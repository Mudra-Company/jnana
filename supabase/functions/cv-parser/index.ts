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

    console.log(`Processing CV: ${fileName}, type: ${fileType}`);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build the message content based on file type
    const isImage = fileType?.startsWith('image/');
    const isPDF = fileType === 'application/pdf';

    let messageContent: any[];

    if (isImage) {
      // For images, use vision capability
      messageContent = [
        {
          type: "text",
          text: `Analizza questo CV/curriculum e estrai le seguenti informazioni in formato JSON:
{
  "firstName": "nome",
  "lastName": "cognome", 
  "headline": "titolo professionale breve",
  "bio": "breve descrizione professionale (max 200 caratteri)",
  "location": "città, paese",
  "yearsExperience": numero_anni_esperienza,
  "skills": ["skill1", "skill2", ...],
  "experiences": [
    {
      "company": "nome azienda",
      "role": "ruolo",
      "startDate": "MM/YYYY",
      "endDate": "MM/YYYY o 'Present'",
      "description": "breve descrizione"
    }
  ],
  "education": [
    {
      "institution": "nome istituto",
      "degree": "tipo laurea/diploma",
      "field": "campo di studi",
      "year": anno_completamento
    }
  ],
  "certifications": ["certificazione1", "certificazione2", ...],
  "languages": ["lingua1", "lingua2", ...]
}

Rispondi SOLO con il JSON, senza markdown o testo aggiuntivo.`
        },
        {
          type: "image_url",
          image_url: {
            url: `data:${fileType};base64,${fileBase64}`
          }
        }
      ];
    } else if (isPDF) {
      // For PDFs, we need to decode and send as text or use document parsing
      // Lovable AI with Gemini can process PDFs
      messageContent = [
        {
          type: "text",
          text: `Analizza questo documento CV in formato PDF (base64 encoded) e estrai le seguenti informazioni in formato JSON:
{
  "firstName": "nome",
  "lastName": "cognome", 
  "headline": "titolo professionale breve",
  "bio": "breve descrizione professionale (max 200 caratteri)",
  "location": "città, paese",
  "yearsExperience": numero_anni_esperienza,
  "skills": ["skill1", "skill2", ...],
  "experiences": [
    {
      "company": "nome azienda",
      "role": "ruolo",
      "startDate": "MM/YYYY",
      "endDate": "MM/YYYY o 'Present'",
      "description": "breve descrizione"
    }
  ],
  "education": [
    {
      "institution": "nome istituto",
      "degree": "tipo laurea/diploma",
      "field": "campo di studi",
      "year": anno_completamento
    }
  ],
  "certifications": ["certificazione1", "certificazione2", ...],
  "languages": ["lingua1", "lingua2", ...]
}

PDF Base64: ${fileBase64.substring(0, 50000)}

Rispondi SOLO con il JSON, senza markdown o testo aggiuntivo.`
        }
      ];
    } else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }

    // Call Lovable AI Gateway
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "Sei un esperto analizzatore di CV. Estrai informazioni strutturate dai curriculum vitae. Rispondi sempre e solo in formato JSON valido."
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
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response from AI");
    }

    console.log("AI Response:", content);

    // Parse the JSON response
    let parsedData: ParsedCVData;
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
      // Return a default structure with empty data
      parsedData = {
        skills: [],
        experiences: [],
        education: [],
        certifications: [],
        languages: [],
      };
    }

    // Ensure all required fields exist
    const result: ParsedCVData = {
      firstName: parsedData.firstName || undefined,
      lastName: parsedData.lastName || undefined,
      headline: parsedData.headline || undefined,
      bio: parsedData.bio || undefined,
      location: parsedData.location || undefined,
      yearsExperience: parsedData.yearsExperience || undefined,
      skills: Array.isArray(parsedData.skills) ? parsedData.skills : [],
      experiences: Array.isArray(parsedData.experiences) ? parsedData.experiences : [],
      education: Array.isArray(parsedData.education) ? parsedData.education : [],
      certifications: Array.isArray(parsedData.certifications) ? parsedData.certifications : [],
      languages: Array.isArray(parsedData.languages) ? parsedData.languages : [],
    };

    console.log("Parsed CV data:", result);

    return new Response(
      JSON.stringify({ data: result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("CV Parser error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to parse CV";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
