import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface PairData {
  userA: string;
  userB: string;
  deskA: string;
  deskB: string;
  score: number;
  level: string;
  insights: string[];
  breakdown: Record<string, number>;
}

interface DeskInfo {
  id: string;
  label: string;
  roomName: string;
  assigneeName: string;
  memberId: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { pairs, desks, globalAverage } = (await req.json()) as {
      pairs: PairData[];
      desks: DeskInfo[];
      globalAverage: number;
    };

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `Sei un consulente esperto di organizzazione degli spazi di lavoro. 
Analizza i dati di compatibilità spaziale e suggerisci scambi di scrivania per ottimizzare la disposizione del team.

Regole:
- Suggerisci al massimo 5 scambi concreti
- Ogni suggerimento deve specificare chi spostare e dove
- Spiega brevemente perché lo scambio migliorerebbe la situazione
- Considera sia le coppie critiche (score basso) che quelle eccellenti (score alto)
- Se lo score globale è già alto (>70%), indica che la disposizione è buona e suggerisci solo micro-ottimizzazioni
- Rispondi SOLO con la chiamata alla funzione suggest_swaps`;

    const userMessage = `Analizza questa disposizione ufficio:

Score Globale: ${globalAverage}%
Numero coppie adiacenti: ${pairs.length}

Scrivanie assegnate:
${desks.map(d => `- ${d.label} (${d.roomName}): ${d.assigneeName}`).join('\n')}

Coppie adiacenti con score:
${pairs.map(p => `- ${p.userA} ↔ ${p.userB}: ${p.score}% (${p.level}) [Comm: ${p.breakdown.communicationFlow}, RIASEC: ${p.breakdown.riasecComplementarity}, Conflitto: ${p.breakdown.conflictRisk}]`).join('\n')}

Insight rilevanti:
${pairs.flatMap(p => p.insights).filter(Boolean).slice(0, 10).join('\n')}

Suggerisci scambi di scrivania per migliorare la compatibilità complessiva.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_swaps",
              description: "Return desk swap suggestions to optimize spatial compatibility.",
              parameters: {
                type: "object",
                properties: {
                  overallAssessment: {
                    type: "string",
                    description: "Brief overall assessment of the current layout (1-2 sentences in Italian).",
                  },
                  suggestions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        personA: { type: "string", description: "Name of person A to swap" },
                        deskA: { type: "string", description: "Current desk label of person A" },
                        personB: { type: "string", description: "Name of person B to swap" },
                        deskB: { type: "string", description: "Current desk label of person B" },
                        reason: { type: "string", description: "Brief reason for the swap in Italian" },
                        expectedImprovement: { type: "string", enum: ["high", "medium", "low"] },
                      },
                      required: ["personA", "deskA", "personB", "deskB", "reason", "expectedImprovement"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["overallAssessment", "suggestions"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_swaps" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit superato, riprova tra poco." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crediti AI esauriti." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Errore AI gateway" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      return new Response(JSON.stringify({ error: "No suggestions returned" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const suggestions = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(suggestions), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("spacesync-optimize error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
