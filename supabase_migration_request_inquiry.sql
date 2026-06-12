-- Migration: Create exhibition_visitors table or add missing columns
-- IMPORTANT: Run this SQL in your separate Request Inquiry Supabase database's SQL editor (not the main CRM database).

-- 1. Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.exhibition_visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  work_phone TEXT NOT NULL,
  is_converted BOOLEAN DEFAULT false,
  converted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  addressee TEXT,
  coordinator_id TEXT,
  address TEXT,
  date_of_birth DATE
);

-- 2. Alter table if it already exists to add the new columns if they are missing
ALTER TABLE public.exhibition_visitors
ADD COLUMN IF NOT EXISTS addressee TEXT,
ADD COLUMN IF NOT EXISTS coordinator_id TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS date_of_birth DATE;
