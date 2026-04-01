import { describe, expect, it } from "vitest";
import type { ToolDefinition } from "../src/core/types";
import { ToolRegistry } from "../src/core/tool-registry";
import { hasPolicyAccess, isPolicyTier } from "../src/security/policy";

function createTool(
  overrides: Partial<ToolDefinition<Record<string, unknown>>> = {},
): ToolDefinition<Record<string, unknown>> {
  return {
    name: overrides.name ?? "test_tool",
    description: overrides.description ?? "Test tool",
    requiredPolicy: overrides.requiredPolicy ?? "operate",
    inputSchema: overrides.inputSchema ?? {
      type: "object",
      properties: {
        title: { type: "string", minLength: 1 },
      },
      required: ["title"],
      additionalProperties: false,
    },
    execute:
      overrides.execute ??
      (async () => ({
        success: true,
        summary: "Executed test tool.",
        verification: {
          status: "verified",
          summary: "Verified test tool execution.",
        },
      })),
  };
}

describe("hasPolicyAccess", () => {
  it("enforces the policy ranking across read, operate, and admin", () => {
    expect(hasPolicyAccess("read", "read")).toBe(true);
    expect(hasPolicyAccess("read", "operate")).toBe(false);
    expect(hasPolicyAccess("operate", "read")).toBe(true);
    expect(hasPolicyAccess("operate", "admin")).toBe(false);
    expect(hasPolicyAccess("admin", "operate")).toBe(true);
  });

  it("recognizes valid policy tiers and rejects unknown values", () => {
    expect(isPolicyTier("admin")).toBe(true);
    expect(isPolicyTier("read")).toBe(true);
    expect(isPolicyTier("owner")).toBe(false);
  });
});

describe("ToolRegistry", () => {
  it("prevents duplicate tool registration", () => {
    const registry = new ToolRegistry();
    const tool = createTool({ name: "duplicate_guard" });

    registry.register(tool);

    expect(() => registry.register(tool)).toThrow("Tool already registered: duplicate_guard");
  });

  it("filters visible tools by the requester policy tier", () => {
    const registry = new ToolRegistry();
    registry.register(createTool({ name: "read_only", requiredPolicy: "read" }));
    registry.register(createTool({ name: "admin_only", requiredPolicy: "admin" }));

    expect(registry.listForPolicy("read").map((tool) => tool.name)).toEqual(["read_only"]);
    expect(registry.listForPolicy("operate").map((tool) => tool.name)).toEqual(["read_only"]);
    expect(registry.listForPolicy("admin").map((tool) => tool.name)).toEqual(["read_only", "admin_only"]);
  });

  it("rejects calls when the requester lacks the required policy", () => {
    const registry = new ToolRegistry();
    registry.register(createTool({ name: "admin_only", requiredPolicy: "admin" }));

    const validation = registry.validateCall(
      {
        toolName: "admin_only",
        params: { title: "Launch note" },
      },
      "operate",
    );

    expect(validation).toContain("Permission denied");
    expect(validation).toContain("admin_only requires admin policy");
  });

  it("rejects calls when parameters do not satisfy the tool schema", () => {
    const registry = new ToolRegistry();
    registry.register(createTool({ name: "schema_guard" }));

    const validation = registry.validateCall(
      {
        toolName: "schema_guard",
        params: {},
      },
      "operate",
    );

    expect(validation).toContain("Invalid parameters for schema_guard");
    expect(validation).toContain("must have required property 'title'");
  });
});
