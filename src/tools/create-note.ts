import { randomUUID } from "crypto";
import type { ToolDefinition } from "../core/types";

type CreateNoteParams = {
  title: string;
  body: string;
};

export const createNoteTool: ToolDefinition<CreateNoteParams> = {
  name: "create_note",
  description: "Create a durable note inside the demo workspace and verify that it was stored.",
  requiredPolicy: "operate",
  exampleRequest: "demo/requests/create-note-and-queue.json",
  inputSchema: {
    type: "object",
    properties: {
      title: { type: "string", minLength: 1, maxLength: 80 },
      body: { type: "string", minLength: 1, maxLength: 500 },
    },
    required: ["title", "body"],
    additionalProperties: false,
  },
  async execute(params, context) {
    const note = {
      id: randomUUID(),
      title: params.title,
      body: params.body,
      createdBy: "operatorkit-demo",
      createdAt: context.now,
    };

    context.workspace.notes.push(note);
    const stored = context.workspace.notes.find((entry) => entry.id === note.id);

    if (!stored) {
      return {
        success: false,
        summary: "I attempted to create the note but could not verify it was stored.",
        error: "Note did not persist in the workspace snapshot.",
        verification: {
          status: "unverified",
          summary: "The note was not present in the workspace after execution.",
        },
      };
    }

    return {
      success: true,
      summary: `I created the note "${stored.title}" and verified it in the workspace.`,
      data: {
        noteId: stored.id,
        title: stored.title,
      },
      verification: {
        status: "verified",
        summary: `Verified note ${stored.id} exists in the workspace.`,
        evidence: {
          noteId: stored.id,
          noteCount: context.workspace.notes.length,
        },
      },
    };
  },
};
