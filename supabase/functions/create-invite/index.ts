// @ts-nocheck — Deno types only at runtime
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { signInvite } from "../_shared/invite-token.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Body {
  email: string;
  firstName?: string;
  lastName?: string;
  companyId: string;
  roleId?: string;       // company_roles.id (optional)
  orgNodeId?: string;    // org_nodes.id (optional)
  jobTitle?: string;
  personalMessage?: string;
  expiresInDays?: number; // default 14
}

const handler = async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Authenticated client to identify caller
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

    const caller = userData.user;
    const body = (await req.json()) as Body;

    if (!body.email || !body.companyId) {
      return new Response(JSON.stringify({ error: "missing_required_fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Service client for cross-table writes
    const admin = createClient(supabaseUrl, serviceKey);

    // Authorization: caller must be company admin/hr of this company OR super admin
    const { data: hrCheck } = await admin.rpc("is_company_hr", {
      _user_id: caller.id, _company_id: body.companyId,
    });
    const { data: superCheck } = await admin.rpc("has_role", {
      _user_id: caller.id, _role: "super_admin",
    });
    if (!hrCheck && !superCheck) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const email = body.email.toLowerCase().trim();

    // Check for existing member with same placeholder_email or user
    const { data: existing } = await admin
      .from("company_members")
      .select("id, status, user_id, placeholder_email, invite_accepted_at")
      .eq("company_id", body.companyId)
      .or(`placeholder_email.eq.${email}`)
      .maybeSingle();

    const expiresInDays = body.expiresInDays ?? 14;
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

    let memberId: string;

    if (existing) {
      if (existing.invite_accepted_at || existing.user_id) {
        return new Response(JSON.stringify({ error: "already_member" }), {
          status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      memberId = existing.id;
    } else {
      const { data: created, error: createErr } = await admin
        .from("company_members")
        .insert({
          company_id: body.companyId,
          placeholder_email: email,
          placeholder_first_name: body.firstName ?? null,
          placeholder_last_name: body.lastName ?? null,
          job_title: body.jobTitle ?? null,
          status: "pending",
          role: "user",
          invited_by: caller.id,
          personal_message: body.personalMessage ?? null,
          pending_role_id: body.roleId ?? null,
          department_id: body.orgNodeId ?? null,
          invite_expires_at: expiresAt.toISOString(),
        })
        .select("id")
        .single();
      if (createErr) {
        console.error("create member error", createErr);
        return new Response(JSON.stringify({ error: "create_member_failed", details: createErr.message }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      memberId = created.id;
    }

    // Sign token
    const token = await signInvite({
      mid: memberId,
      cid: body.companyId,
      exp: Math.floor(expiresAt.getTime() / 1000),
    });

    // Persist token + status
    await admin
      .from("company_members")
      .update({
        invite_token: token,
        invite_expires_at: expiresAt.toISOString(),
        invited_at: new Date().toISOString(),
        status: "invited",
      })
      .eq("id", memberId);

    // Fetch company + caller info for email
    const { data: company } = await admin
      .from("companies").select("name, logo_url").eq("id", body.companyId).maybeSingle();
    const { data: callerProfile } = await admin
      .from("profiles").select("first_name, last_name").eq("id", caller.id).maybeSingle();
    const inviterName = callerProfile
      ? `${callerProfile.first_name ?? ""} ${callerProfile.last_name ?? ""}`.trim()
      : "";

    let roleTitle: string | null = null;
    if (body.roleId) {
      const { data: r } = await admin
        .from("company_roles").select("title").eq("id", body.roleId).maybeSingle();
      roleTitle = r?.title ?? null;
    }

    const appUrl = Deno.env.get("APP_URL") || "https://mudra.holdings";
    const acceptUrl = `${appUrl}/invite/accept?token=${encodeURIComponent(token)}`;

    const isReminder = !!existing && !existing.invite_accepted_at;

    try {
      await fetch(`${supabaseUrl}/functions/v1/send-invite-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({
          employeeEmail: email,
          employeeName: `${body.firstName ?? ""} ${body.lastName ?? ""}`.trim() || email,
          companyName: company?.name ?? "la tua azienda",
          inviterName,
          companyId: body.companyId,
          memberId,
          acceptUrl,
          roleTitle,
          personalMessage: body.personalMessage ?? null,
          isReminder,
          expiresAt: expiresAt.toISOString(),
        }),
      });
    } catch (e) {
      console.error("email dispatch failed", e);
    }

    return new Response(
      JSON.stringify({
        success: true,
        memberId,
        token,
        acceptUrl,
        expiresAt: expiresAt.toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    console.error("create-invite error", e);
    return new Response(JSON.stringify({ error: e?.message ?? "internal_error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
