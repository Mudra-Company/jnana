// @ts-nocheck - Deno types not available in Vite
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TranscriptMessage { role: string; text: string; }

// Default schemas per scenario — used when config.output_schema is empty
const DEFAULT_SCHEMAS: Record<string, any> = {
  discovery: {
    fields: [
      { name: "summary", type: "string", required: true, description: "Sintesi professionale del candidato (max 300 caratteri)" },
      { name: "soft_skills", type: "array_string", required: true, description: "5 soft skill distintive emerse" },
      { name: "primary_values", type: "array_string", required: true, description: "3-4 valori cardine" },
      { name: "risk_factors", type: "array_string", required: true, description: "2-3 potenziali rischi/comportamenti tossici" },
      { name: "seniority_assessment", type: "enum", enum: ["Junior","Mid","Senior","Lead","C-Level"], required: true },
      { name: "career_aspirations", type: "object_aspirations", required: false },
      { name: "confidence_overall", type: "number", required: false, description: "Confidenza analisi 0-1" },
    ],
  },
  role_fit: {
    fields: [
      { name: "summary", type: "string", required: true, description: "Sintesi del fit con il ruolo (max 400 caratteri)" },
      { name: "skill_assessments", type: "array_skill_assessment", required: true, description: "Per OGNI hard skill richiesta dal ruolo, stima il livello osservato 1-5 (o null se non emerso) con evidenza testuale e confidenza" },
      { name: "soft_skill_assessments", type: "array_soft_assessment", required: true, description: "Per ogni soft skill richiesta dal ruolo, indica se emersa, con evidenza" },
      { name: "manager_fit_signals", type: "object_manager_fit", required: false },
      { name: "growth_areas", type: "array_growth", required: true, description: "Aree di sviluppo prioritarie con azioni suggerite" },
      { name: "career_aspirations", type: "object_aspirations", required: true },
      { name: "alerts", type: "array_string", required: false, description: "Bandierine: retention_risk, burnout_signal, mismatch_role, ecc." },
      { name: "seniority_assessment", type: "enum", enum: ["Junior","Mid","Senior","Lead","C-Level"], required: true },
      { name: "soft_skills", type: "array_string", required: true, description: "Top 5 soft skill emerse" },
      { name: "risk_factors", type: "array_string", required: true },
      { name: "confidence_overall", type: "number", required: true },
    ],
  },
  climate_pulse: {
    fields: [
      { name: "summary", type: "string", required: true },
      { name: "culture_fit", type: "array_culture_fit", required: true, description: "Per ognuna delle 9 dimensioni clima (belonging, org_change, my_job, remuneration, boss, unit, responsibility, human, identity), stima 1-5 con evidenza" },
      { name: "alerts", type: "array_string", required: true },
      { name: "growth_areas", type: "array_growth", required: false },
      { name: "soft_skills", type: "array_string", required: false },
      { name: "primary_values", type: "array_string", required: false },
      { name: "risk_factors", type: "array_string", required: false },
      { name: "seniority_assessment", type: "enum", enum: ["Junior","Mid","Senior","Lead","C-Level"], required: false },
      { name: "confidence_overall", type: "number", required: true },
    ],
  },
};

// Convert our compact field types to JSON Schema
function fieldToJsonSchema(field: any): any {
  switch (field.type) {
    case "string": return { type: "string", description: field.description };
    case "number": return { type: "number", description: field.description };
    case "enum": return { type: "string", enum: field.enum, description: field.description };
    case "array_string": return { type: "array", items: { type: "string" }, description: field.description };
    case "array_skill_assessment": return {
      type: "array", description: field.description,
      items: {
        type: "object",
        properties: {
          skillName: { type: "string" },
          requiredLevel: { type: "number" },
          observedLevel: { type: ["number", "null"] },
          evidence: { type: "string" },
          confidence: { type: "string", enum: ["low","medium","high"] },
        },
        required: ["skillName","requiredLevel","observedLevel","evidence","confidence"],
        additionalProperties: false,
      },
    };
    case "array_soft_assessment": return {
      type: "array", description: field.description,
      items: {
        type: "object",
        properties: {
          skillName: { type: "string" },
          present: { type: "boolean" },
          evidence: { type: "string" },
          confidence: { type: "string", enum: ["low","medium","high"] },
        },
        required: ["skillName","present","evidence","confidence"],
        additionalProperties: false,
      },
    };
    case "array_culture_fit": return {
      type: "array", description: field.description,
      items: {
        type: "object",
        properties: {
          dimension: { type: "string", enum: ["belonging","org_change","my_job","remuneration","boss","unit","responsibility","human","identity"] },
          score: { type: "number" },
          evidence: { type: "string" },
        },
        required: ["dimension","score","evidence"],
        additionalProperties: false,
      },
    };
    case "object_manager_fit": return {
      type: "object", description: field.description,
      properties: {
        score: { type: "number" },
        themes: { type: "array", items: { type: "string" } },
        red_flags: { type: "array", items: { type: "string" } },
      },
      required: ["score","themes","red_flags"],
      additionalProperties: false,
    };
    case "array_growth": return {
      type: "array", description: field.description,
      items: {
        type: "object",
        properties: {
          area: { type: "string" },
          suggestedActions: { type: "array", items: { type: "string" } },
        },
        required: ["area","suggestedActions"],
        additionalProperties: false,
      },
    };
    case "object_aspirations": return {
      type: "object", description: field.description,
      properties: {
        shortTerm: { type: "string" },
        longTerm: { type: "string" },
        mobilityWillingness: { type: "string", enum: ["low","medium","high"] },
        mentorshipInterest: { type: "boolean" },
      },
      required: ["shortTerm","longTerm","mobilityWillingness","mentorshipInterest"],
      additionalProperties: false,
    };
    default: return { type: "string", description: field.description };
  }
}

function buildToolFromSchema(schema: any) {
  const fields = schema?.fields || [];
  const properties: any = {};
  const required: string[] = [];
  for (const f of fields) {
    properties[f.name] = fieldToJsonSchema(f);
    if (f.required) required.push(f.name);
  }
  return {
    type: "function",
    function: {
      name: "analyze_candidate",
      description: "Analisi strutturata della sessione Karma",
      parameters: { type: "object", properties, required, additionalProperties: false },
    },
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const {
      transcript,
      botType = "karma_talents",
      scenario = null,
      sessionId = null,
      roleId = null,
      roleContext = null,
    }: { transcript: TranscriptMessage[]; botType?: string; scenario?: string | null; sessionId?: string | null; roleId?: string | null; roleContext?: any } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = (supabaseUrl && supabaseServiceKey) ? createClient(supabaseUrl, supabaseServiceKey) : null;

    // Resolve schema: from active config (matching scenario) → fallback default by scenario → default discovery
    let resolvedScenario = scenario || (botType === "jnana" ? "role_fit" : "discovery");
    let outputSchema: any = null;
    if (supabase) {
      let q = supabase.from("karma_bot_configs").select("output_schema, scenario").eq("bot_type", botType).eq("is_active", true);
      if (scenario) q = q.eq("scenario", scenario);
      const { data } = await q.limit(1).maybeSingle();
      if (data?.output_schema && Array.isArray(data.output_schema?.fields) && data.output_schema.fields.length > 0) {
        outputSchema = data.output_schema;
      }
      if (data?.scenario) resolvedScenario = data.scenario;
    }
    if (!outputSchema) outputSchema = DEFAULT_SCHEMAS[resolvedScenario] || DEFAULT_SCHEMAS.discovery;

    const tool = buildToolFromSchema(outputSchema);

    const conversationText = transcript.map((m) => `${m.role.toUpperCase()}: ${m.text}`).join("\n");

    const systemPrompt = `Sei un Senior HR Assessor e Psicologo del Lavoro.
Analizza il colloquio in modo onesto e chirurgico (luce e ombra), valutando contenuto, stile comunicativo, esitazioni e contraddizioni.
${roleContext ? `\nIl colloquio riguarda il ruolo target seguente. Per ogni hard skill richiesta devi fornire un livello osservato (1-5) o null se non emerso.\n${JSON.stringify(roleContext)}\n` : ""}
Devi chiamare la funzione analyze_candidate rispettando ESATTAMENTE lo schema.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `TRASCRIZIONE:\n${conversationText}` },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "analyze_candidate" } },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[karma-analyze] AI gateway error: ${response.status}`, errorText);
      if (response.status === 429) return new Response(JSON.stringify({ error: "Limite richieste superato." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "Crediti AI esauriti." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "analyze_candidate") throw new Error("Invalid response from AI");

    const analysis: any = JSON.parse(toolCall.function.arguments);

    // Persist on session if requested
    if (supabase && sessionId) {
      const update: any = {
        scenario: resolvedScenario,
        role_id: roleId,
        summary: analysis.summary ?? null,
        soft_skills: analysis.soft_skills ?? null,
        primary_values: analysis.primary_values ?? null,
        risk_factors: analysis.risk_factors ?? null,
        seniority_assessment: analysis.seniority_assessment ?? null,
        skill_assessments: analysis.skill_assessments ?? null,
        soft_skill_assessments: analysis.soft_skill_assessments ?? null,
        culture_fit: analysis.culture_fit ?? null,
        manager_fit_signals: analysis.manager_fit_signals ?? null,
        growth_areas: analysis.growth_areas ?? null,
        career_aspirations: analysis.career_aspirations ?? null,
        alerts: analysis.alerts ?? null,
        confidence_overall: analysis.confidence_overall ?? null,
        completed_at: new Date().toISOString(),
      };
      const { error: upErr } = await supabase.from("karma_sessions").update(update).eq("id", sessionId);
      if (upErr) console.error("[karma-analyze] update session error:", upErr.message);
    }

    // Return camelCased result for backward-compat + raw analysis for new consumers
    const result = {
      summary: analysis.summary,
      softSkills: analysis.soft_skills,
      primaryValues: analysis.primary_values,
      riskFactors: analysis.risk_factors,
      seniorityAssessment: analysis.seniority_assessment,
      skillAssessments: analysis.skill_assessments,
      softSkillAssessments: analysis.soft_skill_assessments,
      cultureFit: analysis.culture_fit,
      managerFitSignals: analysis.manager_fit_signals,
      growthAreas: analysis.growth_areas,
      careerAspirations: analysis.career_aspirations,
      alerts: analysis.alerts,
      confidenceOverall: analysis.confidence_overall,
      scenario: resolvedScenario,
    };

    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("[karma-analyze] Error:", error);
    const fallback = {
      summary: "Analisi non disponibile. Il candidato ha completato il colloquio.",
      softSkills: ["Comunicazione","Impegno","Adattabilità"],
      primaryValues: ["Professionalità","Crescita"],
      riskFactors: ["Dati insufficienti"],
      seniorityAssessment: "Mid",
    };
    return new Response(JSON.stringify(fallback), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
