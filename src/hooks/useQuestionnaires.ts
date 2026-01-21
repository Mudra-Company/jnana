import { useState, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';
import type {
  Questionnaire,
  QuestionnaireSection,
  Question,
  QuestionOption,
  ScoringDimension,
  ScoringWeight,
  QuestionnaireFormData,
  SectionFormData,
  QuestionFormData,
  OptionFormData,
  DimensionFormData,
  QuestionnaireListItem,
  QuestionnaireFilter,
  QuestionnaireUIStyle,
  QuestionnaireConfig,
  SectionConfig,
  QuestionConfig,
} from '../types/questionnaire';

// =============================================
// QUESTIONNAIRE CRUD HOOK
// =============================================

export const useQuestionnaires = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // =============================================
  // FETCH QUESTIONNAIRES LIST
  // =============================================
  const fetchQuestionnaires = useCallback(async (filter: QuestionnaireFilter = 'all'): Promise<QuestionnaireListItem[]> => {
    setLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from('questionnaires')
        .select(`
          id, slug, title, description, ui_style, version, 
          is_published, is_system, created_at, updated_at,
          questionnaire_sections (
            id,
            questions (id)
          )
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filter === 'published') {
        query = query.eq('is_published', true);
      } else if (filter === 'draft') {
        query = query.eq('is_published', false);
      } else if (filter === 'system') {
        query = query.eq('is_system', true);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Transform to list items with counts
      const items: QuestionnaireListItem[] = (data || []).map((q: any) => {
        const sections = q.questionnaire_sections || [];
        const questionCount = sections.reduce((acc: number, s: any) => acc + (s.questions?.length || 0), 0);
        
        return {
          id: q.id,
          slug: q.slug,
          title: q.title,
          description: q.description,
          uiStyle: q.ui_style,
          version: q.version,
          isPublished: q.is_published,
          isSystem: q.is_system,
          sectionCount: sections.length,
          questionCount,
          responseCount: 0, // Will be fetched separately if needed
          createdAt: q.created_at,
          updatedAt: q.updated_at,
        };
      });

      return items;
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // =============================================
  // FETCH SINGLE QUESTIONNAIRE (FULL)
  // =============================================
  const fetchQuestionnaire = useCallback(async (id: string): Promise<Questionnaire | null> => {
    setLoading(true);
    setError(null);

    try {
      // Fetch questionnaire with sections, questions, options
      const { data: qData, error: qError } = await supabase
        .from('questionnaires')
        .select(`
          *,
          questionnaire_sections (
            *,
            questions (
              *,
              question_options (
                *,
                scoring_dimension_weights (*)
              )
            )
          ),
          scoring_dimensions (*)
        `)
        .eq('id', id)
        .single();

      if (qError) throw qError;
      if (!qData) return null;

      // Transform to typed structure
      const questionnaire: Questionnaire = {
        id: qData.id,
        slug: qData.slug,
        title: qData.title,
        description: qData.description,
        uiStyle: qData.ui_style as QuestionnaireUIStyle,
        version: qData.version,
        isPublished: qData.is_published,
        isSystem: qData.is_system,
        config: qData.config as QuestionnaireConfig | undefined,
        createdBy: qData.created_by,
        createdAt: qData.created_at,
        updatedAt: qData.updated_at,
        dimensions: (qData.scoring_dimensions || []).map((d: any): ScoringDimension => ({
          id: d.id,
          questionnaireId: d.questionnaire_id,
          code: d.code,
          label: d.label,
          description: d.description,
          color: d.color,
          sortOrder: d.sort_order,
        })),
        sections: (qData.questionnaire_sections || [])
          .sort((a: any, b: any) => a.sort_order - b.sort_order)
          .map((s: any): QuestionnaireSection => ({
            id: s.id,
            questionnaireId: s.questionnaire_id,
            title: s.title,
            description: s.description,
            type: s.section_type,
            sortOrder: s.sort_order,
            config: s.config as any,
            questions: (s.questions || [])
              .sort((a: any, b: any) => a.sort_order - b.sort_order)
              .map((q: any): Question => ({
                id: q.id,
                sectionId: q.section_id,
                text: q.question_text,
                type: q.question_type,
                isRequired: q.is_required,
                sortOrder: q.sort_order,
                imageUrl: q.image_url,
                icon: q.icon,
                config: q.config as any,
                options: (q.question_options || [])
                  .sort((a: any, b: any) => a.sort_order - b.sort_order)
                  .map((o: any): QuestionOption => ({
                    id: o.id,
                    questionId: o.question_id,
                    text: o.option_text,
                    icon: o.icon,
                    imageUrl: o.image_url,
                    sortOrder: o.sort_order,
                    metadata: o.metadata,
                    weights: (o.scoring_dimension_weights || []).map((w: any): ScoringWeight => ({
                      id: w.id,
                      optionId: w.option_id,
                      dimensionId: w.dimension_id,
                      weight: Number(w.weight),
                    })),
                  })),
              })),
          })),
      };

      return questionnaire;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // =============================================
  // CREATE QUESTIONNAIRE
  // =============================================
  const createQuestionnaire = useCallback(async (data: QuestionnaireFormData): Promise<string | null> => {
    setLoading(true);
    setError(null);

    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data: created, error: createError } = await supabase
        .from('questionnaires')
        .insert({
          slug: data.slug,
          title: data.title,
          description: data.description,
          ui_style: data.uiStyle,
          config: (data.config || {}) as any,
          created_by: userData.user?.id,
        } as any)
        .select('id')
        .single();

      if (createError) throw createError;
      return created?.id || null;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // =============================================
  // UPDATE QUESTIONNAIRE
  // =============================================
  const updateQuestionnaire = useCallback(async (id: string, data: Partial<QuestionnaireFormData>): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const updateData: any = {};
      if (data.slug !== undefined) updateData.slug = data.slug;
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.uiStyle !== undefined) updateData.ui_style = data.uiStyle;
      if (data.config !== undefined) updateData.config = data.config;

      const { error: updateError } = await supabase
        .from('questionnaires')
        .update(updateData)
        .eq('id', id);

      if (updateError) throw updateError;
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // =============================================
  // DELETE QUESTIONNAIRE
  // =============================================
  const deleteQuestionnaire = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('questionnaires')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // =============================================
  // PUBLISH / UNPUBLISH
  // =============================================
  const publishQuestionnaire = useCallback(async (id: string, publish: boolean): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const updateData: any = { is_published: publish };
      
      // Increment version on publish
      if (publish) {
        const { data: current } = await supabase
          .from('questionnaires')
          .select('version')
          .eq('id', id)
          .single();
        
        if (current) {
          updateData.version = current.version + 1;
        }
      }

      const { error: updateError } = await supabase
        .from('questionnaires')
        .update(updateData)
        .eq('id', id);

      if (updateError) throw updateError;
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // =============================================
  // DUPLICATE QUESTIONNAIRE
  // =============================================
  const duplicateQuestionnaire = useCallback(async (id: string): Promise<string | null> => {
    setLoading(true);
    setError(null);

    try {
      // Fetch the full questionnaire
      const original = await fetchQuestionnaire(id);
      if (!original) throw new Error('Questionnaire not found');

      // Create new questionnaire with modified slug
      const newSlug = `${original.slug}-copy-${Date.now()}`;
      const newId = await createQuestionnaire({
        slug: newSlug,
        title: `${original.title} (Copia)`,
        description: original.description,
        uiStyle: original.uiStyle,
        config: original.config,
      });

      if (!newId) throw new Error('Failed to create duplicate');

      // Duplicate dimensions
      const dimensionIdMap: Record<string, string> = {};
      for (const dim of original.dimensions || []) {
        const { data: newDim } = await supabase
          .from('scoring_dimensions')
          .insert({
            questionnaire_id: newId,
            code: dim.code,
            label: dim.label,
            description: dim.description,
            color: dim.color,
            sort_order: dim.sortOrder,
          })
          .select('id')
          .single();
        
        if (newDim) {
          dimensionIdMap[dim.id] = newDim.id;
        }
      }

      // Duplicate sections, questions, options
      for (const section of original.sections || []) {
        const { data: newSection } = await supabase
          .from('questionnaire_sections')
          .insert({
            questionnaire_id: newId,
            title: section.title,
            description: section.description,
            section_type: section.type,
            sort_order: section.sortOrder,
            config: section.config || {},
          })
          .select('id')
          .single();

        if (!newSection) continue;

        for (const question of section.questions || []) {
          const { data: newQuestion } = await supabase
            .from('questions')
            .insert({
              section_id: newSection.id,
              question_text: question.text,
              question_type: question.type,
              is_required: question.isRequired,
              sort_order: question.sortOrder,
              image_url: question.imageUrl,
              icon: question.icon,
              config: question.config || {},
            })
            .select('id')
            .single();

          if (!newQuestion) continue;

          for (const option of question.options || []) {
            const { data: newOption } = await supabase
              .from('question_options')
              .insert({
                question_id: newQuestion.id,
                option_text: option.text,
                icon: option.icon,
                image_url: option.imageUrl,
                sort_order: option.sortOrder,
                metadata: option.metadata || {},
              })
              .select('id')
              .single();

            if (!newOption) continue;

            // Duplicate weights
            for (const weight of option.weights || []) {
              const newDimensionId = dimensionIdMap[weight.dimensionId];
              if (newDimensionId) {
                await supabase
                  .from('scoring_dimension_weights')
                  .insert({
                    option_id: newOption.id,
                    dimension_id: newDimensionId,
                    weight: weight.weight,
                  });
              }
            }
          }
        }
      }

      return newId;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchQuestionnaire, createQuestionnaire]);

  // =============================================
  // SECTION CRUD
  // =============================================
  const addSection = useCallback(async (questionnaireId: string, data: SectionFormData): Promise<string | null> => {
    try {
      // Get max sort order
      const { data: existing } = await supabase
        .from('questionnaire_sections')
        .select('sort_order')
        .eq('questionnaire_id', questionnaireId)
        .order('sort_order', { ascending: false })
        .limit(1);

      const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1;

      const { data: created, error } = await supabase
        .from('questionnaire_sections')
        .insert({
          questionnaire_id: questionnaireId,
          title: data.title,
          description: data.description,
          section_type: data.type,
          config: (data.config || {}) as any,
          sort_order: nextOrder,
        } as any)
        .select('id')
        .single();

      if (error) throw error;
      return created?.id || null;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  }, []);

  const updateSection = useCallback(async (sectionId: string, data: Partial<SectionFormData>): Promise<boolean> => {
    try {
      const updateData: any = {};
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.type !== undefined) updateData.section_type = data.type;
      if (data.config !== undefined) updateData.config = data.config;

      const { error } = await supabase
        .from('questionnaire_sections')
        .update(updateData)
        .eq('id', sectionId);

      if (error) throw error;
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, []);

  const deleteSection = useCallback(async (sectionId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('questionnaire_sections')
        .delete()
        .eq('id', sectionId);

      if (error) throw error;
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, []);

  // =============================================
  // QUESTION CRUD
  // =============================================
  const addQuestion = useCallback(async (sectionId: string, data: QuestionFormData): Promise<string | null> => {
    try {
      const { data: existing } = await supabase
        .from('questions')
        .select('sort_order')
        .eq('section_id', sectionId)
        .order('sort_order', { ascending: false })
        .limit(1);

      const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1;

      const { data: created, error } = await supabase
        .from('questions')
        .insert({
          section_id: sectionId,
          question_text: data.text,
          question_type: data.type,
          is_required: data.isRequired,
          image_url: data.imageUrl,
          icon: data.icon,
          config: (data.config || {}) as any,
          sort_order: nextOrder,
        } as any)
        .select('id')
        .single();

      if (error) throw error;
      return created?.id || null;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  }, []);

  const updateQuestion = useCallback(async (questionId: string, data: Partial<QuestionFormData>): Promise<boolean> => {
    try {
      const updateData: any = {};
      if (data.text !== undefined) updateData.question_text = data.text;
      if (data.type !== undefined) updateData.question_type = data.type;
      if (data.isRequired !== undefined) updateData.is_required = data.isRequired;
      if (data.imageUrl !== undefined) updateData.image_url = data.imageUrl;
      if (data.icon !== undefined) updateData.icon = data.icon;
      if (data.config !== undefined) updateData.config = data.config;

      const { error } = await supabase
        .from('questions')
        .update(updateData)
        .eq('id', questionId);

      if (error) throw error;
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, []);

  const deleteQuestion = useCallback(async (questionId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', questionId);

      if (error) throw error;
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, []);

  // =============================================
  // OPTION CRUD
  // =============================================
  const addOption = useCallback(async (questionId: string, data: OptionFormData): Promise<string | null> => {
    try {
      const { data: existing } = await supabase
        .from('question_options')
        .select('sort_order')
        .eq('question_id', questionId)
        .order('sort_order', { ascending: false })
        .limit(1);

      const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1;

      const { data: created, error } = await supabase
        .from('question_options')
        .insert({
          question_id: questionId,
          option_text: data.text,
          icon: data.icon,
          image_url: data.imageUrl,
          sort_order: nextOrder,
        })
        .select('id')
        .single();

      if (error) throw error;
      return created?.id || null;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  }, []);

  const updateOption = useCallback(async (optionId: string, data: Partial<OptionFormData>): Promise<boolean> => {
    try {
      const updateData: any = {};
      if (data.text !== undefined) updateData.option_text = data.text;
      if (data.icon !== undefined) updateData.icon = data.icon;
      if (data.imageUrl !== undefined) updateData.image_url = data.imageUrl;

      const { error } = await supabase
        .from('question_options')
        .update(updateData)
        .eq('id', optionId);

      if (error) throw error;
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, []);

  const deleteOption = useCallback(async (optionId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('question_options')
        .delete()
        .eq('id', optionId);

      if (error) throw error;
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, []);

  // =============================================
  // DIMENSION CRUD
  // =============================================
  const addDimension = useCallback(async (questionnaireId: string, data: DimensionFormData): Promise<string | null> => {
    try {
      const { data: existing } = await supabase
        .from('scoring_dimensions')
        .select('sort_order')
        .eq('questionnaire_id', questionnaireId)
        .order('sort_order', { ascending: false })
        .limit(1);

      const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1;

      const { data: created, error } = await supabase
        .from('scoring_dimensions')
        .insert({
          questionnaire_id: questionnaireId,
          code: data.code,
          label: data.label,
          description: data.description,
          color: data.color,
          sort_order: nextOrder,
        })
        .select('id')
        .single();

      if (error) throw error;
      return created?.id || null;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  }, []);

  const updateDimension = useCallback(async (dimensionId: string, data: Partial<DimensionFormData>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('scoring_dimensions')
        .update(data)
        .eq('id', dimensionId);

      if (error) throw error;
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, []);

  const deleteDimension = useCallback(async (dimensionId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('scoring_dimensions')
        .delete()
        .eq('id', dimensionId);

      if (error) throw error;
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, []);

  // =============================================
  // SCORING WEIGHTS
  // =============================================
  const setOptionWeight = useCallback(async (optionId: string, dimensionId: string, weight: number): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('scoring_dimension_weights')
        .upsert({
          option_id: optionId,
          dimension_id: dimensionId,
          weight,
        }, {
          onConflict: 'option_id,dimension_id',
        });

      if (error) throw error;
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, []);

  const removeOptionWeight = useCallback(async (optionId: string, dimensionId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('scoring_dimension_weights')
        .delete()
        .eq('option_id', optionId)
        .eq('dimension_id', dimensionId);

      if (error) throw error;
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, []);

  return {
    loading,
    error,
    // Questionnaire
    fetchQuestionnaires,
    fetchQuestionnaire,
    createQuestionnaire,
    updateQuestionnaire,
    deleteQuestionnaire,
    publishQuestionnaire,
    duplicateQuestionnaire,
    // Sections
    addSection,
    updateSection,
    deleteSection,
    // Questions
    addQuestion,
    updateQuestion,
    deleteQuestion,
    // Options
    addOption,
    updateOption,
    deleteOption,
    // Dimensions
    addDimension,
    updateDimension,
    deleteDimension,
    // Weights
    setOptionWeight,
    removeOptionWeight,
  };
};
