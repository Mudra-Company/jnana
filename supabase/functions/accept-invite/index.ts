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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") || "";
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const user = userData.user;

    const { token } = await req.json();
    if (!token) {
      return new Response(JSON.stringify({ error: "missing_token" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const v = await verifyInvite(token);
    if (!v.valid) {
      return new Response(JSON.stringify({ error: "invalid_token", reason: v.reason }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: member } = await admin
      .from("company_members")
      .select("*")
      .eq("id", v.payload!.mid)
      .eq("company_id", v.payload!.cid)
      .maybeSingle();

    if (!member) {
      return new Response(JSON.stringify({ error: "member_not_found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (member.invite_accepted_at || member.user_id) {
      return new Response(JSON.stringify({ error: "already_accepted" }), {
        status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Enforce email match (case-insensitive)
    const placeholder = (member.placeholder_email ?? "").toLowerCase().trim();
    const authEmail = (user.email ?? "").toLowerCase().trim();
    if (placeholder && placeholder !== authEmail) {
      return new Response(
        JSON.stringify({ error: "email_mismatch", expectedEmail: placeholder }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Reconcile member ↔ user
    const now = new Date().toISOString();
    const { error: updErr } = await admin
      .from("company_members")
      .update({
        user_id: user.id,
        status: "active",
        joined_at: now,
        invite_accepted_at: now,
        invite_token: null,
      })
      .eq("id", member.id);
    if (updErr) {
      console.error("update member error", updErr);
      return new Response(JSON.stringify({ error: "reconcile_failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Ensure 'user' role exists in user_roles
    await admin.from("user_roles").upsert(
      { user_id: user.id, role: "user" },
      { onConflict: "user_id,role", ignoreDuplicates: true },
    );

    // If a pending role assignment was attached, materialize it
    if (member.pending_role_id) {
      await admin.from("company_role_assignments").insert({
        role_id: member.pending_role_id,
        user_id: user.id,
        company_member_id: member.id,
        assignment_type: "primary",
        start_date: now.slice(0, 10),
        fte_percentage: 100,
      });
    }

    // Seed onboarding progress
    await admin.from("onboarding_progress").upsert(
      {
        user_id: user.id,
        company_id: member.company_id,
        flow: "b2b",
        current_step: "welcome",
        completed_steps: [],
      },
      { onConflict: "user_id,company_id" },
    );

    return new Response(
      JSON.stringify({
        success: true,
        companyId: member.company_id,
        roleId: member.pending_role_id,
        redirect: "B2B_ONBOARDING",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    console.error("accept-invite error", e);
    return new Response(JSON.stringify({ error: e?.message ?? "internal_error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
