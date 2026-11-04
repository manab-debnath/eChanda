import { serve } from "bun";
import index from "./index.html";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8080";

const server = serve({
  port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
  routes: {
    // Proxy /api/* to the Go backend
    "/api/*": async (req) => {
      const url = new URL(req.url);
      const targetUrl = new URL(url.pathname + url.search, BACKEND_URL);
      const headers = new Headers(req.headers);
      headers.set("host", new URL(BACKEND_URL).host);

      try {
        return await fetch(targetUrl.toString(), {
          method: req.method,
          headers,
          body: ["GET", "HEAD"].includes(req.method) ? undefined : req.body,
          redirect: "follow",
        });
      } catch (err) {
        console.error("Proxy error to Go backend:", err);
        return Response.json(
          { error: "Could not connect to eChanda backend server at " + BACKEND_URL },
          { status: 502 }
        );
      }
    },

    // Serve index.html for all unmatched routes.
    "/*": index,
  },

  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`🚀 eChanda Client running at ${server.url}`);
