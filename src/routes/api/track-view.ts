import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/track-view")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const fs = await import("node:fs");
          const path = await import("node:path");
          const { getDbPool } = await import("@/lib/cms-store");

          const visitorFilePath = path.join(process.cwd(), "public", "visitor-store.json");

          const body = await request.json().catch(() => ({}));
          const pagePath = body.path || "/";
          const nowStr = new Date().toISOString();

          // Save to MySQL if available
          const db = getDbPool();
          if (db) {
            try {
              await db.query(
                "INSERT INTO page_views (path, created_at) VALUES (?, NOW())",
                [pagePath],
              );
            } catch (err) {
              // fallback
            }
          }

          // Always update local file store for persistent fallback
          try {
            let localViews: Array<{ path: string; timestamp: string }> = [];
            if (fs.existsSync(visitorFilePath)) {
              const content = fs.readFileSync(visitorFilePath, "utf-8");
              localViews = JSON.parse(content).views || [];
            }
            localViews.push({ path: pagePath, timestamp: nowStr });
            if (localViews.length > 5000) {
              localViews = localViews.slice(-5000);
            }
            const dir = path.dirname(visitorFilePath);
            if (!fs.existsSync(dir)) {
              fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(visitorFilePath, JSON.stringify({ views: localViews }, null, 2), "utf-8");
          } catch (e) {
            // fallback
          }

          return new Response(JSON.stringify({ success: true }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (error) {
          return new Response(JSON.stringify({ success: false }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
