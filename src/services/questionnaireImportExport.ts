import * as XLSX from 'xlsx';
import type {
  Questionnaire,
  ScoringDimension,
  SectionType,
  QuestionType,
} from '../types/questionnaire';

// =============================================
// TYPES
// =============================================

// New flat format for swipe questionnaires
interface SwipeRow {
  '#': number;
  SEZIONE: string;
  DOMANDA: string;
  'OPZIONE SINISTRA (←)': string;
  'OPZIONE DESTRA (→)': string;
  'PESI SINISTRA'?: string;
  'PESI DESTRA'?: string;
}

// New flat format for step/chat questionnaires
interface FlatRow {
  '#': number;
  SEZIONE: string;
  TIPO_SEZIONE: string;
  DOMANDA: string;
  TIPO_DOMANDA: string;
  OBBLIGATORIA: string;
  OPZIONE_1: string;
  OPZIONE_2?: string;
  OPZIONE_3?: string;
  OPZIONE_4?: string;
  OPZIONE_5?: string;
  PESI_1?: string;
  PESI_2?: string;
  PESI_3?: string;
  PESI_4?: string;
  PESI_5?: string;
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
// HELPER FUNCTIONS
// =============================================

/**
 * Parse weight string like "R:+2, I:+1, S:-1" into array of weights
 */
function parseWeightString(weightStr: string | undefined): { code: string; weight: number }[] {
  if (!weightStr || weightStr.trim() === '') return [];
  
  const weights: { code: string; weight: number }[] = [];
  const parts = weightStr.split(',').map(s => s.trim());
  
  for (const part of parts) {
    const match = part.match(/^([A-Za-z]+):([+-]?\d+)$/);
    if (match) {
      weights.push({
        code: match[1].toUpperCase(),
        weight: parseInt(match[2], 10)
      });
    }
  }
  
  return weights;
}

/**
 * Format weights array into readable string like "R:+2, I:+1"
 */
function formatWeightString(weights: { dimensionId: string; weight: number }[], dimensionMap: Map<string, string>): string {
  if (!weights || weights.length === 0) return '';
  
  return weights
    .filter(w => w.weight !== 0)
    .map(w => {
      const code = dimensionMap.get(w.dimensionId) || '?';
      const sign = w.weight > 0 ? '+' : '';
      return `${code}:${sign}${w.weight}`;
    })
    .join(', ');
}

/**
 * Create instructions sheet content
 */
function createInstructionsSheet(questionnaire: Questionnaire, isSwipe: boolean): string[][] {
  const dimensionsList = questionnaire.dimensions?.map(d => `${d.code} = ${d.label}`).join('\n') || 'Nessuna dimensione configurata';
  
  if (isSwipe) {
    return [
      ['📋 ISTRUZIONI - Template Questionario Swipe (Tinder-like)'],
      [''],
      ['STRUTTURA DEL FILE'],
      ['Questo template è ottimizzato per questionari con interazione "swipe" (scelta binaria).'],
      ['Ogni riga rappresenta una domanda completa con le due opzioni (sinistra e destra).'],
      [''],
      ['COLONNE:'],
      ['# = Numero progressivo della domanda'],
      ['SEZIONE = Nome della sezione (le domande con la stessa sezione vengono raggruppate)'],
      ['DOMANDA = Testo della domanda mostrata all\'utente'],
      ['OPZIONE SINISTRA (←) = Testo dell\'opzione per swipe a sinistra'],
      ['OPZIONE DESTRA (→) = Testo dell\'opzione per swipe a destra'],
      ['PESI SINISTRA = Pesi scoring per l\'opzione sinistra (opzionale)'],
      ['PESI DESTRA = Pesi scoring per l\'opzione destra (opzionale)'],
      [''],
      ['FORMATO PESI:'],
      ['I pesi si scrivono nel formato: CODICE:+/-VALORE'],
      ['Esempi: "R:+2" oppure "S:+1, I:-1" oppure "A:+2, C:+1, E:-1"'],
      [''],
      ['DIMENSIONI DISPONIBILI:'],
      [dimensionsList],
      [''],
      ['ESEMPIO:'],
      ['# | SEZIONE | DOMANDA | OPZIONE SINISTRA | OPZIONE DESTRA | PESI SX | PESI DX'],
      ['1 | Preferenze | Preferisci lavorare... | In team | Da solo | S:+2 | I:+2'],
      ['2 | Preferenze | Ti piace di più... | Seguire regole | Inventare regole | C:+2 | A:+2'],
    ];
  } else {
    return [
      ['📋 ISTRUZIONI - Template Questionario'],
      [''],
      ['STRUTTURA DEL FILE'],
      ['Ogni riga rappresenta una domanda con le sue opzioni.'],
      ['Le domande con la stessa sezione vengono automaticamente raggruppate.'],
      [''],
      ['COLONNE:'],
      ['# = Numero progressivo'],
      ['SEZIONE = Nome della sezione'],
      ['TIPO_SEZIONE = Tipo di sezione (vedi sotto)'],
      ['DOMANDA = Testo della domanda'],
      ['TIPO_DOMANDA = Tipo di domanda (vedi sotto)'],
      ['OBBLIGATORIA = TRUE/FALSE'],
      ['OPZIONE_1...5 = Testo delle opzioni di risposta'],
      ['PESI_1...5 = Pesi scoring per ogni opzione (opzionale)'],
      [''],
      ['TIPI DI SEZIONE VALIDI:'],
      ['forced_choice = Scelta forzata (una sola risposta)'],
      ['checklist = Checklist (risposte multiple)'],
      ['likert = Scala Likert (1-5 o 1-7)'],
      ['open_text = Risposta aperta testuale'],
      [''],
      ['TIPI DI DOMANDA VALIDI:'],
      ['single_choice = Scelta singola'],
      ['multiple_choice = Scelta multipla'],
      ['likert = Scala Likert'],
      ['open_text = Testo libero'],
      ['binary = Scelta binaria (sì/no, vero/falso)'],
      [''],
      ['FORMATO PESI:'],
      ['I pesi si scrivono nel formato: CODICE:+/-VALORE'],
      ['Esempi: "R:+2" oppure "S:+1, I:-1"'],
      [''],
      ['DIMENSIONI DISPONIBILI:'],
      [dimensionsList],
    ];
  }
}

// =============================================
// EXPORT FUNCTIONS
// =============================================

/**
 * Export questionnaire as Excel template with flat, readable structure
 */
export function exportQuestionnaireTemplate(
  questionnaire: Questionnaire,
  includeData: boolean = false
): void {
  const workbook = XLSX.utils.book_new();
  const isSwipe = questionnaire.uiStyle === 'swipe';
  
  // Create dimension ID -> Code map
  const dimensionMap = new Map(questionnaire.dimensions?.map(d => [d.id, d.code]) || []);

  // Sheet 1: Instructions
  const instructionsData = createInstructionsSheet(questionnaire, isSwipe);
  const instructionsSheet = XLSX.utils.aoa_to_sheet(instructionsData);
  
  // Set column width for instructions
  instructionsSheet['!cols'] = [{ wch: 100 }];
  XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Istruzioni');

  if (isSwipe) {
    // SWIPE FORMAT - Optimized for binary questions
    const swipeData: SwipeRow[] = [];
    
    if (includeData && questionnaire.sections) {
      let rowNum = 1;
      
      for (const section of questionnaire.sections) {
        for (const question of section.questions || []) {
          const options = question.options || [];
          const leftOption = options[0];
          const rightOption = options[1];
          
          const leftWeights = leftOption?.weights 
            ? formatWeightString(leftOption.weights.map(w => ({ dimensionId: w.dimensionId, weight: w.weight })), dimensionMap)
            : '';
          const rightWeights = rightOption?.weights
            ? formatWeightString(rightOption.weights.map(w => ({ dimensionId: w.dimensionId, weight: w.weight })), dimensionMap)
            : '';
          
          swipeData.push({
            '#': rowNum++,
            'SEZIONE': section.title,
            'DOMANDA': question.text,
            'OPZIONE SINISTRA (←)': leftOption?.text || '',
            'OPZIONE DESTRA (→)': rightOption?.text || '',
            'PESI SINISTRA': leftWeights,
            'PESI DESTRA': rightWeights,
          });
        }
      }
    }
    
    // Add example row if empty
    if (swipeData.length === 0) {
      const dimCodes = questionnaire.dimensions?.slice(0, 2).map(d => d.code) || ['R', 'I'];
      swipeData.push({
        '#': 1,
        'SEZIONE': 'Preferenze Lavorative',
        'DOMANDA': 'Preferisci lavorare...',
        'OPZIONE SINISTRA (←)': 'In team con altri',
        'OPZIONE DESTRA (→)': 'Da solo in autonomia',
        'PESI SINISTRA': `${dimCodes[0] || 'S'}:+2`,
        'PESI DESTRA': `${dimCodes[1] || 'I'}:+2`,
      });
      swipeData.push({
        '#': 2,
        'SEZIONE': 'Preferenze Lavorative',
        'DOMANDA': 'Ti piace di più...',
        'OPZIONE SINISTRA (←)': 'Seguire regole precise',
        'OPZIONE DESTRA (→)': 'Inventare nuove soluzioni',
        'PESI SINISTRA': 'C:+2',
        'PESI DESTRA': 'A:+2',
      });
    }

    const contentSheet = XLSX.utils.json_to_sheet(swipeData);
    contentSheet['!cols'] = [
      { wch: 5 },  // #
      { wch: 25 }, // SEZIONE
      { wch: 40 }, // DOMANDA
      { wch: 30 }, // OPZIONE SINISTRA
      { wch: 30 }, // OPZIONE DESTRA
      { wch: 20 }, // PESI SINISTRA
      { wch: 20 }, // PESI DESTRA
    ];
    XLSX.utils.book_append_sheet(workbook, contentSheet, 'Contenuti');
    
  } else {
    // FLAT FORMAT - For step/chat questionnaires
    const flatData: FlatRow[] = [];
    
    if (includeData && questionnaire.sections) {
      let rowNum = 1;
      
      for (const section of questionnaire.sections) {
        for (const question of section.questions || []) {
          const options = question.options || [];
          
          const row: FlatRow = {
            '#': rowNum++,
            'SEZIONE': section.title,
            'TIPO_SEZIONE': section.type,
            'DOMANDA': question.text,
            'TIPO_DOMANDA': question.type,
            'OBBLIGATORIA': question.isRequired ? 'TRUE' : 'FALSE',
            'OPZIONE_1': options[0]?.text || '',
            'OPZIONE_2': options[1]?.text || '',
            'OPZIONE_3': options[2]?.text || '',
            'OPZIONE_4': options[3]?.text || '',
            'OPZIONE_5': options[4]?.text || '',
          };
          
          // Add weights
          for (let i = 0; i < 5; i++) {
            const opt = options[i];
            if (opt?.weights) {
              const weightStr = formatWeightString(
                opt.weights.map(w => ({ dimensionId: w.dimensionId, weight: w.weight })),
                dimensionMap
              );
              (row as any)[`PESI_${i + 1}`] = weightStr;
            }
          }
          
          flatData.push(row);
        }
      }
    }
    
    // Add example rows if empty
    if (flatData.length === 0) {
      flatData.push({
        '#': 1,
        'SEZIONE': 'Preferenze Lavorative',
        'TIPO_SEZIONE': 'forced_choice',
        'DOMANDA': 'Quale ambiente di lavoro preferisci?',
        'TIPO_DOMANDA': 'single_choice',
        'OBBLIGATORIA': 'TRUE',
        'OPZIONE_1': 'Ufficio tradizionale',
        'OPZIONE_2': 'Smart working da casa',
        'OPZIONE_3': 'Modalità ibrida',
        'PESI_1': 'C:+2',
        'PESI_2': 'I:+2',
        'PESI_3': 'S:+1, A:+1',
      });
      flatData.push({
        '#': 2,
        'SEZIONE': 'Preferenze Lavorative',
        'TIPO_SEZIONE': 'forced_choice',
        'DOMANDA': 'Come preferisci ricevere feedback?',
        'TIPO_DOMANDA': 'single_choice',
        'OBBLIGATORIA': 'TRUE',
        'OPZIONE_1': 'Subito e diretto',
        'OPZIONE_2': 'Con calma e diplomazia',
        'PESI_1': 'E:+2',
        'PESI_2': 'S:+2',
      });
    }

    const contentSheet = XLSX.utils.json_to_sheet(flatData);
    contentSheet['!cols'] = [
      { wch: 5 },  // #
      { wch: 25 }, // SEZIONE
      { wch: 15 }, // TIPO_SEZIONE
      { wch: 40 }, // DOMANDA
      { wch: 15 }, // TIPO_DOMANDA
      { wch: 12 }, // OBBLIGATORIA
      { wch: 25 }, // OPZIONE_1
      { wch: 25 }, // OPZIONE_2
      { wch: 25 }, // OPZIONE_3
      { wch: 25 }, // OPZIONE_4
      { wch: 25 }, // OPZIONE_5
      { wch: 15 }, // PESI_1
      { wch: 15 }, // PESI_2
      { wch: 15 }, // PESI_3
      { wch: 15 }, // PESI_4
      { wch: 15 }, // PESI_5
    ];
    XLSX.utils.book_append_sheet(workbook, contentSheet, 'Contenuti');
  }

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
 * Import questionnaire data from Excel file (new flat format)
 */
export async function importQuestionnaireData(
  file: File,
  questionnaireId: string,
  dimensions: ScoringDimension[],
  hooks: ImportHooks,
  isSwipe: boolean = false
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

    // Find content sheet
    const contentSheet = workbook.Sheets['Contenuti'];
    if (!contentSheet) {
      result.errors.push('Foglio "Contenuti" non trovato. Assicurati di usare il template corretto.');
      return result;
    }

    // Create dimension code to ID map
    const dimensionCodeToId = new Map(dimensions.map(d => [d.code.toUpperCase(), d.id]));

    // Detect format and parse
    const rawData: any[] = XLSX.utils.sheet_to_json(contentSheet);
    
    if (rawData.length === 0) {
      result.errors.push('Il foglio "Contenuti" è vuoto.');
      return result;
    }

    // Check if it's swipe format
    const firstRow = rawData[0];
    const isSwipeFormat = 'OPZIONE SINISTRA (←)' in firstRow || 'OPZIONE DESTRA (→)' in firstRow;

    // Track created entities
    const sectionIdMap = new Map<string, string>(); // Section name -> DB ID
    
    if (isSwipeFormat) {
      // SWIPE FORMAT IMPORT
      for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i] as SwipeRow;
        const rowNum = i + 2; // Excel row number (1-indexed + header)
        
        const sectionName = row['SEZIONE']?.toString().trim();
        const questionText = row['DOMANDA']?.toString().trim();
        const leftOption = row['OPZIONE SINISTRA (←)']?.toString().trim();
        const rightOption = row['OPZIONE DESTRA (→)']?.toString().trim();
        const leftWeights = row['PESI SINISTRA']?.toString().trim();
        const rightWeights = row['PESI DESTRA']?.toString().trim();

        // Validate required fields
        if (!sectionName) {
          result.errors.push(`Riga ${rowNum}: SEZIONE mancante`);
          continue;
        }
        if (!questionText) {
          result.errors.push(`Riga ${rowNum}: DOMANDA mancante`);
          continue;
        }
        if (!leftOption || !rightOption) {
          result.errors.push(`Riga ${rowNum}: Entrambe le opzioni (sinistra e destra) sono obbligatorie`);
          continue;
        }

        // Get or create section
        let sectionId = sectionIdMap.get(sectionName);
        if (!sectionId) {
          sectionId = await (hooks as any).addSection(questionnaireId, {
            title: sectionName,
            type: 'forced_choice',
          });
          if (sectionId) {
            sectionIdMap.set(sectionName, sectionId);
            result.sectionsCreated++;
          } else {
            result.errors.push(`Riga ${rowNum}: Errore creazione sezione "${sectionName}"`);
            continue;
          }
        }

        // Create question
        const questionId = await hooks.addQuestion(sectionId, {
          text: questionText,
          type: 'binary',
          isRequired: true,
        });

        if (!questionId) {
          result.errors.push(`Riga ${rowNum}: Errore creazione domanda "${questionText.substring(0, 30)}..."`);
          continue;
        }
        result.questionsCreated++;

        // Create options
        const leftOptionId = await hooks.addOption(questionId, { text: leftOption });
        const rightOptionId = await hooks.addOption(questionId, { text: rightOption });

        if (leftOptionId) result.optionsCreated++;
        if (rightOptionId) result.optionsCreated++;

        // Parse and create weights
        if (leftOptionId && leftWeights) {
          const parsedWeights = parseWeightString(leftWeights);
          for (const w of parsedWeights) {
            const dimId = dimensionCodeToId.get(w.code);
            if (dimId) {
              await hooks.setOptionWeight(leftOptionId, dimId, w.weight);
              result.weightsCreated++;
            } else {
              result.errors.push(`Riga ${rowNum}: Dimensione "${w.code}" non trovata nei pesi sinistra`);
            }
          }
        }

        if (rightOptionId && rightWeights) {
          const parsedWeights = parseWeightString(rightWeights);
          for (const w of parsedWeights) {
            const dimId = dimensionCodeToId.get(w.code);
            if (dimId) {
              await hooks.setOptionWeight(rightOptionId, dimId, w.weight);
              result.weightsCreated++;
            } else {
              result.errors.push(`Riga ${rowNum}: Dimensione "${w.code}" non trovata nei pesi destra`);
            }
          }
        }
      }
    } else {
      // FLAT FORMAT IMPORT
      for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i] as FlatRow;
        const rowNum = i + 2;
        
        const sectionName = row['SEZIONE']?.toString().trim();
        const sectionType = (row['TIPO_SEZIONE']?.toString().trim() || 'forced_choice') as SectionType;
        const questionText = row['DOMANDA']?.toString().trim();
        const questionType = (row['TIPO_DOMANDA']?.toString().trim() || 'single_choice') as QuestionType;
        const isRequired = row['OBBLIGATORIA']?.toString().toUpperCase() === 'TRUE';

        // Validate required fields
        if (!sectionName) {
          result.errors.push(`Riga ${rowNum}: SEZIONE mancante`);
          continue;
        }
        if (!questionText) {
          result.errors.push(`Riga ${rowNum}: DOMANDA mancante`);
          continue;
        }

        // Validate types
        if (!VALID_SECTION_TYPES.includes(sectionType)) {
          result.errors.push(`Riga ${rowNum}: TIPO_SEZIONE "${sectionType}" non valido. Validi: ${VALID_SECTION_TYPES.join(', ')}`);
          continue;
        }
        if (!VALID_QUESTION_TYPES.includes(questionType)) {
          result.errors.push(`Riga ${rowNum}: TIPO_DOMANDA "${questionType}" non valido. Validi: ${VALID_QUESTION_TYPES.join(', ')}`);
          continue;
        }

        // Get or create section
        let sectionId = sectionIdMap.get(sectionName);
        if (!sectionId) {
          sectionId = await (hooks as any).addSection(questionnaireId, {
            title: sectionName,
            type: sectionType,
          });
          if (sectionId) {
            sectionIdMap.set(sectionName, sectionId);
            result.sectionsCreated++;
          } else {
            result.errors.push(`Riga ${rowNum}: Errore creazione sezione "${sectionName}"`);
            continue;
          }
        }

        // Create question
        const questionId = await hooks.addQuestion(sectionId, {
          text: questionText,
          type: questionType,
          isRequired,
        });

        if (!questionId) {
          result.errors.push(`Riga ${rowNum}: Errore creazione domanda "${questionText.substring(0, 30)}..."`);
          continue;
        }
        result.questionsCreated++;

        // Create options and weights
        for (let optIdx = 1; optIdx <= 5; optIdx++) {
          const optionText = (row as any)[`OPZIONE_${optIdx}`]?.toString().trim();
          if (!optionText) continue;

          const optionId = await hooks.addOption(questionId, { text: optionText });
          if (optionId) {
            result.optionsCreated++;

            // Parse weights for this option
            const weightsStr = (row as any)[`PESI_${optIdx}`]?.toString().trim();
            if (weightsStr) {
              const parsedWeights = parseWeightString(weightsStr);
              for (const w of parsedWeights) {
                const dimId = dimensionCodeToId.get(w.code);
                if (dimId) {
                  await hooks.setOptionWeight(optionId, dimId, w.weight);
                  result.weightsCreated++;
                } else {
                  result.errors.push(`Riga ${rowNum}, Opzione ${optIdx}: Dimensione "${w.code}" non trovata`);
                }
              }
            }
          }
        }
      }
    }

    result.success = result.errors.length === 0;
    return result;

  } catch (err: any) {
    result.errors.push(`Errore lettura file: ${err.message}`);
    return result;
  }
}
