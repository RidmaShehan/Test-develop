-- AlterTable: allow WhatsApp recipients without a seeker (promotion promoters)
ALTER TABLE "whatsapp_recipients" DROP CONSTRAINT "whatsapp_recipients_seekerId_fkey";

ALTER TABLE "whatsapp_recipients" ALTER COLUMN "seekerId" DROP NOT NULL;

ALTER TABLE "whatsapp_recipients" ADD COLUMN "promotionCodeId" TEXT;

ALTER TABLE "whatsapp_recipients" ADD CONSTRAINT "whatsapp_recipients_seekerId_fkey" FOREIGN KEY ("seekerId") REFERENCES "seekers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "whatsapp_recipients" ADD CONSTRAINT "whatsapp_recipients_promotionCodeId_fkey" FOREIGN KEY ("promotionCodeId") REFERENCES "promotion_codes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "whatsapp_recipients_promotionCodeId_idx" ON "whatsapp_recipients"("promotionCodeId");
