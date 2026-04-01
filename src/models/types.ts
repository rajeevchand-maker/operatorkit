import type { ActionRecord, PolicyTier, ToolCall } from "../core/types";

export interface ModelToolView {
  name: string;
  description: string;
  requiredPolicy: PolicyTier;
}

export interface ModelTurnInput {
  input: string;
  policyTier: PolicyTier;
  availableTools: ModelToolView[];
  actionHistory: ActionRecord[];
}

export type ModelDecision =
  | {
      type: "tool_calls";
      calls: ToolCall[];
    }
  | {
      type: "final";
      text: string;
    };

export interface AgentModel {
  name: string;
  decide(input: ModelTurnInput): Promise<ModelDecision>;
}
