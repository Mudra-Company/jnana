import * as XLSX from 'xlsx';
import type {
  Questionnaire,
  QuestionnaireSection,
  Question,
  QuestionOption,
  ScoringDimension,
  SectionType,
  QuestionType,
} from '../types/questionnaire';

// =============================================
// TYPES
// =============================================

interface SectionRow {
  SECTION_ID: string;
  SECTION_TITLE: string;
  SECTION_TYPE: string;
  SECTION_DESCRIPTION?: string;
  SORT_ORDER: number;
}

interface QuestionRow {
  SECTION_ID: string;
  QUESTION_ID: string;
  QUESTION_TEXT: string;
  QUESTION_TYPE: string;
  IS_REQUIRED: string;
  ICON?: string;
  SORT_ORDER: number;
}

interface OptionRow {
  QUESTION_ID: string;
  OPTION_ID: string;
  OPTION_TEXT: string;
  ICON?: string;
  SORT_ORDER: number;
}

interface WeightRow {
  OPTION_ID: string;
  DIMENSION_CODE: string;
  WEIGHT: number;
}

export interface ImportResult {
  success: boolean;
  sectionsCreated: number;
  questionsCreated: number;
  optionsCreated: number;
  weightsCreated: number;
  errors: string[];
}

export interface ImportHooks {
  addSection: (questionnaireId: string, data: { title: string; type: SectionType; description?: string }) => Promise<string | null>;
  addQuestion: (sectionId: string, data: { text: string; type: QuestionType; isRequired: boolean; icon?: string }) => Promise<string | null>;
  addOption: (questionId: string, data: { text: string; icon?: string }) => Promise<string | null>;
  setOptionWeight: (optionId: string, dimensionId: string, weight: number) => Promise<void>;
}

// =============================================
// VALID TYPES
// =============================================

const VALID_SECTION_TYPES: SectionType[] = ['forced_choice', 'checklist', 'likert', 'open_text'];
const VALID_QUESTION_TYPES: QuestionType[] = ['single_choice', 'multiple_choice', 'likert', 'open_text', 'binary'];

// =============================================
// EXPORT FUNCTIONS
// =============================================

/**
 * Export questionnaire as Excel template
 * @param questionnaire - The questionnaire to export
 * @param includeData - If true, includes existing data; otherwise just headers and examples
 */
export function exportQuestionnaireTemplate(
  questionnaire: Questionnaire,
  includeData: boolean = false
): void {
  const workbook = XLSX.utils.book_new();

  // Sheet 1: Sezioni
  const sectionsData: SectionRow[] = includeData && questionnaire.sections
    ? questionnaire.sections.map((s, idx) => ({
        SECTION_ID: `S${idx + 1}`,
        SECTION_TITLE: s.title,
        SECTION_TYPE: s.type,
        SECTION_DESCRIPTION: s.description || '',
        SORT_ORDER: s.sortOrder,
      }))
    : [{
        SECTION_ID: 'S1',
        SECTION_TITLE: 'Esempio Sezione',
        SECTION_TYPE: 'forced_choice',
        SECTION_DESCRIPTION: 'Descrizione opzionale',
        SORT_ORDER: 1,
      }];

  const sectionsSheet = XLSX.utils.json_to_sheet(sectionsData);
  XLSX.utils.book_append_sheet(workbook, sectionsSheet, 'Sezioni');

  // Sheet 2: Domande
  let questionsData: QuestionRow[] = [];
  
  if (includeData && questionnaire.sections) {
    let qIdx = 1;
    questionnaire.sections.forEach((section, sIdx) => {
      (section.questions || []).forEach((q) => {
        questionsData.push({
          SECTION_ID: `S${sIdx + 1}`,
          QUESTION_ID: `Q${qIdx}`,
          QUESTION_TEXT: q.text,
          QUESTION_TYPE: q.type,
          IS_REQUIRED: q.isRequired ? 'TRUE' : 'FALSE',
          ICON: q.icon || '',
          SORT_ORDER: q.sortOrder,
        });
        qIdx++;
      });
    });
  }
  
  if (questionsData.length === 0) {
    questionsData = [{
      SECTION_ID: 'S1',
      QUESTION_ID: 'Q1',
      QUESTION_TEXT: 'Esempio domanda',
      QUESTION_TYPE: 'single_choice',
      IS_REQUIRED: 'TRUE',
      ICON: '',
      SORT_ORDER: 1,
    }];
  }

  const questionsSheet = XLSX.utils.json_to_sheet(questionsData);
  XLSX.utils.book_append_sheet(workbook, questionsSheet, 'Domande');

  // Sheet 3: Opzioni
  let optionsData: OptionRow[] = [];
  
  if (includeData && questionnaire.sections) {
    let qIdx = 1;
    questionnaire.sections.forEach((section) => {
      (section.questions || []).forEach((q) => {
        (q.options || []).forEach((o, oIdx) => {
          optionsData.push({
            QUESTION_ID: `Q${qIdx}`,
            OPTION_ID: `Q${qIdx}_O${oIdx + 1}`,
            OPTION_TEXT: o.text,
            ICON: o.icon || '',
            SORT_ORDER: o.sortOrder,
          });
        });
        qIdx++;
      });
    });
  }
  
  if (optionsData.length === 0) {
    optionsData = [
      { QUESTION_ID: 'Q1', OPTION_ID: 'Q1_O1', OPTION_TEXT: 'Opzione A', ICON: '', SORT_ORDER: 1 },
      { QUESTION_ID: 'Q1', OPTION_ID: 'Q1_O2', OPTION_TEXT: 'Opzione B', ICON: '', SORT_ORDER: 2 },
    ];
  }

  const optionsSheet = XLSX.utils.json_to_sheet(optionsData);
  XLSX.utils.book_append_sheet(workbook, optionsSheet, 'Opzioni');

  // Sheet 4: Pesi
  let weightsData: WeightRow[] = [];
  
  if (includeData && questionnaire.sections && questionnaire.dimensions) {
    const dimensionMap = new Map(questionnaire.dimensions.map(d => [d.id, d.code]));
    let qIdx = 1;
    
    questionnaire.sections.forEach((section) => {
      (section.questions || []).forEach((q) => {
        (q.options || []).forEach((o, oIdx) => {
          (o.weights || []).forEach((w) => {
            const dimCode = dimensionMap.get(w.dimensionId);
            if (dimCode && w.weight !== 0) {
              weightsData.push({
                OPTION_ID: `Q${qIdx}_O${oIdx + 1}`,
                DIMENSION_CODE: dimCode,
                WEIGHT: w.weight,
              });
            }
          });
        });
        qIdx++;
      });
    });
  }
  
  if (weightsData.length === 0) {
    // Include example with available dimensions
    const dimCodes = questionnaire.dimensions?.map(d => d.code) || ['DIM1', 'DIM2'];
    weightsData = [
      { OPTION_ID: 'Q1_O1', DIMENSION_CODE: dimCodes[0] || 'R', WEIGHT: 2 },
      { OPTION_ID: 'Q1_O2', DIMENSION_CODE: dimCodes[1] || 'I', WEIGHT: 1 },
    ];
  }

  const weightsSheet = XLSX.utils.json_to_sheet(weightsData);
  XLSX.utils.book_append_sheet(workbook, weightsSheet, 'Pesi');

  // Download file
  const fileName = includeData 
    ? `${questionnaire.slug}_export.xlsx`
    : `${questionnaire.slug}_template.xlsx`;
  
  XLSX.writeFile(workbook, fileName);
}

// =============================================
// IMPORT FUNCTIONS
// =============================================

/**
 * Import questionnaire data from Excel file
 */
export async function importQuestionnaireData(
  file: File,
  questionnaireId: string,
  dimensions: ScoringDimension[],
  hooks: ImportHooks
): Promise<ImportResult> {
  const result: ImportResult = {
    success: false,
    sectionsCreated: 0,
    questionsCreated: 0,
    optionsCreated: 0,
    weightsCreated: 0,
    errors: [],
  };

  try {
    // Read file
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    // Parse sheets
    const sectionsSheet = workbook.Sheets['Sezioni'];
    const questionsSheet = workbook.Sheets['Domande'];
    const optionsSheet = workbook.Sheets['Opzioni'];
    const weightsSheet = workbook.Sheets['Pesi'];

    if (!sectionsSheet || !questionsSheet || !optionsSheet) {
      result.errors.push('File mancante dei fogli richiesti: Sezioni, Domande, Opzioni');
      return result;
    }

    const sections: SectionRow[] = XLSX.utils.sheet_to_json(sectionsSheet);
    const questions: QuestionRow[] = XLSX.utils.sheet_to_json(questionsSheet);
    const options: OptionRow[] = XLSX.utils.sheet_to_json(optionsSheet);
    const weights: WeightRow[] = weightsSheet ? XLSX.utils.sheet_to_json(weightsSheet) : [];

    // Validate data
    const validationErrors = validateImportData(sections, questions, options, weights, dimensions);
    if (validationErrors.length > 0) {
      result.errors = validationErrors;
      return result;
    }

    // Create dimension code to ID map
    const dimensionCodeToId = new Map(dimensions.map(d => [d.code, d.id]));

    // Maps for ID tracking
    const sectionIdMap = new Map<string, string>(); // Excel ID -> DB ID
    const questionIdMap = new Map<string, string>(); // Excel ID -> DB ID
    const optionIdMap = new Map<string, string>(); // Excel ID -> DB ID

    // Create sections
    for (const sectionRow of sections) {
      const sectionId = await hooks.addSection(questionnaireId, {
        title: sectionRow.SECTION_TITLE,
        type: sectionRow.SECTION_TYPE as SectionType,
        description: sectionRow.SECTION_DESCRIPTION,
      });

      if (sectionId) {
        sectionIdMap.set(sectionRow.SECTION_ID, sectionId);
        result.sectionsCreated++;
      } else {
        result.errors.push(`Errore creazione sezione: ${sectionRow.SECTION_ID}`);
      }
    }

    // Create questions
    for (const questionRow of questions) {
      const dbSectionId = sectionIdMap.get(questionRow.SECTION_ID);
      if (!dbSectionId) {
        result.errors.push(`Sezione non trovata per domanda: ${questionRow.QUESTION_ID}`);
        continue;
      }

      const questionId = await hooks.addQuestion(dbSectionId, {
        text: questionRow.QUESTION_TEXT,
        type: questionRow.QUESTION_TYPE as QuestionType,
        isRequired: questionRow.IS_REQUIRED?.toUpperCase() === 'TRUE',
        icon: questionRow.ICON || undefined,
      });

      if (questionId) {
        questionIdMap.set(questionRow.QUESTION_ID, questionId);
        result.questionsCreated++;
      } else {
        result.errors.push(`Errore creazione domanda: ${questionRow.QUESTION_ID}`);
      }
    }

    // Create options
    for (const optionRow of options) {
      const dbQuestionId = questionIdMap.get(optionRow.QUESTION_ID);
      if (!dbQuestionId) {
        result.errors.push(`Domanda non trovata per opzione: ${optionRow.OPTION_ID}`);
        continue;
      }

      const optionId = await hooks.addOption(dbQuestionId, {
        text: optionRow.OPTION_TEXT,
        icon: optionRow.ICON || undefined,
      });

      if (optionId) {
        optionIdMap.set(optionRow.OPTION_ID, optionId);
        result.optionsCreated++;
      } else {
        result.errors.push(`Errore creazione opzione: ${optionRow.OPTION_ID}`);
      }
    }

    // Create weights
    for (const weightRow of weights) {
      const dbOptionId = optionIdMap.get(weightRow.OPTION_ID);
      const dimensionId = dimensionCodeToId.get(weightRow.DIMENSION_CODE);

      if (!dbOptionId) {
        result.errors.push(`Opzione non trovata per peso: ${weightRow.OPTION_ID}`);
        continue;
      }

      if (!dimensionId) {
        result.errors.push(`Dimensione non trovata: ${weightRow.DIMENSION_CODE}`);
        continue;
      }

      await hooks.setOptionWeight(dbOptionId, dimensionId, weightRow.WEIGHT);
      result.weightsCreated++;
    }

    result.success = result.errors.length === 0;
    return result;

  } catch (err: any) {
    result.errors.push(`Errore lettura file: ${err.message}`);
    return result;
  }
}

// =============================================
// VALIDATION
// =============================================

function validateImportData(
  sections: SectionRow[],
  questions: QuestionRow[],
  options: OptionRow[],
  weights: WeightRow[],
  dimensions: ScoringDimension[]
): string[] {
  const errors: string[] = [];
  const sectionIds = new Set(sections.map(s => s.SECTION_ID));
  const questionIds = new Set(questions.map(q => q.QUESTION_ID));
  const optionIds = new Set(options.map(o => o.OPTION_ID));
  const dimensionCodes = new Set(dimensions.map(d => d.code));

  // Validate sections
  sections.forEach((s, idx) => {
    if (!s.SECTION_ID) {
      errors.push(`Riga ${idx + 2} Sezioni: SECTION_ID mancante`);
    }
    if (!s.SECTION_TITLE) {
      errors.push(`Riga ${idx + 2} Sezioni: SECTION_TITLE mancante`);
    }
    if (s.SECTION_TYPE && !VALID_SECTION_TYPES.includes(s.SECTION_TYPE as SectionType)) {
      errors.push(`Riga ${idx + 2} Sezioni: SECTION_TYPE non valido "${s.SECTION_TYPE}". Validi: ${VALID_SECTION_TYPES.join(', ')}`);
    }
  });

  // Validate questions
  questions.forEach((q, idx) => {
    if (!q.QUESTION_ID) {
      errors.push(`Riga ${idx + 2} Domande: QUESTION_ID mancante`);
    }
    if (!q.SECTION_ID || !sectionIds.has(q.SECTION_ID)) {
      errors.push(`Riga ${idx + 2} Domande: SECTION_ID "${q.SECTION_ID}" non esiste in Sezioni`);
    }
    if (!q.QUESTION_TEXT) {
      errors.push(`Riga ${idx + 2} Domande: QUESTION_TEXT mancante`);
    }
    if (q.QUESTION_TYPE && !VALID_QUESTION_TYPES.includes(q.QUESTION_TYPE as QuestionType)) {
      errors.push(`Riga ${idx + 2} Domande: QUESTION_TYPE non valido "${q.QUESTION_TYPE}". Validi: ${VALID_QUESTION_TYPES.join(', ')}`);
    }
  });

  // Validate options
  options.forEach((o, idx) => {
    if (!o.OPTION_ID) {
      errors.push(`Riga ${idx + 2} Opzioni: OPTION_ID mancante`);
    }
    if (!o.QUESTION_ID || !questionIds.has(o.QUESTION_ID)) {
      errors.push(`Riga ${idx + 2} Opzioni: QUESTION_ID "${o.QUESTION_ID}" non esiste in Domande`);
    }
    if (!o.OPTION_TEXT) {
      errors.push(`Riga ${idx + 2} Opzioni: OPTION_TEXT mancante`);
    }
  });

  // Validate weights
  weights.forEach((w, idx) => {
    if (!w.OPTION_ID || !optionIds.has(w.OPTION_ID)) {
      errors.push(`Riga ${idx + 2} Pesi: OPTION_ID "${w.OPTION_ID}" non esiste in Opzioni`);
    }
    if (!w.DIMENSION_CODE || !dimensionCodes.has(w.DIMENSION_CODE)) {
      errors.push(`Riga ${idx + 2} Pesi: DIMENSION_CODE "${w.DIMENSION_CODE}" non esiste tra le dimensioni configurate`);
    }
    if (w.WEIGHT === undefined || isNaN(Number(w.WEIGHT))) {
      errors.push(`Riga ${idx + 2} Pesi: WEIGHT deve essere un numero`);
    }
  });

  return errors;
}
