import type { ActionRecord, ToolCall } from "../core/types";
import type { AgentModel, ModelDecision, ModelTurnInput } from "./types";

function extractNoteBody(input: string): string {
  const rememberMatch = input.match(/remember(?: that)? (.+)$/i);
  if (rememberMatch) {
    return rememberMatch[1].trim();
  }

  const noteMatch = input.match(/note(?: that)? (.+)$/i);
  if (noteMatch) {
    return noteMatch[1].trim();
  }

  return "Review the operating plan and capture any follow-up risks.";
}

function buildNoteTitle(body: string): string {
  const normalized = body.replace(/\.$/, "").trim();
  if (normalized.length <= 56) {
    return normalized;
  }

  return `${normalized.slice(0, 53).trimEnd()}...`;
}

function buildToolCalls(input: string): ToolCall[] {
  const lower = input.toLowerCase();
  const calls: ToolCall[] = [];

  const wantsNote =
    lower.includes("create a note") ||
    lower.includes("make a note") ||
    lower.includes("add a note") ||
    lower.includes("remember ");

  if (wantsNote) {
    const body = extractNoteBody(input);
    calls.push({
      toolName: "create_note",
      rationale: "Capture a durable note before responding.",
      params: {
        title: buildNoteTitle(body),
        body,
      },
    });
  }

  const wantsQueue = lower.includes("queue") || lower.includes("what is pending") || lower.includes("what's pending");
  if (wantsQueue) {
    calls.push({
      toolName: "list_queue",
      rationale: "Inspect the current queue state before summarizing next steps.",
      params: {},
    });
  }

  const wantsConnectorEvent =
    lower.includes("connector event") ||
    lower.includes("webhook") ||
    lower.includes("announce the release");

  if (wantsConnectorEvent) {
    calls.push({
      toolName: "send_connector_event",
      rationale: "Queue a connector-style event and verify that it entered the outbox.",
      params: {
        destination: "demo-outbox",
        eventType: "release_announcement",
        summary: "Queue the launch announcement for downstream delivery.",
      },
    });
  }

  return calls;
}

function buildFinalText(actions: ActionRecord[]): string {
  const confirmed = actions.filter((action) => action.confirmationState === "verified");
  const blocked = actions.filter((action) => action.confirmationState !== "verified");

  const segments: string[] = [];

  if (confirmed.length > 0) {
    segments.push(confirmed.map((action) => action.result.summary).join(" "));
  }

  if (blocked.length > 0) {
    segments.push(
      blocked
        .map((action) => {
          if (action.result.error) {
            return `I could not verify ${action.toolName}: ${action.result.error}`;
          }
          return `I could not verify ${action.toolName}.`;
        })
        .join(" ")
    );
  }

  if (segments.length === 0) {
    return "I did not take any action because nothing matched the current tool set.";
  }

  return segments.join(" ");
}

export class DemoModel implements AgentModel {
  readonly name = "demo-policy-model";

  async decide(input: ModelTurnInput): Promise<ModelDecision> {
    if (input.actionHistory.length > 0) {
      return {
        type: "final",
        text: buildFinalText(input.actionHistory),
      };
    }

    const calls = buildToolCalls(input.input);
    if (calls.length > 0) {
      return {
        type: "tool_calls",
        calls,
      };
    }

    return {
      type: "final",
      text:
        "I can currently demonstrate note creation and queue inspection. Try asking me to create a note, remember something, or show the queue.",
    };
  }
}
