import mysql from "mysql2/promise";
import fs from "node:fs";
import path from "node:path";
import { defaultCmsData, type CmsData, deepMergeCmsData } from "./cms-defaults";

export { defaultCmsData, type CmsData, deepMergeCmsData };

// MySQL Connection Helper
let pool: mysql.Pool | null = null;

export function getDbPool(): mysql.Pool | null {
  if (pool) return pool;
  try {
    const host = process.env.MYSQL_HOST || "localhost";
    const user = process.env.MYSQL_USER || "root";
    const password = process.env.MYSQL_PASSWORD || "";
    const database = process.env.MYSQL_DATABASE || "buddies_db";
    const port = Number(process.env.MYSQL_PORT) || 3306;

    pool = mysql.createPool({
      host,
      user,
      password,
      database,
      port,
      connectTimeout: 5000,
      dateStrings: true,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
    return pool;
  } catch (err) {
    console.warn("MySQL pool creation warning:", err);
    return null;
  }
}

// Local JSON File Fallback Storage Path
const dataFilePath = path.join(process.cwd(), "public", "cms-store.json");

export function getCmsDataLocal(): CmsData {
  try {
    if (fs.existsSync(dataFilePath)) {
      const fileData = fs.readFileSync(dataFilePath, "utf-8");
      return deepMergeCmsData(defaultCmsData, JSON.parse(fileData));
    }
  } catch (err) {
    console.error("Error reading local cms-store.json:", err);
  }
  return defaultCmsData;
}

export function saveCmsDataLocal(data: Partial<CmsData>): CmsData {
  const current = getCmsDataLocal();
  const updated = deepMergeCmsData(current, data);
  try {
    const dir = path.dirname(dataFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(dataFilePath, JSON.stringify(updated, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving local cms-store.json:", err);
  }
  return updated;
}

// Unified Get CMS Data (MySQL + Fallback)
export async function getCmsData(): Promise<CmsData> {
  const db = getDbPool();
  if (db) {
    try {
      const [rows] = await db.query<any[]>(
        "SELECT section_key, content_json FROM site_settings",
      );
      if (rows && rows.length > 0) {
        const result: any = {};
        for (const row of rows) {
          try {
            result[row.section_key] = JSON.parse(row.content_json);
          } catch (e) {
            // ignore JSON parse error for specific section
          }
        }
        return deepMergeCmsData(defaultCmsData, result);
      }
    } catch (err) {
      // MySQL query failed or DB not initialized yet, fallback to file storage
    }
  }
  return getCmsDataLocal();
}

// Unified Save Section CMS Data (MySQL + Fallback)
export async function saveSectionData(sectionKey: keyof CmsData, data: any): Promise<void> {
  // First save locally to ensure instant persistent fallback
  const localData = getCmsDataLocal();
  localData[sectionKey] = data;
  saveCmsDataLocal(localData);

  // Then try saving to MySQL
  const db = getDbPool();
  if (db) {
    try {
      const jsonStr = JSON.stringify(data);
      await db.query(
        `INSERT INTO site_settings (section_key, content_json)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE content_json = VALUES(content_json)`,
        [sectionKey, jsonStr],
      );
    } catch (err) {
      console.warn(`Could not save ${sectionKey} to MySQL (falling back to JSON store):`, err);
    }
  }
}
