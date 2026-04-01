import type { ActionRecord, PolicyTier, RunRequest, ToolResult } from "../core/types";
import type { ToolRegistry } from "../core/tool-registry";
import type { AgentModel } from "../models/types";
import { RunRecorder, type RunArtifactsSummary } from "./run-recorder";
import { loadWorkspaceFixture } from "./workspace-store";

export interface RuntimeConfig {
  artifactDir: string;
  defaultWorkspaceFile: string;
  maxIterations: number;
}

export interface RuntimeRunResult {
  requestId: string;
  model: string;
  text: string;
  actions: ActionRecord[];
  artifacts: RunArtifactsSummary;
}

function blockedResult(message: string): ToolResult {
  return {
    success: false,
    summary: "The runtime blocked this action.",
    error: message,
    verification: {
      status: "blocked",
      summary: message,
    },
  };
}

export class AgentRuntime {
  constructor(
    private readonly registry: ToolRegistry,
    private readonly model: AgentModel,
    private readonly config: RuntimeConfig
  ) {}

  listTools() {
    return this.registry.list().map((tool) => ({
      name: tool.name,
      description: tool.description,
      requiredPolicy: tool.requiredPolicy,
      ...(tool.exampleRequest ? { exampleRequest: tool.exampleRequest } : {}),
    }));
  }

  async run(request: RunRequest): Promise<RuntimeRunResult> {
    const workspaceFile = request.workspaceFile ?? this.config.defaultWorkspaceFile;
    const workspace = loadWorkspaceFixture(workspaceFile);
    const recorder = new RunRecorder("operatorkit", this.config.artifactDir, request, workspaceFile);
    const actions: ActionRecord[] = [];

    for (let iteration = 0; iteration < this.config.maxIterations; iteration += 1) {
      const decision = await this.model.decide({
        input: request.input,
        policyTier: request.policyTier,
        availableTools: this.listTools().filter((tool) => this.canSeeTool(request.policyTier, tool.requiredPolicy)),
        actionHistory: actions,
      });

      recorder.recordDecision(iteration + 1, decision);

      if (decision.type === "final") {
        return {
          requestId: recorder.runId,
          model: this.model.name,
          text: decision.text,
          actions,
          artifacts: recorder.finalize(this.model.name, decision.text, actions),
        };
      }

      for (const call of decision.calls) {
        const validationError = this.registry.validateCall(call, request.policyTier);
        if (validationError) {
          actions.push({
            toolName: call.toolName,
            params: call.params,
            requiredPolicy: this.registry.getRequiredPolicy(call.toolName),
            allowed: false,
            rationale: call.rationale,
            result: blockedResult(validationError),
            confirmationState: "blocked",
          });
          continue;
        }

        const result = await this.registry.executeCall(call, {
          requestId: recorder.runId,
          policyTier: request.policyTier,
          workspace,
          now: new Date().toISOString(),
        });

        actions.push({
          toolName: call.toolName,
          params: call.params,
          requiredPolicy: this.registry.getRequiredPolicy(call.toolName),
          allowed: true,
          rationale: call.rationale,
          result,
          confirmationState:
            result.verification.status === "verified"
              ? "verified"
              : result.verification.status === "unverified"
                ? "unverified"
                : "blocked",
        });
      }
    }

    const fallbackText = "I stopped after reaching the maximum tool iterations without a verified final answer.";
    return {
      requestId: recorder.runId,
      model: this.model.name,
      text: fallbackText,
      actions,
      artifacts: recorder.finalize(this.model.name, fallbackText, actions),
    };
  }

  private canSeeTool(requester: PolicyTier, required: PolicyTier): boolean {
    if (requester === "admin") {
      return true;
    }

    if (requester === "operate") {
      return required === "read" || required === "operate";
    }

    return required === "read";
  }
}
