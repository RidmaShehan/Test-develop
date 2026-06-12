-- SQL script to delete all request inquiries (exhibition visitors) added today (2026-06-12)
-- IMPORTANT: Run this SQL in your separate Request Inquiry Supabase database's SQL editor (refer to project reference 'pcrdpephzjfanaxelzgz').

-- OPTION A: Delete records specifically created on or after 2026-06-12 (Sri Lanka / Local time / UTC)
-- This targets today's imports/inserts specifically.

-- 1. Delete associated visitor programs
DELETE FROM public.visitor_programs
WHERE visitor_id IN (
  SELECT id FROM public.exhibition_visitors
  WHERE created_at >= '2026-06-12 00:00:00'
);

-- 2. Delete associated visitor metadata
DELETE FROM public.visitor_metadata
WHERE visitor_id IN (
  SELECT id FROM public.exhibition_visitors
  WHERE created_at >= '2026-06-12 00:00:00'
);

-- 3. Delete exhibition visitors
DELETE FROM public.exhibition_visitors
WHERE created_at >= '2026-06-12 00:00:00';



-- OPTION B (Alternative): Dynamic delete targeting current calendar date of the database
-- Uncomment the block below to run dynamically.
/*
DELETE FROM public.visitor_programs
WHERE visitor_id IN (
  SELECT id FROM public.exhibition_visitors
  WHERE created_at >= CURRENT_DATE
);

DELETE FROM public.visitor_metadata
WHERE visitor_id IN (
  SELECT id FROM public.exhibition_visitors
  WHERE created_at >= CURRENT_DATE
);

DELETE FROM public.exhibition_visitors
WHERE created_at >= CURRENT_DATE;
*/
