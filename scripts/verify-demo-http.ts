import { buildServer } from "../src/server";
import { loadConfig } from "../src/config";
import { signDemoToken } from "../src/security/auth";

async function main() {
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
        input: "Create a note to review the launch checklist and then show me the queue.",
        policyTier: "operate",
      },
    });

    console.log(`Status: ${response.statusCode}`);
    console.log(response.body);

    if (response.statusCode >= 400) {
      process.exitCode = 1;
    }
  } finally {
    await fastify.close();
  }
}

main().catch((error) => {
  console.error("Operatorkit demo verification failed:", error);
  process.exit(1);
});
