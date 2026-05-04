
-- Fix profile_code format (add hyphens) for Amaeru leadership so the
-- compatibility engine (which splits on '-') can correctly compute matches.

-- Giuseppe Ciniero (CEO, both tenants if duplicated)
UPDATE riasec_results SET profile_code='E-S-C'
WHERE user_id='b3bbdccd-6b96-47a5-a26d-22236989cc83'
  AND profile_code IN ('ESC','E-S-C') OR profile_code='ESC' AND user_id='b3bbdccd-6b96-47a5-a26d-22236989cc83';

UPDATE riasec_results SET profile_code='E-S-C'
WHERE company_id='02b47082-c1d5-4e63-bc78-b6e9dfe602a7'
  AND user_id='b3bbdccd-6b96-47a5-a26d-22236989cc83';

-- Chiara Tacco (CDA): ESC
UPDATE riasec_results SET profile_code='E-S-C'
WHERE user_id='bfe13f6c-c81e-4f82-ad51-66165cdca227';

-- Carlotta Silvestrini (CDA): ESI -> E-S-I
UPDATE riasec_results SET profile_code='E-S-I'
WHERE user_id='b7358e41-ccbe-4fe1-8e3f-0ca5c92f9327';

-- Diego Barbisan (CDA): ECI -> E-C-I
UPDATE riasec_results SET profile_code='E-C-I'
WHERE user_id='1fda1e17-d59d-42a8-bd25-d27e0d45e506';

-- Also: any other Amaeru row that still has unhyphenated 3-letter code -> add hyphens
UPDATE riasec_results
SET profile_code = substring(profile_code,1,1) || '-' || substring(profile_code,2,1) || '-' || substring(profile_code,3,1)
WHERE company_id='02b47082-c1d5-4e63-bc78-b6e9dfe602a7'
  AND profile_code ~ '^[A-Z]{3}$';
