import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/admin/analytics")({
  server: {
    handlers: {
      GET: async () => {
        const fs = await import("node:fs");
        const path = await import("node:path");
        const { getDbPool } = await import("@/lib/cms-store");

        const visitorFilePath = path.join(process.cwd(), "public", "visitor-store.json");

        let dbConnected = false;
        let todayCount = 0;
        let weeklyCount = 0;
        let monthlyCount = 0;
        let dailyBreakdown: Array<{ day: string; count: number; pct: number }> = [
          { day: "Mon", count: 0, pct: 10 },
          { day: "Tue", count: 0, pct: 10 },
          { day: "Wed", count: 0, pct: 10 },
          { day: "Thu", count: 0, pct: 10 },
          { day: "Fri", count: 0, pct: 10 },
          { day: "Sat", count: 0, pct: 10 },
          { day: "Sun", count: 0, pct: 10 },
        ];

        const db = getDbPool();
        if (db) {
          try {
            await db.query(`
              CREATE TABLE IF NOT EXISTS page_views (
                id INT AUTO_INCREMENT PRIMARY KEY,
                path VARCHAR(255) NOT NULL DEFAULT '/',
                ip_address VARCHAR(45) DEFAULT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
              )
            `);
            dbConnected = true;

            const [todayRows] = await db.query<any[]>(
              "SELECT COUNT(*) as count FROM page_views WHERE DATE(created_at) = CURDATE()",
            );
            todayCount = todayRows[0]?.count || 0;

            const [weekRows] = await db.query<any[]>(
              "SELECT COUNT(*) as count FROM page_views WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)",
            );
            weeklyCount = weekRows[0]?.count || 0;

            const [monthRows] = await db.query<any[]>(
              "SELECT COUNT(*) as count FROM page_views WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)",
            );
            monthlyCount = monthRows[0]?.count || 0;

            const [dayRows] = await db.query<any[]>(`
              SELECT DAYNAME(created_at) as day_name, COUNT(*) as count
              FROM page_views
              WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
              GROUP BY DAYNAME(created_at)
            `);

            const dayMap: Record<string, number> = {};
            for (const r of dayRows) {
              dayMap[r.day_name] = r.count;
            }

            const daysArr = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
            const shortDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
            const counts = daysArr.map((d) => dayMap[d] || 0);
            const maxVal = Math.max(...counts, 1);

            dailyBreakdown = shortDays.map((sd, i) => ({
              day: sd,
              count: counts[i],
              pct: Math.max(Math.round((counts[i] / maxVal) * 100), 8),
            }));
          } catch (err) {
            console.warn("MySQL analytics query warning:", err);
          }
        }

        if (!dbConnected || (todayCount === 0 && weeklyCount === 0)) {
          try {
            if (fs.existsSync(visitorFilePath)) {
              const content = fs.readFileSync(visitorFilePath, "utf-8");
              const store = JSON.parse(content);
              const views: Array<{ path: string; timestamp: string }> = store.views || [];

              const now = new Date();
              const todayStr = now.toISOString().split("T")[0];
              const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
              const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

              let localToday = 0;
              let localWeek = 0;
              let localMonth = 0;

              views.forEach((v) => {
                const vDate = new Date(v.timestamp);
                if (v.timestamp.startsWith(todayStr)) localToday++;
                if (vDate >= sevenDaysAgo) localWeek++;
                if (vDate >= thirtyDaysAgo) localMonth++;
              });

              todayCount = Math.max(todayCount, localToday);
              weeklyCount = Math.max(weeklyCount, localWeek);
              monthlyCount = Math.max(monthlyCount, localMonth);
            }
          } catch (e) {
            // fallback
          }
        }

        return new Response(
          JSON.stringify({
            success: true,
            dbConnected,
            todayVisitors: todayCount,
            weeklyVisitors: weeklyCount,
            monthlyVisitors: monthlyCount,
            dailyBreakdown,
          }),
          { headers: { "Content-Type": "application/json" } },
        );
      },
    },
  },
});
