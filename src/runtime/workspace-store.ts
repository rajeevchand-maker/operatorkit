import { readFileSync } from "fs";
import { resolve } from "path";
import type { DemoWorkspace } from "../core/types";

export function loadWorkspaceFixture(workspaceFile: string): DemoWorkspace {
  const filePath = resolve(process.cwd(), workspaceFile);
  const parsed = JSON.parse(readFileSync(filePath, "utf8")) as DemoWorkspace;

  return structuredClone(parsed);
}
