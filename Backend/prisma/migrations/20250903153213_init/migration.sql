-- CreateEnum
CREATE TYPE "public"."ReportStatus" AS ENUM ('IDLE', 'QUEUED', 'GENERATING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."UploadStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GlobalCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GlobalCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CategoryAsin" (
    "id" TEXT NOT NULL,
    "asin" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "globalCategoryId" TEXT NOT NULL,

    CONSTRAINT "CategoryAsin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DemandReport" (
    "id" TEXT NOT NULL,
    "status" "public"."ReportStatus" NOT NULL DEFAULT 'QUEUED',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "userId" TEXT NOT NULL,
    "globalCategoryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "DemandReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProductCategory" (
    "id" TEXT NOT NULL,
    "asin" TEXT NOT NULL,
    "categoryName" TEXT NOT NULL,
    "categoryUrl" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ProductCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BestSellingAsin" (
    "id" TEXT NOT NULL,
    "categoryAnalyticsId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "asin" TEXT NOT NULL,
    "title" TEXT,
    "imageUrl" TEXT,
    "price" DOUBLE PRECISION,
    "rating" DOUBLE PRECISION,
    "reviewsCount" INTEGER,
    "monthlySales" INTEGER,
    "monthlyRevenue" DOUBLE PRECISION,

    CONSTRAINT "BestSellingAsin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CategoryAnalytics" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "summaryJson" JSONB,
    "salesOverTimeJson" JSONB,
    "brandMarketShareJson" JSONB,

    CONSTRAINT "CategoryAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Product" (
    "id" TEXT NOT NULL,
    "asin" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "title" TEXT,
    "imageUrl" TEXT,
    "fbaQty" INTEGER NOT NULL DEFAULT 0,
    "mfnQty" INTEGER NOT NULL DEFAULT 0,
    "vendorQty" INTEGER NOT NULL DEFAULT 0,
    "totalQty" INTEGER NOT NULL DEFAULT 0,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Upload" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "dateStart" TIMESTAMP(3),
    "dateEnd" TIMESTAMP(3),
    "filename" TEXT,
    "path" TEXT,
    "status" "public"."UploadStatus" NOT NULL DEFAULT 'PENDING',
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Upload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Otp" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "otpHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL,

    CONSTRAINT "Otp_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "public"."SalesDaily" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "sku" TEXT NOT NULL,
    "asin" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "SalesDaily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MarketingRecord" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'campaign',
    "campaignName" TEXT,
    "adGroupName" TEXT,
    "keyword" TEXT,
    "asin" TEXT,
    "sku" TEXT,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "spend" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "orders" INTEGER NOT NULL DEFAULT 0,
    "sales" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ctr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cpc" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "acos" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "roas" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "marketplace" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "MarketingRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Variation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "tags" TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Variation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VariationItem" (
    "id" TEXT NOT NULL,
    "sku" TEXT,
    "asin" TEXT,
    "note" TEXT,
    "variationId" TEXT NOT NULL,

    CONSTRAINT "VariationItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "public"."User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "GlobalCategory_url_key" ON "public"."GlobalCategory"("url");

-- CreateIndex
CREATE UNIQUE INDEX "GlobalCategory_categoryId_key" ON "public"."GlobalCategory"("categoryId");

-- CreateIndex
CREATE INDEX "CategoryAsin_asin_idx" ON "public"."CategoryAsin"("asin");

-- CreateIndex
CREATE UNIQUE INDEX "CategoryAsin_asin_globalCategoryId_userId_key" ON "public"."CategoryAsin"("asin", "globalCategoryId", "userId");

-- CreateIndex
CREATE INDEX "DemandReport_userId_status_idx" ON "public"."DemandReport"("userId", "status");

-- CreateIndex
CREATE INDEX "ProductCategory_asin_idx" ON "public"."ProductCategory"("asin");

-- CreateIndex
CREATE UNIQUE INDEX "ProductCategory_asin_categoryUrl_key" ON "public"."ProductCategory"("asin", "categoryUrl");

-- CreateIndex
CREATE INDEX "BestSellingAsin_categoryAnalyticsId_idx" ON "public"."BestSellingAsin"("categoryAnalyticsId");

-- CreateIndex
CREATE UNIQUE INDEX "CategoryAnalytics_reportId_key" ON "public"."CategoryAnalytics"("reportId");

-- CreateIndex
CREATE INDEX "Product_userId_idx" ON "public"."Product"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_userId_asin_sku_key" ON "public"."Product"("userId", "asin", "sku");

-- CreateIndex
CREATE INDEX "Upload_userId_type_idx" ON "public"."Upload"("userId", "type");

-- CreateIndex
CREATE INDEX "Otp_email_type_idx" ON "public"."Otp"("email", "type");

-- CreateIndex
CREATE INDEX "InventorySnapshot_userId_date_idx" ON "public"."InventorySnapshot"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "InventorySnapshot_userId_asin_sku_date_key" ON "public"."InventorySnapshot"("userId", "asin", "sku", "date");

-- CreateIndex
CREATE UNIQUE INDEX "SalesDaily_userId_date_sku_key" ON "public"."SalesDaily"("userId", "date", "sku");

-- CreateIndex
CREATE INDEX "MarketingRecord_userId_date_idx" ON "public"."MarketingRecord"("userId", "date");

-- CreateIndex
CREATE INDEX "MarketingRecord_userId_campaignName_date_idx" ON "public"."MarketingRecord"("userId", "campaignName", "date");

-- CreateIndex
CREATE INDEX "MarketingRecord_userId_asin_date_idx" ON "public"."MarketingRecord"("userId", "asin", "date");

-- CreateIndex
CREATE INDEX "Variation_userId_name_idx" ON "public"."Variation"("userId", "name");

-- CreateIndex
CREATE INDEX "VariationItem_variationId_idx" ON "public"."VariationItem"("variationId");

-- AddForeignKey
ALTER TABLE "public"."CategoryAsin" ADD CONSTRAINT "CategoryAsin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CategoryAsin" ADD CONSTRAINT "CategoryAsin_globalCategoryId_fkey" FOREIGN KEY ("globalCategoryId") REFERENCES "public"."GlobalCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DemandReport" ADD CONSTRAINT "DemandReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DemandReport" ADD CONSTRAINT "DemandReport_globalCategoryId_fkey" FOREIGN KEY ("globalCategoryId") REFERENCES "public"."GlobalCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BestSellingAsin" ADD CONSTRAINT "BestSellingAsin_categoryAnalyticsId_fkey" FOREIGN KEY ("categoryAnalyticsId") REFERENCES "public"."CategoryAnalytics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CategoryAnalytics" ADD CONSTRAINT "CategoryAnalytics_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "public"."DemandReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Product" ADD CONSTRAINT "Product_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Upload" ADD CONSTRAINT "Upload_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InventorySnapshot" ADD CONSTRAINT "InventorySnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SalesDaily" ADD CONSTRAINT "SalesDaily_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MarketingRecord" ADD CONSTRAINT "MarketingRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Variation" ADD CONSTRAINT "Variation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VariationItem" ADD CONSTRAINT "VariationItem_variationId_fkey" FOREIGN KEY ("variationId") REFERENCES "public"."Variation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
