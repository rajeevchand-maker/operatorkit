import type { ToolRegistry } from "../core/tool-registry";
import { createNoteTool } from "./create-note";
import { listQueueTool } from "./list-queue";
import { sendConnectorEventTool } from "./send-connector-event";

export function registerDefaultTools(registry: ToolRegistry): void {
  registry.register(listQueueTool);
  registry.register(createNoteTool);
  registry.register(sendConnectorEventTool);
}
