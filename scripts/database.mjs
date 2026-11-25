import mysql from "mysql2/promise";
import { readFile } from "node:fs/promises";

const database = process.env.MYSQL_DATABASE;
const checkOnly = process.argv.includes("--check");
let connection;

try {
  if (!process.env.MYSQL_HOST || !process.env.MYSQL_USER || !database) {
    throw new Error("Set MYSQL_HOST, MYSQL_USER and MYSQL_DATABASE in .env.local.");
  }
  const port = Number(process.env.MYSQL_PORT || 3306);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("MYSQL_PORT must be between 1 and 65535.");
  }
  const config = {
    host: process.env.MYSQL_HOST,
    port,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD || "",
    connectTimeout: 5000,
  };
  try {
    connection = await mysql.createConnection({ ...config, database });
  } catch (error) {
    if (checkOnly || error.code !== "ER_BAD_DB_ERROR") throw error;
    connection = await mysql.createConnection(config);
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS ${mysql.escapeId(database)} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
    await connection.changeUser({ database });
  }

  if (!checkOnly) {
    const schema = (
      await Promise.all(
        ["../schema.sql", "../commerce-schema.sql"].map((file) =>
          readFile(new URL(file, import.meta.url), "utf8"),
        ),
      )
    ).join("\n");
    // Use the configured database, and never install the legacy default admin password.
    const statements = schema.replace(/^--.*$/gm, "").split(";");
    for (const statement of statements) {
      if (/^\s*CREATE TABLE IF NOT EXISTS\b/i.test(statement)) {
        await connection.query(statement);
      }
    }

    let content;
    try {
      content = JSON.parse(
        await readFile(new URL("../public/cms-store.json", import.meta.url), "utf8"),
      );
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    if (content) {
      await connection.beginTransaction();
      try {
        for (const [section, value] of Object.entries(content)) {
          await connection.execute(
            "INSERT INTO site_settings (section_key, content_json) VALUES (?, ?) ON DUPLICATE KEY UPDATE section_key = VALUES(section_key)",
            [section, JSON.stringify(value)],
          );
        }
        await connection.commit();
      } catch (error) {
        await connection.rollback();
        throw error;
      }
    }
    console.log("Database schema ready; existing CMS sections preserved.");
    // Existing public collections stay visible, but zero stock prevents unverified bookings.
    const [cmsRows] = await connection.query(
      "SELECT section_key, content_json FROM site_settings WHERE section_key IN ('rentals', 'costumes')",
    );
    for (const row of cmsRows) {
      const data = JSON.parse(row.content_json);
      const items = row.section_key === "rentals" ? data : data.categories || [];
      for (const [index, item] of items.entries()) {
        const price = Number((item.tag || "").match(/[\d,]+/)?.[0]?.replaceAll(",", "") || 0) * 100;
        await connection.execute(
          `INSERT INTO rental_products (id, source_key, kind, name, category, description, image, specifications, price_paise, active)
           VALUES (UUID(), ?, ?, ?, ?, ?, ?, '', ?, 1)
           ON DUPLICATE KEY UPDATE source_key = VALUES(source_key)`,
          [
            `${row.section_key}-${item.id ?? index}`,
            row.section_key === "rentals" ? "equipment" : "costume",
            item.title,
            item.title,
            item.description || item.desc || "",
            item.image || data.image || "",
            price,
          ],
        );
        // Explicit one-time publication of previously imported drafts. Normal setup
        // never republishes products that an administrator has unpublished.
        if (process.argv.includes("--publish-imported")) {
          await connection.execute(
            "UPDATE rental_products SET active=1 WHERE source_key=? AND active=0 AND stock=0 AND price_paise>0 AND image<>''",
            [`${row.section_key}-${item.id ?? index}`],
          );
        }
      }
    }
  }

  const [settings] = await connection.query("SELECT COUNT(*) AS count FROM site_settings");
  const [views] = await connection.query("SELECT COUNT(*) AS count FROM page_views");
  console.log(
    `MySQL connected. CMS sections: ${settings[0].count}; page views: ${views[0].count}.`,
  );
} catch (error) {
  const messages = {
    ETIMEDOUT:
      "MySQL did not respond. Check that XAMPP MySQL is healthy and the host/port are correct.",
    ECONNREFUSED:
      "MySQL is not accepting connections. Start MySQL and check MYSQL_HOST/MYSQL_PORT.",
    ER_ACCESS_DENIED_ERROR: "MySQL rejected the credentials. Check MYSQL_USER/MYSQL_PASSWORD.",
    ER_BAD_DB_ERROR: "The database does not exist. Run npm run db:setup.",
    ER_NO_SUCH_TABLE: "The application tables are missing. Run npm run db:setup.",
  };
  console.error(
    messages[error.code] || (error.code ? `Database setup failed (${error.code}).` : error.message),
  );
  process.exitCode = 1;
} finally {
  if (connection) await connection.end();
}
