-- ============================================================
-- Migration: Full EduCRM Sprints A–G
-- Adds: Password Reset, Lead Scoring, Voice Notes, Documents,
--       Invoices/Payments, Events, SMS Campaigns, Alumni
-- ============================================================

-- -----------------------------------------------
-- SPRINT A — Auth: Password Reset Tokens
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
    "id"        TEXT NOT NULL,
    "token"     TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt"    TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "password_reset_tokens_token_key" ON "password_reset_tokens"("token");
ALTER TABLE "password_reset_tokens"
    ADD CONSTRAINT "password_reset_tokens_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- -----------------------------------------------
-- SPRINT B — Lead Scoring
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS "lead_scores" (
    "id"         TEXT NOT NULL,
    "seekerId"   TEXT NOT NULL,
    "score"      INTEGER NOT NULL DEFAULT 0,
    "tier"       TEXT NOT NULL DEFAULT 'COLD',
    "breakdown"  JSONB,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"  TIMESTAMP(3) NOT NULL,
    CONSTRAINT "lead_scores_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "lead_scores_seekerId_key" ON "lead_scores"("seekerId");
ALTER TABLE "lead_scores"
    ADD CONSTRAINT "lead_scores_seekerId_fkey"
    FOREIGN KEY ("seekerId") REFERENCES "seekers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- -----------------------------------------------
-- SPRINT B — Voice Notes
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS "voice_notes" (
    "id"              TEXT NOT NULL,
    "seekerId"        TEXT NOT NULL,
    "userId"          TEXT NOT NULL,
    "cloudinaryId"    TEXT NOT NULL,
    "cloudinaryUrl"   TEXT NOT NULL,
    "durationSeconds" INTEGER,
    "transcription"   TEXT,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "voice_notes_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "voice_notes"
    ADD CONSTRAINT "voice_notes_seekerId_fkey"
    FOREIGN KEY ("seekerId") REFERENCES "seekers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "voice_notes"
    ADD CONSTRAINT "voice_notes_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- -----------------------------------------------
-- SPRINT C — Document Types
-- -----------------------------------------------
CREATE TYPE IF NOT EXISTS "DocumentCategory" AS ENUM (
    'IDENTITY', 'ACADEMIC', 'FINANCIAL', 'PROGRAM', 'OTHER'
);

CREATE TABLE IF NOT EXISTS "document_types" (
    "id"          TEXT NOT NULL,
    "name"        TEXT NOT NULL,
    "code"        TEXT NOT NULL,
    "category"    "DocumentCategory" NOT NULL DEFAULT 'OTHER',
    "description" TEXT,
    "required"    BOOLEAN NOT NULL DEFAULT false,
    "active"      BOOLEAN NOT NULL DEFAULT true,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,
    CONSTRAINT "document_types_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "document_types_code_key" ON "document_types"("code");

CREATE TABLE IF NOT EXISTS "program_document_requirements" (
    "id"             TEXT NOT NULL,
    "programId"      TEXT NOT NULL,
    "documentTypeId" TEXT NOT NULL,
    "required"       BOOLEAN NOT NULL DEFAULT true,
    "notes"          TEXT,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "program_document_requirements_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "program_document_requirements_programId_documentTypeId_key"
    ON "program_document_requirements"("programId", "documentTypeId");
ALTER TABLE "program_document_requirements"
    ADD CONSTRAINT "program_document_requirements_programId_fkey"
    FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "program_document_requirements"
    ADD CONSTRAINT "program_document_requirements_documentTypeId_fkey"
    FOREIGN KEY ("documentTypeId") REFERENCES "document_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- -----------------------------------------------
-- SPRINT C — Documents
-- -----------------------------------------------
CREATE TYPE IF NOT EXISTS "DocumentStatus" AS ENUM (
    'PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED'
);

CREATE TABLE IF NOT EXISTS "documents" (
    "id"              TEXT NOT NULL,
    "seekerId"        TEXT NOT NULL,
    "documentTypeId"  TEXT NOT NULL,
    "uploadedById"    TEXT NOT NULL,
    "verifiedById"    TEXT,
    "cloudinaryId"    TEXT NOT NULL,
    "cloudinaryUrl"   TEXT NOT NULL,
    "thumbnailUrl"    TEXT,
    "fileName"        TEXT NOT NULL,
    "fileSize"        INTEGER NOT NULL,
    "fileFormat"      TEXT NOT NULL,
    "folder"          TEXT NOT NULL,
    "status"          TEXT NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "notes"           TEXT,
    "expiryDate"      TIMESTAMP(3),
    "deletedAt"       TIMESTAMP(3),
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL,
    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "documents"
    ADD CONSTRAINT "documents_seekerId_fkey"
    FOREIGN KEY ("seekerId") REFERENCES "seekers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "documents"
    ADD CONSTRAINT "documents_documentTypeId_fkey"
    FOREIGN KEY ("documentTypeId") REFERENCES "document_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "documents"
    ADD CONSTRAINT "documents_uploadedById_fkey"
    FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "documents"
    ADD CONSTRAINT "documents_verifiedById_fkey"
    FOREIGN KEY ("verifiedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "document_versions" (
    "id"            TEXT NOT NULL,
    "documentId"    TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "cloudinaryId"  TEXT NOT NULL,
    "cloudinaryUrl" TEXT NOT NULL,
    "fileSize"      INTEGER NOT NULL,
    "uploadedById"  TEXT NOT NULL,
    "notes"         TEXT,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "document_versions_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "document_versions"
    ADD CONSTRAINT "document_versions_documentId_fkey"
    FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "document_versions"
    ADD CONSTRAINT "document_versions_uploadedById_fkey"
    FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "document_requests" (
    "id"             TEXT NOT NULL,
    "seekerId"       TEXT NOT NULL,
    "documentTypeId" TEXT NOT NULL,
    "requestedById"  TEXT NOT NULL,
    "message"        TEXT,
    "dueDate"        TIMESTAMP(3),
    "fulfilled"      BOOLEAN NOT NULL DEFAULT false,
    "reminderCount"  INTEGER NOT NULL DEFAULT 0,
    "lastReminderAt" TIMESTAMP(3),
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL,
    CONSTRAINT "document_requests_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "document_requests"
    ADD CONSTRAINT "document_requests_seekerId_fkey"
    FOREIGN KEY ("seekerId") REFERENCES "seekers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "document_requests"
    ADD CONSTRAINT "document_requests_documentTypeId_fkey"
    FOREIGN KEY ("documentTypeId") REFERENCES "document_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "document_requests"
    ADD CONSTRAINT "document_requests_requestedById_fkey"
    FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- -----------------------------------------------
-- SPRINT D — Invoices & Payments
-- -----------------------------------------------
CREATE TYPE IF NOT EXISTS "PaymentStatus" AS ENUM (
    'PENDING', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED', 'REFUNDED'
);
CREATE TYPE IF NOT EXISTS "PaymentMethod" AS ENUM (
    'BANK_TRANSFER', 'CASH', 'CARD', 'ONLINE', 'CHEQUE', 'OTHER'
);

CREATE TABLE IF NOT EXISTS "invoices" (
    "id"            TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "seekerId"      TEXT NOT NULL,
    "createdById"   TEXT NOT NULL,
    "status"        "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "totalAmount"   DECIMAL(10,2) NOT NULL,
    "currency"      TEXT NOT NULL DEFAULT 'LKR',
    "notes"         TEXT,
    "dueDate"       TIMESTAMP(3),
    "paidAt"        TIMESTAMP(3),
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3) NOT NULL,
    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "invoices_invoiceNumber_key" ON "invoices"("invoiceNumber");
ALTER TABLE "invoices"
    ADD CONSTRAINT "invoices_seekerId_fkey"
    FOREIGN KEY ("seekerId") REFERENCES "seekers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "invoices"
    ADD CONSTRAINT "invoices_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "invoice_items" (
    "id"          TEXT NOT NULL,
    "invoiceId"   TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity"    INTEGER NOT NULL DEFAULT 1,
    "amount"      DECIMAL(10,2) NOT NULL,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "invoice_items"
    ADD CONSTRAINT "invoice_items_invoiceId_fkey"
    FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "payments" (
    "id"             TEXT NOT NULL,
    "invoiceId"      TEXT NOT NULL,
    "amount"         DECIMAL(10,2) NOT NULL,
    "method"         "PaymentMethod" NOT NULL,
    "reference"      TEXT,
    "notes"          TEXT,
    "paidAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordedById"   TEXT NOT NULL,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "payments"
    ADD CONSTRAINT "payments_invoiceId_fkey"
    FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payments"
    ADD CONSTRAINT "payments_recordedById_fkey"
    FOREIGN KEY ("recordedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- -----------------------------------------------
-- SPRINT E — Events
-- -----------------------------------------------
CREATE TYPE IF NOT EXISTS "EventType" AS ENUM (
    'WEBINAR', 'OPEN_DAY', 'INFO_SESSION', 'WORKSHOP', 'ORIENTATION', 'OTHER'
);
CREATE TYPE IF NOT EXISTS "EventStatus" AS ENUM (
    'DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED'
);

CREATE TABLE IF NOT EXISTS "events" (
    "id"           TEXT NOT NULL,
    "title"        TEXT NOT NULL,
    "description"  TEXT,
    "type"         "EventType" NOT NULL DEFAULT 'OTHER',
    "status"       "EventStatus" NOT NULL DEFAULT 'DRAFT',
    "startAt"      TIMESTAMP(3) NOT NULL,
    "endAt"        TIMESTAMP(3),
    "location"     TEXT,
    "onlineLink"   TEXT,
    "maxAttendees" INTEGER,
    "createdById"  TEXT NOT NULL,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL,
    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "events"
    ADD CONSTRAINT "events_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "event_registrations" (
    "id"        TEXT NOT NULL,
    "eventId"   TEXT NOT NULL,
    "seekerId"  TEXT NOT NULL,
    "attended"  BOOLEAN NOT NULL DEFAULT false,
    "notes"     TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "event_registrations_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "event_registrations_eventId_seekerId_key"
    ON "event_registrations"("eventId", "seekerId");
ALTER TABLE "event_registrations"
    ADD CONSTRAINT "event_registrations_eventId_fkey"
    FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "event_registrations"
    ADD CONSTRAINT "event_registrations_seekerId_fkey"
    FOREIGN KEY ("seekerId") REFERENCES "seekers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- -----------------------------------------------
-- SPRINT F — SMS Campaigns
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS "sms_messages" (
    "id"          TEXT NOT NULL,
    "sentById"    TEXT NOT NULL,
    "message"     TEXT NOT NULL,
    "provider"    TEXT NOT NULL DEFAULT 'notify_lk',
    "status"      TEXT NOT NULL DEFAULT 'SENT',
    "sentAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sms_messages_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "sms_messages"
    ADD CONSTRAINT "sms_messages_sentById_fkey"
    FOREIGN KEY ("sentById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "sms_recipients" (
    "id"          TEXT NOT NULL,
    "smsMessageId" TEXT NOT NULL,
    "phone"       TEXT NOT NULL,
    "name"        TEXT,
    "seekerId"    TEXT,
    "status"      TEXT NOT NULL DEFAULT 'SENT',
    "error"       TEXT,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sms_recipients_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "sms_recipients"
    ADD CONSTRAINT "sms_recipients_smsMessageId_fkey"
    FOREIGN KEY ("smsMessageId") REFERENCES "sms_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sms_recipients"
    ADD CONSTRAINT "sms_recipients_seekerId_fkey"
    FOREIGN KEY ("seekerId") REFERENCES "seekers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- -----------------------------------------------
-- SPRINT G — Alumni Management
-- -----------------------------------------------
CREATE TYPE IF NOT EXISTS "AlumniStatus" AS ENUM (
    'EMPLOYED', 'SELF_EMPLOYED', 'STUDYING', 'UNEMPLOYED', 'UNKNOWN'
);

CREATE TABLE IF NOT EXISTS "alumni" (
    "id"          TEXT NOT NULL,
    "seekerId"    TEXT NOT NULL,
    "programId"   TEXT,
    "graduatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status"      "AlumniStatus" NOT NULL DEFAULT 'UNKNOWN',
    "currentRole" TEXT,
    "employer"    TEXT,
    "linkedinUrl" TEXT,
    "notes"       TEXT,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,
    CONSTRAINT "alumni_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "alumni_seekerId_key" ON "alumni"("seekerId");
ALTER TABLE "alumni"
    ADD CONSTRAINT "alumni_seekerId_fkey"
    FOREIGN KEY ("seekerId") REFERENCES "seekers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "alumni"
    ADD CONSTRAINT "alumni_programId_fkey"
    FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "alumni_engagements" (
    "id"        TEXT NOT NULL,
    "alumniId"  TEXT NOT NULL,
    "type"      TEXT NOT NULL,
    "notes"     TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "alumni_engagements_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "alumni_engagements"
    ADD CONSTRAINT "alumni_engagements_alumniId_fkey"
    FOREIGN KEY ("alumniId") REFERENCES "alumni"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- -----------------------------------------------
-- SPRINT A — New Permissions
-- -----------------------------------------------
-- Add new permissions if not already present
INSERT INTO "permissions" ("id", "name", "description", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'VIEW_REPORTS',      'View reports and analytics', NOW(), NOW()),
  (gen_random_uuid()::text, 'READ_DOCUMENTS',    'View student documents',     NOW(), NOW()),
  (gen_random_uuid()::text, 'MANAGE_DOCUMENTS',  'Upload and manage documents',NOW(), NOW()),
  (gen_random_uuid()::text, 'READ_PAYMENTS',     'View invoices and payments', NOW(), NOW()),
  (gen_random_uuid()::text, 'MANAGE_PAYMENTS',   'Create and manage payments', NOW(), NOW()),
  (gen_random_uuid()::text, 'READ_EVENT',        'View events',                NOW(), NOW()),
  (gen_random_uuid()::text, 'MANAGE_EVENT',      'Create and manage events',   NOW(), NOW()),
  (gen_random_uuid()::text, 'READ_ALUMNI',       'View alumni records',        NOW(), NOW()),
  (gen_random_uuid()::text, 'MANAGE_ALUMNI',     'Manage alumni records',      NOW(), NOW()),
  (gen_random_uuid()::text, 'SEND_SMS',          'Send SMS campaigns',         NOW(), NOW())
ON CONFLICT DO NOTHING;
