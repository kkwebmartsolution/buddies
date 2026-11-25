import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/uploads/$filename")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { filename } = params;
        if (!/^[a-zA-Z0-9_.-]+$/.test(filename) || filename.includes(".."))
          return new Response(null, { status: 404 });
        const fs = await import("node:fs/promises");
        const path = await import("node:path");
        const types: Record<string, string> = {
          jpg: "image/jpeg",
          jpeg: "image/jpeg",
          png: "image/png",
          webp: "image/webp",
          gif: "image/gif",
        };
        const mime = types[filename.split(".").pop()?.toLowerCase() || ""];
        if (!mime) return new Response(null, { status: 404 });
        const dirs = [
          process.env.UPLOAD_DIR || path.join(process.cwd(), "storage", "uploads"),
          path.join(process.cwd(), "public", "uploads"),
        ];
        for (const dir of dirs) {
          try {
            const data = await fs.readFile(path.join(dir, filename));
            return new Response(new Uint8Array(data), {
              headers: {
                "Content-Type": mime,
                "X-Content-Type-Options": "nosniff",
                "Cache-Control": "public, max-age=31536000, immutable",
              },
            });
          } catch (error) {
            if ((error as NodeJS.ErrnoException).code !== "ENOENT")
              return new Response(null, { status: 500 });
          }
        }
        return new Response(null, { status: 404 });
      },
    },
  },
});
