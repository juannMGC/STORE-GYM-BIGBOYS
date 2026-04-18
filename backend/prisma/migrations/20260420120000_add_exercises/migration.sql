-- CreateTable
CREATE TABLE "MuscleGroup" (
    "id"          TEXT NOT NULL,
    "name"        TEXT NOT NULL,
    "slug"        TEXT NOT NULL,
    "description" TEXT,
    "icon"        TEXT,
    "order"       INTEGER NOT NULL DEFAULT 0,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MuscleGroup_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MuscleGroup_name_key" ON "MuscleGroup"("name");
CREATE UNIQUE INDEX "MuscleGroup_slug_key" ON "MuscleGroup"("slug");

CREATE TABLE "Exercise" (
    "id"            TEXT NOT NULL,
    "name"          TEXT NOT NULL,
    "slug"          TEXT NOT NULL,
    "description"   TEXT,
    "instructions"  TEXT,
    "muscleGroupId" TEXT NOT NULL,
    "level"         TEXT NOT NULL DEFAULT 'BEGINNER',
    "sets"          INTEGER,
    "reps"          TEXT,
    "restSeconds"   INTEGER,
    "equipment"     TEXT,
    "tips"          TEXT,
    "imageUrl"      TEXT,
    "videoUrl"      TEXT,
    "active"        BOOLEAN NOT NULL DEFAULT true,
    "featured"      BOOLEAN NOT NULL DEFAULT false,
    "order"         INTEGER NOT NULL DEFAULT 0,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Exercise_slug_key" ON "Exercise"("slug");
CREATE INDEX "Exercise_muscleGroupId_idx" ON "Exercise"("muscleGroupId");
CREATE INDEX "Exercise_active_idx" ON "Exercise"("active");

ALTER TABLE "Exercise"
  ADD CONSTRAINT "Exercise_muscleGroupId_fkey"
  FOREIGN KEY ("muscleGroupId")
  REFERENCES "MuscleGroup"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "MuscleGroup" ("id", "name", "slug", "order")
VALUES
  (gen_random_uuid(), 'Pecho', 'pecho', 1),
  (gen_random_uuid(), 'Espalda', 'espalda', 2),
  (gen_random_uuid(), 'Piernas', 'piernas', 3),
  (gen_random_uuid(), 'Hombros', 'hombros', 4),
  (gen_random_uuid(), 'Biceps', 'biceps', 5),
  (gen_random_uuid(), 'Triceps', 'triceps', 6),
  (gen_random_uuid(), 'Core', 'core', 7),
  (gen_random_uuid(), 'Cardio', 'cardio', 8);
