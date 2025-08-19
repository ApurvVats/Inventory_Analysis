/*
  Warnings:

  - You are about to drop the column `name` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,asin,sku]` on the table `Product` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[username]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Made the column `asin` on table `Product` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `passwordHash` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `username` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."MarketingRecord_userId_sku_date_idx";

-- DropIndex
DROP INDEX "public"."Product_userId_asin_idx";

-- DropIndex
DROP INDEX "public"."Product_userId_sku_key";

-- DropIndex
DROP INDEX "public"."SalesDaily_userId_date_idx";

-- DropIndex
DROP INDEX "public"."Upload_userId_type_createdAt_idx";

-- DropIndex
DROP INDEX "public"."VariationItem_asin_idx";

-- DropIndex
DROP INDEX "public"."VariationItem_sku_idx";

-- AlterTable
ALTER TABLE "public"."MarketingRecord" ALTER COLUMN "level" SET DEFAULT 'campaign';

-- AlterTable
ALTER TABLE "public"."Product" DROP COLUMN "name",
ADD COLUMN     "fbaQty" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "mfnQty" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "title" TEXT,
ADD COLUMN     "totalQty" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "vendorQty" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "asin" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."Upload" ADD COLUMN     "dateEnd" TIMESTAMP(3),
ADD COLUMN     "dateStart" TIMESTAMP(3),
ALTER COLUMN "filename" DROP NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'pending';

-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "password",
ADD COLUMN     "passwordHash" TEXT NOT NULL,
ADD COLUMN     "username" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "public"."InventorySnapshot" (
    "id" TEXT NOT NULL,
    "asin" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "fbaQty" INTEGER NOT NULL DEFAULT 0,
    "mfnQty" INTEGER NOT NULL DEFAULT 0,
    "vendorQty" INTEGER NOT NULL DEFAULT 0,
    "totalQty" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "InventorySnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InventorySnapshot_userId_date_idx" ON "public"."InventorySnapshot"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "InventorySnapshot_userId_asin_sku_date_key" ON "public"."InventorySnapshot"("userId", "asin", "sku", "date");

-- CreateIndex
CREATE INDEX "Product_userId_idx" ON "public"."Product"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_userId_asin_sku_key" ON "public"."Product"("userId", "asin", "sku");

-- CreateIndex
CREATE INDEX "Upload_userId_type_idx" ON "public"."Upload"("userId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "public"."User"("username");

-- AddForeignKey
ALTER TABLE "public"."InventorySnapshot" ADD CONSTRAINT "InventorySnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
