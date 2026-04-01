import Ajv from "ajv";
import type { ValidateFunction } from "ajv";
import type { PolicyTier, ToolCall, ToolDefinition, ToolExecutionContext, ToolResult } from "./types";
import { hasPolicyAccess } from "../security/policy";

type RegisteredTool = ToolDefinition<Record<string, unknown>>;

export class ToolRegistry {
  private readonly tools = new Map<string, RegisteredTool>();
  private readonly validators = new Map<string, ValidateFunction>();
  private readonly ajv = new Ajv({ allErrors: true });

  register(tool: RegisteredTool): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool already registered: ${tool.name}`);
    }

    this.tools.set(tool.name, tool);
    this.validators.set(tool.name, this.ajv.compile(tool.inputSchema));
  }

  list(): RegisteredTool[] {
    return Array.from(this.tools.values());
  }

  listForPolicy(policyTier: PolicyTier): RegisteredTool[] {
    return this.list().filter((tool) => hasPolicyAccess(policyTier, tool.requiredPolicy));
  }

  get(name: string): RegisteredTool | undefined {
    return this.tools.get(name);
  }

  getRequiredPolicy(name: string): PolicyTier | "unknown" {
    return this.tools.get(name)?.requiredPolicy ?? "unknown";
  }

  validateCall(call: ToolCall, requesterPolicy: PolicyTier): string | null {
    const tool = this.tools.get(call.toolName);

    if (!tool) {
      return `Unknown tool: ${call.toolName}`;
    }

    if (!hasPolicyAccess(requesterPolicy, tool.requiredPolicy)) {
      return `Permission denied: ${call.toolName} requires ${tool.requiredPolicy} policy`;
    }

    const validate = this.validators.get(call.toolName);
    if (!validate) {
      return `No validator registered for ${call.toolName}`;
    }

    const valid = validate(call.params);
    if (!valid) {
      const errors = validate.errors
        ?.map((error) => `${error.instancePath || "/"} ${error.message}`)
        .join("; ");
      return `Invalid parameters for ${call.toolName}: ${errors}`;
    }

    return null;
  }

  async executeCall(call: ToolCall, context: ToolExecutionContext): Promise<ToolResult> {
    const tool = this.tools.get(call.toolName);

    if (!tool) {
      return {
        success: false,
        summary: `Unable to run ${call.toolName}.`,
        error: `Unknown tool: ${call.toolName}`,
        verification: {
          status: "blocked",
          summary: `No tool named ${call.toolName} is registered.`,
        },
      };
    }

    return tool.execute(call.params, context);
  }
}
