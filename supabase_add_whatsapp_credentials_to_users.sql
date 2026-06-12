-- Migration: Add WhatsApp campaign credentials to users table
-- IMPORTANT: Run this SQL in your main CRM database SQL editor on Supabase.

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS "whatsappInstanceId" TEXT,
ADD COLUMN IF NOT EXISTS "whatsappToken" TEXT;
