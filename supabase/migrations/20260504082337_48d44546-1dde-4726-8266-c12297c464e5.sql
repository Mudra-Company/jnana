
-- Realign Amaeru subordinates' RIASEC profiles to share 2-3 dominant traits
-- with their managers, raising the Sintonia Leadership & Management index
-- to a healthy ~70-80% average while keeping a couple of realistic outliers.

-- Helper: each row sets new top-3 codes via score adjustments + profile_code.
-- Scale 0-30. Top-3 are the highest 3 dimensions.

-- === Sub of Giuseppe (CEO, ESC) ===

-- Valentina Rossi (Veterinary Lead): ISR -> SEI (shares S, E with CEO; keeps Vet I-trait)
UPDATE riasec_results SET
  score_r=10, score_i=22, score_a=14, score_s=26, score_e=24, score_c=12,
  profile_code='S-E-I'
WHERE user_id='16e5f41f-ac02-4ef0-a293-f568ec1e7821';

-- Paola Neri (CFO): keep CEI -> ECI (E,C shared with CEO + I)
UPDATE riasec_results SET
  score_r=8, score_i=22, score_a=10, score_s=16, score_e=27, score_c=26,
  profile_code='E-C-I'
WHERE user_id='be059b44-a1f8-42dd-a513-7376b301f831';

-- Lorenzo Marchetti (CTO): IEC -> ECI (now strongly aligned with CEO E,C + I)
UPDATE riasec_results SET
  score_r=12, score_i=24, score_a=12, score_s=15, score_e=27, score_c=25,
  profile_code='E-C-I'
WHERE user_id='be94cb58-29e5-4084-9321-5e4849b21aa0';

-- Martina Gallo (CS Lead): SEA -> ESA (E,S shared with CEO + A)
UPDATE riasec_results SET
  score_r=7, score_i=14, score_a=20, score_s=25, score_e=27, score_c=18,
  profile_code='E-S-A'
WHERE user_id='65fbb31f-2e7e-4737-81bf-d3045150330c';

-- Giulia Ruggi (Head of Marketing): EAS -> ESA (E,S shared + A)
UPDATE riasec_results SET
  score_r=6, score_i=16, score_a=22, score_s=24, score_e=28, score_c=15,
  profile_code='E-S-A'
WHERE user_id='0c81f3b2-6c66-49f4-93b2-f03e23b47910';

-- === Sub of Lorenzo (CTO, ECI) ===

-- Alessia Conti (FE Engineer): IAR -> ICE (shares I,C,E = 3 traits, excellent fit)
UPDATE riasec_results SET
  score_r=12, score_i=25, score_a=16, score_s=14, score_e=22, score_c=24,
  profile_code='I-C-E'
WHERE user_id='e327c712-dbfe-4bf7-84c6-54e9d2b4fdf5';

-- Federico Romano (iOS): IAC -> ICE (3 shared, perfect)
UPDATE riasec_results SET
  score_r=14, score_i=27, score_a=18, score_s=13, score_e=22, score_c=24,
  profile_code='I-C-E'
WHERE user_id='2721497c-4e95-48f0-99c1-025c47830a36';

-- Sara Bianchi (Lead AI): IRE -> IEC (3 shared with CTO)
UPDATE riasec_results SET
  score_r=14, score_i=28, score_a=15, score_s=12, score_e=25, score_c=23,
  profile_code='I-E-C'
WHERE user_id='48f72c6c-6ec5-4d85-9967-2bb3c07abffd';

-- Elena Marini (Product Designer): AIS -> IEA (shares I,E + A creativity)
UPDATE riasec_results SET
  score_r=9, score_i=24, score_a=26, score_s=16, score_e=22, score_c=14,
  profile_code='I-A-E'
WHERE user_id='60ce4d17-bdd0-495f-a039-8befde6da871';

-- Matteo Greco (BE Engineer): IRC -> ICE (3 shared)
UPDATE riasec_results SET
  score_r=15, score_i=26, score_a=11, score_s=12, score_e=22, score_c=24,
  profile_code='I-C-E'
WHERE user_id='bf1ed50d-de8e-450d-b38e-df9c54076b1a';

-- === Sub of Paola (CFO, ECI) ===

-- Stefano Lombardi (Finance & Admin): CIE -> CEI (3 shared, perfect)
UPDATE riasec_results SET
  score_r=7, score_i=24, score_a=9, score_s=15, score_e=25, score_c=27,
  profile_code='C-E-I'
WHERE user_id='e38ca102-4d45-4a7b-9588-5379669fe1ed';

-- Francesca Moretti (People & Legal): SCE -> CES (2 shared C,E + S empathy)
UPDATE riasec_results SET
  score_r=5, score_i=16, score_a=14, score_s=24, score_e=25, score_c=26,
  profile_code='C-E-S'
WHERE user_id='9ba4e673-b18f-4880-bc5a-23d2e626c861';

-- === Sub of Martina (CS Lead, ESA) ===

-- Riccardo Esposito (Community & Support): SAE (already 3 shared)
UPDATE riasec_results SET
  score_r=8, score_i=12, score_a=22, score_s=27, score_e=24, score_c=15,
  profile_code='S-E-A'
WHERE user_id='15b308a8-fb1c-42cb-9939-aee91d30b027';

-- === Sub of Giulia (Head of Marketing, ESA) ===

-- Marco Galli (Content & Brand): -> AES (3 shared)
UPDATE riasec_results SET
  score_r=6, score_i=14, score_a=26, score_s=22, score_e=24, score_c=12,
  profile_code='A-E-S'
WHERE user_id='6d1eefba-9c3d-4515-ad1f-5a592ec1ffa0';

-- Sofia De Luca (Performance & SEO): -> EAS (3 shared)
UPDATE riasec_results SET
  score_r=7, score_i=18, score_a=22, score_s=20, score_e=26, score_c=16,
  profile_code='E-A-S'
WHERE user_id='1368664c-bbac-4aa0-9c41-d11d5668e1f3';

-- Luca Ferrari (Social Media): -> SEA (3 shared)
UPDATE riasec_results SET
  score_r=6, score_i=14, score_a=24, score_s=27, score_e=25, score_c=13,
  profile_code='S-E-A'
WHERE user_id='29af48e8-f210-456b-a107-592cac8a9aa7';

-- === Sub of Sara (Lead AI, IEC) ===

-- Davide Russo (ML/CV): -> IEC (3 shared)
UPDATE riasec_results SET
  score_r=14, score_i=27, score_a=15, score_s=12, score_e=23, score_c=22,
  profile_code='I-E-C'
WHERE user_id='955b8689-e723-4b7f-b05c-3d7bfff70e53';

-- === Sub of Valentina (Vet Lead, SEI) ===

-- Andrea Pozzi (Pet Nutrition): -> SIE (3 shared)
UPDATE riasec_results SET
  score_r=8, score_i=23, score_a=14, score_s=26, score_e=22, score_c=12,
  profile_code='S-I-E'
WHERE user_id='cbd9601b-2e55-4a3e-a24b-43d68733bc4b';
