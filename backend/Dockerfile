FROM dailyco/pipecat-base:latest

# Enable bytecode compilation
ENV UV_COMPILE_BYTECODE=1

# Copy from the cache instead of linking since it's a mounted volume
ENV UV_LINK_MODE=copy

# Pin Python version to 3.13 (onnxruntime doesn't support 3.14 yet)
ENV UV_PYTHON=3.13

# Install Node.js for MCP servers
RUN apt-get update && apt-get install -y nodejs npm ffmpeg && rm -rf /var/lib/apt/lists/*

# Install the project's dependencies using the lockfile and settings
RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    uv sync --locked --no-install-project --no-dev --python 3.13

# Copy the application code
COPY ./bot.py bot.py
COPY ./emotive_tts_processor.py emotive_tts_processor.py
COPY ./mcp_config.py mcp_config.py

# Copy and build MCP servers
COPY ./src src

# Build each MCP server
WORKDIR /app/src/mcp-servers/sable-mcp
RUN npm install && npm run build

WORKDIR /app/src/mcp-servers/imessage-mcp
RUN npm install && npm run build

WORKDIR /app/src/mcp-servers/private-journal-mcp
RUN npm install && npm run build

# Return to app root
WORKDIR /app

# Set environment variable for mcp_config.py to find the correct paths
ENV APP_ROOT=/app
