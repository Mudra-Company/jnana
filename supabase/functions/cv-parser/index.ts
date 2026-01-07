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
  "bio": "breve descrizione professionale se presente (max 200 caratteri) o null",
  "location": "città/paese se presente o null",
  "yearsExperience": numero anni esperienza calcolato dalle date o null,
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

    console.log("Sending to Gemini Pro (complete file, no truncation)...");

    // Call Lovable AI Gateway with Gemini Pro for better document understanding
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro", // Pro for better accuracy
        messages: [
          {
            role: "system",
            content: "Sei un estrattore di dati da CV. Estrai SOLO dati reali dal documento. MAI inventare informazioni. Rispondi sempre in JSON valido senza markdown."
          },
          {
            role: "user",
            content: messageContent
          }
        ],
        max_tokens: 4000,
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
      
      parsedData = JSON.parse(cleanContent.trim());
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
