import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Lock, User, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { site } from "@/lib/site";

export const Route = createFileRoute("/admin/login")({
  component: AdminLogin,
  head: () => ({
    meta: [{ title: `Admin Login — ${site.name}` }],
  }),
});

function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (data.success && data.token) {
        localStorage.setItem("buddies_admin_token", data.token);
        navigate({ to: "/admin" });
      } else {
        setError(data.message || "Invalid username or password");
      }
    } catch (err: any) {
      setError("Login failed. Please check server connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#070506] p-4 relative overflow-hidden text-foreground">
      <div className="film-grain" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 bg-hero-glow opacity-80" aria-hidden="true" />

      {/* Decorative ambient glowing circles */}
      <div className="pointer-events-none absolute -left-20 -top-20 size-96 rounded-full bg-red-600/10 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-20 -right-20 size-96 rounded-full bg-red-800/15 blur-[120px]" />

      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-white/15 bg-card/80 p-8 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)]">
        <div className="text-center">
          <div className="mx-auto mb-4 inline-flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500/20 to-red-950/40 border border-primary/40 text-primary shadow-glow">
            <ShieldCheck className="size-7" />
          </div>

          <a href="/" className="font-display text-3xl font-bold tracking-tight text-foreground block">
            {site.shortName}
            <span className="text-primary">.</span>
          </a>
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs font-semibold text-muted-foreground">
            <Sparkles className="size-3 text-primary" /> Studio Control Panel
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-500/40 bg-red-500/15 p-4 text-center text-sm font-medium text-red-300 backdrop-blur-md">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="mt-6 flex flex-col gap-4">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Admin Username
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full rounded-2xl border border-white/10 bg-background/90 py-3.5 pl-11 pr-4 text-sm text-foreground transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Security Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-2xl border border-white/10 bg-background/90 py-3.5 pl-11 pr-4 text-sm text-foreground transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-red-600 via-primary to-red-700 py-4 text-sm font-semibold text-primary-foreground shadow-glow transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? "Verifying Credentials..." : "Access Admin Panel"}
            <ArrowRight className="size-4" />
          </button>
        </form>

        <div className="mt-8 border-t border-white/10 pt-4 text-center text-xs text-muted-foreground">
          Default User: <code className="text-foreground font-semibold">admin</code> | Password: <code className="text-foreground font-semibold">admin123</code>
        </div>
      </div>
    </div>
  );
}
