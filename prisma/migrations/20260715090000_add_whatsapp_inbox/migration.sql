CREATE TABLE "whatsapp_inbox_messages" (
  "id" TEXT NOT NULL,
  "providerMessageId" TEXT NOT NULL,
  "instanceId" TEXT NOT NULL,
  "phoneNumber" TEXT NOT NULL,
  "body" TEXT,
  "direction" TEXT NOT NULL,
  "messageType" TEXT NOT NULL DEFAULT 'chat',
  "status" TEXT,
  "rawPayload" JSONB,
  "sentById" TEXT,
  "receivedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "seekerId" TEXT,
  CONSTRAINT "whatsapp_inbox_messages_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "whatsapp_inbox_messages_providerMessageId_key" ON "whatsapp_inbox_messages"("providerMessageId");
CREATE INDEX "whatsapp_inbox_messages_phoneNumber_receivedAt_idx" ON "whatsapp_inbox_messages"("phoneNumber", "receivedAt");
CREATE INDEX "whatsapp_inbox_messages_seekerId_receivedAt_idx" ON "whatsapp_inbox_messages"("seekerId", "receivedAt");
ALTER TABLE "whatsapp_inbox_messages" ADD CONSTRAINT "whatsapp_inbox_messages_seekerId_fkey" FOREIGN KEY ("seekerId") REFERENCES "seekers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
