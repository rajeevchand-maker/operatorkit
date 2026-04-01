import Fastify from "fastify";
import { loadConfig } from "./config";
import type { RunRequest } from "./core/types";
import { DemoModel } from "./models/demo-model";
import { AgentRuntime } from "./runtime/agent-runtime";
import { createAuthHook } from "./security/auth";
import { ToolRegistry } from "./core/tool-registry";
import { registerDefaultTools } from "./tools/register-default-tools";
import { isPolicyTier } from "./security/policy";

function parseRunRequest(body: unknown): RunRequest {
  if (!body || typeof body !== "object") {
    throw new Error("Request body must be an object.");
  }

  const input = (body as Record<string, unknown>).input;
  const policyTier = (body as Record<string, unknown>).policyTier;
  const workspaceFile = (body as Record<string, unknown>).workspaceFile;

  if (typeof input !== "string" || !input.trim()) {
    throw new Error("input must be a non-empty string.");
  }

  if (!isPolicyTier(policyTier)) {
    throw new Error("policyTier must be one of: read, operate, admin.");
  }

  if (workspaceFile !== undefined && typeof workspaceFile !== "string") {
    throw new Error("workspaceFile must be a string when provided.");
  }

  return {
    input,
    policyTier,
    ...(workspaceFile ? { workspaceFile } : {}),
  };
}

export async function buildServer() {
  const config = loadConfig();
  const fastify = Fastify({ logger: true });
  const registry = new ToolRegistry();
  registerDefaultTools(registry);

  const runtime = new AgentRuntime(registry, new DemoModel(), {
    artifactDir: config.artifactDir,
    defaultWorkspaceFile: config.defaultWorkspaceFile,
    maxIterations: config.maxIterations,
  });

  fastify.get("/health", async () => ({
    status: "ready",
    runtime: "operatorkit",
    model: "demo-policy-model",
    toolCount: runtime.listTools().length,
  }));

  fastify.get("/tools", async () => ({
    tools: runtime.listTools(),
  }));

  fastify.post<{ Body: unknown }>(
    "/runs",
    { onRequest: createAuthHook(config) },
    async (request, reply) => {
      try {
        const parsed = parseRunRequest(request.body);
        return await runtime.run(parsed);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Invalid request";
        return reply.code(400).send({ error: message });
      }
    }
  );

  return { fastify, config };
}

async function start() {
  const { fastify, config } = await buildServer();
  await fastify.listen({ port: config.port, host: "0.0.0.0" });
}

if (require.main === module) {
  start().catch((error) => {
    console.error("Failed to start operatorkit:", error);
    process.exit(1);
  });
}
