// @ts-nocheck - Deno types not available in Vite
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ParsedCVData {
  firstName?: string;
  lastName?: string;
  headline?: string;
  bio?: string;
  location?: string;
  yearsExperience?: number;
  skills: string[];
  experiences: {
    company: string;
    role: string;
    startDate?: string;
    endDate?: string;
    description?: string;
  }[];
  education: {
    institution: string;
    degree: string;
    field?: string;
    year?: number;
  }[];
  certifications: string[];
  languages: string[];
  confidence: 'high' | 'low' | 'failed';
}

// Generic/suspicious names that indicate hallucination
const SUSPICIOUS_NAMES = [
  'mario rossi', 'paola rossi', 'giuseppe rossi', 'maria rossi',
  'mario bianchi', 'paola bianchi', 'luca bianchi',
  'john doe', 'jane doe', 'john smith',
  'nome cognome', 'first last'
];

// Generic company names that indicate hallucination
const SUSPICIOUS_COMPANIES = [
  'azienda x', 'azienda y', 'azienda z',
  'company x', 'company y', 'company z',
  'company abc', 'acme', 'example company',
  'nome azienda', 'company name'
];

function detectHallucination(data: ParsedCVData): { isHallucinated: boolean; reason?: string } {
  // Check for suspicious names
  const fullName = `${data.firstName || ''} ${data.lastName || ''}`.toLowerCase().trim();
  if (SUSPICIOUS_NAMES.some(name => fullName.includes(name))) {
    return { isHallucinated: true, reason: `Nome sospetto rilevato: ${fullName}` };
  }

  // Check for suspicious companies
  for (const exp of data.experiences) {
    const companyLower = exp.company.toLowerCase();
    if (SUSPICIOUS_COMPANIES.some(c => companyLower.includes(c))) {
      return { isHallucinated: true, reason: `Azienda sospetta rilevata: ${exp.company}` };
    }
  }

  return { isHallucinated: false };
}

// Helper functions for extracting data from truncated/malformed JSON
function extractJsonField(content: string, fieldName: string): string | undefined {
  const regex = new RegExp(`"${fieldName}"\\s*:\\s*"([^"]*)"`, 'i');
  const match = content.match(regex);
  return match ? match[1] : undefined;
}

function extractJsonNumberField(content: string, fieldName: string): number | undefined {
  const regex = new RegExp(`"${fieldName}"\\s*:\\s*(\\d+)`, 'i');
  const match = content.match(regex);
  return match ? parseInt(match[1], 10) : undefined;
}

function extractJsonArray(content: string, fieldName: string): string[] {
  const regex = new RegExp(`"${fieldName}"\\s*:\\s*\\[([^\\]]*?)\\]`, 'is');
  const match = content.match(regex);
  if (!match) return [];
  
  const arrayContent = match[1];
  const items: string[] = [];
  const itemRegex = /"([^"]+)"/g;
  let itemMatch;
  while ((itemMatch = itemRegex.exec(arrayContent)) !== null) {
    items.push(itemMatch[1]);
  }
  return items;
}

function extractJsonArrayOfObjects(content: string, fieldName: string): any[] {
  // Find the start of the array
  const startRegex = new RegExp(`"${fieldName}"\\s*:\\s*\\[`, 'i');
  const startMatch = content.match(startRegex);
  if (!startMatch || startMatch.index === undefined) return [];
  
  const arrayStart = startMatch.index + startMatch[0].length;
  
  // Extract complete objects from the array
  const objects: any[] = [];
  let depth = 0;
  let objectStart = -1;
  let inString = false;
  let escapeNext = false;
  
  for (let i = arrayStart; i < content.length; i++) {
    const char = content[i];
    
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    
    if (char === '\\') {
      escapeNext = true;
      continue;
    }
    
    if (char === '"') {
      inString = !inString;
      continue;
    }
    
    if (!inString) {
      if (char === '{') {
        if (depth === 0) objectStart = i;
        depth++;
      } else if (char === '}') {
        depth--;
        if (depth === 0 && objectStart !== -1) {
          const objectStr = content.substring(objectStart, i + 1);
          try {
            objects.push(JSON.parse(objectStr));
          } catch (e) {
            // Skip malformed object
          }
          objectStart = -1;
        }
      } else if (char === ']' && depth === 0) {
        break; // End of array
      }
    }
  }
  
  return objects;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileBase64, fileType, fileName } = await req.json();

    if (!fileBase64) {
      throw new Error('No file data provided');
    }

    // Log file details for debugging
    const base64Length = fileBase64.length;
    console.log(`Processing CV: ${fileName}`);
    console.log(`File type: ${fileType}`);
    console.log(`Base64 length: ${base64Length} characters (~${Math.round(base64Length * 0.75 / 1024)} KB)`);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const isImage = fileType?.startsWith('image/');
    const isPDF = fileType === 'application/pdf';

    if (!isImage && !isPDF) {
      throw new Error(`Formato file non supportato: ${fileType}. Usa PDF o immagine.`);
    }

    // Build the prompt with anti-hallucination instructions
    const extractionPrompt = `Analizza questo curriculum vitae e estrai le informazioni in formato JSON.

REGOLE CRITICHE:
1. Estrai SOLO informazioni che trovi ESPLICITAMENTE nel documento
2. NON INVENTARE MAI nomi, aziende, ruoli, date o competenze
3. Se non riesci a leggere una sezione o il testo è illeggibile, lascia il campo vuoto o array vuoto
4. Se il documento non sembra un CV, restituisci tutti i campi vuoti
5. Cerca: nome/cognome nell'header o contatti, sezioni "Esperienze/Experience", "Istruzione/Education", "Competenze/Skills"

FORMATO RISPOSTA (JSON puro, senza markdown):
{
  "firstName": "nome trovato nel documento o null",
  "lastName": "cognome trovato nel documento o null", 
  "headline": "titolo professionale se presente o null",
    "bio": "descrizione professionale completa (summary/about/profile) se presente nel documento, senza troncamenti o null",
    "location": "città/paese se presente o null",
    "yearsExperience": numero totale anni esperienza lavorativa (calcola: anno corrente meno anno di inizio della prima esperienza lavorativa) o null,
  "skills": ["competenza1", "competenza2"],
  "experiences": [
    {
      "company": "nome azienda ESATTO dal documento",
      "role": "ruolo ESATTO dal documento",
      "startDate": "MM/YYYY o YYYY",
      "endDate": "MM/YYYY o YYYY o 'Present'",
      "description": "descrizione se presente"
    }
  ],
  "education": [
    {
      "institution": "nome istituto ESATTO",
      "degree": "tipo laurea/diploma",
      "field": "campo di studi",
      "year": anno completamento
    }
  ],
  "certifications": ["certificazione1", "certificazione2"],
  "languages": ["lingua1", "lingua2"]
}

IMPORTANTE: Rispondi SOLO con il JSON, senza backtick, senza markdown, senza spiegazioni.`;

    // Build message content with COMPLETE file as inline_data
    const messageContent = [
      {
        type: "text",
        text: extractionPrompt
      },
      {
        type: "image_url",
        image_url: {
          url: `data:${fileType};base64,${fileBase64}` // COMPLETE file, no truncation
        }
      }
    ];

    console.log("Sending to Gemini Flash (complete file, no truncation)...");

    // Call Lovable AI Gateway with Gemini Flash for faster response and less truncation
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash", // Flash is faster and less likely to truncate
        messages: [
          {
            role: "system",
            content: "Sei un estrattore di dati da CV. Estrai SOLO dati reali dal documento. MAI inventare informazioni. Rispondi sempre in JSON valido senza markdown. Mantieni le risposte concise."
          },
          {
            role: "user",
            content: messageContent
          }
        ],
        max_tokens: 8000, // Increased to prevent truncation
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Troppi tentativi. Riprova tra qualche secondo." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Crediti esauriti. Contatta il supporto." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`Errore AI: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Nessuna risposta dall'AI");
    }

    console.log("AI Response received, parsing...");
    console.log("Raw response:", content.substring(0, 500));

    // Parse the JSON response
    let parsedData: Partial<ParsedCVData>;
    try {
      // Clean up the response - remove markdown code blocks if present
      let cleanContent = content.trim();
      if (cleanContent.startsWith("```json")) {
        cleanContent = cleanContent.slice(7);
      }
      if (cleanContent.startsWith("```")) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith("```")) {
        cleanContent = cleanContent.slice(0, -3);
      }
      cleanContent = cleanContent.trim();
      
      // Try to parse the JSON
      try {
        parsedData = JSON.parse(cleanContent);
      } catch (firstParseError) {
        console.log("First parse failed, attempting to repair truncated JSON...");
        
        // Try to repair truncated JSON by finding the last complete object/array
        let repairedContent = cleanContent;
        
        // Count brackets to find where JSON breaks
        let braceCount = 0;
        let bracketCount = 0;
        let lastValidIndex = 0;
        let inString = false;
        let escapeNext = false;
        
        for (let i = 0; i < repairedContent.length; i++) {
          const char = repairedContent[i];
          
          if (escapeNext) {
            escapeNext = false;
            continue;
          }
          
          if (char === '\\') {
            escapeNext = true;
            continue;
          }
          
          if (char === '"' && !escapeNext) {
            inString = !inString;
            continue;
          }
          
          if (!inString) {
            if (char === '{') braceCount++;
            if (char === '}') {
              braceCount--;
              if (braceCount >= 0) lastValidIndex = i;
            }
            if (char === '[') bracketCount++;
            if (char === ']') {
              bracketCount--;
              if (bracketCount >= 0) lastValidIndex = i;
            }
          }
        }
        
        // If we have unclosed braces/brackets, try to close them
        if (braceCount > 0 || bracketCount > 0) {
          // Find the last complete property or array element
          // Look for the last comma or opening bracket/brace before truncation
          let truncatePoint = repairedContent.length;
          for (let i = repairedContent.length - 1; i >= 0; i--) {
            const char = repairedContent[i];
            if (char === ',' || char === '[' || char === '{') {
              truncatePoint = i;
              if (char === ',') truncatePoint = i; // Keep content before the comma
              break;
            }
            if (char === ']' || char === '}') {
              // Found a complete element
              truncatePoint = i + 1;
              break;
            }
          }
          
          repairedContent = repairedContent.substring(0, truncatePoint);
          
          // Remove trailing comma if present
          repairedContent = repairedContent.replace(/,\s*$/, '');
          
          // Close any open brackets/braces
          while (bracketCount > 0) {
            repairedContent += ']';
            bracketCount--;
          }
          while (braceCount > 0) {
            repairedContent += '}';
            braceCount--;
          }
          
          console.log("Repaired JSON (last 200 chars):", repairedContent.slice(-200));
        }
        
        try {
          parsedData = JSON.parse(repairedContent);
          console.log("Successfully parsed repaired JSON");
        } catch (repairError) {
          // Last resort: try to extract just the data we can find using regex
          console.log("Repair failed, attempting regex extraction...");
          parsedData = {
            firstName: extractJsonField(cleanContent, 'firstName'),
            lastName: extractJsonField(cleanContent, 'lastName'),
            headline: extractJsonField(cleanContent, 'headline'),
            bio: extractJsonField(cleanContent, 'bio'),
            location: extractJsonField(cleanContent, 'location'),
            yearsExperience: extractJsonNumberField(cleanContent, 'yearsExperience'),
            skills: extractJsonArray(cleanContent, 'skills'),
            experiences: extractJsonArrayOfObjects(cleanContent, 'experiences'),
            education: extractJsonArrayOfObjects(cleanContent, 'education'),
            certifications: extractJsonArray(cleanContent, 'certifications'),
            languages: extractJsonArray(cleanContent, 'languages'),
          };
          console.log("Regex extraction result:", JSON.stringify(parsedData, null, 2));
        }
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      console.error("Content was:", content);
      
      return new Response(
        JSON.stringify({ 
          error: "Non siamo riusciti a leggere il CV. Prova con un PDF con testo selezionabile.",
          details: "Parsing JSON fallito"
        }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalize experiences - convert "Present" endDate to null
    const normalizedExperiences = (Array.isArray(parsedData.experiences) ? parsedData.experiences : []).map(exp => {
      const endDateLower = (exp.endDate || '').toLowerCase().trim();
      const isCurrentJob = !exp.endDate || 
        endDateLower === 'present' ||
        endDateLower === 'presente' ||
        endDateLower === 'current' ||
        endDateLower === 'attuale' ||
        endDateLower === 'oggi' ||
        endDateLower === 'ad oggi';
      
      return {
        ...exp,
        endDate: isCurrentJob ? null : exp.endDate
      };
    });

    // Build result with defaults
    const result: ParsedCVData = {
      firstName: parsedData.firstName || undefined,
      lastName: parsedData.lastName || undefined,
      headline: parsedData.headline || undefined,
      bio: parsedData.bio || undefined,
      location: parsedData.location || undefined,
      yearsExperience: parsedData.yearsExperience || undefined,
      skills: Array.isArray(parsedData.skills) ? parsedData.skills : [],
      experiences: normalizedExperiences,
      education: Array.isArray(parsedData.education) ? parsedData.education : [],
      certifications: Array.isArray(parsedData.certifications) ? parsedData.certifications : [],
      languages: Array.isArray(parsedData.languages) ? parsedData.languages : [],
      confidence: 'high'
    };

    // Check for hallucination
    const hallucinationCheck = detectHallucination(result);
    if (hallucinationCheck.isHallucinated) {
      console.warn("HALLUCINATION DETECTED:", hallucinationCheck.reason);
      result.confidence = 'low';
      
      // Return error for clearly hallucinated data
      return new Response(
        JSON.stringify({ 
          error: "Il CV non è stato letto correttamente. Riprova con un documento più leggibile.",
          details: hallucinationCheck.reason,
          confidence: 'failed'
        }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if we got meaningful data
    const hasName = result.firstName || result.lastName;
    const hasExperiences = result.experiences.length > 0;
    const hasEducation = result.education.length > 0;
    
    if (!hasName && !hasExperiences && !hasEducation) {
      result.confidence = 'low';
      console.warn("LOW CONFIDENCE: No meaningful data extracted");
    }

    console.log("Parsed CV data:", JSON.stringify(result, null, 2));
    console.log("Confidence:", result.confidence);

    return new Response(
      JSON.stringify(result), // Return directly, no extra wrapping
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("CV Parser error:", error);
    const errorMessage = error instanceof Error ? error.message : "Errore durante il parsing del CV";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
