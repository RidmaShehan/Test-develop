-- Bootstrap an ADMIN role, grant ALL permissions to it, and create an admin user.
-- Run this in Supabase: SQL Editor → New query.
--
-- REQUIRED: replace the placeholders below.
--   __ADMIN_EMAIL__       (e.g. admin@educationcrm.com)
--   __ADMIN_NAME__        (e.g. Admin User)
--   __ADMIN_PASSWORD__    (PLAIN TEXT; will be bcrypt-hashed in DB via pgcrypto)
--
-- Notes:
-- - This uses Prisma-created tables in schema "public".
-- - It upserts by unique keys, so it is safe to run multiple times.

BEGIN;

-- Needed for gen_random_uuid() and bcrypt hashing via crypt()/gen_salt()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

WITH role_upsert AS (
  -- Create the roles you requested.
  -- NOTE: User.role is an enum and does NOT include MANAGER; MANAGER is created
  -- here as an RBAC role in public.roles.
  INSERT INTO public.roles ("id", "name", "description", "isActive", "createdAt", "updatedAt")
  VALUES
    (gen_random_uuid()::text, 'ADMIN',          'Admin role (bootstrapped)',          true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'ADMINISTRATOR',  'Administrator role (bootstrapped)',  true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'COORDINATOR',    'Coordinator role (bootstrapped)',    true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'MANAGER',        'Manager role (bootstrapped)',        true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  ON CONFLICT ("name") DO UPDATE
    SET "description" = EXCLUDED."description",
        "isActive" = true,
        "updatedAt" = CURRENT_TIMESTAMP
  RETURNING "id", "name"
),
permissions_ensure AS (
  -- Create one row in public.permissions for every enum value in public."Permission"
  INSERT INTO public.permissions ("id", "name", "description", "createdAt")
  SELECT
    gen_random_uuid()::text,
    p,
    p::text,
    CURRENT_TIMESTAMP
  FROM unnest(enum_range(NULL::public."Permission")) AS p
  ON CONFLICT ("name") DO NOTHING
  RETURNING "id"
),
role_permissions_ensure AS (
  -- Attach ALL permissions to ADMIN + ADMINISTRATOR (so the new admin user will work immediately)
  INSERT INTO public.role_permissions ("id", "roleId", "permissionId")
  SELECT
    gen_random_uuid()::text,
    r."id",
    p."id"
  FROM role_upsert r
  JOIN public.permissions p ON true
  WHERE r."name" IN ('ADMIN', 'ADMINISTRATOR')
  ON CONFLICT ("roleId", "permissionId") DO NOTHING
  RETURNING 1
),
user_upsert AS (
  INSERT INTO public.users ("id", "name", "email", "password", "role", "isActive", "createdAt", "updatedAt")
  VALUES (
    gen_random_uuid()::text,
    '__ADMIN_NAME__',
    '__ADMIN_EMAIL__',
    crypt('__ADMIN_PASSWORD__', gen_salt('bf', 12)),
    'ADMIN'::public."UserRole",
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
  ON CONFLICT ("email") DO UPDATE
    SET "name" = EXCLUDED."name",
        "password" = EXCLUDED."password",
        "role" = EXCLUDED."role",
        "isActive" = true,
        "updatedAt" = CURRENT_TIMESTAMP
  RETURNING "id"
)
INSERT INTO public.user_role_assignments ("id", "userId", "roleId", "assignedAt", "assignedBy")
SELECT
  gen_random_uuid()::text,
  u."id",
  r."id",
  CURRENT_TIMESTAMP,
  NULL
FROM user_upsert u
JOIN role_upsert r ON r."name" = 'ADMIN'
ON CONFLICT ("userId", "roleId") DO NOTHING;

COMMIT;


