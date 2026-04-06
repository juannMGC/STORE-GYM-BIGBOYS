-- RenameColumn
ALTER TABLE "User" RENAME COLUMN "auth0Sub" TO "auth0Id";

-- AlterTable
ALTER TABLE "User" ADD COLUMN "name" TEXT;
