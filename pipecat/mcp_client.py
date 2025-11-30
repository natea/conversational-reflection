"""
MCP Client for Pipecat Bot

Manages connections to MCP servers (imessage-mcp, sable-mcp, maya-tts-mcp, journal-mcp)
via stdio transport. Handles spawning subprocesses and JSON-RPC communication.
"""

import asyncio
import json
import os
import subprocess
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any, Callable, Optional

from loguru import logger


class MCPServer(Enum):
    """Available MCP servers."""
    SABLE = "sable"
    IMESSAGE = "imessage"
    JOURNAL = "journal"
    MAYA_TTS = "maya-tts"


@dataclass
class MCPServerConfig:
    """Configuration for an MCP server."""
    name: str
    command: str
    args: list[str]
    cwd: Optional[str] = None
    env: Optional[dict[str, str]] = None
    tools: list[str] = field(default_factory=list)


# Tool to server mapping
TOOL_SERVER_MAP: dict[str, MCPServer] = {
    # Sable - Emotional Awareness
    "analyze_emotion": MCPServer.SABLE,
    "feel_emotion": MCPServer.SABLE,
    "get_emotional_state": MCPServer.SABLE,
    "record_memory": MCPServer.SABLE,
    "query_memories": MCPServer.SABLE,
    "create_somatic_marker": MCPServer.SABLE,
    "check_somatic_markers": MCPServer.SABLE,
    # iMessage
    "get_messages": MCPServer.IMESSAGE,
    "list_chats": MCPServer.IMESSAGE,
    "watch_messages": MCPServer.IMESSAGE,
    # Journal
    "process_thoughts": MCPServer.JOURNAL,
    "search_journal": MCPServer.JOURNAL,
    "read_journal_entry": MCPServer.JOURNAL,
    "list_recent_entries": MCPServer.JOURNAL,
    # Maya TTS
    "speak_as_contact": MCPServer.MAYA_TTS,
    "speak_reflection": MCPServer.MAYA_TTS,
    "preview_voice": MCPServer.MAYA_TTS,
}


class MCPClient:
    """
    Client for communicating with MCP servers via stdio.
    
    Manages server lifecycle and JSON-RPC message passing.
    """
    
    def __init__(self, workspace_root: Optional[str] = None):
        self.workspace_root = workspace_root or self._find_workspace_root()
        self._servers: dict[MCPServer, subprocess.Popen] = {}
        self._server_configs: dict[MCPServer, MCPServerConfig] = {}
        self._request_id = 0
        self._pending_requests: dict[int, asyncio.Future] = {}
        self._reader_tasks: dict[MCPServer, asyncio.Task] = {}
        
        self._init_server_configs()
    
    def _find_workspace_root(self) -> str:
        """Find the workspace root by looking for package.json."""
        current = Path(__file__).parent.parent
        if (current / "package.json").exists():
            return str(current)
        return str(current)
    
    def _init_server_configs(self):
        """Initialize server configurations."""
        mcp_servers_path = Path(self.workspace_root) / "src" / "mcp-servers"
        
        self._server_configs = {
            MCPServer.SABLE: MCPServerConfig(
                name="sable-mcp",
                command="node",
                args=[str(mcp_servers_path / "sable-mcp" / "dist" / "index.js")],
                cwd=str(mcp_servers_path / "sable-mcp"),
                tools=[
                    "analyze_emotion", "feel_emotion", "get_emotional_state",
                    "record_memory", "query_memories", "create_somatic_marker",
                    "check_somatic_markers"
                ]
            ),
            MCPServer.IMESSAGE: MCPServerConfig(
                name="imessage-mcp",
                command="node",
                args=[str(mcp_servers_path / "imessage-mcp" / "dist" / "index.js")],
                cwd=str(mcp_servers_path / "imessage-mcp"),
                tools=["get_messages", "list_chats", "watch_messages"]
            ),
            MCPServer.JOURNAL: MCPServerConfig(
                name="private-journal-mcp",
                command="node",
                args=[str(mcp_servers_path / "private-journal-mcp" / "dist" / "index.js")],
                cwd=str(mcp_servers_path / "private-journal-mcp"),
                tools=[
                    "process_thoughts", "search_journal",
                    "read_journal_entry", "list_recent_entries"
                ]
            ),
            MCPServer.MAYA_TTS: MCPServerConfig(
                name="maya-tts-mcp",
                command="node",
                args=[str(mcp_servers_path / "maya-tts-mcp" / "dist" / "index.js")],
                cwd=str(mcp_servers_path / "maya-tts-mcp"),
                tools=["speak_as_contact", "speak_reflection", "preview_voice"]
            ),
        }
    
    async def start_server(self, server: MCPServer) -> bool:
        """Start an MCP server if not already running."""
        if server in self._servers and self._servers[server].poll() is None:
            logger.debug(f"Server {server.value} already running")
            return True
        
        config = self._server_configs.get(server)
        if not config:
            logger.error(f"No configuration for server: {server.value}")
            return False
        
        # Check if the dist file exists
        dist_path = Path(config.args[0])
        if not dist_path.exists():
            logger.warning(
                f"MCP server not built: {dist_path}. "
                f"Run 'npm run build' in {config.cwd}"
            )
            return False
        
        try:
            logger.info(f"Starting MCP server: {config.name}")
            
            env = os.environ.copy()
            if config.env:
                env.update(config.env)
            
            process = subprocess.Popen(
                [config.command] + config.args,
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                cwd=config.cwd,
                env=env,
                bufsize=0,  # Unbuffered
            )
            
            self._servers[server] = process
            
            # Start reader task for this server
            self._reader_tasks[server] = asyncio.create_task(
                self._read_server_output(server)
            )
            
            # Give it a moment to start
            await asyncio.sleep(0.5)
            
            if process.poll() is not None:
                stderr = process.stderr.read().decode() if process.stderr else ""
                logger.error(f"Server {config.name} exited immediately: {stderr}")
                return False
            
            logger.info(f"✓ MCP server {config.name} started (PID: {process.pid})")
            return True
            
        except Exception as e:
            logger.error(f"Failed to start server {config.name}: {e}")
            return False
    
    async def _read_server_output(self, server: MCPServer):
        """Read output from server and dispatch responses."""
        process = self._servers.get(server)
        if not process or not process.stdout:
            return
        
        config = self._server_configs[server]
        buffer = b""
        stdout = process.stdout  # Type narrowing
        
        while True:
            try:
                # Read available data
                data = await asyncio.get_event_loop().run_in_executor(
                    None, lambda: stdout.read(4096)
                )
                
                if not data:
                    if process.poll() is not None:
                        logger.warning(f"Server {config.name} has exited")
                        break
                    continue
                
                buffer += data
                
                # Try to parse complete JSON-RPC messages
                while b"\n" in buffer:
                    line, buffer = buffer.split(b"\n", 1)
                    if not line.strip():
                        continue
                    
                    try:
                        message = json.loads(line.decode())
                        await self._handle_server_message(server, message)
                    except json.JSONDecodeError as e:
                        logger.debug(f"Non-JSON output from {config.name}: {line.decode()}")
                        
            except Exception as e:
                logger.error(f"Error reading from {config.name}: {e}")
                break
    
    async def _handle_server_message(self, server: MCPServer, message: dict):
        """Handle a message from an MCP server."""
        config = self._server_configs[server]
        
        # Check if this is a response to a pending request
        if "id" in message and message["id"] in self._pending_requests:
            future = self._pending_requests.pop(message["id"])
            if "error" in message:
                future.set_exception(
                    MCPError(message["error"].get("message", "Unknown error"))
                )
            else:
                future.set_result(message.get("result"))
        else:
            # Log notifications or other messages
            logger.debug(f"Message from {config.name}: {message}")
    
    async def call_tool(
        self,
        tool_name: str,
        arguments: dict[str, Any]
    ) -> dict[str, Any]:
        """
        Call an MCP tool by name.
        
        Automatically routes to the correct server based on tool name.
        """
        # Determine which server handles this tool
        server = TOOL_SERVER_MAP.get(tool_name)
        if not server:
            logger.warning(f"Unknown tool: {tool_name}, returning mock response")
            return {"status": "mock", "tool": tool_name, "args": arguments}
        
        # Ensure server is running
        if not await self.start_server(server):
            logger.error(f"Failed to start server for tool: {tool_name}")
            return {
                "status": "error",
                "error": f"MCP server {server.value} not available",
                "tool": tool_name
            }
        
        process = self._servers[server]
        config = self._server_configs[server]
        
        # Build JSON-RPC request
        self._request_id += 1
        request = {
            "jsonrpc": "2.0",
            "id": self._request_id,
            "method": "tools/call",
            "params": {
                "name": tool_name,
                "arguments": arguments
            }
        }
        
        # Create future for response
        future: asyncio.Future = asyncio.get_event_loop().create_future()
        self._pending_requests[self._request_id] = future
        
        # Ensure stdin is available
        stdin = process.stdin
        if not stdin:
            return {"status": "error", "error": "Server stdin not available", "tool": tool_name}
        
        try:
            # Send request
            request_bytes = (json.dumps(request) + "\n").encode()
            stdin.write(request_bytes)
            stdin.flush()
            
            logger.debug(f"Sent to {config.name}: {tool_name}({arguments})")
            
            # Wait for response with timeout
            result = await asyncio.wait_for(future, timeout=30.0)
            
            # Parse the result content
            if isinstance(result, dict) and "content" in result:
                content = result["content"]
                if isinstance(content, list) and len(content) > 0:
                    first_content = content[0]
                    if first_content.get("type") == "text":
                        try:
                            return json.loads(first_content["text"])
                        except json.JSONDecodeError:
                            return {"text": first_content["text"]}
            
            return result or {"status": "success"}
            
        except asyncio.TimeoutError:
            self._pending_requests.pop(self._request_id, None)
            logger.error(f"Timeout waiting for {config.name} response to {tool_name}")
            return {"status": "error", "error": "Timeout", "tool": tool_name}
            
        except Exception as e:
            self._pending_requests.pop(self._request_id, None)
            logger.error(f"Error calling {tool_name}: {e}")
            return {"status": "error", "error": str(e), "tool": tool_name}
    
    async def stop_server(self, server: MCPServer):
        """Stop an MCP server."""
        if server not in self._servers:
            return
        
        config = self._server_configs[server]
        process = self._servers[server]
        
        # Cancel reader task
        if server in self._reader_tasks:
            self._reader_tasks[server].cancel()
            try:
                await self._reader_tasks[server]
            except asyncio.CancelledError:
                pass
        
        # Terminate process
        if process.poll() is None:
            logger.info(f"Stopping MCP server: {config.name}")
            process.terminate()
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
        
        del self._servers[server]
        logger.info(f"✓ MCP server {config.name} stopped")
    
    async def stop_all(self):
        """Stop all running MCP servers."""
        servers = list(self._servers.keys())
        for server in servers:
            await self.stop_server(server)
    
    def get_server_status(self) -> dict[str, str]:
        """Get status of all servers."""
        status = {}
        for server, config in self._server_configs.items():
            if server in self._servers:
                process = self._servers[server]
                if process.poll() is None:
                    status[config.name] = "running"
                else:
                    status[config.name] = "exited"
            else:
                status[config.name] = "not started"
        return status


class MCPError(Exception):
    """Error from MCP server."""
    pass


# Singleton instance
_mcp_client: Optional[MCPClient] = None


def get_mcp_client() -> MCPClient:
    """Get or create the singleton MCP client."""
    global _mcp_client
    if _mcp_client is None:
        _mcp_client = MCPClient()
    return _mcp_client


async def call_mcp_tool(tool_name: str, arguments: dict[str, Any]) -> dict[str, Any]:
    """Convenience function to call an MCP tool."""
    client = get_mcp_client()
    return await client.call_tool(tool_name, arguments)
