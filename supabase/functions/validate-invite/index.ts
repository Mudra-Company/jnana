// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verifyInvite } from "../_shared/invite-token.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { token } = await req.json();
    if (!token) {
      return new Response(JSON.stringify({ valid: false, reason: "missing_token" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const v = await verifyInvite(token);
    if (!v.valid) {
      return new Response(JSON.stringify({ valid: false, reason: v.reason }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: member, error } = await admin
      .from("company_members")
      .select("id, company_id, placeholder_email, placeholder_first_name, placeholder_last_name, job_title, status, user_id, invite_accepted_at, pending_role_id, personal_message")
      .eq("id", v.payload!.mid)
      .eq("company_id", v.payload!.cid)
      .maybeSingle();

    if (error || !member) {
      return new Response(JSON.stringify({ valid: false, reason: "member_not_found" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (member.invite_accepted_at || member.user_id) {
      return new Response(JSON.stringify({ valid: false, reason: "already_accepted" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: company } = await admin
      .from("companies").select("id, name, logo_url").eq("id", member.company_id).maybeSingle();

    let role: { id: string; title: string } | null = null;
    if (member.pending_role_id) {
      const { data: r } = await admin
        .from("company_roles").select("id, title").eq("id", member.pending_role_id).maybeSingle();
      role = r ?? null;
    }

    return new Response(
      JSON.stringify({
        valid: true,
        member: {
          id: member.id,
          email: member.placeholder_email,
          firstName: member.placeholder_first_name,
          lastName: member.placeholder_last_name,
          jobTitle: member.job_title,
          personalMessage: member.personal_message,
        },
        company,
        role,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    console.error("validate-invite error", e);
    return new Response(JSON.stringify({ valid: false, reason: "internal_error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
