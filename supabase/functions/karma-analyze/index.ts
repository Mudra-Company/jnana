import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TranscriptMessage {
  role: string;
  text: string;
}

interface KarmaAnalysis {
  summary: string;
  soft_skills: string[];
  primary_values: string[];
  risk_factors: string[];
  seniority_assessment: "Junior" | "Mid" | "Senior" | "Lead" | "C-Level";
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transcript }: { transcript: TranscriptMessage[] } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`[karma-analyze] Analyzing transcript with ${transcript.length} messages`);

    // Convert transcript to readable format
    const conversationText = transcript
      .map(m => `${m.role.toUpperCase()}: ${m.text}`)
      .join("\n");

    const systemPrompt = `Sei un Senior HR Assessor e Psicologo del Lavoro.
Analizza la seguente trascrizione di colloquio per creare un profilo onesto e "chirurgico" del candidato.
Non essere buonista: identifica sia i punti di forza che i potenziali rischi (Luce e Ombra).

ISTRUZIONI DI ANALISI:
Analizza non solo il contenuto esplicito, ma anche lo stile comunicativo, la sintassi, le esitazioni e le contraddizioni.

Devi chiamare la funzione analyze_candidate con i risultati della tua analisi.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro", // Use Pro for analysis (more accurate)
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `TRASCRIZIONE DEL COLLOQUIO:\n${conversationText}` }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "analyze_candidate",
              description: "Genera un'analisi strutturata del candidato basata sul colloquio Karma AI",
              parameters: {
                type: "object",
                properties: {
                  summary: {
                    type: "string",
                    description: "Sintesi professionale del candidato in terza persona (max 300 caratteri)"
                  },
                  soft_skills: {
                    type: "array",
                    items: { type: "string" },
                    description: "5 Soft Skills distintive emerse (es. 'Gestione dell'ambiguità', 'Comunicazione persuasiva')"
                  },
                  primary_values: {
                    type: "array",
                    items: { type: "string" },
                    description: "3-4 valori cardine che guidano le scelte (es. 'Meritocrazia', 'Status', 'Sicurezza')"
                  },
                  risk_factors: {
                    type: "array",
                    items: { type: "string" },
                    description: "2-3 potenziali comportamenti tossici, limitanti o rischi (es. 'Tendenza al micromanagement', 'Bassa tolleranza allo stress')"
                  },
                  seniority_assessment: {
                    type: "string",
                    enum: ["Junior", "Mid", "Senior", "Lead", "C-Level"],
                    description: "Livello di seniority valutato"
                  }
                },
                required: ["summary", "soft_skills", "primary_values", "risk_factors", "seniority_assessment"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "analyze_candidate" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[karma-analyze] AI gateway error: ${response.status}`, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite di richieste superato. Riprova tra qualche secondo." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Crediti AI esauriti. Contatta l'amministratore." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("[karma-analyze] Raw response:", JSON.stringify(data));

    // Extract tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "analyze_candidate") {
      console.error("[karma-analyze] No valid tool call in response");
      throw new Error("Invalid response from AI");
    }

    const analysis: KarmaAnalysis = JSON.parse(toolCall.function.arguments);
    console.log("[karma-analyze] Analysis complete:", analysis);

    // Transform to camelCase for frontend
    const result = {
      summary: analysis.summary,
      softSkills: analysis.soft_skills,
      primaryValues: analysis.primary_values,
      riskFactors: analysis.risk_factors,
      seniorityAssessment: analysis.seniority_assessment
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[karma-analyze] Error:", error);
    
    // Return fallback analysis
    const fallback = {
      summary: "Analisi automatica non disponibile. Il candidato ha completato il colloquio.",
      softSkills: ["Comunicazione", "Impegno", "Adattabilità"],
      primaryValues: ["Professionalità", "Crescita"],
      riskFactors: ["Dati insufficienti per valutazione completa"],
      seniorityAssessment: "Mid"
    };
    
    return new Response(JSON.stringify(fallback), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
