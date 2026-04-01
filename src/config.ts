import "dotenv/config";
import { resolve } from "path";

export interface OperatorkitConfig {
  port: number;
  artifactDir: string;
  jwtSecret: string;
  jwtIssuer: string;
  jwtAudience: string;
  defaultWorkspaceFile: string;
  maxIterations: number;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function loadConfig(): OperatorkitConfig {
  return {
    port: Number.parseInt(process.env.PORT ?? "3200", 10),
    artifactDir: resolve(process.cwd(), process.env.OPERATORKIT_ARTIFACT_DIR ?? "./artifacts/runs"),
    jwtSecret: requireEnv("OPERATORKIT_JWT_SECRET"),
    jwtIssuer: process.env.OPERATORKIT_JWT_ISSUER ?? "operatorkit-local",
    jwtAudience: process.env.OPERATORKIT_JWT_AUDIENCE ?? "operatorkit",
    defaultWorkspaceFile: process.env.OPERATORKIT_DEFAULT_WORKSPACE ?? "demo/workspaces/default-workspace.json",
    maxIterations: Number.parseInt(process.env.OPERATORKIT_MAX_ITERATIONS ?? "4", 10),
  };
}
