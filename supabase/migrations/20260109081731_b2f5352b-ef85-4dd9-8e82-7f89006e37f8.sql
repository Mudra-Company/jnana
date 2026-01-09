-- ============================================
-- KARMA BOT CONFIGURATION TABLES
-- ============================================

-- Table to store bot configurations with versioning
CREATE TABLE public.karma_bot_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_type TEXT NOT NULL CHECK (bot_type IN ('jnana', 'karma_talents')),
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT false,
  
  -- System prompt with template variables support
  system_prompt TEXT NOT NULL,
  
  -- Interview objectives (array of objective objects)
  objectives JSONB NOT NULL DEFAULT '[]',
  
  -- Which profile inputs the bot should read
  profile_inputs JSONB NOT NULL DEFAULT '{
    "riasec_score": true,
    "experiences": true,
    "education": true,
    "hard_skills": true,
    "bio": true,
    "headline": true,
    "portfolio": false,
    "certifications": false,
    "languages": false
  }',
  
  -- Model configuration
  model TEXT NOT NULL DEFAULT 'google/gemini-2.5-flash',
  max_exchanges INTEGER NOT NULL DEFAULT 8,
  temperature NUMERIC(2,1) DEFAULT 0.7,
  
  -- Closing patterns for auto-close detection
  closing_patterns JSONB NOT NULL DEFAULT '[]',
  
  -- Metadata
  version_notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(bot_type, version)
);

-- Table to store knowledge base documents
CREATE TABLE public.karma_bot_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_type TEXT NOT NULL CHECK (bot_type IN ('jnana', 'karma_talents')),
  
  -- Document info
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size_bytes INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  
  -- Extracted content (for inline context)
  extracted_text TEXT,
  extraction_status TEXT DEFAULT 'pending' CHECK (extraction_status IN ('pending', 'processing', 'completed', 'failed')),
  
  -- Whether this document is active (included in context)
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  uploaded_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.karma_bot_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.karma_bot_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for karma_bot_configs
CREATE POLICY "Super admins can manage bot configs"
ON public.karma_bot_configs
FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Edge functions can read active configs"
ON public.karma_bot_configs
FOR SELECT
USING (is_active = true);

-- RLS Policies for karma_bot_documents
CREATE POLICY "Super admins can manage bot documents"
ON public.karma_bot_documents
FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Edge functions can read active documents"
ON public.karma_bot_documents
FOR SELECT
USING (is_active = true);

-- Create storage bucket for knowledge base documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('karma-documents', 'karma-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Super admins can upload karma documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'karma-documents' 
  AND has_role(auth.uid(), 'super_admin'::app_role)
);

CREATE POLICY "Super admins can view karma documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'karma-documents' 
  AND has_role(auth.uid(), 'super_admin'::app_role)
);

CREATE POLICY "Super admins can delete karma documents"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'karma-documents' 
  AND has_role(auth.uid(), 'super_admin'::app_role)
);

-- ============================================
-- SEED INITIAL CONFIGURATIONS
-- ============================================

-- Insert initial Karma Talents (B2C) configuration
INSERT INTO public.karma_bot_configs (
  bot_type, 
  version, 
  is_active, 
  system_prompt,
  objectives,
  profile_inputs,
  closing_patterns,
  version_notes
) VALUES (
  'karma_talents',
  1,
  true,
  'Sei Karma, un esperto consulente di carriera e coach professionale con anni di esperienza nella valutazione dei talenti.

Il tuo obiettivo è condurre un colloquio naturale e coinvolgente per comprendere meglio il candidato.

**Profilo del candidato:**
- Nome: {{firstName}}
- Codice RIASEC: {{profileCode}}
- Headline: {{headline}}
- Bio: {{bio}}

**Esperienze lavorative:**
{{experiences}}

**Formazione:**
{{education}}

**Competenze tecniche:**
{{skills}}

**Istruzioni:**
1. Inizia con un saluto caloroso usando il nome del candidato
2. Fai domande aperte per esplorare motivazioni, valori e aspirazioni
3. Approfondisci le esperienze più rilevanti
4. Valuta soft skills come comunicazione, leadership, problem-solving
5. Identifica punti di forza e aree di sviluppo
6. Mantieni un tono professionale ma amichevole
7. Limita ogni risposta a 2-3 frasi
8. Dopo 6-8 scambi, concludi ringraziando e riassumendo i punti chiave

**Importante:** Non menzionare mai che sei un''intelligenza artificiale. Comportati come un consulente umano esperto.',
  '[
    {"id": "soft_skills", "label": "Valutare soft skills", "enabled": true},
    {"id": "values", "label": "Identificare valori professionali", "enabled": true},
    {"id": "seniority", "label": "Stimare livello di seniority", "enabled": true},
    {"id": "motivations", "label": "Esplorare motivazioni", "enabled": true},
    {"id": "risk_factors", "label": "Identificare risk factors", "enabled": false}
  ]',
  '{
    "riasec_score": true,
    "experiences": true,
    "education": true,
    "hard_skills": true,
    "bio": true,
    "headline": true,
    "portfolio": false,
    "certifications": false,
    "languages": false
  }',
  '[
    "grazie per questa conversazione",
    "è stato un piacere conoscerti",
    "ti auguro il meglio",
    "in bocca al lupo",
    "buona fortuna"
  ]',
  'Versione iniziale estratta dal codice frontend'
);

-- Insert initial Jnana (B2B) configuration
INSERT INTO public.karma_bot_configs (
  bot_type, 
  version, 
  is_active, 
  system_prompt,
  objectives,
  profile_inputs,
  closing_patterns,
  version_notes
) VALUES (
  'jnana',
  1,
  true,
  'Sei Karma, un consulente HR esperto specializzato in analisi del clima aziendale e fit culturale.

Stai conducendo un colloquio con un dipendente dell''azienda per comprendere il suo allineamento con la cultura organizzativa.

**Profilo del dipendente:**
- Nome: {{firstName}}
- Ruolo: {{jobTitle}}
- Codice RIASEC: {{profileCode}}

**Esperienze lavorative:**
{{experiences}}

**Contesto aziendale:**
{{companyContext}}

**Istruzioni:**
1. Inizia presentandoti e spiegando lo scopo del colloquio
2. Esplora la percezione del clima aziendale
3. Indaga sul senso di appartenenza e motivazione
4. Valuta l''allineamento con i valori aziendali
5. Identifica eventuali aree di tensione o miglioramento
6. Mantieni un tono formale ma empatico
7. Limita ogni risposta a 2-3 frasi
8. Concludi dopo 6-8 scambi riassumendo i punti emersi

**Importante:** Le informazioni raccolte saranno usate in forma aggregata per migliorare il clima aziendale.',
  '[
    {"id": "culture_fit", "label": "Valutare fit culturale", "enabled": true},
    {"id": "climate", "label": "Analizzare percezione clima", "enabled": true},
    {"id": "engagement", "label": "Misurare engagement", "enabled": true},
    {"id": "team_dynamics", "label": "Esplorare dinamiche di team", "enabled": true},
    {"id": "improvement_areas", "label": "Identificare aree di miglioramento", "enabled": false}
  ]',
  '{
    "riasec_score": true,
    "experiences": true,
    "education": false,
    "hard_skills": false,
    "bio": true,
    "headline": true,
    "portfolio": false,
    "certifications": false,
    "languages": false,
    "company_context": true
  }',
  '[
    "grazie per il tempo dedicato",
    "apprezzo la tua disponibilità",
    "è stato un colloquio utile"
  ]',
  'Versione iniziale per colloqui B2B aziendali'
);