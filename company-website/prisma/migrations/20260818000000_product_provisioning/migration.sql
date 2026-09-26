ALTER TABLE "Product" ADD COLUMN "productionUrl" TEXT;
ALTER TABLE "Subscription" ADD COLUMN "externalTenantId" TEXT;
ALTER TABLE "Subscription" ADD COLUMN "externalAccessUrl" TEXT;
ALTER TABLE "Subscription" ADD COLUMN "provisionedAt" TIMESTAMP(3);
ALTER TABLE "Subscription" ADD COLUMN "provisioningError" TEXT;
CREATE UNIQUE INDEX "Subscription_externalTenantId_key" ON "Subscription"("externalTenantId");
