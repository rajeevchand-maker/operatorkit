import jwt from "jsonwebtoken";
import type { FastifyReply, FastifyRequest } from "fastify";
import type { OperatorkitConfig } from "../config";

export function signDemoToken(config: OperatorkitConfig): string {
  return jwt.sign(
    { scope: "runtime:execute" },
    config.jwtSecret,
    {
      audience: config.jwtAudience,
      issuer: config.jwtIssuer,
      subject: "operatorkit-local-demo",
      expiresIn: "1h",
    }
  );
}

export function verifyToken(token: string, config: OperatorkitConfig): jwt.JwtPayload {
  return jwt.verify(token, config.jwtSecret, {
    audience: config.jwtAudience,
    issuer: config.jwtIssuer,
  }) as jwt.JwtPayload;
}

export function createAuthHook(config: OperatorkitConfig) {
  return async function authHook(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const header = request.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      reply.code(401).send({ error: "Missing or malformed Authorization header" });
      return;
    }

    try {
      verifyToken(header.slice(7), config);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid token";
      reply.code(401).send({ error: message });
    }
  };
}
