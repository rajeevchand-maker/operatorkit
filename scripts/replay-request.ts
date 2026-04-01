import { readFileSync } from "fs";
import { resolve } from "path";
import { buildServer } from "../src/server";
import { loadConfig } from "../src/config";
import { signDemoToken } from "../src/security/auth";

type RequestFixture = {
  description: string;
  input: string;
  policyTier: "read" | "operate" | "admin";
  workspaceFile?: string;
};

function readFixture(pathArg: string | undefined): RequestFixture {
  if (!pathArg) {
    throw new Error("Usage: npm run replay:request -- <fixture-path>");
  }

  const filePath = resolve(process.cwd(), pathArg);
  return JSON.parse(readFileSync(filePath, "utf8")) as RequestFixture;
}

async function main() {
  const fixture = readFixture(process.argv[2]);
  const config = loadConfig();
  const { fastify } = await buildServer();

  try {
    const response = await fastify.inject({
      method: "POST",
      url: "/runs",
      headers: {
        authorization: `Bearer ${signDemoToken(config)}`,
      },
      payload: {
        input: fixture.input,
        policyTier: fixture.policyTier,
        ...(fixture.workspaceFile ? { workspaceFile: fixture.workspaceFile } : {}),
      },
    });

    console.log(
      JSON.stringify(
        {
          description: fixture.description,
          status: response.statusCode,
          body: JSON.parse(response.body),
        },
        null,
        2
      )
    );

    if (response.statusCode >= 400) {
      process.exitCode = 1;
    }
  } finally {
    await fastify.close();
  }
}

main().catch((error) => {
  console.error("Request replay failed:", error);
  process.exit(1);
});
