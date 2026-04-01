export type PolicyTier = "read" | "operate" | "admin";

export interface DemoNote {
  id: string;
  title: string;
  body: string;
  createdBy: string;
  createdAt: string;
}

export interface DemoQueueItem {
  id: string;
  title: string;
  status: "queued" | "in_review" | "done";
  owner: string;
  category: string;
}

export interface DemoConnectorEnvelope {
  id: string;
  eventType: string;
  payload: Record<string, unknown>;
  queuedAt: string;
}

export interface DemoWorkspace {
  notes: DemoNote[];
  queue: DemoQueueItem[];
  connectorOutbox: DemoConnectorEnvelope[];
}

export interface ToolVerification {
  status: "verified" | "unverified" | "blocked";
  summary: string;
  evidence?: Record<string, unknown>;
}

export interface ToolResult {
  success: boolean;
  summary: string;
  data?: Record<string, unknown>;
  error?: string;
  verification: ToolVerification;
}

export interface ToolExecutionContext {
  requestId: string;
  policyTier: PolicyTier;
  workspace: DemoWorkspace;
  now: string;
}

export interface ToolCall {
  toolName: string;
  params: Record<string, unknown>;
  rationale?: string;
}

export interface ActionRecord {
  toolName: string;
  params: Record<string, unknown>;
  requiredPolicy: PolicyTier | "unknown";
  allowed: boolean;
  rationale?: string;
  result: ToolResult;
  confirmationState: "verified" | "unverified" | "blocked";
}

export interface ToolDefinition<TParams extends Record<string, unknown> = Record<string, unknown>> {
  name: string;
  description: string;
  requiredPolicy: PolicyTier;
  exampleRequest?: string;
  inputSchema: Record<string, unknown>;
  execute(params: TParams, context: ToolExecutionContext): Promise<ToolResult>;
}

export interface RunRequest {
  input: string;
  policyTier: PolicyTier;
  workspaceFile?: string;
}
