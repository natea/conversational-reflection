#
# MCP Server Configuration for Ginger Voice Bot
#
# Defines the MCP servers that provide Ginger with her capabilities:
# - sable: Emotional depth (Damasio consciousness model)
# - imessage: Access to user's iMessage conversations
# - journal: Long-term memory via semantic journal
#

import os

from mcp import StdioServerParameters

# Get the backend directory (where this file and src/ are located)
# In Docker, files are in /app; locally, they're in the backend directory
BACKEND_ROOT = os.environ.get("APP_ROOT", os.path.dirname(os.path.abspath(__file__)))

MCP_SERVERS = {
    "sable": StdioServerParameters(
        command="node",
        args=[f"{BACKEND_ROOT}/src/mcp-servers/sable-mcp/dist/index.js"],
    ),
    "imessage": StdioServerParameters(
        command="node",
        args=[f"{BACKEND_ROOT}/src/mcp-servers/imessage-mcp/dist/index.js"],
    ),
    "journal": StdioServerParameters(
        command="node",
        args=[f"{BACKEND_ROOT}/src/mcp-servers/private-journal-mcp/dist/index.js"],
    ),
}
