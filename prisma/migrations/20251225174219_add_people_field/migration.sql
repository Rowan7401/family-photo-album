/*
  Warnings:

  - Added the required column `people` to the `Photo` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Photo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "imageUrl" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "caption" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "takenAt" DATETIME NOT NULL,
    "uploaderName" TEXT NOT NULL,
    "people" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Photo" ("caption", "createdAt", "id", "imageUrl", "location", "takenAt", "title", "uploaderName") SELECT "caption", "createdAt", "id", "imageUrl", "location", "takenAt", "title", "uploaderName" FROM "Photo";
DROP TABLE "Photo";
ALTER TABLE "new_Photo" RENAME TO "Photo";
CREATE INDEX "Photo_takenAt_createdAt_idx" ON "Photo"("takenAt", "createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
