-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Upload" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "path" TEXT,
    "status" TEXT NOT NULL,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Upload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Product" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "asin" TEXT,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SalesDaily" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "sku" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesDaily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MarketingRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "level" TEXT NOT NULL,
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

    CONSTRAINT "MarketingRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Variation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "tags" TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Variation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VariationItem" (
    "id" TEXT NOT NULL,
    "variationId" TEXT NOT NULL,
    "sku" TEXT,
    "asin" TEXT,
    "note" TEXT,

    CONSTRAINT "VariationItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "Upload_userId_type_createdAt_idx" ON "public"."Upload"("userId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "Product_userId_asin_idx" ON "public"."Product"("userId", "asin");

-- CreateIndex
CREATE UNIQUE INDEX "Product_userId_sku_key" ON "public"."Product"("userId", "sku");

-- CreateIndex
CREATE INDEX "SalesDaily_userId_date_idx" ON "public"."SalesDaily"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "SalesDaily_userId_date_sku_key" ON "public"."SalesDaily"("userId", "date", "sku");

-- CreateIndex
CREATE INDEX "MarketingRecord_userId_date_idx" ON "public"."MarketingRecord"("userId", "date");

-- CreateIndex
CREATE INDEX "MarketingRecord_userId_campaignName_date_idx" ON "public"."MarketingRecord"("userId", "campaignName", "date");

-- CreateIndex
CREATE INDEX "MarketingRecord_userId_asin_date_idx" ON "public"."MarketingRecord"("userId", "asin", "date");

-- CreateIndex
CREATE INDEX "MarketingRecord_userId_sku_date_idx" ON "public"."MarketingRecord"("userId", "sku", "date");

-- CreateIndex
CREATE INDEX "Variation_userId_name_idx" ON "public"."Variation"("userId", "name");

-- CreateIndex
CREATE INDEX "VariationItem_variationId_idx" ON "public"."VariationItem"("variationId");

-- CreateIndex
CREATE INDEX "VariationItem_sku_idx" ON "public"."VariationItem"("sku");

-- CreateIndex
CREATE INDEX "VariationItem_asin_idx" ON "public"."VariationItem"("asin");

-- AddForeignKey
ALTER TABLE "public"."Upload" ADD CONSTRAINT "Upload_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Product" ADD CONSTRAINT "Product_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SalesDaily" ADD CONSTRAINT "SalesDaily_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MarketingRecord" ADD CONSTRAINT "MarketingRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Variation" ADD CONSTRAINT "Variation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VariationItem" ADD CONSTRAINT "VariationItem_variationId_fkey" FOREIGN KEY ("variationId") REFERENCES "public"."Variation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
