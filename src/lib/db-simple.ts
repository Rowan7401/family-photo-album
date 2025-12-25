// Simple SQLite database without Prisma - if Prisma continues to cause issues
import Database from "better-sqlite3";
import { existsSync } from "fs";

const dbPath = process.env.DATABASE_URL?.replace(/^file:/, "") || "./dev.db";
const db = new Database(dbPath);

// Initialize schema if needed
if (!existsSync(dbPath) || db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='photos'").get() === undefined) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      imageUrl TEXT NOT NULL,
      title TEXT NOT NULL,
      caption TEXT NOT NULL DEFAULT '',
      location TEXT NOT NULL,
      takenAt TEXT NOT NULL,
      uploaderName TEXT NOT NULL,
      people TEXT NOT NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_takenAt ON photos(takenAt DESC, createdAt DESC);
  `);
  console.log("[db-simple] Database initialized");
}

export const dbSimple = {
  // Get all photos, optionally filtered by people
  getPhotos: (filterPeople?: string[]) => {
    let query = "SELECT * FROM photos";
    const params: string[] = [];
    
    if (filterPeople && filterPeople.length > 0) {
      const conditions = filterPeople.map(() => "people LIKE ?").join(" OR ");
      query += ` WHERE ${conditions}`;
      params.push(...filterPeople.map(p => `%${p}%`));
    }
    
    query += " ORDER BY takenAt DESC, createdAt DESC";
    
    const results = db.prepare(query).all(...params) as any[];
    // Parse people JSON strings back to arrays
    return results.map(photo => ({
      ...photo,
      people: photo.people, // Keep as JSON string for now (matches frontend expectation)
    }));
  },
  
  // Create a new photo
  createPhoto: (data: {
    imageUrl: string;
    title: string;
    caption: string;
    location: string;
    takenAt: string;
    uploaderName: string;
    people: string[];
  }) => {
    const stmt = db.prepare(`
      INSERT INTO photos (imageUrl, title, caption, location, takenAt, uploaderName, people)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      data.imageUrl,
      data.title,
      data.caption || "",
      data.location,
      data.takenAt,
      data.uploaderName,
      JSON.stringify(data.people)
    );
    
    return {
      id: result.lastInsertRowid,
      ...data,
      people: JSON.stringify(data.people),
      createdAt: new Date().toISOString(),
    };
  },
};

