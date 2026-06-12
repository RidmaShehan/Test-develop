-- Migration: Add campaign_id column to exhibition_visitors table
-- IMPORTANT: Run this SQL in your separate Request Inquiry Supabase database's SQL editor (not the main CRM database).

ALTER TABLE public.exhibition_visitors
ADD COLUMN IF NOT EXISTS campaign_id TEXT;
