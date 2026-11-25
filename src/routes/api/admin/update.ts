import { createFileRoute } from "@tanstack/react-router";
import type { CmsData } from "@/lib/cms-defaults";

export const Route = createFileRoute("/api/admin/update")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { saveSectionData } = await import("@/lib/cms-store");
          const { verifyAdminToken } = await import("@/lib/auth");

          const authHeader = request.headers.get("Authorization");
          const cookieHeader = request.headers.get("Cookie");
          let token = "";

          if (authHeader && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
          } else if (cookieHeader) {
            const match = cookieHeader.match(/buddies_admin_token=([^;]+)/);
            if (match) token = match[1];
          }

          const user = verifyAdminToken(token);
          if (!user) {
            return new Response(
              JSON.stringify({ success: false, message: "Unauthorized. Please log in." }),
              { status: 401, headers: { "Content-Type": "application/json" } },
            );
          }

          const body = await request.json();
          const { section, data } = body;

          if (!section || !data) {
            return new Response(
              JSON.stringify({ success: false, message: "Missing section or data" }),
              { status: 400, headers: { "Content-Type": "application/json" } },
            );
          }

          if (
            section === "site" &&
            data.theme !== undefined &&
            !["light", "dark"].includes(data.theme)
          ) {
            return Response.json(
              { success: false, message: "Choose a light or dark website theme." },
              { status: 400 },
            );
          }
          await saveSectionData(section as keyof CmsData, data);

          return new Response(
            JSON.stringify({
              success: true,
              message: `Section '${section}' updated successfully!`,
            }),
            { headers: { "Content-Type": "application/json" } },
          );
        } catch (err) {
          return new Response(
            JSON.stringify({
              success: false,
              message: err instanceof Error ? err.message : "Failed to update section",
            }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});
