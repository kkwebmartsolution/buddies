import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/admin/upload")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const fs = await import("node:fs");
          const path = await import("node:path");
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
          const { filename, base64 } = body;

          if (!filename || !base64) {
            return new Response(
              JSON.stringify({ success: false, message: "Missing image file or data" }),
              { status: 400, headers: { "Content-Type": "application/json" } },
            );
          }

          const matches = base64.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
          if (!matches) {
            return new Response(
              JSON.stringify({ success: false, message: "Invalid image format" }),
              { status: 400, headers: { "Content-Type": "application/json" } },
            );
          }

          const ext = matches[1] || "jpg";
          if (!["jpeg", "jpg", "png", "webp", "gif"].includes(ext.toLowerCase()) || base64.length > 7 * 1024 * 1024) {
            return new Response(JSON.stringify({ success: false, message: "Use a JPG, PNG, WebP or GIF image up to 5 MB." }), { status: 400, headers: { "Content-Type": "application/json" } });
          }
          const buffer = Buffer.from(matches[2], "base64");
          if (buffer.length > 5 * 1024 * 1024) {
            return new Response(JSON.stringify({ success: false, message: "Image must be under 5 MB." }), { status: 400, headers: { "Content-Type": "application/json" } });
          }
          const safeName = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, "_")}.${ext}`;

          const uploadsDir = process.env.UPLOAD_DIR || path.join(process.cwd(), "storage", "uploads");
          if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
          }

          const filePath = path.join(uploadsDir, safeName);
          fs.writeFileSync(filePath, buffer);

          const imageUrl = `/uploads/${safeName}`;

          return new Response(
            JSON.stringify({
              success: true,
              imageUrl,
              message: "Image uploaded successfully!",
            }),
            { headers: { "Content-Type": "application/json" } },
          );
        } catch (err: any) {
          return new Response(
            JSON.stringify({ success: false, message: err.message || "Upload failed" }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});
