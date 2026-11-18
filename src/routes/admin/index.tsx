import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  LogOut,
  Save,
  Upload,
  Plus,
  Trash2,
  Globe,
  Film,
  Camera,
  Briefcase,
  Video,
  Info,
  AlertCircle,
  ExternalLink,
  Sparkles,
  Layers,
  Sliders,
  CheckCircle2,
  LayoutDashboard,
  TrendingUp,
  Users,
  Eye,
  Activity,
  ArrowUpRight,
  Clock,
  Database,
  Menu,
  X,
  Settings,
  ShieldCheck,
  Mic,
  Shirt,
  Crown,
  Sun,
  Moon,
} from "lucide-react";
import { defaultCmsData, type CmsData } from "@/lib/cms-defaults";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
  head: () => ({
    meta: [{ title: `Admin Dashboard — Buddies Production` }],
  }),
});

type TabType =
  | "dashboard"
  | "site"
  | "hero"
  | "partners"
  | "about"
  | "services"
  | "works"
  | "videos"
  | "rentals"
  | "dubbing"
  | "costumes";

interface ActivityLog {
  id: string;
  action: string;
  details: string;
  time: string;
  type: "update" | "login" | "upload";
}

function AdminDashboard() {
  const [data, setData] = useState<CmsData>(defaultCmsData);
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("admin_theme") as "dark" | "light") || "dark";
    }
    return "dark";
  });

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("admin_theme", nextTheme);
  };
  const [logs, setLogs] = useState<ActivityLog[]>([
    {
      id: "1",
      action: "Admin Session Started",
      details: "Logged into Studio Control Panel",
      time: "Just now",
      type: "login",
    },
    {
      id: "2",
      action: "Hero Switcher Updated",
      details: "Configured Netflix optical beam words",
      time: "10 mins ago",
      type: "update",
    },
    {
      id: "3",
      action: "Image Media Uploaded",
      details: "Added cinema camera asset rental-camera.jpg",
      time: "45 mins ago",
      type: "upload",
    },
    {
      id: "4",
      action: "Portfolio Work Saved",
      details: "Added 'Velocity' commercial showcase",
      time: "2 hours ago",
      type: "update",
    },
    {
      id: "5",
      action: "Database Synced",
      details: "MySQL tables & local JSON store updated",
      time: "Yesterday",
      type: "update",
    },
  ]);

  const [analytics, setAnalytics] = useState({
    dbConnected: true,
    todayVisitors: 0,
    weeklyVisitors: 0,
    monthlyVisitors: 0,
    dailyBreakdown: [
      { day: "Mon", count: 0, pct: 10 },
      { day: "Tue", count: 0, pct: 10 },
      { day: "Wed", count: 0, pct: 10 },
      { day: "Thu", count: 0, pct: 10 },
      { day: "Fri", count: 0, pct: 10 },
      { day: "Sat", count: 0, pct: 10 },
      { day: "Sun", count: 0, pct: 10 },
    ],
  });

  const navigate = useNavigate();

  const getToken = () => localStorage.getItem("buddies_admin_token") || "";

  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate({ to: "/admin/login" });
      return;
    }

    fetch("/api/content")
      .then((res) => res.json())
      .then((resData) => {
        if (resData) {
          setData((prev) => ({ ...prev, ...resData }));
        }
      })
      .catch((err) => {
        console.warn("Using local defaults:", err);
      })
      .finally(() => setLoading(false));

    fetch("/api/admin/analytics")
      .then((res) => res.json())
      .then((resAnalytics) => {
        if (resAnalytics.success) {
          setAnalytics({
            dbConnected: resAnalytics.dbConnected,
            todayVisitors: resAnalytics.todayVisitors,
            weeklyVisitors: resAnalytics.weeklyVisitors,
            monthlyVisitors: resAnalytics.monthlyVisitors,
            dailyBreakdown: resAnalytics.dailyBreakdown || [],
          });
        }
      })
      .catch(() => {});
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("buddies_admin_token");
    document.cookie = "buddies_admin_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    navigate({ to: "/admin/login" });
  };

  const addActivityLog = (action: string, details: string, type: "update" | "login" | "upload" = "update") => {
    const newLog: ActivityLog = {
      id: String(Date.now()),
      action,
      details,
      time: "Just now",
      type,
    };
    setLogs((prev) => [newLog, ...prev.slice(0, 7)]);
  };

  const saveSection = async (sectionKey: keyof CmsData, sectionData: any) => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          section: sectionKey,
          data: sectionData,
        }),
      });

      const result = await res.json();
      if (result.success) {
        setMessage({ text: `Section '${String(sectionKey)}' saved successfully!`, type: "success" });
        setData((prev) => ({ ...prev, [sectionKey]: sectionData }));
        addActivityLog(`Saved ${String(sectionKey).toUpperCase()} section`, "Changes saved to database & JSON store", "update");
      } else {
        setMessage({ text: result.message || "Failed to save section", type: "error" });
      }
    } catch (err: any) {
      setMessage({ text: "Error saving data to server", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    onUploaded: (url: string) => void,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      try {
        const res = await fetch("/api/admin/upload", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({ filename: file.name, base64 }),
        });
        const uploadResult = await res.json();
        if (uploadResult.success && uploadResult.imageUrl) {
          onUploaded(uploadResult.imageUrl);
          setMessage({ text: "Image uploaded successfully!", type: "success" });
          addActivityLog("Uploaded Media Image", `File: ${file.name}`, "upload");
        } else {
          setMessage({ text: uploadResult.message || "Upload failed", type: "error" });
        }
      } catch (err) {
        setMessage({ text: "Upload failed", type: "error" });
      }
    };
    reader.readAsDataURL(file);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070506] text-foreground">
        <div className="text-center">
          <div className="size-14 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto shadow-glow" />
          <p className="mt-4 font-display text-lg font-bold tracking-tight">Loading Studio Control Portal...</p>
        </div>
      </div>
    );
  }

  // Sidebar Menu Items Definition
  const menuGroups = [
    {
      title: "OVERVIEW",
      items: [{ id: "dashboard", label: "Dashboard Analytics", icon: LayoutDashboard, count: null }],
    },
    {
      title: "CONTENT MANAGEMENT",
      items: [
        { id: "hero", label: "Hero Banner", icon: Film, count: null },
        { id: "partners", label: "Partners & Marquee", icon: Globe, count: data.partners?.length },
        { id: "about", label: "About Studio", icon: Sparkles, count: null },
        { id: "services", label: "Services Offered", icon: Layers, count: data.services?.length },
        { id: "works", label: "Portfolio Works", icon: Briefcase, count: data.works?.length },
        { id: "videos", label: "Video Showcase", icon: Video, count: data.videos?.length },
        { id: "rentals", label: "Equipment Kits", icon: Camera, count: data.rentals?.length },
        { id: "dubbing", label: "Dubbing & Recording", icon: Mic, count: data.dubbing?.features?.length },
        { id: "costumes", label: "Costume Rentals", icon: Shirt, count: data.costumes?.categories?.length },
      ],
    },
    {
      title: "SYSTEM & CONFIG",
      items: [{ id: "site", label: "Site Settings", icon: Settings, count: null }],
    },
  ];

  const isLight = theme === "light";

  return (
    <div
      className={`min-h-screen flex relative overflow-x-hidden transition-colors duration-300 ${
        isLight ? "admin-light-mode bg-slate-100 text-slate-900" : "bg-[#070506] text-foreground"
      }`}
    >
      <div className="film-grain" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 bg-hero-glow opacity-50" aria-hidden="true" />

      {/* Mobile Drawer Overlay */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Left Vertical Sidebar Menu */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 flex flex-col transition-transform duration-300 backdrop-blur-2xl lg:translate-x-0 ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } ${
          isLight
            ? "bg-white/95 border-r border-slate-200 text-slate-900 shadow-lg"
            : "bg-[#0d090b]/95 border-r border-white/10 text-foreground"
        }`}
      >
        {/* Sidebar Header */}
        <div className={`flex items-center justify-between p-6 border-b ${isLight ? "border-slate-200" : "border-white/10"}`}>
          <div>
            <a href="/" target="_blank" className="font-display text-2xl font-bold tracking-tight flex items-center gap-1.5">
              Buddies<span className="text-primary">.</span>
            </a>
            <div className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/30 px-2.5 py-0.5 text-[0.68rem] font-bold text-primary">
              <ShieldCheck className="size-3" /> Control Panel v2.4
            </div>
          </div>
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className={`lg:hidden ${isLight ? "text-slate-500 hover:text-slate-900" : "text-muted-foreground hover:text-foreground"}`}
          >
            <X className="size-6" />
          </button>
        </div>

        {/* Sidebar Navigation Items */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 custom-scrollbar">
          {menuGroups.map((group, idx) => (
            <div key={idx} className="space-y-2">
              <h4 className={`px-3 text-[0.65rem] font-bold uppercase tracking-widest ${isLight ? "text-slate-400" : "text-muted-foreground/70"}`}>
                {group.title}
              </h4>
              <div className="space-y-1">
                {group.items.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id as TabType);
                        setMobileSidebarOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-2xl px-3.5 py-3 text-sm font-semibold transition-all ${
                        isActive
                          ? "bg-gradient-to-r from-red-600 via-primary to-red-800 text-white shadow-glow border border-primary/50"
                          : isLight
                          ? "text-slate-600 hover:bg-slate-200/80 hover:text-slate-900 border border-transparent"
                          : "text-muted-foreground hover:bg-white/5 hover:text-foreground border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`size-4 ${isActive ? "text-white" : "text-primary"}`} />
                        <span>{tab.label}</span>
                      </div>
                      {tab.count !== null && tab.count !== undefined && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[0.65rem] font-bold ${
                            isActive
                              ? "bg-white/20 text-white"
                              : isLight
                              ? "bg-slate-200 text-slate-700"
                              : "bg-white/10 text-muted-foreground"
                          }`}
                        >
                          {tab.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar User Footer */}
        <div className={`p-4 border-t ${isLight ? "border-slate-200 bg-slate-100/80" : "border-white/10 bg-black/40"}`}>
          <div className={`flex items-center justify-between rounded-2xl p-3 border ${isLight ? "bg-white border-slate-200" : "bg-card/60 border-white/10"}`}>
            <div className="flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-xl bg-primary/20 text-primary font-bold text-sm">
                A
              </div>
              <div className="truncate">
                <p className="text-xs font-bold truncate">Admin Studio</p>
                <p className="text-[0.68rem] text-emerald-500 font-semibold">● System Active</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className={`p-2 transition-colors ${isLight ? "text-slate-400 hover:text-red-600" : "text-muted-foreground hover:text-red-400"}`}
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container Area */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
        {/* Top Header Navbar */}
        <header
          className={`sticky top-0 z-30 border-b backdrop-blur-xl px-4 sm:px-8 py-4 flex items-center justify-between transition-colors ${
            isLight
              ? "bg-white/90 border-slate-200 text-slate-900 shadow-sm"
              : "bg-[#070506]/90 border-white/10 text-foreground"
          }`}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className={`lg:hidden p-2 ${isLight ? "text-slate-600 hover:text-slate-900" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Menu className="size-6" />
            </button>
            <div>
              <h1 className="font-display text-xl font-bold tracking-tight capitalize">
                {activeTab === "dashboard" ? "Studio Analytics & Overview" : `${activeTab} Management`}
              </h1>
              <p className={`text-xs hidden sm:block ${isLight ? "text-slate-500" : "text-muted-foreground"}`}>
                Manage website content, assets, and live performance metrics
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              title={`Switch to ${isLight ? "Dark" : "Light"} Mode`}
              className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold border transition-all ${
                isLight
                  ? "bg-amber-100/90 border-amber-300 text-amber-900 hover:bg-amber-200 shadow-xs"
                  : "bg-white/10 border-white/15 text-foreground hover:bg-white/20"
              }`}
            >
              {isLight ? (
                <>
                  <Sun className="size-3.5 text-amber-600 fill-amber-500" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="size-3.5 text-indigo-400 fill-indigo-400" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>

            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-semibold text-emerald-500">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" /> Live DB Online
            </span>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground glow-red hover:scale-105 transition-transform"
            >
              <ExternalLink className="size-3.5" /> View Live Site
            </a>
          </div>
        </header>

        {/* Main Workspace Body */}
        <main className="flex-1 p-4 sm:p-8 space-y-8 relative z-10">
          {/* Notification Toast */}
          {message && (
            <div
              className={`flex items-center justify-between rounded-2xl border p-4 text-sm font-medium backdrop-blur-xl shadow-xl transition-all ${
                message.type === "success"
                  ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                  : "border-red-500/40 bg-red-500/15 text-red-300"
              }`}
            >
              <div className="flex items-center gap-3">
                {message.type === "success" ? (
                  <CheckCircle2 className="size-5 shrink-0 text-emerald-400" />
                ) : (
                  <AlertCircle className="size-5 shrink-0 text-red-400" />
                )}
                {message.text}
              </div>
              <button onClick={() => setMessage(null)} className="text-xs opacity-70 hover:opacity-100 font-bold">
                Dismiss
              </button>
            </div>
          )}

          {/* DASHBOARD ANALYTICS OVERVIEW TAB */}
          {activeTab === "dashboard" && (
            <div className="space-y-8">
              {/* Analytics Metric Cards */}
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {/* Today Visitors */}
                <div className="rounded-3xl border border-white/10 bg-card/60 p-6 backdrop-blur-xl relative overflow-hidden space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Today Visitors
                    </span>
                    <div className="grid size-10 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      <Users className="size-5" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-display text-3xl font-bold">{analytics.todayVisitors.toLocaleString()}</h3>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                      <TrendingUp className="size-3.5" /> Real-time active tracking
                    </div>
                  </div>
                  {/* Mini Sparkline Bars */}
                  <div className="flex items-end gap-1.5 h-8 pt-2">
                    {[40, 65, 45, 80, 55, 90, 100].map((h, i) => (
                      <div
                        key={i}
                        style={{ height: `${h}%` }}
                        className="flex-1 rounded-sm bg-gradient-to-t from-primary/30 to-primary"
                      />
                    ))}
                  </div>
                </div>

                {/* Weekly Visitors */}
                <div className="rounded-3xl border border-white/10 bg-card/60 p-6 backdrop-blur-xl relative overflow-hidden space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Weekly Visitors
                    </span>
                    <div className="grid size-10 place-items-center rounded-2xl bg-primary/15 text-primary border border-primary/30">
                      <Eye className="size-5" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-display text-3xl font-bold">{analytics.weeklyVisitors.toLocaleString()}</h3>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                      <TrendingUp className="size-3.5" /> Real-time 7-day count
                    </div>
                  </div>
                  {/* Mini Sparkline Bars */}
                  <div className="flex items-end gap-1.5 h-8 pt-2">
                    {[50, 70, 60, 85, 95, 75, 100].map((h, i) => (
                      <div
                        key={i}
                        style={{ height: `${h}%` }}
                        className="flex-1 rounded-sm bg-gradient-to-t from-red-600/30 to-primary"
                      />
                    ))}
                  </div>
                </div>

                {/* Monthly Visitors */}
                <div className="rounded-3xl border border-white/10 bg-card/60 p-6 backdrop-blur-xl relative overflow-hidden space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Monthly Visitors
                    </span>
                    <div className="grid size-10 place-items-center rounded-2xl bg-blue-500/15 text-blue-400 border border-blue-500/30">
                      <Activity className="size-5" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-display text-3xl font-bold">{analytics.monthlyVisitors.toLocaleString()}</h3>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                      <TrendingUp className="size-3.5" /> Real-time 30-day count
                    </div>
                  </div>
                  {/* Mini Sparkline Bars */}
                  <div className="flex items-end gap-1.5 h-8 pt-2">
                    {[30, 50, 70, 65, 80, 85, 95].map((h, i) => (
                      <div
                        key={i}
                        style={{ height: `${h}%` }}
                        className="flex-1 rounded-sm bg-gradient-to-t from-blue-600/30 to-blue-400"
                      />
                    ))}
                  </div>
                </div>

                {/* Storage & Database Engine */}
                <div className="rounded-3xl border border-white/10 bg-card/60 p-6 backdrop-blur-xl relative overflow-hidden space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Database Sync
                    </span>
                    <div className="grid size-10 place-items-center rounded-2xl bg-purple-500/15 text-purple-400 border border-purple-500/30">
                      <Database className="size-5" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-display text-2xl font-bold">
                      {analytics.dbConnected ? "MySQL Connected" : "Local File Store"}
                    </h3>
                    <p className="mt-1 text-xs text-emerald-400 font-semibold">
                      {analytics.dbConnected ? "buddies_db @ localhost:3306" : "public/cms-store.json"}
                    </p>
                  </div>
                  <div className="pt-2 text-[0.68rem] text-muted-foreground font-mono">
                    Status: {analytics.dbConnected ? "Live Connection Operational" : "File Storage Synchronized"}
                  </div>
                </div>
              </div>

              {/* Traffic Visualizer & Recent Activity Section */}
              <div className="grid gap-8 lg:grid-cols-3">
                {/* Traffic Bar Visualizer Chart */}
                <div className="lg:col-span-2 rounded-3xl border border-white/15 bg-card/70 p-6 sm:p-8 backdrop-blur-2xl space-y-6">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div>
                      <h2 className="font-display text-xl font-bold">Weekly Traffic Analytics</h2>
                      <p className="text-xs text-muted-foreground">Daily unique site visitor counts</p>
                    </div>
                    <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs font-semibold text-muted-foreground">
                      Last 7 Days
                    </span>
                  </div>

                  {/* Visual Bar Chart */}
                  <div className="space-y-4 pt-2">
                    <div className="flex items-end justify-between gap-3 h-52 pt-4 pb-2 px-2 border-b border-white/10">
                      {analytics.dailyBreakdown.map((item, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                          <span className="text-[0.68rem] font-bold text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                            {item.count}
                          </span>
                          <div
                            style={{ height: `${item.pct}%` }}
                            className="w-full max-w-[38px] rounded-t-xl bg-gradient-to-t from-red-800 via-primary to-red-500 shadow-glow transition-transform group-hover:scale-105"
                          />
                          <span className="text-xs font-semibold text-muted-foreground mt-1">
                            {item.day}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground font-medium pt-2">
                      <span>Total Visitors This Week: <strong className="text-foreground">{analytics.weeklyVisitors.toLocaleString()}</strong></span>
                      <span>Avg Daily: <strong className="text-foreground">{Math.round(analytics.weeklyVisitors / 7).toLocaleString()}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Recent Activity Log Stream */}
                <div className="rounded-3xl border border-white/15 bg-card/70 p-6 sm:p-8 backdrop-blur-2xl space-y-6">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div className="flex items-center gap-2">
                      <Clock className="size-4 text-primary" />
                      <h2 className="font-display text-xl font-bold">Recent Activity</h2>
                    </div>
                    <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>

                  <div className="space-y-4">
                    {logs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-start gap-3 rounded-2xl border border-white/5 bg-background/50 p-3.5 hover:border-white/15 transition-colors"
                      >
                        <div className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                          <Activity className="size-3.5" />
                        </div>
                        <div className="flex-1 truncate">
                          <p className="text-xs font-bold text-foreground truncate">{log.action}</p>
                          <p className="text-[0.7rem] text-muted-foreground truncate">{log.details}</p>
                          <span className="text-[0.65rem] text-primary/80 font-mono">{log.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quick Management Shortcuts Grid */}
              <div className="space-y-4">
                <h3 className="font-display text-lg font-bold">Quick Management Shortcuts</h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <button
                    onClick={() => setActiveTab("hero")}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-card/50 p-5 hover:border-primary/50 hover:bg-card transition-all text-left group"
                  >
                    <div>
                      <h4 className="font-bold text-sm">Edit Hero Section</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">Headline & Netflix words</p>
                    </div>
                    <ArrowUpRight className="size-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </button>

                  <button
                    onClick={() => setActiveTab("works")}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-card/50 p-5 hover:border-primary/50 hover:bg-card transition-all text-left group"
                  >
                    <div>
                      <h4 className="font-bold text-sm">Add Portfolio Work</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">Upload film project</p>
                    </div>
                    <ArrowUpRight className="size-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </button>

                  <button
                    onClick={() => setActiveTab("rentals")}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-card/50 p-5 hover:border-primary/50 hover:bg-card transition-all text-left group"
                  >
                    <div>
                      <h4 className="font-bold text-sm">Manage Rentals</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">Camera & lens gear</p>
                    </div>
                    <ArrowUpRight className="size-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </button>

                  <button
                    onClick={() => setActiveTab("site")}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-card/50 p-5 hover:border-primary/50 hover:bg-card transition-all text-left group"
                  >
                    <div>
                      <h4 className="font-bold text-sm">Site Settings</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">WhatsApp & address</p>
                    </div>
                    <ArrowUpRight className="size-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SITE INFO TAB */}
          {activeTab === "site" && (
            <div className="rounded-3xl border border-white/15 bg-card/70 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl relative space-y-6">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent rounded-t-3xl" />
              <div className="flex items-center justify-between border-b border-white/10 pb-5">
                <div>
                  <h2 className="font-display text-2xl font-bold tracking-tight">General Site Settings</h2>
                  <p className="text-xs text-muted-foreground mt-1">Configure global branding, address, and social links</p>
                </div>
                <button
                  onClick={() => saveSection("site", data.site)}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-xs font-semibold text-primary-foreground glow-red hover:scale-105 transition-transform"
                >
                  <Save className="size-4" /> Save Site Settings
                </button>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Full Brand Name
                  </label>
                  <input
                    type="text"
                    value={data.site.name}
                    onChange={(e) =>
                      setData({ ...data, site: { ...data.site, name: e.target.value } })
                    }
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-background/90 p-3.5 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Short Name (Navbar Logo)
                  </label>
                  <input
                    type="text"
                    value={data.site.shortName}
                    onChange={(e) =>
                      setData({ ...data, site: { ...data.site, shortName: e.target.value } })
                    }
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-background/90 p-3.5 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Site Tagline
                </label>
                <input
                  type="text"
                  value={data.site.tagline}
                  onChange={(e) =>
                    setData({ ...data, site: { ...data.site, tagline: e.target.value } })
                  }
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-background/90 p-3.5 text-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  SEO Meta Description
                </label>
                <textarea
                  rows={3}
                  value={data.site.description}
                  onChange={(e) =>
                    setData({ ...data, site: { ...data.site, description: e.target.value } })
                  }
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-background/90 p-3.5 text-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    WhatsApp Phone Number
                  </label>
                  <input
                    type="text"
                    value={data.site.social.whatsapp}
                    onChange={(e) =>
                      setData({
                        ...data,
                        site: {
                          ...data.site,
                          social: { ...data.site.social, whatsapp: e.target.value },
                        },
                      })
                    }
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-background/90 p-3.5 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Contact Email Address
                  </label>
                  <input
                    type="email"
                    value={data.site.social.email}
                    onChange={(e) =>
                      setData({
                        ...data,
                        site: {
                          ...data.site,
                          social: { ...data.site.social, email: e.target.value },
                        },
                      })
                    }
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-background/90 p-3.5 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Physical Address
                </label>
                <input
                  type="text"
                  value={data.site.location.address}
                  onChange={(e) =>
                    setData({
                      ...data,
                      site: {
                        ...data.site,
                        location: { ...data.site.location, address: e.target.value },
                      },
                    })
                  }
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-background/90 p-3.5 text-sm focus:border-primary focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* HERO TAB */}
          {activeTab === "hero" && (
            <div className="rounded-3xl border border-white/15 bg-card/70 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl relative space-y-6">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent rounded-t-3xl" />
              <div className="flex items-center justify-between border-b border-white/10 pb-5">
                <div>
                  <h2 className="font-display text-2xl font-bold tracking-tight">Hero Section Settings</h2>
                  <p className="text-xs text-muted-foreground mt-1">Manage main headline, subtext, and Netflix switcher words</p>
                </div>
                <button
                  onClick={() => saveSection("hero", data.hero)}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-xs font-semibold text-primary-foreground glow-red hover:scale-105 transition-transform"
                >
                  <Save className="size-4" /> Save Hero Section
                </button>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Subtitle Badge Tag
                </label>
                <input
                  type="text"
                  value={data.hero.subtitle}
                  onChange={(e) =>
                    setData({ ...data, hero: { ...data.hero, subtitle: e.target.value } })
                  }
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-background/90 p-3.5 text-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Headline Line 1
                </label>
                <input
                  type="text"
                  value={data.hero.line1}
                  onChange={(e) =>
                    setData({ ...data, hero: { ...data.hero, line1: e.target.value } })
                  }
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-background/90 p-3.5 text-sm focus:border-primary focus:outline-none font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Netflix Animated Switcher Words (Comma Separated)
                </label>
                <input
                  type="text"
                  value={data.hero.line2Words.join(", ")}
                  onChange={(e) =>
                    setData({
                      ...data,
                      hero: {
                        ...data.hero,
                        line2Words: e.target.value
                          .split(",")
                          .map((w) => w.trim())
                          .filter(Boolean),
                      },
                    })
                  }
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-background/90 p-3.5 text-sm font-mono text-primary focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Hero Paragraph Description
                </label>
                <textarea
                  rows={4}
                  value={data.hero.paragraph}
                  onChange={(e) =>
                    setData({ ...data, hero: { ...data.hero, paragraph: e.target.value } })
                  }
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-background/90 p-3.5 text-sm focus:border-primary focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* PARTNERS / MARQUEE TAB */}
          {activeTab === "partners" && (
            <div className="rounded-3xl border border-white/15 bg-card/70 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl relative space-y-6">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent rounded-t-3xl" />
              <div className="flex items-center justify-between border-b border-white/10 pb-5">
                <div>
                  <h2 className="font-display text-2xl font-bold tracking-tight">Partners & Brand Marquee</h2>
                  <p className="text-xs text-muted-foreground mt-1">Manage scrolling ticker brands showing right after Hero</p>
                </div>
                <button
                  onClick={() => saveSection("partners", data.partners)}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-xs font-semibold text-primary-foreground glow-red hover:scale-105 transition-transform"
                >
                  <Save className="size-4" /> Save Marquee Items
                </button>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Partner Brands & Categories (Comma Separated)
                </label>
                <textarea
                  rows={4}
                  value={data.partners.join(", ")}
                  onChange={(e) =>
                    setData({
                      ...data,
                      partners: e.target.value
                        .split(",")
                        .map((p) => p.trim())
                        .filter(Boolean),
                    })
                  }
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-background/90 p-3.5 text-sm font-medium focus:border-primary focus:outline-none"
                />
              </div>

              <div className="space-y-4 pt-4 border-t border-white/10">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Individual Item Cards ({data.partners.length} Items)
                </span>
                <div className="grid gap-3 sm:grid-cols-2">
                  {data.partners.map((partner, pIdx) => (
                    <div
                      key={pIdx}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-background/60 p-3.5 hover:border-primary/40 transition-colors"
                    >
                      <input
                        type="text"
                        value={partner}
                        onChange={(e) => {
                          const updated = [...data.partners];
                          updated[pIdx] = e.target.value;
                          setData({ ...data, partners: updated });
                        }}
                        className="w-full bg-transparent text-sm font-bold text-foreground focus:outline-none"
                      />
                      <button
                        onClick={() => {
                          const updated = data.partners.filter((_, i) => i !== pIdx);
                          setData({ ...data, partners: updated });
                        }}
                        className="ml-2 text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => {
                    setData({
                      ...data,
                      partners: [...data.partners, "New Brand Item"],
                    });
                  }}
                  className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-dashed border-white/20 p-4 w-full justify-center text-sm font-semibold text-muted-foreground hover:border-primary hover:text-foreground hover:bg-white/5 transition-all"
                >
                  <Plus className="size-4" /> Add Partner Brand Item
                </button>
              </div>
            </div>
          )}

          {/* SERVICES TAB */}
          {activeTab === "services" && (
            <div className="rounded-3xl border border-white/15 bg-card/70 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl relative space-y-6">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent rounded-t-3xl" />
              <div className="flex items-center justify-between border-b border-white/10 pb-5">
                <div>
                  <h2 className="font-display text-2xl font-bold tracking-tight">Services Settings</h2>
                  <p className="text-xs text-muted-foreground mt-1">Manage studio offerings and service cards</p>
                </div>
                <button
                  onClick={() => saveSection("services", data.services)}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-xs font-semibold text-primary-foreground glow-red hover:scale-105 transition-transform"
                >
                  <Save className="size-4" /> Save Services
                </button>
              </div>

              <div className="space-y-4">
                {data.services.map((srv, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-white/10 bg-background/60 p-5 space-y-3 hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-primary">Service #{srv.no}</span>
                      <button
                        onClick={() => {
                          const newServices = data.services.filter((_, i) => i !== idx);
                          setData({ ...data, services: newServices });
                        }}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-4">
                      <div>
                        <input
                          type="text"
                          placeholder="01"
                          value={srv.no}
                          onChange={(e) => {
                            const updated = [...data.services];
                            updated[idx].no = e.target.value;
                            setData({ ...data, services: updated });
                          }}
                          className="w-full rounded-xl border border-white/10 bg-background p-3 text-sm font-mono text-center"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <input
                          type="text"
                          placeholder="Service Title"
                          value={srv.title}
                          onChange={(e) => {
                            const updated = [...data.services];
                            updated[idx].title = e.target.value;
                            setData({ ...data, services: updated });
                          }}
                          className="w-full rounded-xl border border-white/10 bg-background p-3 text-sm font-bold"
                        />
                      </div>
                    </div>

                    <textarea
                      rows={2}
                      placeholder="Service Description Body"
                      value={srv.body}
                      onChange={(e) => {
                        const updated = [...data.services];
                        updated[idx].body = e.target.value;
                        setData({ ...data, services: updated });
                      }}
                      className="w-full rounded-xl border border-white/10 bg-background p-3 text-sm"
                    />
                  </div>
                ))}

                <button
                  onClick={() => {
                    const nextNo = String(data.services.length + 1).padStart(2, "0");
                    setData({
                      ...data,
                      services: [
                        ...data.services,
                        { no: nextNo, title: "New Studio Service", body: "Service details description..." },
                      ],
                    });
                  }}
                  className="inline-flex items-center gap-2 rounded-2xl border border-dashed border-white/20 p-4 w-full justify-center text-sm font-semibold text-muted-foreground hover:border-primary hover:text-foreground hover:bg-white/5 transition-all"
                >
                  <Plus className="size-4" /> Add New Service
                </button>
              </div>
            </div>
          )}

          {/* WORKS TAB */}
          {activeTab === "works" && (
            <div className="rounded-3xl border border-white/15 bg-card/70 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl relative space-y-6">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent rounded-t-3xl" />
              <div className="flex items-center justify-between border-b border-white/10 pb-5">
                <div>
                  <h2 className="font-display text-2xl font-bold tracking-tight">Portfolio Works</h2>
                  <p className="text-xs text-muted-foreground mt-1">Manage showcase film projects and imagery</p>
                </div>
                <button
                  onClick={() => saveSection("works", data.works)}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-xs font-semibold text-primary-foreground glow-red hover:scale-105 transition-transform"
                >
                  <Save className="size-4" /> Save Portfolio Works
                </button>
              </div>

              <div className="space-y-4">
                {data.works.map((work, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-white/10 bg-background/60 p-5 space-y-4 hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-primary">Portfolio Item #{idx + 1}</span>
                      <button
                        onClick={() => {
                          const updated = data.works.filter((_, i) => i !== idx);
                          setData({ ...data, works: updated });
                        }}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <input
                        type="text"
                        placeholder="Project Title"
                        value={work.title}
                        onChange={(e) => {
                          const updated = [...data.works];
                          updated[idx].title = e.target.value;
                          setData({ ...data, works: updated });
                        }}
                        className="w-full rounded-xl border border-white/10 bg-background p-3 text-sm font-bold"
                      />
                      <input
                        type="text"
                        placeholder="Category"
                        value={work.category}
                        onChange={(e) => {
                          const updated = [...data.works];
                          updated[idx].category = e.target.value;
                          setData({ ...data, works: updated });
                        }}
                        className="w-full rounded-xl border border-white/10 bg-background p-3 text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Year"
                        value={work.year}
                        onChange={(e) => {
                          const updated = [...data.works];
                          updated[idx].year = e.target.value;
                          setData({ ...data, works: updated });
                        }}
                        className="w-full rounded-xl border border-white/10 bg-background p-3 text-sm font-mono"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 items-center">
                      {work.image && (
                        <img
                          src={work.image}
                          alt={work.title}
                          className="size-16 rounded-xl object-cover border border-white/10 shadow-md"
                        />
                      )}
                      <input
                        type="text"
                        placeholder="Image URL or uploaded path"
                        value={work.image}
                        onChange={(e) => {
                          const updated = [...data.works];
                          updated[idx].image = e.target.value;
                          setData({ ...data, works: updated });
                        }}
                        className="w-full flex-1 rounded-xl border border-white/10 bg-background p-3 text-sm"
                      />
                      <label className="inline-flex items-center gap-2 rounded-xl bg-card border border-white/15 px-4 py-3 text-xs font-semibold cursor-pointer hover:bg-white/10 transition-colors whitespace-nowrap">
                        <Upload className="size-4" /> Upload Image
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) =>
                            handleFileUpload(e, (url) => {
                              const updated = [...data.works];
                              updated[idx].image = url;
                              setData({ ...data, works: updated });
                            })
                          }
                        />
                      </label>
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => {
                    setData({
                      ...data,
                      works: [
                        ...data.works,
                        {
                          title: "New Film Project",
                          category: "Commercial",
                          year: "2026",
                          image: "/uploads/sample.jpg",
                        },
                      ],
                    });
                  }}
                  className="inline-flex items-center gap-2 rounded-2xl border border-dashed border-white/20 p-4 w-full justify-center text-sm font-semibold text-muted-foreground hover:border-primary hover:text-foreground hover:bg-white/5 transition-all"
                >
                  <Plus className="size-4" /> Add Portfolio Work
                </button>
              </div>
            </div>
          )}

          {/* VIDEOS TAB */}
          {activeTab === "videos" && (
            <div className="rounded-3xl border border-white/15 bg-card/70 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl relative space-y-6">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent rounded-t-3xl" />
              <div className="flex items-center justify-between border-b border-white/10 pb-5">
                <div>
                  <h2 className="font-display text-2xl font-bold tracking-tight">Video Showcase</h2>
                  <p className="text-xs text-muted-foreground mt-1">Manage YouTube video links and descriptions</p>
                </div>
                <button
                  onClick={() => saveSection("videos", data.videos)}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-xs font-semibold text-primary-foreground glow-red hover:scale-105 transition-transform"
                >
                  <Save className="size-4" /> Save Videos
                </button>
              </div>

              <div className="space-y-4">
                {data.videos.map((vid, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-white/10 bg-background/60 p-5 space-y-4 hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-primary">Showcase Video #{idx + 1}</span>
                      <button
                        onClick={() => {
                          const updated = data.videos.filter((_, i) => i !== idx);
                          setData({ ...data, videos: updated });
                        }}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <input
                        type="text"
                        placeholder="YouTube Video ID (e.g. ScMzIvxBSi4)"
                        value={vid.youtubeId}
                        onChange={(e) => {
                          const updated = [...data.videos];
                          updated[idx].youtubeId = e.target.value;
                          setData({ ...data, videos: updated });
                        }}
                        className="w-full rounded-xl border border-white/10 bg-background p-3 text-sm font-mono text-primary font-bold"
                      />
                      <input
                        type="text"
                        placeholder="Video Title"
                        value={vid.title}
                        onChange={(e) => {
                          const updated = [...data.videos];
                          updated[idx].title = e.target.value;
                          setData({ ...data, videos: updated });
                        }}
                        className="w-full rounded-xl border border-white/10 bg-background p-3 text-sm font-bold"
                      />
                      <input
                        type="text"
                        placeholder="Category"
                        value={vid.category}
                        onChange={(e) => {
                          const updated = [...data.videos];
                          updated[idx].category = e.target.value;
                          setData({ ...data, videos: updated });
                        }}
                        className="w-full rounded-xl border border-white/10 bg-background p-3 text-sm"
                      />
                    </div>

                    <textarea
                      rows={2}
                      placeholder="Video Description"
                      value={vid.description}
                      onChange={(e) => {
                        const updated = [...data.videos];
                        updated[idx].description = e.target.value;
                        setData({ ...data, videos: updated });
                      }}
                      className="w-full rounded-xl border border-white/10 bg-background p-3 text-sm"
                    />
                  </div>
                ))}

                <button
                  onClick={() => {
                    setData({
                      ...data,
                      videos: [
                        ...data.videos,
                        {
                          youtubeId: "ScMzIvxBSi4",
                          title: "New Showcase Video",
                          category: "Commercial",
                          description: "Video film description...",
                        },
                      ],
                    });
                  }}
                  className="inline-flex items-center gap-2 rounded-2xl border border-dashed border-white/20 p-4 w-full justify-center text-sm font-semibold text-muted-foreground hover:border-primary hover:text-foreground hover:bg-white/5 transition-all"
                >
                  <Plus className="size-4" /> Add Video Showcase
                </button>
              </div>
            </div>
          )}

          {/* RENTALS TAB */}
          {activeTab === "rentals" && (
            <div className="rounded-3xl border border-white/15 bg-card/70 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl relative space-y-6">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent rounded-t-3xl" />
              <div className="flex items-center justify-between border-b border-white/10 pb-5">
                <div>
                  <h2 className="font-display text-2xl font-bold tracking-tight">Equipment Rental Kits</h2>
                  <p className="text-xs text-muted-foreground mt-1">Manage cinema gear for hire, tags, and pricing</p>
                </div>
                <button
                  onClick={() => saveSection("rentals", data.rentals)}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-xs font-semibold text-primary-foreground glow-red hover:scale-105 transition-transform"
                >
                  <Save className="size-4" /> Save Rental Kits
                </button>
              </div>

              <div className="space-y-4">
                {data.rentals.map((r, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-white/10 bg-background/60 p-5 space-y-4 hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-primary">Rental Kit #{idx + 1}</span>
                      <button
                        onClick={() => {
                          const updated = data.rentals.filter((_, i) => i !== idx);
                          setData({ ...data, rentals: updated });
                        }}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <input
                        type="text"
                        placeholder="Kit Title"
                        value={r.title}
                        onChange={(e) => {
                          const updated = [...data.rentals];
                          updated[idx].title = e.target.value;
                          setData({ ...data, rentals: updated });
                        }}
                        className="w-full rounded-xl border border-white/10 bg-background p-3 text-sm font-bold"
                      />
                      <input
                        type="text"
                        placeholder="Price Tag (From ₹8,000 / day)"
                        value={r.tag}
                        onChange={(e) => {
                          const updated = [...data.rentals];
                          updated[idx].tag = e.target.value;
                          setData({ ...data, rentals: updated });
                        }}
                        className="w-full rounded-xl border border-white/10 bg-background p-3 text-sm font-semibold text-emerald-400"
                      />
                      <input
                        type="text"
                        placeholder="Icon Name (Camera, Aperture, Lightbulb, Plane, Mic, Move)"
                        value={r.icon}
                        onChange={(e) => {
                          const updated = [...data.rentals];
                          updated[idx].icon = e.target.value;
                          setData({ ...data, rentals: updated });
                        }}
                        className="w-full rounded-xl border border-white/10 bg-background p-3 text-sm"
                      />
                    </div>

                    <textarea
                      rows={2}
                      placeholder="Kit Description"
                      value={r.description}
                      onChange={(e) => {
                        const updated = [...data.rentals];
                        updated[idx].description = e.target.value;
                        setData({ ...data, rentals: updated });
                      }}
                      className="w-full rounded-xl border border-white/10 bg-background p-3 text-sm"
                    />

                    <div className="flex flex-col sm:flex-row gap-3 items-center">
                      {r.image && (
                        <img
                          src={r.image}
                          alt={r.title}
                          className="size-16 rounded-xl object-cover border border-white/10 shadow-md"
                        />
                      )}
                      <input
                        type="text"
                        placeholder="Image URL or uploaded path"
                        value={r.image}
                        onChange={(e) => {
                          const updated = [...data.rentals];
                          updated[idx].image = e.target.value;
                          setData({ ...data, rentals: updated });
                        }}
                        className="w-full flex-1 rounded-xl border border-white/10 bg-background p-3 text-sm"
                      />
                      <label className="inline-flex items-center gap-2 rounded-xl bg-card border border-white/15 px-4 py-3 text-xs font-semibold cursor-pointer hover:bg-white/10 transition-colors whitespace-nowrap">
                        <Upload className="size-4" /> Upload Image
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) =>
                            handleFileUpload(e, (url) => {
                              const updated = [...data.rentals];
                              updated[idx].image = url;
                              setData({ ...data, rentals: updated });
                            })
                          }
                        />
                      </label>
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => {
                    setData({
                      ...data,
                      rentals: [
                        ...data.rentals,
                        {
                          icon: "Camera",
                          title: "New Rental Kit",
                          description: "Description of rental gear...",
                          tag: "From ₹5,000 / day",
                          image: "/uploads/rental.jpg",
                        },
                      ],
                    });
                  }}
                  className="inline-flex items-center gap-2 rounded-2xl border border-dashed border-white/20 p-4 w-full justify-center text-sm font-semibold text-muted-foreground hover:border-primary hover:text-foreground hover:bg-white/5 transition-all"
                >
                  <Plus className="size-4" /> Add Rental Kit
                </button>
              </div>
            </div>
          )}

          {/* ABOUT TAB */}
          {activeTab === "about" && (
            <div className="rounded-3xl border border-white/15 bg-card/70 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl relative space-y-6">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent rounded-t-3xl" />
              <div className="flex items-center justify-between border-b border-white/10 pb-5">
                <div>
                  <h2 className="font-display text-2xl font-bold tracking-tight">About Section Settings</h2>
                  <p className="text-xs text-muted-foreground mt-1">Manage studio bio, metrics, and about team imagery</p>
                </div>
                <button
                  onClick={() => saveSection("about", data.about)}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-xs font-semibold text-primary-foreground glow-red hover:scale-105 transition-transform"
                >
                  <Save className="size-4" /> Save About Section
                </button>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Section Tag Badge
                </label>
                <input
                  type="text"
                  value={data.about.tag}
                  onChange={(e) =>
                    setData({ ...data, about: { ...data.about, tag: e.target.value } })
                  }
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-background/90 p-3.5 text-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Headline Main Title
                  </label>
                  <input
                    type="text"
                    value={data.about.titleMain}
                    onChange={(e) =>
                      setData({ ...data, about: { ...data.about, titleMain: e.target.value } })
                    }
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-background/90 p-3.5 text-sm font-bold focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Headline Red Highlight
                  </label>
                  <input
                    type="text"
                    value={data.about.titleRed}
                    onChange={(e) =>
                      setData({ ...data, about: { ...data.about, titleRed: e.target.value } })
                    }
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-background/90 p-3.5 text-sm font-bold text-primary focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  About Description Paragraph
                </label>
                <textarea
                  rows={4}
                  value={data.about.description}
                  onChange={(e) =>
                    setData({ ...data, about: { ...data.about, description: e.target.value } })
                  }
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-background/90 p-3.5 text-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Studio Photo
                </label>
                <div className="mt-2 flex flex-col sm:flex-row gap-3 items-center">
                  {data.about.aboutImage && (
                    <img
                      src={data.about.aboutImage}
                      alt="About"
                      className="size-16 rounded-xl object-cover border border-white/10 shadow-md"
                    />
                  )}
                  <input
                    type="text"
                    value={data.about.aboutImage}
                    onChange={(e) =>
                      setData({
                        ...data,
                        about: { ...data.about, aboutImage: e.target.value },
                      })
                    }
                    className="w-full flex-1 rounded-xl border border-white/10 bg-background p-3 text-sm"
                  />
                  <label className="inline-flex items-center gap-2 rounded-xl bg-card border border-white/15 px-4 py-3 text-xs font-semibold cursor-pointer hover:bg-white/10 transition-colors whitespace-nowrap">
                    <Upload className="size-4" /> Upload Photo
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        handleFileUpload(e, (url) => {
                          setData({
                            ...data,
                            about: { ...data.about, aboutImage: url },
                          });
                        })
                      }
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* DUBBING & RECORDING STUDIO TAB */}
          {activeTab === "dubbing" && (
            <div className="rounded-3xl border border-white/15 bg-card/70 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl relative space-y-6">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent rounded-t-3xl" />
              <div className="flex items-center justify-between border-b border-white/10 pb-5">
                <div>
                  <h2 className="font-display text-2xl font-bold tracking-tight">Dubbing & Recording Studio</h2>
                  <p className="text-xs text-muted-foreground mt-1">Manage studio booking details, WhatsApp message, acoustics specs, and features</p>
                </div>
                <button
                  onClick={() => saveSection("dubbing", data.dubbing)}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-xs font-semibold text-primary-foreground glow-red hover:scale-105 transition-transform"
                >
                  <Save className="size-4" /> Save Dubbing Section
                </button>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Section Tag Badge
                </label>
                <input
                  type="text"
                  value={data.dubbing?.tag || ""}
                  onChange={(e) =>
                    setData({ ...data, dubbing: { ...data.dubbing, tag: e.target.value } })
                  }
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-background/90 p-3.5 text-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Headline Main Title
                  </label>
                  <input
                    type="text"
                    value={data.dubbing?.titleMain || ""}
                    onChange={(e) =>
                      setData({ ...data, dubbing: { ...data.dubbing, titleMain: e.target.value } })
                    }
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-background/90 p-3.5 text-sm font-bold focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Headline Red Highlight
                  </label>
                  <input
                    type="text"
                    value={data.dubbing?.titleRed || ""}
                    onChange={(e) =>
                      setData({ ...data, dubbing: { ...data.dubbing, titleRed: e.target.value } })
                    }
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-background/90 p-3.5 text-sm font-bold text-primary focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Description Paragraph
                </label>
                <textarea
                  rows={3}
                  value={data.dubbing?.description || ""}
                  onChange={(e) =>
                    setData({ ...data, dubbing: { ...data.dubbing, description: e.target.value } })
                  }
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-background/90 p-3.5 text-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Studio Booth Image
                </label>
                <div className="mt-2 flex flex-col sm:flex-row gap-3 items-center">
                  {data.dubbing?.image && (
                    <img
                      src={data.dubbing.image}
                      alt="Dubbing Studio"
                      className="size-16 rounded-xl object-cover border border-white/10 shadow-md"
                    />
                  )}
                  <input
                    type="text"
                    value={data.dubbing?.image || ""}
                    onChange={(e) =>
                      setData({
                        ...data,
                        dubbing: { ...data.dubbing, image: e.target.value },
                      })
                    }
                    className="w-full flex-1 rounded-xl border border-white/10 bg-background p-3 text-sm"
                  />
                  <label className="inline-flex items-center gap-2 rounded-xl bg-card border border-white/15 px-4 py-3 text-xs font-semibold cursor-pointer hover:bg-white/10 transition-colors whitespace-nowrap">
                    <Upload className="size-4" /> Upload Photo
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        handleFileUpload(e, (url) => {
                          setData({
                            ...data,
                            dubbing: { ...data.dubbing, image: url },
                          });
                        })
                      }
                    />
                  </label>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Left Top Badge
                  </label>
                  <input
                    type="text"
                    value={data.dubbing?.badge1 || ""}
                    onChange={(e) =>
                      setData({ ...data, dubbing: { ...data.dubbing, badge1: e.target.value } })
                    }
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-background/90 p-3.5 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Right Top Badge
                  </label>
                  <input
                    type="text"
                    value={data.dubbing?.badge2 || ""}
                    onChange={(e) =>
                      setData({ ...data, dubbing: { ...data.dubbing, badge2: e.target.value } })
                    }
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-background/90 p-3.5 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Card Overlay Title
                  </label>
                  <input
                    type="text"
                    value={data.dubbing?.cardTitle || ""}
                    onChange={(e) =>
                      setData({ ...data, dubbing: { ...data.dubbing, cardTitle: e.target.value } })
                    }
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-background/90 p-3.5 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Card Overlay Subtitle
                  </label>
                  <input
                    type="text"
                    value={data.dubbing?.cardDesc || ""}
                    onChange={(e) =>
                      setData({ ...data, dubbing: { ...data.dubbing, cardDesc: e.target.value } })
                    }
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-background/90 p-3.5 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    WhatsApp Button Text
                  </label>
                  <input
                    type="text"
                    value={data.dubbing?.buttonText || ""}
                    onChange={(e) =>
                      setData({ ...data, dubbing: { ...data.dubbing, buttonText: e.target.value } })
                    }
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-background/90 p-3.5 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    WhatsApp Pre-filled Message
                  </label>
                  <input
                    type="text"
                    value={data.dubbing?.whatsappMessage || ""}
                    onChange={(e) =>
                      setData({ ...data, dubbing: { ...data.dubbing, whatsappMessage: e.target.value } })
                    }
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-background/90 p-3.5 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Features Editor */}
              <div className="space-y-4 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg font-bold">Studio Specifications & Features</h3>
                  <span className="text-xs text-muted-foreground font-semibold">
                    {data.dubbing?.features?.length || 0} features listed
                  </span>
                </div>

                {(data.dubbing?.features || []).map((f, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-card/40 p-4 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex flex-1 items-center gap-3">
                        <select
                          value={f.icon}
                          onChange={(e) => {
                            const updated = [...(data.dubbing?.features || [])];
                            updated[idx].icon = e.target.value;
                            setData({ ...data, dubbing: { ...data.dubbing, features: updated } });
                          }}
                          className="rounded-xl border border-white/10 bg-background p-2 text-xs font-semibold"
                        >
                          <option value="Mic">Mic (Condenser)</option>
                          <option value="Headphones">Headphones</option>
                          <option value="Volume2">Volume2 (Foley/SFX)</option>
                          <option value="Radio">Radio (Sync/Broadcast)</option>
                          <option value="Music">Music</option>
                          <option value="Sliders">Sliders (Mixing)</option>
                          <option value="Sparkles">Sparkles</option>
                        </select>
                        <input
                          type="text"
                          placeholder="Feature Title"
                          value={f.title}
                          onChange={(e) => {
                            const updated = [...(data.dubbing?.features || [])];
                            updated[idx].title = e.target.value;
                            setData({ ...data, dubbing: { ...data.dubbing, features: updated } });
                          }}
                          className="flex-1 rounded-xl border border-white/10 bg-background p-2 text-sm font-semibold"
                        />
                      </div>
                      <button
                        onClick={() => {
                          const updated = (data.dubbing?.features || []).filter((_, i) => i !== idx);
                          setData({ ...data, dubbing: { ...data.dubbing, features: updated } });
                        }}
                        className="p-2 text-muted-foreground hover:text-red-400"
                        title="Delete feature"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      placeholder="Feature Description"
                      value={f.desc}
                      onChange={(e) => {
                        const updated = [...(data.dubbing?.features || [])];
                        updated[idx].desc = e.target.value;
                        setData({ ...data, dubbing: { ...data.dubbing, features: updated } });
                      }}
                      className="w-full rounded-xl border border-white/10 bg-background p-2.5 text-xs text-muted-foreground focus:outline-none"
                    />
                  </div>
                ))}

                <button
                  onClick={() => {
                    setData({
                      ...data,
                      dubbing: {
                        ...data.dubbing,
                        features: [
                          ...(data.dubbing?.features || []),
                          {
                            icon: "Mic",
                            title: "New Feature / Gear",
                            desc: "Description of recording gear or booth specification...",
                          },
                        ],
                      },
                    });
                  }}
                  className="inline-flex items-center gap-2 rounded-2xl border border-dashed border-white/20 p-3.5 w-full justify-center text-xs font-semibold text-muted-foreground hover:border-primary hover:text-foreground hover:bg-white/5 transition-all"
                >
                  <Plus className="size-4" /> Add Studio Feature
                </button>
              </div>
            </div>
          )}

          {/* COSTUME RENTALS TAB */}
          {activeTab === "costumes" && (
            <div className="rounded-3xl border border-white/15 bg-card/70 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl relative space-y-6">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent rounded-t-3xl" />
              <div className="flex items-center justify-between border-b border-white/10 pb-5">
                <div>
                  <h2 className="font-display text-2xl font-bold tracking-tight">Character Costume Rentals</h2>
                  <p className="text-xs text-muted-foreground mt-1">Manage wardrobe collections, pricing tags, WhatsApp enquiry, and banner photos</p>
                </div>
                <button
                  onClick={() => saveSection("costumes", data.costumes)}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-xs font-semibold text-primary-foreground glow-red hover:scale-105 transition-transform"
                >
                  <Save className="size-4" /> Save Costumes Section
                </button>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Section Tag Badge
                </label>
                <input
                  type="text"
                  value={data.costumes?.tag || ""}
                  onChange={(e) =>
                    setData({ ...data, costumes: { ...data.costumes, tag: e.target.value } })
                  }
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-background/90 p-3.5 text-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Headline Main Title
                  </label>
                  <input
                    type="text"
                    value={data.costumes?.titleMain || ""}
                    onChange={(e) =>
                      setData({ ...data, costumes: { ...data.costumes, titleMain: e.target.value } })
                    }
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-background/90 p-3.5 text-sm font-bold focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Headline Red Highlight
                  </label>
                  <input
                    type="text"
                    value={data.costumes?.titleRed || ""}
                    onChange={(e) =>
                      setData({ ...data, costumes: { ...data.costumes, titleRed: e.target.value } })
                    }
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-background/90 p-3.5 text-sm font-bold text-primary focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Description Paragraph
                </label>
                <textarea
                  rows={3}
                  value={data.costumes?.description || ""}
                  onChange={(e) =>
                    setData({ ...data, costumes: { ...data.costumes, description: e.target.value } })
                  }
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-background/90 p-3.5 text-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Wardrobe Highlight Banner Image
                </label>
                <div className="mt-2 flex flex-col sm:flex-row gap-3 items-center">
                  {data.costumes?.image && (
                    <img
                      src={data.costumes.image}
                      alt="Costume Wardrobe"
                      className="size-16 rounded-xl object-cover border border-white/10 shadow-md"
                    />
                  )}
                  <input
                    type="text"
                    value={data.costumes?.image || ""}
                    onChange={(e) =>
                      setData({
                        ...data,
                        costumes: { ...data.costumes, image: e.target.value },
                      })
                    }
                    className="w-full flex-1 rounded-xl border border-white/10 bg-background p-3 text-sm"
                  />
                  <label className="inline-flex items-center gap-2 rounded-xl bg-card border border-white/15 px-4 py-3 text-xs font-semibold cursor-pointer hover:bg-white/10 transition-colors whitespace-nowrap">
                    <Upload className="size-4" /> Upload Banner
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        handleFileUpload(e, (url) => {
                          setData({
                            ...data,
                            costumes: { ...data.costumes, image: url },
                          });
                        })
                      }
                    />
                  </label>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Banner Top Badge
                  </label>
                  <input
                    type="text"
                    value={data.costumes?.badge || ""}
                    onChange={(e) =>
                      setData({ ...data, costumes: { ...data.costumes, badge: e.target.value } })
                    }
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-background/90 p-3.5 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Banner Overlay Title
                  </label>
                  <input
                    type="text"
                    value={data.costumes?.bannerTitle || ""}
                    onChange={(e) =>
                      setData({ ...data, costumes: { ...data.costumes, bannerTitle: e.target.value } })
                    }
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-background/90 p-3.5 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Banner Subtitle / Dresser Support Text
                </label>
                <textarea
                  rows={2}
                  value={data.costumes?.bannerDesc || ""}
                  onChange={(e) =>
                    setData({ ...data, costumes: { ...data.costumes, bannerDesc: e.target.value } })
                  }
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-background/90 p-3.5 text-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    WhatsApp Button Text
                  </label>
                  <input
                    type="text"
                    value={data.costumes?.buttonText || ""}
                    onChange={(e) =>
                      setData({ ...data, costumes: { ...data.costumes, buttonText: e.target.value } })
                    }
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-background/90 p-3.5 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    WhatsApp Pre-filled Enquiry Message
                  </label>
                  <input
                    type="text"
                    value={data.costumes?.whatsappMessage || ""}
                    onChange={(e) =>
                      setData({ ...data, costumes: { ...data.costumes, whatsappMessage: e.target.value } })
                    }
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-background/90 p-3.5 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Categories & Costumes List */}
              <div className="space-y-4 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg font-bold">Costume Categories & Kits</h3>
                  <span className="text-xs text-muted-foreground font-semibold">
                    {data.costumes?.categories?.length || 0} categories
                  </span>
                </div>

                {(data.costumes?.categories || []).map((c, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-card/40 p-4 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex flex-1 items-center gap-3">
                        <select
                          value={c.icon}
                          onChange={(e) => {
                            const updated = [...(data.costumes?.categories || [])];
                            updated[idx].icon = e.target.value;
                            setData({ ...data, costumes: { ...data.costumes, categories: updated } });
                          }}
                          className="rounded-xl border border-white/10 bg-background p-2 text-xs font-semibold"
                        >
                          <option value="Crown">Crown (Royalty/Period)</option>
                          <option value="Palette">Palette (Cultural/Traditional)</option>
                          <option value="Shield">Shield (Theatrical/Armor)</option>
                          <option value="Shirt">Shirt (Modern/Stylized)</option>
                          <option value="Sparkles">Sparkles (Glamour/Props)</option>
                        </select>
                        <input
                          type="text"
                          placeholder="Category Title"
                          value={c.title}
                          onChange={(e) => {
                            const updated = [...(data.costumes?.categories || [])];
                            updated[idx].title = e.target.value;
                            setData({ ...data, costumes: { ...data.costumes, categories: updated } });
                          }}
                          className="flex-1 rounded-xl border border-white/10 bg-background p-2 text-sm font-semibold"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Price Tag (e.g. From ₹1,500 / day)"
                          value={c.tag}
                          onChange={(e) => {
                            const updated = [...(data.costumes?.categories || [])];
                            updated[idx].tag = e.target.value;
                            setData({ ...data, costumes: { ...data.costumes, categories: updated } });
                          }}
                          className="w-44 rounded-xl border border-white/10 bg-background p-2 text-xs font-semibold text-primary"
                        />
                        <button
                          onClick={() => {
                            const updated = (data.costumes?.categories || []).filter((_, i) => i !== idx);
                            setData({ ...data, costumes: { ...data.costumes, categories: updated } });
                          }}
                          className="p-2 text-muted-foreground hover:text-red-400"
                          title="Delete category"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>
                    <textarea
                      rows={2}
                      placeholder="Category Description & Included Outfits"
                      value={c.desc}
                      onChange={(e) => {
                        const updated = [...(data.costumes?.categories || [])];
                        updated[idx].desc = e.target.value;
                        setData({ ...data, costumes: { ...data.costumes, categories: updated } });
                      }}
                      className="w-full rounded-xl border border-white/10 bg-background p-2.5 text-xs text-muted-foreground focus:outline-none"
                    />
                  </div>
                ))}

                <button
                  onClick={() => {
                    setData({
                      ...data,
                      costumes: {
                        ...data.costumes,
                        categories: [
                          ...(data.costumes?.categories || []),
                          {
                            icon: "Crown",
                            title: "New Costume Category",
                            tag: "From ₹1,500 / day",
                            desc: "Description of character outfits, robes, fabrics and accessories...",
                          },
                        ],
                      },
                    });
                  }}
                  className="inline-flex items-center gap-2 rounded-2xl border border-dashed border-white/20 p-3.5 w-full justify-center text-xs font-semibold text-muted-foreground hover:border-primary hover:text-foreground hover:bg-white/5 transition-all"
                >
                  <Plus className="size-4" /> Add Costume Category
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
