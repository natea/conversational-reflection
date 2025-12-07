#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import axios from "axios";
import { spawn, ChildProcess } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import * as fs from "fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Python server configuration
const PYTHON_SERVER_PORT = 8765;
const PYTHON_SERVER_URL = `http://localhost:${PYTHON_SERVER_PORT}`;
const PYTHON_SERVER_STARTUP_TIMEOUT = 30000; // 30 seconds

// Zod schemas for validation
const SpeakAsContactSchema = z.object({
  text: z.string().min(1, "Text cannot be empty"),
  voice_description: z.string().min(1, "Voice description required"),
  emotion_tags: z.array(z.enum([
    "laugh", "giggle", "sigh", "gasp", "cry", "whisper", "angry"
  ])).optional().default([]),
});

const SpeakReflectionSchema = z.object({
  text: z.string().min(1, "Text cannot be empty"),
  tone: z.enum(["neutral", "gentle", "concerned", "warm"]).default("neutral"),
});

const PreviewVoiceSchema = z.object({
  voice_description: z.string().min(1, "Voice description required"),
  sample_text: z.string().default("Hello, this is how I sound."),
});

class MayaTTSServer {
  private server: Server;
  private pythonProcess: ChildProcess | null = null;
  private serverReady = false;

  constructor() {
    this.server = new Server(
      {
        name: "maya-tts-mcp",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
    this.setupErrorHandlers();
  }

  private setupErrorHandlers(): void {
    this.server.onerror = (error) => {
      console.error("[MCP Error]", error);
    };

    process.on("SIGINT", async () => {
      await this.cleanup();
      process.exit(0);
    });

    process.on("SIGTERM", async () => {
      await this.cleanup();
      process.exit(0);
    });
  }

  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools: Tool[] = [
        {
          name: "speak_as_contact",
          description: "Generate speech as a contact with their voice profile and emotional expression",
          inputSchema: {
            type: "object",
            properties: {
              text: {
                type: "string",
                description: "The text to speak",
              },
              voice_description: {
                type: "string",
                description: "Voice description (e.g., 'Female voice in her 30s, American accent, warm timbre')",
              },
              emotion_tags: {
                type: "array",
                items: {
                  type: "string",
                  enum: ["laugh", "giggle", "sigh", "gasp", "cry", "whisper", "angry"],
                },
                description: "Optional emotion tags to apply",
                default: [],
              },
            },
            required: ["text", "voice_description"],
          },
        },
        {
          name: "speak_reflection",
          description: "Generate AI reflection speech in calm, neutral voice",
          inputSchema: {
            type: "object",
            properties: {
              text: {
                type: "string",
                description: "The reflection text to speak",
              },
              tone: {
                type: "string",
                enum: ["neutral", "gentle", "concerned", "warm"],
                description: "The tone of voice for the reflection",
                default: "neutral",
              },
            },
            required: ["text"],
          },
        },
        {
          name: "preview_voice",
          description: "Generate a sample of a voice description to preview how it sounds",
          inputSchema: {
            type: "object",
            properties: {
              voice_description: {
                type: "string",
                description: "Voice description to preview",
              },
              sample_text: {
                type: "string",
                description: "Sample text to speak",
                default: "Hello, this is how I sound.",
              },
            },
            required: ["voice_description"],
          },
        },
      ];

      return { tools };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        // Ensure Python server is running
        if (!this.serverReady) {
          await this.startPythonServer();
        }

        switch (request.params.name) {
          case "speak_as_contact":
            return await this.handleSpeakAsContact(request.params.arguments);

          case "speak_reflection":
            return await this.handleSpeakReflection(request.params.arguments);

          case "preview_voice":
            return await this.handlePreviewVoice(request.params.arguments);

          default:
            throw new Error(`Unknown tool: ${request.params.name}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text",
              text: `Error: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  private async startPythonServer(): Promise<void> {
    if (this.serverReady) return;

    console.error("[Maya TTS] Starting Python inference server...");

    const serverPath = join(__dirname, "..", "server.py");

    // Check if server file exists
    try {
      await fs.access(serverPath);
    } catch (error) {
      throw new Error(`Python server not found at ${serverPath}`);
    }

    // Start Python server using venv
    const venvPython = join(__dirname, "..", "venv", "bin", "python3");
    const pythonExecutable = await fs.access(venvPython).then(() => venvPython).catch(() => "python3");

    this.pythonProcess = spawn(pythonExecutable, [serverPath], {
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, PYTHONUNBUFFERED: "1" },
    });

    // Log Python server output
    this.pythonProcess.stdout?.on("data", (data) => {
      console.error(`[Python Server] ${data.toString().trim()}`);
    });

    this.pythonProcess.stderr?.on("data", (data) => {
      console.error(`[Python Server Error] ${data.toString().trim()}`);
    });

    this.pythonProcess.on("error", (error) => {
      console.error("[Python Server] Process error:", error);
      this.serverReady = false;
    });

    this.pythonProcess.on("exit", (code) => {
      console.error(`[Python Server] Exited with code ${code}`);
      this.serverReady = false;
    });

    // Wait for server to be ready
    const startTime = Date.now();
    while (Date.now() - startTime < PYTHON_SERVER_STARTUP_TIMEOUT) {
      try {
        const response = await axios.get(`${PYTHON_SERVER_URL}/health`, {
          timeout: 1000,
        });
        if (response.status === 200) {
          this.serverReady = true;
          console.error("[Maya TTS] Python server ready");
          return;
        }
      } catch (error) {
        // Server not ready yet, wait and retry
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    throw new Error("Python server failed to start within timeout period");
  }

  private async handleSpeakAsContact(args: unknown) {
    const params = SpeakAsContactSchema.parse(args);

    const response = await axios.post(
      `${PYTHON_SERVER_URL}/speak_as_contact`,
      {
        text: params.text,
        voice_description: params.voice_description,
        emotion_tags: params.emotion_tags,
      },
      { timeout: 60000 } // 60 second timeout for generation
    );

    if (response.data.error) {
      throw new Error(response.data.error);
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            audio_path: response.data.audio_path,
            audio_base64: response.data.audio_base64,
            duration_seconds: response.data.duration_seconds,
            voice_description: params.voice_description,
            emotion_tags: params.emotion_tags,
          }, null, 2),
        },
      ],
    };
  }

  private async handleSpeakReflection(args: unknown) {
    const params = SpeakReflectionSchema.parse(args);

    // Define reflection voice descriptions based on tone
    const toneDescriptions: Record<string, string> = {
      neutral: "Female voice in her 40s, neutral American accent, calm and professional timbre",
      gentle: "Female voice in her 40s, soft American accent, gentle and soothing timbre",
      concerned: "Female voice in her 40s, warm American accent, concerned but supportive timbre",
      warm: "Female voice in her 40s, warm American accent, friendly and compassionate timbre",
    };

    const voiceDescription = toneDescriptions[params.tone];

    const response = await axios.post(
      `${PYTHON_SERVER_URL}/speak_reflection`,
      {
        text: params.text,
        voice_description: voiceDescription,
        tone: params.tone,
      },
      { timeout: 60000 }
    );

    if (response.data.error) {
      throw new Error(response.data.error);
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            audio_path: response.data.audio_path,
            audio_base64: response.data.audio_base64,
            duration_seconds: response.data.duration_seconds,
            tone: params.tone,
          }, null, 2),
        },
      ],
    };
  }

  private async handlePreviewVoice(args: unknown) {
    const params = PreviewVoiceSchema.parse(args);

    const response = await axios.post(
      `${PYTHON_SERVER_URL}/preview_voice`,
      {
        voice_description: params.voice_description,
        sample_text: params.sample_text,
      },
      { timeout: 60000 }
    );

    if (response.data.error) {
      throw new Error(response.data.error);
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            audio_path: response.data.audio_path,
            audio_base64: response.data.audio_base64,
            duration_seconds: response.data.duration_seconds,
            voice_description: params.voice_description,
          }, null, 2),
        },
      ],
    };
  }

  private async cleanup(): Promise<void> {
    console.error("[Maya TTS] Shutting down...");

    if (this.pythonProcess) {
      this.pythonProcess.kill("SIGTERM");

      // Wait for process to exit gracefully
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          if (this.pythonProcess) {
            this.pythonProcess.kill("SIGKILL");
          }
          resolve();
        }, 5000);

        this.pythonProcess?.on("exit", () => {
          clearTimeout(timeout);
          resolve();
        });
      });
    }

    this.serverReady = false;
    console.error("[Maya TTS] Shutdown complete");
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("[Maya TTS MCP] Server running on stdio");
  }
}

// Start the server
const server = new MayaTTSServer();
server.run().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
