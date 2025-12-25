// lib/db-simple.ts
import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.DATABASE_URL || "file:./dev.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Initialize schema if needed
const initDb = async () => {
  await client.execute(`
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
  `);
  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_takenAt ON photos(takenAt DESC, createdAt DESC);
  `);
};

initDb().catch(console.error);

export const dbSimple = {
  // Get all photos, optionally filtered by people
  getPhotos: async (filterPeople?: string[]) => {
    let query = "SELECT * FROM photos";
    const params: string[] = [];
    
    if (filterPeople && filterPeople.length > 0) {
      const conditions = filterPeople.map(() => "people LIKE ?").join(" OR ");
      query += ` WHERE ${conditions}`;
      params.push(...filterPeople.map(p => `%${p}%`));
    }
    
    query += " ORDER BY takenAt DESC, createdAt DESC";
    
    const result = await client.execute({
      sql: query,
      args: params,
    });
    
    return result.rows.map(row => ({
      id: row.id,
      imageUrl: row.imageUrl,
      title: row.title,
      caption: row.caption,
      location: row.location,
      takenAt: row.takenAt,
      uploaderName: row.uploaderName,
      people: row.people,
      createdAt: row.createdAt,
    }));
  },
  
  // Create a new photo
  createPhoto: async (data: {
    imageUrl: string;
    title: string;
    caption: string;
    location: string;
    takenAt: string;
    uploaderName: string;
    people: string[];
  }) => {
    const result = await client.execute({
      sql: `
        INSERT INTO photos (imageUrl, title, caption, location, takenAt, uploaderName, people)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        RETURNING *
      `,
      args: [
        data.imageUrl,
        data.title,
        data.caption || "",
        data.location,
        data.takenAt,
        data.uploaderName,
        JSON.stringify(data.people),
      ],
    });
    
    const row = result.rows[0];
    return {
      id: row.id,
      imageUrl: row.imageUrl,
      title: row.title,
      caption: row.caption,
      location: row.location,
      takenAt: row.takenAt,
      uploaderName: row.uploaderName,
      people: row.people,
      createdAt: row.createdAt,
    };
  },
};