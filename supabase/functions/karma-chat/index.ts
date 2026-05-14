// @ts-nocheck - Deno types not available in Vite
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

const CLIMATE_DIMENSION_LABELS: Record<string, string> = {
  belonging: "Senso di Appartenenza",
  org_change: "Organizzazione e Cambiamento",
  my_job: "Il Mio Lavoro",
  remuneration: "La Mia Remunerazione",
  boss: "Rapporto con il Capo",
  unit: "La Mia Unità (Team)",
  responsibility: "Responsabilità",
  human: "Aspetto Umano",
  identity: "Identità",
};

const SENIORITY_RANK: Record<string, number> = {
  junior: 1, mid: 2, senior: 3, lead: 4, "c-level": 5,
  Junior: 1, Mid: 2, Senior: 3, Lead: 4, "C-Level": 5,
};

function fmtSkillsRequired(skills: any[]): string {
  if (!skills?.length) return "—";
  return skills.map((s) => `- ${s.name}${s.level ? ` (Lv ${s.level} richiesto)` : ""}${s.mandatory === false ? " [opzionale]" : ""}`).join("\n");
}

function fmtUserSkillsLeveled(skills: Array<{ name: string; level: number; category?: string }>): string {
  if (!skills?.length) return "Nessuna competenza dichiarata";
  return skills.map((s) => `- ${s.name} (Lv ${s.level} attuale${s.category ? `, ${s.category}` : ""})`).join("\n");
}

function buildSkillGap(required: any[], userSkills: Array<{ name: string; level: number }>): {
  matched: Array<{ name: string; required: number; observed: number }>;
  missing: Array<{ name: string; required: number }>;
  underleveled: Array<{ name: string; required: number; observed: number }>;
} {
  const userMap = new Map(userSkills.map((s) => [s.name.toLowerCase(), s.level]));
  const matched: any[] = [];
  const missing: any[] = [];
  const underleveled: any[] = [];
  for (const r of required || []) {
    const observed = userMap.get((r.name || "").toLowerCase());
    const reqLvl = r.level || 3;
    if (observed === undefined) {
      missing.push({ name: r.name, required: reqLvl });
    } else if (observed < reqLvl) {
      underleveled.push({ name: r.name, required: reqLvl, observed });
    } else {
      matched.push({ name: r.name, required: reqLvl, observed });
    }
  }
  return { matched, missing, underleveled };
}

function fmtGapMarkdown(gap: ReturnType<typeof buildSkillGap>): string {
  const parts: string[] = [];
  if (gap.matched.length) {
    parts.push("**Già coperte:** " + gap.matched.map((m) => `${m.name} (Lv ${m.observed}≥${m.required})`).join(", "));
  }
  if (gap.underleveled.length) {
    parts.push("**Sotto-livello da approfondire:**\n" + gap.underleveled.map((m) => `- ${m.name}: persona Lv ${m.observed}, ruolo richiede Lv ${m.required}`).join("\n"));
  }
  if (gap.missing.length) {
    parts.push("**Non dichiarate dal candidato:** " + gap.missing.map((m) => `${m.name} (Lv ${m.required})`).join(", "));
  }
  return parts.join("\n\n") || "Nessun gap rilevante.";
}

function fmtClimateScores(scores: Record<string, number> | null): string {
  if (!scores) return "—";
  return Object.entries(scores)
    .map(([k, v]) => `- ${CLIMATE_DIMENSION_LABELS[k] || k}: ${typeof v === "number" ? v.toFixed(1) : v}/5`)
    .join("\n");
}

function processTemplate(prompt: string, vars: Record<string, string>): string {
  let out = prompt;
  for (const [k, v] of Object.entries(vars)) {
    out = out.replace(new RegExp(`\\{\\{${k}\\}\\}`, "g"), v ?? "");
  }
  return out;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, botType = "karma_talents", profileData = {}, roleId = null, scenario = null } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) throw new Error("Database credentials not configured");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1) Active config (filter by scenario when provided, else by bot_type+active)
    let configQuery = supabase
      .from("karma_bot_configs")
      .select("*")
      .eq("bot_type", botType)
      .eq("is_active", true);
    if (scenario) configQuery = configQuery.eq("scenario", scenario);
    const { data: configData, error: configError } = await configQuery.maybeSingle();
    if (configError) console.warn("[karma-chat] config error:", configError.message);
    if (!configData) {
      // fallback: any active for bot_type
      const { data: fallback } = await supabase
        .from("karma_bot_configs").select("*").eq("bot_type", botType).eq("is_active", true).limit(1).maybeSingle();
      if (!fallback) throw new Error(`No active config for bot_type=${botType}`);
      Object.assign(configData = {}, fallback);
    }
    const config = configData as any;
    const allowed = (config.allowed_inputs || {}) as Record<string, boolean>;
    const isAllowed = (key: string) => allowed[key] !== false; // default-on if not specified

    // 2) Documents
    const { data: docsData } = await supabase
      .from("karma_bot_documents").select("id, extracted_text, file_name, is_active")
      .eq("bot_type", botType).eq("is_active", true);
    const documents = docsData || [];

    // 3) Resolve role context (only if jnana / role_fit context useful)
    let roleCtx: any = null;
    let userId: string | null = profileData.userId || null;
    if (botType === "jnana" || roleId) {
      let resolvedRoleId = roleId;
      // If not provided but we have a userId, take primary assignment
      if (!resolvedRoleId && userId) {
        const { data: assignment } = await supabase
          .from("company_role_assignments")
          .select("role_id")
          .eq("user_id", userId)
          .eq("assignment_type", "primary")
          .is("end_date", null)
          .limit(1)
          .maybeSingle();
        resolvedRoleId = assignment?.role_id || null;
      }
      if (resolvedRoleId) {
        const { data: role } = await supabase
          .from("company_roles")
          .select("id,title,description,responsibilities,daily_tasks,kpis,required_hard_skills,required_soft_skills,required_seniority,required_languages,required_certifications,years_experience_min,years_experience_max,ccnl_level,contract_type,remote_policy,collaboration_profile")
          .eq("id", resolvedRoleId).maybeSingle();
        roleCtx = role || null;
      }
    }

    // 4) User hard skills with proficiency level
    let userHardSkillsLeveled: Array<{ name: string; level: number; category?: string }> = [];
    if (userId && isAllowed("hard_skills_leveled")) {
      const { data: uhs } = await supabase
        .from("user_hard_skills")
        .select("proficiency_level, custom_skill_name, hard_skills_catalog(name,category)")
        .eq("user_id", userId);
      userHardSkillsLeveled = (uhs || []).map((row: any) => ({
        name: row.hard_skills_catalog?.name || row.custom_skill_name || "Skill",
        level: row.proficiency_level || 3,
        category: row.hard_skills_catalog?.category,
      }));
    }

    // 5) Climate dimension scores
    let climateScores: Record<string, number> | null = null;
    if (userId && isAllowed("climate_dimensions")) {
      const { data: cr } = await supabase
        .from("climate_responses")
        .select("section_averages, overall_average, submitted_at")
        .eq("user_id", userId)
        .order("submitted_at", { ascending: false })
        .limit(1).maybeSingle();
      if (cr?.section_averages) climateScores = cr.section_averages;
    }

    // 6) Previous karma sessions (last 2 summaries)
    let previousSummaries = "";
    if (userId && isAllowed("karma_history")) {
      const { data: prev } = await supabase
        .from("karma_sessions")
        .select("scenario, summary, completed_at")
        .eq("user_id", userId)
        .not("summary", "is", null)
        .order("completed_at", { ascending: false })
        .limit(2);
      previousSummaries = (prev || [])
        .map((p: any) => `- [${p.scenario || "n/d"} • ${(p.completed_at || "").slice(0, 10)}] ${p.summary}`)
        .join("\n");
    }

    // 7) Compute gap
    const gap = roleCtx
      ? buildSkillGap(roleCtx.required_hard_skills || [], userHardSkillsLeveled)
      : { matched: [], missing: [], underleveled: [] };

    // Seniority gap
    let seniorityGapTxt = "—";
    if (roleCtx?.required_seniority && profileData.seniority) {
      const reqR = SENIORITY_RANK[roleCtx.required_seniority] || 0;
      const obsR = SENIORITY_RANK[profileData.seniority] || 0;
      if (reqR && obsR) {
        const delta = obsR - reqR;
        seniorityGapTxt = delta === 0
          ? `Allineata (${profileData.seniority})`
          : delta > 0
            ? `Sopra il livello richiesto (persona ${profileData.seniority} vs ${roleCtx.required_seniority})`
            : `Sotto il livello richiesto (persona ${profileData.seniority} vs ${roleCtx.required_seniority})`;
      }
    }

    // 8) Build template variables
    const vars: Record<string, string> = {
      firstName: profileData.firstName || "Candidato",
      lastName: profileData.lastName || "",
      profileCode: profileData.profileCode || "",
      headline: profileData.headline || "",
      bio: profileData.bio || "",
      jobTitle: profileData.jobTitle || roleCtx?.title || "",
      companyContext: profileData.companyContext || "",
      experiences: (profileData.experiences || []).slice(0, 5).map((e: any) => `- ${e.role} @ ${e.company}${e.isCurrent ? " (attuale)" : ""}`).join("\n") || "Nessuna esperienza indicata",
      education: (profileData.education || []).slice(0, 3).map((e: any) => `- ${e.degree} @ ${e.institution}`).join("\n") || "Nessuna formazione indicata",
      skills: (profileData.skills || []).slice(0, 12).join(", ") || "—",
      // Org context
      orgNodeName: profileData.orgNodeName || "Non specificato",
      orgNodeType: profileData.orgNodeType || "",
      directReports: String(profileData.directReports ?? 0),
      teamSize: String(profileData.teamSize ?? 0),
      orgLevel: String(profileData.orgLevel ?? 0),
      isManager: String(profileData.isManager ?? false),
      managerName: profileData.managerName || "N/A",
      // Role context
      roleTitle: roleCtx?.title || "—",
      roleDescription: roleCtx?.description || "—",
      requiredHardSkills: fmtSkillsRequired(roleCtx?.required_hard_skills || []),
      requiredSoftSkills: fmtSkillsRequired(roleCtx?.required_soft_skills || []),
      requiredSeniority: roleCtx?.required_seniority || "—",
      kpis: (roleCtx?.kpis || []).map((k: any) => `- ${k.name}${k.target ? ` (target: ${k.target})` : ""}`).join("\n") || "—",
      responsibilities: (roleCtx?.responsibilities || []).map((r: string) => `- ${r}`).join("\n") || "—",
      dailyTasks: (roleCtx?.daily_tasks || []).map((t: string) => `- ${t}`).join("\n") || "—",
      userHardSkillsLeveled: fmtUserSkillsLeveled(userHardSkillsLeveled),
      skillGap: fmtGapMarkdown(gap),
      seniorityGap: seniorityGapTxt,
      climateScores: fmtClimateScores(climateScores),
      collaborationLinks: roleCtx?.collaboration_profile?.links?.length
        ? roleCtx.collaboration_profile.links.map((l: any) => `- ${l.targetLabel} (${l.collaborationPercentage}% del tempo, affinità ${l.personalAffinity}/5)`).join("\n")
        : "—",
      previousKarmaSummary: previousSummaries || "Nessun colloquio precedente.",
    };

    let systemPrompt = processTemplate(config.system_prompt, vars);

    // Discussion style
    const style = config.discussion_style || {};
    if (style.max_response_sentences || style.tone) {
      systemPrompt += `\n\n## STILE\n`;
      if (style.tone) systemPrompt += `- Tono: ${style.tone}\n`;
      if (style.max_response_sentences) systemPrompt += `- Limita ogni tua risposta a max ${style.max_response_sentences} frasi.\n`;
      if (style.language) systemPrompt += `- Lingua: ${style.language}\n`;
      if (style.follow_up_depth) systemPrompt += `- Profondità follow-up: ${style.follow_up_depth}\n`;
    }

    // Knowledge base
    const kb = documents.filter((d: any) => d.extracted_text).map((d: any) => `\n--- ${d.file_name} ---\n${d.extracted_text}`).join("\n");
    if (kb) systemPrompt += `\n\n## KNOWLEDGE BASE\n${kb}`;

    // Objectives
    const enabledObjectives = (config.objectives || []).filter((o: any) => o.enabled).map((o: any) => o.label);
    if (enabledObjectives.length) {
      systemPrompt += `\n\n## OBIETTIVI DEL COLLOQUIO\n${enabledObjectives.map((o: string) => `- ${o}`).join("\n")}`;
    }

    // Stop after N exchanges
    if (config.max_exchanges) {
      systemPrompt += `\n\n## LIMITE\nConcludi il colloquio dopo circa ${config.max_exchanges} scambi, riassumendo i punti emersi.`;
    }

    console.log(`[karma-chat] scenario=${config.scenario} role=${roleCtx?.title || "n/a"} prompt=${systemPrompt.length}ch`);

    const apiMessages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...messages.map((m: any) => ({
        role: m.role === "user" ? "user" as const : "assistant" as const,
        content: m.content,
      })),
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: config.model || "google/gemini-2.5-flash",
        messages: apiMessages,
        stream: true,
        temperature: config.temperature || 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[karma-chat] AI gateway error: ${response.status}`, errorText);
      if (response.status === 429) return new Response(JSON.stringify({ error: "Limite richieste superato." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "Crediti AI esauriti." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ error: "Errore servizio AI" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Connection": "keep-alive" },
    });
  } catch (error) {
    console.error("[karma-chat] Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
