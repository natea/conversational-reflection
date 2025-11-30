#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

// Contact name lookup
import { lookupContact } from './contacts.js';

// Types for iMessage data structures
interface IMessage {
  id: string;
  text: string;
  sender: string;
  senderName: string | null;  // Contact name from address book (may be null)
  timestamp: Date;
  isFromMe: boolean;
  chatId: string;
  attachments?: string[];
}

interface IChat {
  id: string;
  displayName: string | null;  // Contact/group name (may be null)
  participants: string[];
  isGroup: boolean;
  unreadCount: number;
  lastMessage?: IMessage;
}

// Conditional import of imessage-kit
let IMessageSDK: any;
let isIMessageAvailable = false;
let iMessageInstance: any = null;

async function initializeIMessage() {
  try {
    const imessageKit = await import('@photon-ai/imessage-kit');
    IMessageSDK = imessageKit.IMessageSDK;
    isIMessageAvailable = true;

    // Initialize the SDK instance
    iMessageInstance = new IMessageSDK();
    console.error('✓ imessage-kit initialized successfully');
    return true;
  } catch (error) {
    console.error('✗ imessage-kit not available - macOS with Full Disk Access required');
    console.error('  Please ensure:');
    console.error('  1. Running on macOS');
    console.error('  2. Terminal/Node has Full Disk Access in System Settings > Privacy & Security');
    console.error('  3. @photon-ai/imessage-kit is installed');
    isIMessageAvailable = false;
    return false;
  }
}

// Ensure iMessage is available before operations
function ensureIMessageAvailable() {
  if (!isIMessageAvailable || !iMessageInstance) {
    throw new McpError(
      ErrorCode.InternalError,
      'iMessage is not available. macOS with Full Disk Access is required.'
    );
  }
}

// Tool implementations
async function getMessages(args: {
  contact?: string;
  since?: string;
  limit?: number;
  unread_only?: boolean;
  include_own_messages?: boolean;
}): Promise<{ messages: IMessage[]; total: number }> {
  ensureIMessageAvailable();

  const { contact, since, limit = 50, unread_only = false, include_own_messages = true } = args;

  try {
    // Parse since date if provided
    let sinceDate: Date | undefined;
    if (since) {
      sinceDate = new Date(since);
      if (isNaN(sinceDate.getTime())) {
        throw new McpError(
          ErrorCode.InvalidParams,
          `Invalid date format for 'since': ${since}. Use ISO 8601 format.`
        );
      }
    }

    // Get messages from iMessage using the correct API
    // The SDK uses getMessages(filter) with sender/chatId fields
    const filter: any = {
      limit,
      since: sinceDate,
      unreadOnly: unread_only,
      excludeOwnMessages: !include_own_messages,
    };

    // If contact is provided, use it as sender filter
    if (contact) {
      filter.sender = contact;
    }

    const result = await iMessageInstance.getMessages(filter);
    const messages: IMessage[] = result.messages || result;

    return {
      messages: messages.map((msg: any) => {
        const sender = msg.sender || msg.handle;
        // Try to get contact name: first from SDK, then from our Contacts lookup
        const senderName = msg.senderName || lookupContact(sender);
        return {
          id: msg.id || msg.guid,
          text: msg.text || msg.body || '',
          sender,
          senderName,
          timestamp: new Date(msg.date || msg.timestamp),
          isFromMe: msg.isFromMe || msg.is_from_me || false,
          chatId: msg.chatId || msg.chat_id,
          attachments: msg.attachments || [],
        };
      }),
      total: messages.length,
    };
  } catch (error: any) {
    if (error instanceof McpError) throw error;

    throw new McpError(
      ErrorCode.InternalError,
      `Failed to get messages: ${error.message || 'Unknown error'}`
    );
  }
}

async function listChats(args: {
  type?: 'direct' | 'group' | 'all';
  has_unread?: boolean;
  search?: string;
  limit?: number;
}): Promise<{ chats: IChat[]; total: number }> {
  ensureIMessageAvailable();

  const { type = 'all', has_unread, search, limit = 50 } = args;

  try {
    // Get all chats from iMessage using the correct API: listChats()
    // The SDK supports: { limit, type: 'all'|'group'|'dm', hasUnread, sortBy, search }
    const chatType = type === 'direct' ? 'dm' : type; // API uses 'dm' not 'direct'

    let chats: any[] = await iMessageInstance.listChats({
      limit,
      type: chatType,
      hasUnread: has_unread,
      search: search,
    });

    // Map to standardized format
    // SDK returns ChatSummary: { chatId, displayName, lastMessageAt, isGroup, unreadCount }
    const formattedChats: IChat[] = chats.map((chat: any) => {
      const chatId = chat.chatId || chat.id || chat.guid;
      // For non-group chats, try to resolve contact name from the chatId
      // chatId format for DMs is often like "iMessage;-;+1234567890" or just the identifier
      let displayName = chat.displayName;
      if (!displayName && !chat.isGroup) {
        // Extract identifier from chatId and try contact lookup
        const identifier = chatId.includes(';') ? chatId.split(';').pop() : chatId;
        displayName = lookupContact(identifier || '');
      }
      return {
        id: chatId,
        displayName: displayName || 'Unnamed Chat',
        participants: [], // SDK doesn't return participants in ChatSummary
        isGroup: chat.isGroup || false,
        unreadCount: chat.unreadCount || 0,
        lastMessage: undefined, // SDK doesn't include lastMessage in ChatSummary
      };
    });

    return {
      chats: formattedChats,
      total: formattedChats.length,
    };
  } catch (error: any) {
    if (error instanceof McpError) throw error;

    throw new McpError(
      ErrorCode.InternalError,
      `Failed to list chats: ${error.message || 'Unknown error'}`
    );
  }
}

async function watchMessages(args: {
  poll_interval?: number;
  contacts?: string[];
}): Promise<{ status: string; watching: boolean; interval: number; contacts: string[] }> {
  ensureIMessageAvailable();

  const { poll_interval = 3000, contacts = [] } = args;

  try {
    // Note: poll_interval and contacts are not supported by the SDK's startWatching API
    // The SDK uses WatcherEvents: { onMessage, onDirectMessage, onGroupMessage, onError }

    // Start watching for new messages using the correct API
    await iMessageInstance.startWatching({
      onMessage: (message: any) => {
        // Filter by contacts if specified
        if (contacts.length > 0) {
          const sender = message.sender || '';
          if (!contacts.some(c => sender.includes(c))) {
            return; // Skip messages not from watched contacts
          }
        }

        // Log to stderr (MCP uses stdout for protocol)
        console.error('New message:', {
          from: message.sender,
          text: message.text,
          timestamp: message.date,
        });
      },
      onError: (error: Error) => {
        console.error('Watch error:', error.message);
      },
    });

    return {
      status: 'watching',
      watching: true,
      interval: poll_interval,
      contacts: contacts,
    };
  } catch (error: any) {
    if (error instanceof McpError) throw error;

    throw new McpError(
      ErrorCode.InternalError,
      `Failed to start watching messages: ${error.message || 'Unknown error'}`
    );
  }
}

// Create and configure the MCP server
const server = new Server(
  {
    name: 'imessage-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_messages',
        description:
          'Get iMessage messages with optional filters. Returns messages from a specific contact or all recent messages.',
        inputSchema: {
          type: 'object',
          properties: {
            contact: {
              type: 'string',
              description: 'Phone number or email of the contact to get messages from',
            },
            since: {
              type: 'string',
              description: 'ISO 8601 date string to get messages since (e.g., "2024-01-01T00:00:00Z")',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of messages to return (default: 50)',
              default: 50,
            },
            unread_only: {
              type: 'boolean',
              description: 'Only return unread messages (default: false)',
              default: false,
            },
            include_own_messages: {
              type: 'boolean',
              description: 'Include messages sent by you (default: true)',
              default: true,
            },
          },
        },
      },
      {
        name: 'list_chats',
        description:
          'List available iMessage conversations with filters. Returns all chats, direct messages, or group chats.',
        inputSchema: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['direct', 'group', 'all'],
              description: 'Type of chats to list (default: "all")',
              default: 'all',
            },
            has_unread: {
              type: 'boolean',
              description: 'Filter by unread status (true = only unread, false = only read, undefined = all)',
            },
            search: {
              type: 'string',
              description: 'Search chats by display name or participant names',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of chats to return (default: 50)',
              default: 50,
            },
          },
        },
      },
      {
        name: 'watch_messages',
        description:
          'Start watching for new iMessage messages. Polls for new messages at the specified interval and logs them to stderr.',
        inputSchema: {
          type: 'object',
          properties: {
            poll_interval: {
              type: 'number',
              description: 'Polling interval in milliseconds (minimum: 1000, default: 3000)',
              default: 3000,
              minimum: 1000,
            },
            contacts: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'Optional array of contact phone numbers/emails to watch',
            },
          },
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    switch (name) {
      case 'get_messages': {
        const result = await getMessages(args || {});
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'list_chats': {
        const result = await listChats(args || {});
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'watch_messages': {
        const result = await watchMessages(args || {});
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      default:
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${name}`
        );
    }
  } catch (error: any) {
    if (error instanceof McpError) {
      throw error;
    }

    throw new McpError(
      ErrorCode.InternalError,
      `Tool execution failed: ${error.message || 'Unknown error'}`
    );
  }
});

// Start the server
async function main() {
  // Initialize iMessage on startup
  await initializeIMessage();

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('iMessage MCP Server running on stdio');
  console.error(`iMessage available: ${isIMessageAvailable}`);
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
