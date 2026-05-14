-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'TRANSFER', 'CARD_EXTERNAL', 'OTHER');

-- AlterEnum
ALTER TYPE "PaymentProvider" ADD VALUE 'MANUAL';

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "collectedById" TEXT,
ADD COLUMN     "method" "PaymentMethod",
ADD COLUMN     "notes" TEXT,
ALTER COLUMN "provider" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "Payment_collectedById_createdAt_idx" ON "Payment"("collectedById", "createdAt");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_collectedById_fkey" FOREIGN KEY ("collectedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
