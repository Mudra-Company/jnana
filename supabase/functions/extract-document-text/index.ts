import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ExtractRequest {
  document_id: string;
  file_path: string;
  mime_type: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { document_id, file_path, mime_type } = await req.json() as ExtractRequest;

    if (!document_id || !file_path) {
      return new Response(
        JSON.stringify({ error: "document_id and file_path are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Update status to processing
    await supabase
      .from("karma_bot_documents")
      .update({ extraction_status: "processing" })
      .eq("id", document_id);

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("karma-documents")
      .download(file_path);

    if (downloadError || !fileData) {
      console.error("Download error:", downloadError);
      await supabase
        .from("karma_bot_documents")
        .update({ extraction_status: "failed" })
        .eq("id", document_id);
      
      return new Response(
        JSON.stringify({ error: "Failed to download file", details: downloadError?.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let extractedText = "";

    // Handle different file types
    if (mime_type === "text/plain") {
      // TXT files - read directly
      extractedText = await fileData.text();
    } else if (
      mime_type === "application/pdf" ||
      mime_type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      // PDF/DOCX - use Lovable AI (Gemini) for extraction
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      
      if (!LOVABLE_API_KEY) {
        throw new Error("LOVABLE_API_KEY not configured");
      }

      // Convert file to base64
      const arrayBuffer = await fileData.arrayBuffer();
      const base64Content = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
      );

      // Determine mime type for Gemini
      const geminiMimeType = mime_type === "application/pdf" 
        ? "application/pdf" 
        : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

      // Call Lovable AI Gateway with file
      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Estrai tutto il testo da questo documento. Mantieni la formattazione originale il più possibile. Restituisci SOLO il testo estratto, senza commenti aggiuntivi."
                },
                {
                  type: "file",
                  file: {
                    filename: file_path.split("/").pop(),
                    file_data: `data:${geminiMimeType};base64,${base64Content}`
                  }
                }
              ]
            }
          ],
          max_completion_tokens: 16000,
        }),
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error("AI extraction error:", aiResponse.status, errorText);
        throw new Error(`AI extraction failed: ${aiResponse.status}`);
      }

      const aiResult = await aiResponse.json();
      extractedText = aiResult.choices?.[0]?.message?.content || "";
    } else {
      // Unsupported type - try to read as text anyway
      try {
        extractedText = await fileData.text();
      } catch {
        extractedText = `[Formato non supportato: ${mime_type}]`;
      }
    }

    // Update document with extracted text
    const { error: updateError } = await supabase
      .from("karma_bot_documents")
      .update({
        extracted_text: extractedText,
        extraction_status: extractedText ? "completed" : "failed",
      })
      .eq("id", document_id);

    if (updateError) {
      console.error("Update error:", updateError);
      throw updateError;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        extracted_length: extractedText.length,
        status: extractedText ? "completed" : "failed"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Extract document error:", error);
    
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
