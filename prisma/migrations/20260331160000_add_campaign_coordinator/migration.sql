-- Add coordinatorId on campaigns
ALTER TABLE "campaigns" ADD COLUMN "coordinatorId" TEXT REFERENCES "users"("id") ON DELETE SET NULL;
