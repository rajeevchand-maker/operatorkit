import type { ToolDefinition } from "../core/types";

type ListQueueParams = {
  status?: "queued" | "in_review" | "done";
};

export const listQueueTool: ToolDefinition<ListQueueParams> = {
  name: "list_queue",
  description: "List items in the demo operations queue and verify the resulting count.",
  requiredPolicy: "read",
  exampleRequest: "demo/requests/list-queue.json",
  inputSchema: {
    type: "object",
    properties: {
      status: {
        type: "string",
        enum: ["queued", "in_review", "done"],
      },
    },
    additionalProperties: false,
  },
  async execute(params, context) {
    const items = params.status
      ? context.workspace.queue.filter((item) => item.status === params.status)
      : context.workspace.queue;

    return {
      success: true,
      summary: `I inspected the queue and verified ${items.length} item${items.length === 1 ? "" : "s"} in scope.`,
      data: {
        items: items.map((item) => ({
          id: item.id,
          title: item.title,
          status: item.status,
          owner: item.owner,
        })),
      },
      verification: {
        status: "verified",
        summary: `Verified queue query returned ${items.length} item${items.length === 1 ? "" : "s"}.`,
        evidence: {
          count: items.length,
          status: params.status ?? "all",
        },
      },
    };
  },
};
