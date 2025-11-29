/**
 * iMessage Client - Wrapper around @photon-ai/imessage-kit
 *
 * Provides a simplified interface for reading iMessage transcripts
 * from the macOS Messages database.
 */

export interface Message {
  id: number
  chatId: string
  sender: string
  text: string
  timestamp: Date
  isFromMe: boolean
  isRead: boolean
}

export interface Chat {
  chatId: string
  displayName: string | null
  isGroup: boolean
  participants: string[]
  unreadCount: number
  lastMessage?: string
  lastMessageDate?: Date
}

export interface GetMessagesOptions {
  contact?: string
  chatId?: string
  since?: Date | string
  until?: Date | string
  limit?: number
  unreadOnly?: boolean
}

export interface ListChatsOptions {
  type?: 'direct' | 'group' | 'all'
  hasUnread?: boolean
  search?: string
  limit?: number
}

export class IMessageClient {
  private sdk: any = null
  private initialized = false

  /**
   * Initialize the iMessage SDK
   * Requires Full Disk Access permission on macOS
   */
  async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      // Dynamic import to handle cases where imessage-kit isn't installed
      const { IMessageSDK } = await import('@photon-ai/imessage-kit')
      this.sdk = new IMessageSDK()
      this.initialized = true
    } catch (error) {
      throw new Error(
        `Failed to initialize iMessage SDK: ${error instanceof Error ? error.message : 'Unknown error'}. ` +
        'Ensure @photon-ai/imessage-kit is installed and Full Disk Access is granted.'
      )
    }
  }

  /**
   * Check if iMessage access is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      await this.initialize()
      // Try to list chats as a connectivity test
      await this.sdk.listChats({ limit: 1 })
      return true
    } catch {
      return false
    }
  }

  /**
   * Get messages with optional filters
   */
  async getMessages(options: GetMessagesOptions = {}): Promise<Message[]> {
    await this.initialize()

    const queryOptions: any = {
      limit: options.limit ?? 50
    }

    if (options.contact) {
      queryOptions.sender = options.contact
    }

    if (options.chatId) {
      queryOptions.chatId = options.chatId
    }

    if (options.since) {
      queryOptions.since = options.since instanceof Date
        ? options.since
        : new Date(options.since)
    }

    if (options.until) {
      queryOptions.until = options.until instanceof Date
        ? options.until
        : new Date(options.until)
    }

    if (options.unreadOnly) {
      queryOptions.unreadOnly = true
    }

    const result = await this.sdk.getMessages(queryOptions)

    return result.messages.map((msg: any) => ({
      id: msg.id,
      chatId: msg.chatId,
      sender: msg.sender || 'unknown',
      text: msg.text || '',
      timestamp: new Date(msg.timestamp),
      isFromMe: msg.isFromMe ?? false,
      isRead: msg.isRead ?? true
    }))
  }

  /**
   * List available chats
   */
  async listChats(options: ListChatsOptions = {}): Promise<Chat[]> {
    await this.initialize()

    const queryOptions: any = {
      limit: options.limit ?? 20
    }

    if (options.type && options.type !== 'all') {
      queryOptions.type = options.type
    }

    if (options.hasUnread !== undefined) {
      queryOptions.hasUnread = options.hasUnread
    }

    if (options.search) {
      queryOptions.search = options.search
    }

    const chats = await this.sdk.listChats(queryOptions)

    return chats.map((chat: any) => ({
      chatId: chat.chatId,
      displayName: chat.displayName || null,
      isGroup: chat.isGroup ?? false,
      participants: chat.participants || [],
      unreadCount: chat.unreadCount ?? 0,
      lastMessage: chat.lastMessage,
      lastMessageDate: chat.lastMessageDate ? new Date(chat.lastMessageDate) : undefined
    }))
  }

  /**
   * Get unread messages
   */
  async getUnreadMessages(): Promise<{ total: number; senderCount: number; messages: Message[] }> {
    await this.initialize()

    const result = await this.sdk.getUnreadMessages()

    return {
      total: result.total,
      senderCount: result.senderCount,
      messages: result.messages.map((msg: any) => ({
        id: msg.id,
        chatId: msg.chatId,
        sender: msg.sender || 'unknown',
        text: msg.text || '',
        timestamp: new Date(msg.timestamp),
        isFromMe: msg.isFromMe ?? false,
        isRead: false
      }))
    }
  }

  /**
   * Close the SDK connection
   */
  async close(): Promise<void> {
    if (this.sdk) {
      await this.sdk.close()
      this.sdk = null
      this.initialized = false
    }
  }
}

// Singleton instance
let clientInstance: IMessageClient | null = null

export function getIMessageClient(): IMessageClient {
  if (!clientInstance) {
    clientInstance = new IMessageClient()
  }
  return clientInstance
}
