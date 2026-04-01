import { randomUUID } from "crypto";
import type { ToolDefinition } from "../core/types";

type SendConnectorEventParams = {
  destination: string;
  eventType: string;
  summary: string;
};

export const sendConnectorEventTool: ToolDefinition<SendConnectorEventParams> = {
  name: "send_connector_event",
  description: "Queue a generic connector event in the demo outbox and verify that it was recorded.",
  requiredPolicy: "admin",
  exampleRequest: "demo/requests/send-connector-event.json",
  inputSchema: {
    type: "object",
    properties: {
      destination: { type: "string", minLength: 1, maxLength: 80 },
      eventType: { type: "string", minLength: 1, maxLength: 80 },
      summary: { type: "string", minLength: 1, maxLength: 280 },
    },
    required: ["destination", "eventType", "summary"],
    additionalProperties: false,
  },
  async execute(params, context) {
    const envelope = {
      id: randomUUID(),
      eventType: params.eventType,
      payload: {
        destination: params.destination,
        summary: params.summary,
      },
      queuedAt: context.now,
    };

    context.workspace.connectorOutbox.push(envelope);
    const stored = context.workspace.connectorOutbox.find((entry) => entry.id === envelope.id);

    if (!stored) {
      return {
        success: false,
        summary: "I attempted to queue the connector event but could not verify it.",
        error: "Connector event was not present in the outbox after execution.",
        verification: {
          status: "unverified",
          summary: "The connector event did not persist in the outbox.",
        },
      };
    }

    return {
      success: true,
      summary: `I queued the ${stored.eventType} connector event for ${params.destination} and verified it in the outbox.`,
      data: {
        eventId: stored.id,
        destination: params.destination,
        outboxSize: context.workspace.connectorOutbox.length,
      },
      verification: {
        status: "verified",
        summary: `Verified connector event ${stored.id} exists in the outbox.`,
        evidence: {
          eventId: stored.id,
          outboxSize: context.workspace.connectorOutbox.length,
        },
      },
    };
  },
};
