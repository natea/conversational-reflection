"""
iMessage Client for Pipecat Bot

Provides direct access to iMessage data on macOS by spawning the
imessage-mcp TypeScript server and communicating via JSON-RPC over stdio.
"""

import asyncio
import json
import os
import subprocess
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Optional

from loguru import logger


@dataclass
class Message:
    """An iMessage message."""
    id: str
    text: str
    sender: str
    sender_name: Optional[str]
    timestamp: datetime
    is_from_me: bool
    chat_id: str


@dataclass
class Chat:
    """An iMessage chat/conversation."""
    id: str
    display_name: Optional[str]
    participants: list[str]
    is_group: bool
    unread_count: int


class IMessageClient:
    """
    Client for accessing iMessage data via the imessage-mcp server.
    
    Spawns a Node.js subprocess running the MCP server and communicates
    via JSON-RPC over stdio.
    """
    
    def __init__(self, workspace_root: Optional[str] = None):
        self.workspace_root = workspace_root or self._find_workspace_root()
        self._process: Optional[subprocess.Popen] = None
        self._request_id = 0
        self._lock = asyncio.Lock()
    
    def _find_workspace_root(self) -> str:
        """Find the workspace root by looking for package.json."""
        current = Path(__file__).parent.parent
        if (current / "package.json").exists():
            return str(current)
        return str(current)
    
    async def _ensure_server(self) -> subprocess.Popen:
        """Ensure the MCP server is running."""
        if self._process is None or self._process.poll() is not None:
            # Build path to the compiled MCP server
            server_path = Path(self.workspace_root) / "dist" / "mcp-servers" / "imessage-mcp" / "index.js"
            
            if not server_path.exists():
                # Try src path for development
                server_path = Path(self.workspace_root) / "src" / "mcp-servers" / "imessage-mcp" / "index.ts"
                if not server_path.exists():
                    raise RuntimeError(
                        f"iMessage MCP server not found. Run 'npm run build' in {self.workspace_root}"
                    )
                # Use ts-node or tsx for TypeScript
                cmd = ["npx", "tsx", str(server_path)]
            else:
                cmd = ["node", str(server_path)]
            
            logger.info(f"Starting iMessage MCP server: {' '.join(cmd)}")
            
            self._process = subprocess.Popen(
                cmd,
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                cwd=self.workspace_root,
                text=True,
                bufsize=1
            )
            
            # Wait a moment for startup
            await asyncio.sleep(0.5)
            
            if self._process.poll() is not None:
                stderr = self._process.stderr.read() if self._process.stderr else ""
                raise RuntimeError(f"iMessage MCP server failed to start: {stderr}")
            
            # Initialize the MCP connection
            await self._send_request("initialize", {
                "protocolVersion": "2024-11-05",
                "capabilities": {},
                "clientInfo": {"name": "pipecat-bot", "version": "1.0.0"}
            })
            
            logger.info("iMessage MCP server initialized")
        
        return self._process
    
    async def _send_request(self, method: str, params: dict) -> Any:
        """Send a JSON-RPC request to the MCP server."""
        async with self._lock:
            process = await self._ensure_server()
            
            self._request_id += 1
            request = {
                "jsonrpc": "2.0",
                "id": self._request_id,
                "method": method,
                "params": params
            }
            
            request_str = json.dumps(request) + "\n"
            
            if process.stdin is None or process.stdout is None:
                raise RuntimeError("MCP server stdin/stdout not available")
            
            process.stdin.write(request_str)
            process.stdin.flush()
            
            # Read response
            response_str = process.stdout.readline()
            if not response_str:
                raise RuntimeError("No response from MCP server")
            
            response = json.loads(response_str)
            
            if "error" in response:
                raise RuntimeError(f"MCP error: {response['error']}")
            
            return response.get("result")
    
    async def _call_tool(self, tool_name: str, arguments: dict) -> Any:
        """Call an MCP tool."""
        result = await self._send_request("tools/call", {
            "name": tool_name,
            "arguments": arguments
        })
        
        # MCP tool results are wrapped in content array
        if isinstance(result, dict) and "content" in result:
            content = result["content"]
            if content and isinstance(content, list) and len(content) > 0:
                first = content[0]
                if isinstance(first, dict) and "text" in first:
                    return json.loads(first["text"])
        
        return result
    
    async def get_messages(
        self,
        contact: Optional[str] = None,
        since: Optional[str] = None,
        limit: int = 50,
        unread_only: bool = False
    ) -> list[Message]:
        """
        Get iMessage messages.
        
        Args:
            contact: Filter by contact name or phone number
            since: ISO 8601 date string to filter messages after
            limit: Maximum number of messages to return
            unread_only: Only return unread messages
            
        Returns:
            List of Message objects
        """
        try:
            args: dict[str, Any] = {"limit": limit, "unread_only": unread_only}
            if contact:
                args["contact"] = contact
            if since:
                args["since"] = since
            
            result = await self._call_tool("get_messages", args)
            
            messages = []
            for msg in result.get("messages", []):
                messages.append(Message(
                    id=msg.get("id", ""),
                    text=msg.get("text", ""),
                    sender=msg.get("sender", ""),
                    sender_name=msg.get("senderName"),
                    timestamp=datetime.fromisoformat(msg.get("timestamp", "")) if msg.get("timestamp") else datetime.now(),
                    is_from_me=msg.get("isFromMe", False),
                    chat_id=msg.get("chatId", "")
                ))
            
            return messages
            
        except Exception as e:
            logger.error(f"Failed to get messages: {e}")
            return []
    
    async def list_chats(
        self,
        chat_type: str = "all",
        has_unread: Optional[bool] = None,
        search: Optional[str] = None,
        limit: int = 50
    ) -> list[Chat]:
        """
        List iMessage chats.
        
        Args:
            chat_type: "direct", "group", or "all"
            has_unread: Filter by unread status
            search: Search term for chat names
            limit: Maximum number of chats to return
            
        Returns:
            List of Chat objects
        """
        try:
            args: dict[str, Any] = {"type": chat_type, "limit": limit}
            if has_unread is not None:
                args["has_unread"] = has_unread
            if search:
                args["search"] = search
            
            result = await self._call_tool("list_chats", args)
            
            chats = []
            for chat in result.get("chats", []):
                chats.append(Chat(
                    id=chat.get("id", ""),
                    display_name=chat.get("displayName"),
                    participants=chat.get("participants", []),
                    is_group=chat.get("isGroup", False),
                    unread_count=chat.get("unreadCount", 0)
                ))
            
            return chats
            
        except Exception as e:
            logger.error(f"Failed to list chats: {e}")
            return []
    
    async def get_contacts(self, limit: int = 100) -> list[dict]:
        """
        Get contacts from iMessage chats.
        
        Returns list of contacts with name and identifier.
        """
        try:
            chats = await self.list_chats(chat_type="direct", limit=limit)
            
            contacts = []
            seen = set()
            
            for chat in chats:
                for participant in chat.participants:
                    if participant not in seen:
                        seen.add(participant)
                        contacts.append({
                            "identifier": participant,
                            "name": chat.display_name if not chat.is_group else None,
                            "chat_id": chat.id
                        })
            
            return contacts
            
        except Exception as e:
            logger.error(f"Failed to get contacts: {e}")
            return []
    
    async def close(self):
        """Close the MCP server connection."""
        if self._process:
            self._process.terminate()
            try:
                self._process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self._process.kill()
            self._process = None


# Global client instance
_client: Optional[IMessageClient] = None


def get_imessage_client() -> IMessageClient:
    """Get or create the global iMessage client."""
    global _client
    if _client is None:
        _client = IMessageClient()
    return _client


async def get_messages(
    contact: Optional[str] = None,
    since: Optional[str] = None,
    limit: int = 50
) -> list[dict]:
    """
    Convenience function to get messages.
    
    Returns list of message dicts for easy JSON serialization.
    """
    client = get_imessage_client()
    messages = await client.get_messages(contact=contact, since=since, limit=limit)
    
    return [
        {
            "id": m.id,
            "text": m.text,
            "sender": m.sender,
            "sender_name": m.sender_name,
            "timestamp": m.timestamp.isoformat(),
            "is_from_me": m.is_from_me,
            "chat_id": m.chat_id
        }
        for m in messages
    ]


async def get_contacts(limit: int = 100) -> list[dict]:
    """Convenience function to get contacts."""
    client = get_imessage_client()
    return await client.get_contacts(limit=limit)


async def list_conversations(limit: int = 50) -> list[dict]:
    """
    Convenience function to list conversations.
    
    Returns list of chat dicts for easy JSON serialization.
    """
    client = get_imessage_client()
    chats = await client.list_chats(limit=limit)
    
    return [
        {
            "id": c.id,
            "display_name": c.display_name,
            "participants": c.participants,
            "is_group": c.is_group,
            "unread_count": c.unread_count
        }
        for c in chats
    ]
