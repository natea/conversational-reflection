# iMessage MCP Server - Linux Deployment Limitations and Alternatives

## The Problem

The `imessage-mcp` server requires macOS because it depends on:
1. `@photon-ai/imessage-kit` - which accesses the local iMessage database
2. Native macOS APIs for reading iMessage conversations
3. The SQLite database at `~/Library/Messages/chat.db` (macOS only)

This means the iMessage integration will NOT work on a Linux VM in Google Cloud.

## Solutions

### Option 1: Run iMessage MCP on a Separate macOS Instance

If you have access to a Mac mini or macOS VM:

```bash
# On the macOS machine
git clone https://github.com/your-username/conversational-reflection.git
cd conversational-reflection/src/mcp-servers/imessage-mcp
npm install
npm run build

# Run as a service that exposes MCP over HTTP/WebSocket
# (You would need to modify the MCP server to support remote connections)
```

### Option 2: Use a Third-Party Messaging API

Replace iMessage with a cross-platform messaging service:

```python
# Example using Twilio SMS/MMS
from twilio.rest import Client

class MessagingBridge:
    def __init__(self, account_sid, auth_token):
        self.client = Client(account_sid, auth_auth_token)

    def get_messages(self, contact=None, limit=50):
        # Fetch messages from Twilio
        messages = self.client.messages.list(limit=limit)
        return [self.format_message(m) for m in messages]
```

### Option 3: Create a Message Import Feature

Import messages from an iMessage export:

```python
# Create an import script that users can run on their Mac
# to export messages and upload to the server
```

### Option 4: Disable iMessage Integration

Modify `bot.py` to gracefully handle the missing iMessage MCP:

```python
# The current implementation already does this with graceful degradation
# The MCP server will fail to start, but Ginger will continue working
# with reduced capabilities
```

## Implementation for Production Deployment

The deployment scripts already handle this limitation:

1. The imessage-mcp server is installed but won't work on Linux
2. Ginger detects this and adjusts her capabilities accordingly
3. Users see a message about reduced capabilities

### To Remove iMessage MCP Completely

Edit `mcp_config.py` and comment out the imessage section:

```python
MCP_SERVERS = {
    "sable": StdioServerParameters(
        command="node",
        args=[f"{PROJECT_ROOT}/src/mcp-servers/sable-mcp/dist/index.js"],
    ),
    # "imessage": StdioServerParameters(
    #     command="node",
    #     args=[f"{PROJECT_ROOT}/src/mcp-servers/imessage-mcp/dist/index.js"],
    # ),
    "journal": StdioServerParameters(
        command="node",
        args=[f"{PROJECT_ROOT}/src/mcp-servers/private-journal-mcp/dist/index.js"],
    ),
}
```

### Alternative: WebSocket Bridge

If you want to maintain iMessage functionality, create a WebSocket bridge:

1. Run a simple WebSocket server on a Mac
2. Have the Linux VM connect to it for iMessage data
3. Implement proper authentication and security

Example bridge implementation:

```javascript
// On Mac: imessage-bridge.js
const WebSocket = require('ws');
const imessage = require('@photon-ai/imessage-kit');

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
    console.log('Ginger server connected');

    ws.on('message', async (request) => {
        const { type, params } = JSON.parse(request);

        try {
            switch(type) {
                case 'get_messages':
                    const messages = await imessage.getMessages(params);
                    ws.send(JSON.stringify({ success: true, data: messages }));
                    break;
                // ... other methods
            }
        } catch (error) {
            ws.send(JSON.stringify({ success: false, error: error.message }));
        }
    });
});
```

## Recommendation

For production deployment on Linux:
1. **Accept the limitation** - Ginger works great without iMessage
2. **Focus on core features** - Emotional analysis and memory work well
3. **Consider alternatives** - Add other messaging integrations if needed
4. **Document clearly** - Let users know iMessage is macOS-only

The graceful degradation in the current code handles this cleanly - users won't see errors, just reduced capabilities.