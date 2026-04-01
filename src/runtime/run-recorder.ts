import { mkdirSync, writeFileSync } from "fs";
import { join, relative } from "path";
import type { ActionRecord, RunRequest } from "../core/types";
import type { ModelDecision } from "../models/types";

export interface RunArtifactsSummary {
  runId: string;
  runDirectory: string;
  requestFile: string;
  logFile: string;
}

type DecisionRecord = {
  iteration: number;
  decision: ModelDecision;
};

type RecordedRun = {
  runId: string;
  runtime: string;
  startedAt: string;
  durationMs: number;
  request: RunRequest;
  workspaceFile: string;
  model: string;
  finalText: string;
  actions: ActionRecord[];
  decisions: DecisionRecord[];
};

export class RunRecorder {
  readonly runId: string;
  private readonly startedAt = new Date();
  private readonly runDirectoryPath: string;
  private readonly relativeRunDirectory: string;
  private readonly decisions: DecisionRecord[] = [];

  constructor(
    private readonly runtimeName: string,
    artifactRoot: string,
    private readonly request: RunRequest,
    private readonly workspaceFile: string
  ) {
    const dateStamp = this.startedAt.toISOString().slice(0, 10);
    const timeStamp = this.startedAt.toISOString().slice(11, 19).replace(/:/g, "-");
    const suffix = Math.random().toString(36).slice(2, 6);

    this.runId = `${runtimeName}_${timeStamp}_${suffix}`;
    this.runDirectoryPath = join(artifactRoot, dateStamp, this.runId);
    this.relativeRunDirectory = relative(process.cwd(), this.runDirectoryPath);

    mkdirSync(this.runDirectoryPath, { recursive: true });
    this.writeJson("request.json", {
      request: this.request,
      workspaceFile: this.workspaceFile,
      startedAt: this.startedAt.toISOString(),
    });
  }

  recordDecision(iteration: number, decision: ModelDecision): void {
    this.decisions.push({ iteration, decision });
  }

  finalize(model: string, finalText: string, actions: ActionRecord[]): RunArtifactsSummary {
    const recordedRun: RecordedRun = {
      runId: this.runId,
      runtime: this.runtimeName,
      startedAt: this.startedAt.toISOString(),
      durationMs: Date.now() - this.startedAt.getTime(),
      request: this.request,
      workspaceFile: this.workspaceFile,
      model,
      finalText,
      actions,
      decisions: this.decisions,
    };

    this.writeJson("run.json", recordedRun);

    return {
      runId: this.runId,
      runDirectory: this.relativeRunDirectory,
      requestFile: join(this.relativeRunDirectory, "request.json"),
      logFile: join(this.relativeRunDirectory, "run.json"),
    };
  }

  private writeJson(filename: string, value: unknown): void {
    writeFileSync(join(this.runDirectoryPath, filename), JSON.stringify(value, null, 2) + "\n");
  }
}
