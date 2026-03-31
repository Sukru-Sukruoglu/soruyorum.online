BEGIN;

-- Unicon Mice organization + corporate_wl package + organizer user mappings
-- Safe to run multiple times (idempotent behavior for org/subscription checks).
-- IMPORTANT: Replace sample emails in the UPDATE section before running.

WITH upsert_org AS (
  INSERT INTO organizations (
    id,
    name,
    slug,
    plan,
    updated_at
  )
  VALUES (
    gen_random_uuid()::text,
    'Unicon Mice',
    'unicon-mice',
    'corporate_wl',
    NOW()
  )
  ON CONFLICT (slug)
  DO UPDATE SET
    name = EXCLUDED.name,
    plan = EXCLUDED.plan,
    updated_at = NOW()
  RETURNING id
),
org_ref AS (
  SELECT id FROM upsert_org
  UNION ALL
  SELECT o.id
  FROM organizations o
  WHERE o.slug = 'unicon-mice'
  LIMIT 1
)
INSERT INTO subscriptions (
  id,
  organization_id,
  plan,
  status,
  current_period_start,
  current_period_end,
  payment_method,
  metadata,
  updated_at
)
SELECT
  gen_random_uuid()::text,
  org_ref.id,
  'corporate_wl',
  'active',
  CURRENT_DATE,
  (CURRENT_DATE + INTERVAL '1 year')::date,
  'manual',
  '{"source":"manual_setup","note":"Unicon Mice corporate WL setup"}'::jsonb,
  NOW()
FROM org_ref
WHERE NOT EXISTS (
  SELECT 1
  FROM subscriptions s
  WHERE s.organization_id = org_ref.id
    AND s.status = 'active'
    AND lower(s.plan) = 'corporate_wl'
);

-- Map existing users to Unicon Mice and set role=organizer.
-- Replace these sample names with real customer user names.
-- NOTE: If duplicate names exist, all matching users will be updated.
WITH org_ref AS (
  SELECT id
  FROM organizations
  WHERE slug = 'unicon-mice'
  LIMIT 1
)
UPDATE users u
SET
  organization_id = org_ref.id,
  role = 'organizer',
  updated_at = NOW()
FROM org_ref
WHERE lower(coalesce(u.name, '')) IN (
  lower('Ornek Kullanici 1'),
  lower('Ornek Kullanici 2'),
  lower('Ornek Kullanici 3')
);

COMMIT;
