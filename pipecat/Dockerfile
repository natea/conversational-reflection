FROM dailyco/pipecat-base:latest

# Enable bytecode compilation
ENV UV_COMPILE_BYTECODE=1

# Copy from the cache instead of linking since it's a mounted volume
ENV UV_LINK_MODE=copy

# Install the project's dependencies using the lockfile and settings
RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    uv sync --locked --no-install-project --no-dev

# Copy the application code
COPY ./bot.py bot.py

# Set the command to run the bot
CMD ["uv", "run", "python", "bot.py", "--transport", "webrtc"]

# Add labels for metadata
LABEL org.opencontainers.image.title="Ginger Voice Bot Backend"
LABEL org.opencontainers.image.description="Production backend for Ginger Voice Bot powered by Pipecat"
LABEL org.opencontainers.image.vendor="Ginger Voice Bot"
LABEL org.opencontainers.image.licenses="MIT"
