/*
  Warnings:

  - Added the required column `asin` to the `SalesDaily` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."SalesDaily" ADD COLUMN     "asin" TEXT NOT NULL;
