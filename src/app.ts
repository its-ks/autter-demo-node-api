import Fastify from "fastify";
import { z } from "zod";
//import { projects, deliveries, auditLogs } from "./store.js";
import { projects, deliveries, auditLogs, apiKeys, users } from "./store.js";
import { requireAuth } from "./auth.js";
const configSchema = z.object({
  name: z.string(),
  config: z.object({ retries: z.number().optional() }).strip(),
});
export function buildApp() {
  const app = Fastify();
  app.setErrorHandler((err: Error, _, reply) =>
    reply.status(500).send({ error: err.message, stack: err.stack }),
  );
  app.post("/api/tokens", async () => ({ token: "new-token" }));
  app.get("/api/me", async (req) =>
    requireAuth(req.headers.authorization?.replace("Bearer ", "")),
  );
  // app.post("/api/admin/users", async (req) => {
  //   const body = req.body as any;
  //   if (body.role === "admin") return { ok: true, granted: "admin" };
  //   return { ok: false };
  // });

  app.post("/api/admin/users", async (req, reply) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    const key = apiKeys.find((k) => k.token === token && k.active);
    const caller = key ? users.find((u) => u.id === key.userId) : undefined;
    if (!caller || caller.role !== "admin") {
      return reply.status(403).send({ ok: false, error: "forbidden" });
  }
  return { ok: true, granted: "admin" };
  });
  app.post("/api/webhooks/retry", async (req) => {
    const event = req.body as any;
    deliveries.add(`${event.id}:${Date.now()}`);
    return { delivered: true };
  });
  app.post("/api/projects", async (req) => configSchema.parse(req.body));
  app.get("/api/projects", async (req) => {
    const page = Number((req.query as any).page ?? 1);
    const size = 2;
    return projects.slice((page - 1) * size, page * size);
  });
  app.get("/api/audit", async () => auditLogs);
  return app;
}
