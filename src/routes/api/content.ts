import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/content")({
  server: {
    handlers: {
      GET: async () => {
        const { getCmsData } = await import("@/lib/cms-store");
        const data = await getCmsData();
        return new Response(JSON.stringify(data), {
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=10",
          },
        });
      },
    },
  },
});
