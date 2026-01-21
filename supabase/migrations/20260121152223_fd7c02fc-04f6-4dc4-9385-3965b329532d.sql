-- =============================================
-- QUESTIONNAIRE MANAGER - DYNAMIC SURVEY ENGINE
-- =============================================

-- 1. Questionnaires (meta-data)
CREATE TABLE public.questionnaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  ui_style TEXT NOT NULL DEFAULT 'step' CHECK (ui_style IN ('step', 'chat', 'swipe')),
  version INTEGER NOT NULL DEFAULT 1,
  is_published BOOLEAN NOT NULL DEFAULT false,
  is_system BOOLEAN NOT NULL DEFAULT false,
  config JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Questionnaire Sections
CREATE TABLE public.questionnaire_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  questionnaire_id UUID NOT NULL REFERENCES public.questionnaires(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  section_type TEXT NOT NULL DEFAULT 'forced_choice' CHECK (section_type IN ('forced_choice', 'checklist', 'likert', 'open_text')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Questions
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES public.questionnaire_sections(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'single_choice' CHECK (question_type IN ('single_choice', 'multiple_choice', 'likert', 'open_text', 'binary')),
  is_required BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  icon TEXT,
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Question Options
CREATE TABLE public.question_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  icon TEXT,
  image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Scoring Dimensions
CREATE TABLE public.scoring_dimensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  questionnaire_id UUID NOT NULL REFERENCES public.questionnaires(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  color TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(questionnaire_id, code)
);

-- 6. Scoring Dimension Weights (option -> dimension mapping)
CREATE TABLE public.scoring_dimension_weights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  option_id UUID NOT NULL REFERENCES public.question_options(id) ON DELETE CASCADE,
  dimension_id UUID NOT NULL REFERENCES public.scoring_dimensions(id) ON DELETE CASCADE,
  weight NUMERIC NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(option_id, dimension_id)
);

-- 7. User Questionnaire Responses (sessions)
CREATE TABLE public.user_questionnaire_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  questionnaire_id UUID NOT NULL REFERENCES public.questionnaires(id) ON DELETE RESTRICT,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  version_completed INTEGER NOT NULL,
  computed_scores JSONB DEFAULT '{}'::jsonb,
  raw_answers JSONB DEFAULT '[]'::jsonb,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- 8. Response Answers (individual answers)
CREATE TABLE public.response_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID NOT NULL REFERENCES public.user_questionnaire_responses(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE RESTRICT,
  selected_option_id UUID REFERENCES public.question_options(id) ON DELETE RESTRICT,
  text_answer TEXT,
  likert_value INTEGER CHECK (likert_value IS NULL OR (likert_value >= 1 AND likert_value <= 5)),
  answered_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_questionnaire_sections_questionnaire ON public.questionnaire_sections(questionnaire_id);
CREATE INDEX idx_questions_section ON public.questions(section_id);
CREATE INDEX idx_question_options_question ON public.question_options(question_id);
CREATE INDEX idx_scoring_dimensions_questionnaire ON public.scoring_dimensions(questionnaire_id);
CREATE INDEX idx_scoring_weights_option ON public.scoring_dimension_weights(option_id);
CREATE INDEX idx_scoring_weights_dimension ON public.scoring_dimension_weights(dimension_id);
CREATE INDEX idx_user_responses_user ON public.user_questionnaire_responses(user_id);
CREATE INDEX idx_user_responses_questionnaire ON public.user_questionnaire_responses(questionnaire_id);
CREATE INDEX idx_response_answers_response ON public.response_answers(response_id);

-- =============================================
-- ENABLE RLS
-- =============================================
ALTER TABLE public.questionnaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questionnaire_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scoring_dimensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scoring_dimension_weights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_questionnaire_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.response_answers ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES
-- =============================================

-- QUESTIONNAIRES
CREATE POLICY "Super admins can manage questionnaires"
ON public.questionnaires FOR ALL
USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Anyone can view published questionnaires"
ON public.questionnaires FOR SELECT
USING (is_published = true);

-- QUESTIONNAIRE_SECTIONS
CREATE POLICY "Super admins can manage sections"
ON public.questionnaire_sections FOR ALL
USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Anyone can view sections of published questionnaires"
ON public.questionnaire_sections FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.questionnaires q
  WHERE q.id = questionnaire_id AND q.is_published = true
));

-- QUESTIONS
CREATE POLICY "Super admins can manage questions"
ON public.questions FOR ALL
USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Anyone can view questions of published questionnaires"
ON public.questions FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.questionnaire_sections s
  JOIN public.questionnaires q ON q.id = s.questionnaire_id
  WHERE s.id = section_id AND q.is_published = true
));

-- QUESTION_OPTIONS
CREATE POLICY "Super admins can manage options"
ON public.question_options FOR ALL
USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Anyone can view options of published questionnaires"
ON public.question_options FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.questions qu
  JOIN public.questionnaire_sections s ON s.id = qu.section_id
  JOIN public.questionnaires q ON q.id = s.questionnaire_id
  WHERE qu.id = question_id AND q.is_published = true
));

-- SCORING_DIMENSIONS
CREATE POLICY "Super admins can manage scoring dimensions"
ON public.scoring_dimensions FOR ALL
USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Anyone can view dimensions of published questionnaires"
ON public.scoring_dimensions FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.questionnaires q
  WHERE q.id = questionnaire_id AND q.is_published = true
));

-- SCORING_DIMENSION_WEIGHTS
CREATE POLICY "Super admins can manage scoring weights"
ON public.scoring_dimension_weights FOR ALL
USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Anyone can view weights of published questionnaires"
ON public.scoring_dimension_weights FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.question_options o
  JOIN public.questions qu ON qu.id = o.question_id
  JOIN public.questionnaire_sections s ON s.id = qu.section_id
  JOIN public.questionnaires q ON q.id = s.questionnaire_id
  WHERE o.id = option_id AND q.is_published = true
));

-- USER_QUESTIONNAIRE_RESPONSES
CREATE POLICY "Users can manage own responses"
ON public.user_questionnaire_responses FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Super admins can view all responses"
ON public.user_questionnaire_responses FOR SELECT
USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Company admins can view company responses"
ON public.user_questionnaire_responses FOR SELECT
USING (company_id IS NOT NULL AND is_company_admin(auth.uid(), company_id));

-- RESPONSE_ANSWERS
CREATE POLICY "Users can manage own answers"
ON public.response_answers FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.user_questionnaire_responses r
  WHERE r.id = response_id AND r.user_id = auth.uid()
));

CREATE POLICY "Super admins can view all answers"
ON public.response_answers FOR SELECT
USING (has_role(auth.uid(), 'super_admin'));

-- =============================================
-- TRIGGERS
-- =============================================
CREATE TRIGGER update_questionnaires_updated_at
BEFORE UPDATE ON public.questionnaires
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_questionnaire_sections_updated_at
BEFORE UPDATE ON public.questionnaire_sections
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_questions_updated_at
BEFORE UPDATE ON public.questions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();