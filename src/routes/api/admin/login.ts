import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/admin/login")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { checkAdminCredentials, signAdminToken } = await import("@/lib/auth");
          const body = await request.json();
          const { username, password } = body;

          if (
            (username === "admin" || username === "admin@buddies.in") &&
            checkAdminCredentials(password)
          ) {
            const token = signAdminToken(username);
            return new Response(
              JSON.stringify({ success: true, token, message: "Logged in successfully" }),
              {
                headers: {
                  "Content-Type": "application/json",
                  "Set-Cookie": `buddies_admin_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`,
                },
              },
            );
          }

          return new Response(
            JSON.stringify({ success: false, message: "Invalid username or password" }),
            { status: 401, headers: { "Content-Type": "application/json" } },
          );
        } catch (err) {
          return new Response(
            JSON.stringify({ success: false, message: "Authentication failed" }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});
