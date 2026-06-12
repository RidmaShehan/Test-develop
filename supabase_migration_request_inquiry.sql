-- Migration: Add missing columns to exhibition_visitors table
-- Run this SQL in your Request Inquiry Supabase project's SQL editor.

ALTER TABLE public.exhibition_visitors
ADD COLUMN IF NOT EXISTS addressee TEXT,
ADD COLUMN IF NOT EXISTS coordinator_id TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS date_of_birth DATE;
