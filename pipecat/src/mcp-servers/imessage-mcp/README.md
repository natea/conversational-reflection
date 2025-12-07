# iMessage MCP Server

A Model Context Protocol (MCP) server that provides access to iMessage conversations using the `imessage-kit` library.

## Features

- **Get Messages**: Retrieve iMessage messages with flexible filtering
- **List Chats**: View all conversations with search and filtering
- **Watch Messages**: Monitor for new messages in real-time

## Prerequisites

### System Requirements

1. **macOS Only**: This server only works on macOS as it accesses the local iMessage database
2. **Full Disk Access**: Terminal (or the application running Node.js) must have Full Disk Access permission

### Granting Full Disk Access

1. Open **System Settings** → **Privacy & Security** → **Full Disk Access**
2. Click the **+** button
3. Navigate to `/Applications/Utilities/Terminal.app` (or your terminal application)
4. Add it to the list and ensure the checkbox is enabled
5. Restart your terminal application

## Installation

```bash
npm install
```

## Building

```bash
npm run build
```

## Usage

### Running Standalone

```bash
npm start
```

### Integration with Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "imessage": {
      "command": "node",
      "args": [
        "/Users/nateaune/Documents/code/conversational-reflection/src/mcp-servers/imessage-mcp/index.js"
      ]
    }
  }
}
```

## Available Tools

### get_messages

Get iMessage messages with optional filters.

**Parameters:**
- `contact` (string, optional): Phone number or email of the contact
- `since` (string, optional): ISO 8601 date string to filter messages
- `limit` (number, optional): Maximum number of messages (default: 50)
- `unread_only` (boolean, optional): Only return unread messages (default: false)

**Example:**
```json
{
  "contact": "+1234567890",
  "since": "2024-01-01T00:00:00Z",
  "limit": 100,
  "unread_only": true
}
```

### list_chats

List available iMessage conversations.

**Parameters:**
- `type` (string, optional): Filter by chat type - "direct", "group", or "all" (default: "all")
- `has_unread` (boolean, optional): Filter by unread status
- `search` (string, optional): Search by display name or participants
- `limit` (number, optional): Maximum number of chats (default: 50)

**Example:**
```json
{
  "type": "group",
  "has_unread": true,
  "search": "family",
  "limit": 20
}
```

### watch_messages

Start watching for new iMessage messages.

**Parameters:**
- `poll_interval` (number, optional): Polling interval in milliseconds (minimum: 1000, default: 3000)
- `contacts` (array, optional): Array of contact identifiers to watch

**Example:**
```json
{
  "poll_interval": 5000,
  "contacts": ["+1234567890", "friend@example.com"]
}
```

## Error Handling

The server includes comprehensive error handling for:

- **Missing Full Disk Access**: Clear error message with setup instructions
- **Invalid Parameters**: Validation of date formats and numeric ranges
- **Platform Compatibility**: Graceful degradation on non-macOS systems
- **SDK Availability**: Handles cases where imessage-kit is not installed

## Development

### Watch Mode

```bash
npm run dev
```

### Type Checking

TypeScript is configured with strict mode for maximum type safety.

## Troubleshooting

### "imessage-kit not available" Error

1. Verify you're running on macOS
2. Check Full Disk Access permissions (see Prerequisites)
3. Ensure `@photon-ai/imessage-kit` is installed: `npm install`
4. Restart your terminal application after granting permissions

### No Messages Returned

1. Ensure Messages.app has been used on this Mac
2. Check that the contact identifier is correct (phone number or email)
3. Verify the date range includes messages

### Watch Not Working

1. Ensure poll_interval is at least 1000ms
2. Check that Messages.app is running
3. Verify Full Disk Access permissions

## License

MIT
