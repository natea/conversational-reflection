# Fix: ruv-swarm MCP Server Native Module Failure

## Problem

The ruv-swarm MCP server fails to start with an error like:

```
[ERROR] Failed to initialize pooled persistence {
  error: 'Failed to initialize write connection: Could not locate the bindings file. Tried:
   → .../better-sqlite3/compiled/24.11.1/linux/arm64/better_sqlite3.node
   → .../better-sqlite3/lib/binding/node-v137-linux-arm64/better_sqlite3.node
   ...
}
```

## Root Cause

`better-sqlite3` is a native Node.js addon that requires platform-specific compiled binaries. Pre-built binaries may not exist for:
- Very new Node.js versions (v24+)
- Certain platform/architecture combinations (e.g., linux/arm64)
- Node.js ABI version mismatches

When the npx cache contains a corrupted or incomplete installation, the native module fails to load.

## Solution

### Quick Fix (Recommended)

Clear the npx cache and reinstall:

```bash
# Remove the ruv-swarm npx cache
rm -rf ~/.npm/_npx

# Optionally clear other npm caches
npm cache clean --force

# Reinstall by running any ruv-swarm command (takes 1-3 minutes to compile)
npx ruv-swarm status
```

### Alternative: Pin to Stable Node Version

If compilation fails, use a Node.js version with pre-built binaries:

```bash
# Install and use Node 20 LTS
nvm install 20
nvm use 20

# Clear caches
rm -rf ~/.npm/_npx ~/.npm/_cacache

# Retry
npx ruv-swarm status
```

## Verification

After the fix, you should see:

```
🧠 Initializing ruv-swarm with WASM capabilities...
[INFO] Pooled persistence layer initialized successfully
✅ WASM bindings loaded successfully (actual WASM)
✅ Successfully loaded WASM from: Local development (relative to src/)
✅  Loaded WASM module: core (512.0 KB)
📊 Features: {
  neural_networks: true,
  forecasting: true,
  cognitive_diversity: true,
  simd_support: true
}
```

## Environment Details (Original Issue)

- **Node.js**: v24.11.1 (ABI version v137)
- **Platform**: linux/arm64
- **Package**: ruv-swarm v1.0.20
- **Dependency**: better-sqlite3

## Prevention

1. **Use LTS Node versions** (20.x or 22.x) for better native module compatibility
2. **Periodically clear npx cache** if experiencing strange module errors
3. **Ensure build tools are installed** for native compilation:
   ```bash
   # Debian/Ubuntu
   sudo apt-get install build-essential python3

   # macOS
   xcode-select --install
   ```

## Related MCP Servers

This fix applies to any MCP server using `better-sqlite3`:
- ruv-swarm
- Other servers with SQLite persistence

---

**Date Fixed**: 2025-12-07
**Fixed By**: SPARC Debugger Mode
