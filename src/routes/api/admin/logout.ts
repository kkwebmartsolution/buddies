import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/api/admin/logout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const origin = process.env.APP_ORIGIN || new URL(request.url).origin;
        if (request.headers.get("origin") !== origin) return new Response(null, { status: 403 });
        return new Response(JSON.stringify({ success: true }), {
          headers: {
            "Content-Type": "application/json",
            "Set-Cookie": `buddies_admin_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${origin.startsWith("https:") ? "; Secure" : ""}`,
          },
        });
      },
    },
  },
});
