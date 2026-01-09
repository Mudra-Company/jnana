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

interface ProfileData {
  firstName?: string;
  lastName?: string;
  profileCode?: string;
  headline?: string;
  bio?: string;
  experiences?: Array<{ role: string; company: string; isCurrent?: boolean }>;
  education?: Array<{ degree: string; institution: string }>;
  skills?: string[];
  jobTitle?: string;
  companyContext?: string;
}

interface BotConfig {
  id: string;
  bot_type: string;
  system_prompt: string;
  objectives: Array<{ id: string; label: string; enabled: boolean }>;
  profile_inputs: Record<string, boolean>;
  model: string;
  max_exchanges: number;
  temperature: number;
  closing_patterns: string[];
  is_active: boolean;
}

interface BotDocument {
  id: string;
  extracted_text: string | null;
  file_name: string;
  is_active: boolean;
}

/**
 * Replace template variables in the system prompt with actual profile data
 */
function processTemplateVariables(prompt: string, profileData: ProfileData): string {
  let processed = prompt;

  // Basic replacements
  processed = processed.replace(/\{\{firstName\}\}/g, profileData.firstName || 'Candidato');
  processed = processed.replace(/\{\{lastName\}\}/g, profileData.lastName || '');
  processed = processed.replace(/\{\{profileCode\}\}/g, profileData.profileCode || '');
  processed = processed.replace(/\{\{headline\}\}/g, profileData.headline || '');
  processed = processed.replace(/\{\{bio\}\}/g, profileData.bio || '');
  processed = processed.replace(/\{\{jobTitle\}\}/g, profileData.jobTitle || '');
  processed = processed.replace(/\{\{companyContext\}\}/g, profileData.companyContext || '');

  // Format experiences
  if (profileData.experiences && profileData.experiences.length > 0) {
    const expList = profileData.experiences
      .slice(0, 5)
      .map(exp => `- ${exp.role} presso ${exp.company}${exp.isCurrent ? ' (attuale)' : ''}`)
      .join('\n');
    processed = processed.replace(/\{\{experiences\}\}/g, expList);
  } else {
    processed = processed.replace(/\{\{experiences\}\}/g, 'Nessuna esperienza indicata');
  }

  // Format education
  if (profileData.education && profileData.education.length > 0) {
    const eduList = profileData.education
      .slice(0, 3)
      .map(edu => `- ${edu.degree} presso ${edu.institution}`)
      .join('\n');
    processed = processed.replace(/\{\{education\}\}/g, eduList);
  } else {
    processed = processed.replace(/\{\{education\}\}/g, 'Nessuna formazione indicata');
  }

  // Format skills
  if (profileData.skills && profileData.skills.length > 0) {
    processed = processed.replace(/\{\{skills\}\}/g, profileData.skills.slice(0, 10).join(', '));
  } else {
    processed = processed.replace(/\{\{skills\}\}/g, 'Nessuna competenza indicata');
  }

  return processed;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      messages, 
      botType = 'karma_talents', 
      profileData = {} 
    }: { 
      messages: ChatMessage[]; 
      botType?: string;
      profileData?: ProfileData;
    } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Initialize Supabase client with service role for reading config
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Supabase credentials not configured");
      throw new Error("Database credentials not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch active bot configuration
    console.log(`[karma-chat] Fetching config for bot_type: ${botType}`);
    const { data: configData, error: configError } = await supabase
      .from('karma_bot_configs')
      .select('*')
      .eq('bot_type', botType)
      .eq('is_active', true)
      .single();

    if (configError || !configData) {
      console.error('[karma-chat] Config fetch error:', configError);
      throw new Error(`No active configuration found for bot type: ${botType}`);
    }

    const config = configData as BotConfig;
    console.log(`[karma-chat] Using config v${config.max_exchanges} with model ${config.model}`);

    // Fetch active documents for knowledge base
    const { data: docsData, error: docsError } = await supabase
      .from('karma_bot_documents')
      .select('id, extracted_text, file_name, is_active')
      .eq('bot_type', botType)
      .eq('is_active', true);

    if (docsError) {
      console.warn('[karma-chat] Documents fetch warning:', docsError);
    }

    const documents = (docsData || []) as BotDocument[];
    console.log(`[karma-chat] Loaded ${documents.length} active documents`);

    // Process system prompt with template variables
    let systemPrompt = processTemplateVariables(config.system_prompt, profileData);

    // Append knowledge base context if documents exist
    if (documents.length > 0) {
      const knowledgeContext = documents
        .filter(doc => doc.extracted_text)
        .map(doc => `\n--- Documento: ${doc.file_name} ---\n${doc.extracted_text}`)
        .join('\n');

      if (knowledgeContext) {
        systemPrompt += `\n\n## KNOWLEDGE BASE\nUtilizza le seguenti informazioni come contesto aggiuntivo:\n${knowledgeContext}`;
      }
    }

    // Build enabled objectives list
    const enabledObjectives = (config.objectives || [])
      .filter((obj: { enabled: boolean }) => obj.enabled)
      .map((obj: { label: string }) => obj.label);

    if (enabledObjectives.length > 0) {
      systemPrompt += `\n\n## OBIETTIVI DEL COLLOQUIO\nConcentrati su questi aspetti:\n${enabledObjectives.map((o: string) => `- ${o}`).join('\n')}`;
    }

    console.log(`[karma-chat] Starting chat with ${messages.length} messages, prompt length: ${systemPrompt.length}`);

    // Build messages array with system prompt first
    const apiMessages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...messages.map(m => ({
        role: m.role === "user" ? "user" as const : "assistant" as const,
        content: m.content
      }))
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
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
      
      return new Response(
        JSON.stringify({ error: "Errore nel servizio AI" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[karma-chat] Streaming response started");

    // Return the stream directly
    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("[karma-chat] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
