-- Manual migration: Training, TrainingSchedule, TrainingBenefit

CREATE TABLE "Training" (
  "id"          TEXT NOT NULL,
  "name"        TEXT NOT NULL,
  "slug"        TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "longDesc"    TEXT,
  "price"       DOUBLE PRECISION NOT NULL,
  "priceLabel"  TEXT,
  "imageUrl"    TEXT,
  "icon"        TEXT,
  "active"      BOOLEAN NOT NULL DEFAULT true,
  "featured"    BOOLEAN NOT NULL DEFAULT false,
  "order"       INTEGER NOT NULL DEFAULT 0,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Training_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Training_slug_key" ON "Training"("slug");

CREATE TABLE "TrainingSchedule" (
  "id"         TEXT NOT NULL,
  "trainingId" TEXT NOT NULL,
  "day"        TEXT NOT NULL,
  "startTime"  TEXT NOT NULL,
  "endTime"    TEXT NOT NULL,
  "spots"      INTEGER,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TrainingSchedule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TrainingBenefit" (
  "id"         TEXT NOT NULL,
  "trainingId" TEXT NOT NULL,
  "text"       TEXT NOT NULL,
  "order"      INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "TrainingBenefit_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "TrainingSchedule"
  ADD CONSTRAINT "TrainingSchedule_trainingId_fkey"
  FOREIGN KEY ("trainingId")
  REFERENCES "Training"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TrainingBenefit"
  ADD CONSTRAINT "TrainingBenefit_trainingId_fkey"
  FOREIGN KEY ("trainingId")
  REFERENCES "Training"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
