
-- ============================================================================
-- FIX SPACESYNC AMAERU: collaboration links + Sala CDA desks
-- ============================================================================

-- 1) Fix link 'Membro CDA → CEO': cambio targetType da 'member' a 'role'.
--    Il targetId (2f28afaf-...) è già il role_id del CEO, era solo etichettato male.
UPDATE company_roles
SET collaboration_profile = jsonb_set(
  collaboration_profile,
  '{links}',
  (
    SELECT jsonb_agg(
      CASE
        WHEN link->>'targetId' = '2f28afaf-9ad8-5b22-8fcb-5192a62b5242'
             AND link->>'targetType' = 'member'
        THEN link
             || jsonb_build_object('targetType', 'role')
             || jsonb_build_object(
                  'memberBreakdown',
                  jsonb_build_array(
                    jsonb_build_object(
                      'memberId', '129fd34e-d30e-5c78-b9cc-85adcc2877db',
                      'memberLabel', 'CEO',
                      'percentage', 100,
                      'affinity', COALESCE((link->>'personalAffinity')::int, 5)
                    )
                  )
                )
        ELSE link
      END
    )
    FROM jsonb_array_elements(collaboration_profile->'links') AS link
  )
)
WHERE company_id = (SELECT id FROM companies WHERE name = 'Amaeru')
  AND title = 'Membro CDA';

-- 2) Aggiungi link reciproci tra i 3 Membri CDA (board interna).
--    Ogni Membro CDA collabora 10% con ciascuno degli altri due, affinità 4.
WITH cda_roles AS (
  SELECT cr.id AS role_id, cra.company_member_id AS member_id, cr.title
  FROM company_roles cr
  LEFT JOIN company_role_assignments cra ON cra.role_id = cr.id
  WHERE cr.company_id = (SELECT id FROM companies WHERE name = 'Amaeru')
    AND cr.title = 'Membro CDA'
)
UPDATE company_roles cr_target
SET collaboration_profile = jsonb_set(
  cr_target.collaboration_profile,
  '{links}',
  COALESCE(cr_target.collaboration_profile->'links', '[]'::jsonb)
  || (
    SELECT COALESCE(jsonb_agg(
      jsonb_build_object(
        'targetType', 'role',
        'targetId', other.role_id::text,
        'targetLabel', 'Membro CDA',
        'collaborationPercentage', 10,
        'personalAffinity', 4,
        'memberBreakdown', jsonb_build_array(
          jsonb_build_object(
            'memberId', other.member_id::text,
            'memberLabel', 'Membro CDA',
            'percentage', 100,
            'affinity', 4
          )
        )
      )
    ), '[]'::jsonb)
    FROM cda_roles other
    WHERE other.role_id <> cr_target.id
      AND other.member_id IS NOT NULL
      -- evita duplicati se rilanciato
      AND NOT EXISTS (
        SELECT 1
        FROM jsonb_array_elements(COALESCE(cr_target.collaboration_profile->'links','[]'::jsonb)) AS l
        WHERE l->>'targetId' = other.role_id::text
      )
  )
)
WHERE cr_target.company_id = (SELECT id FROM companies WHERE name = 'Amaeru')
  AND cr_target.title = 'Membro CDA';

-- 3) Crea 3 scrivanie nella Sala CDA (Piano 2 Milano HQ) e assegnale ai 3 Membri CDA
DO $$
DECLARE
  v_room_id uuid := '7440ca31-83ca-4c12-b837-15132b7cc34a';
  v_member_ids uuid[] := ARRAY[
    'fc70eebc-3f44-5aca-b20c-caca71ea4cdf'::uuid,
    '595e7898-5a15-50e5-8859-716f4ad00ef3'::uuid,
    '1bedcd9d-b9a0-5db0-aae4-9176cc067f4a'::uuid
  ];
  v_role_ids uuid[] := ARRAY[
    '24ef46f5-75ee-5112-9a8c-835f497c3817'::uuid,
    'e2a5ac5c-0b54-58fb-8345-80e1d51f066c'::uuid,
    '49062e5a-e74a-5e67-a052-ae9e611e3103'::uuid
  ];
  v_positions int[][] := ARRAY[ARRAY[60,60], ARRAY[180,60], ARRAY[300,60]];
  i int;
BEGIN
  FOR i IN 1..3 LOOP
    -- Salta se la persona ha già una scrivania
    IF NOT EXISTS (SELECT 1 FROM office_desks WHERE company_member_id = v_member_ids[i]) THEN
      INSERT INTO office_desks (room_id, label, x, y, company_member_id, company_role_id)
      VALUES (
        v_room_id,
        'CDA ' || i,
        v_positions[i][1],
        v_positions[i][2],
        v_member_ids[i],
        v_role_ids[i]
      );
    END IF;
  END LOOP;
END $$;
