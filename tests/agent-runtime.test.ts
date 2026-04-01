import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join, resolve } from "path";
import { afterEach, describe, expect, it } from "vitest";
import { ToolRegistry } from "../src/core/tool-registry";
import type { DemoWorkspace } from "../src/core/types";
import type { AgentModel } from "../src/models/types";
import { DemoModel } from "../src/models/demo-model";
import { AgentRuntime } from "../src/runtime/agent-runtime";
import { createNoteTool } from "../src/tools/create-note";
import { listQueueTool } from "../src/tools/list-queue";
import { sendConnectorEventTool } from "../src/tools/send-connector-event";

const cleanupPaths: string[] = [];

function createWorkspaceFixture(): DemoWorkspace {
  return {
    notes: [],
    queue: [
      {
        id: "queue-1",
        title: "Review launch notes",
        status: "queued",
        owner: "Alex",
        category: "release",
      },
    ],
    connectorOutbox: [],
  };
}

function createRuntime(model: AgentModel, maxIterations: number = 3) {
  const root = mkdtempSync(join(tmpdir(), "operatorkit-tests-"));
  const workspaceFile = join(root, "workspace.json");
  const artifactDir = join(root, "artifacts");

  writeFileSync(workspaceFile, JSON.stringify(createWorkspaceFixture(), null, 2));
  cleanupPaths.push(root);

  const registry = new ToolRegistry();
  registry.register(createNoteTool);
  registry.register(listQueueTool);
  registry.register(sendConnectorEventTool);

  return new AgentRuntime(registry, model, {
    artifactDir,
    defaultWorkspaceFile: workspaceFile,
    maxIterations,
  });
}

afterEach(() => {
  while (cleanupPaths.length > 0) {
    rmSync(cleanupPaths.pop()!, { recursive: true, force: true });
  }
});

describe("AgentRuntime", () => {
  it("records verified multi-tool runs and writes run artifacts", async () => {
    const runtime = createRuntime(new DemoModel());

    const result = await runtime.run({
      input: "Create a note to remember launch risk and show me the queue",
      policyTier: "operate",
    });

    expect(result.actions.map((action) => action.toolName)).toEqual(["create_note", "list_queue"]);
    expect(result.actions.every((action) => action.confirmationState === "verified")).toBe(true);
    expect(result.text).toContain("verified it in the workspace");
    expect(result.text).toContain("verified 1 item in scope");

    const requestFile = resolve(process.cwd(), result.artifacts.requestFile);
    const logFile = resolve(process.cwd(), result.artifacts.logFile);

    expect(existsSync(requestFile)).toBe(true);
    expect(existsSync(logFile)).toBe(true);

    const recordedRun = JSON.parse(readFileSync(logFile, "utf8")) as {
      finalText: string;
      actions: Array<{ toolName: string }>;
    };

    expect(recordedRun.actions.map((action) => action.toolName)).toEqual(["create_note", "list_queue"]);
    expect(recordedRun.finalText).toBe(result.text);
  });

  it("blocks admin-only tool calls for operate policy and surfaces the denial clearly", async () => {
    const runtime = createRuntime(new DemoModel());

    const result = await runtime.run({
      input: "Announce the release with a connector event",
      policyTier: "operate",
    });

    expect(result.actions).toHaveLength(1);
    expect(result.actions[0]?.toolName).toBe("send_connector_event");
    expect(result.actions[0]?.requiredPolicy).toBe("admin");
    expect(result.actions[0]?.confirmationState).toBe("blocked");
    expect(result.actions[0]?.result.error).toContain("Permission denied");
    expect(result.text).toContain("I could not verify send_connector_event");
  });

  it("fails closed when the model never reaches a final answer", async () => {
    const loopingModel: AgentModel = {
      name: "looping-model",
      async decide() {
        return {
          type: "tool_calls",
          calls: [
            {
              toolName: "list_queue",
              params: {},
              rationale: "Keep checking the queue forever.",
            },
          ],
        };
      },
    };

    const runtime = createRuntime(loopingModel, 2);

    const result = await runtime.run({
      input: "What is pending?",
      policyTier: "read",
    });

    expect(result.text).toBe(
      "I stopped after reaching the maximum tool iterations without a verified final answer.",
    );
    expect(result.actions).toHaveLength(2);
    expect(result.actions.every((action) => action.toolName === "list_queue")).toBe(true);
    expect(result.actions.every((action) => action.confirmationState === "verified")).toBe(true);
  });
});
