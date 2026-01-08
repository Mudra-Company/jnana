// @ts-nocheck - Deno types only available at runtime
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InviteEmailRequest {
  employeeEmail: string;
  employeeName: string;
  companyName: string;
  inviterName?: string;
  companyId: string;
  memberId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { 
      employeeEmail, 
      employeeName, 
      companyName, 
      inviterName,
      companyId,
      memberId 
    }: InviteEmailRequest = await req.json();

    // Validate required fields
    if (!employeeEmail || !employeeName || !companyName || !companyId || !memberId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Generate magic link for signup (employee will create account)
    // Use APP_URL env variable or fallback to the Lovable project URL
    const appUrl = Deno.env.get("APP_URL") || "https://mudra.holdings";
    const signupUrl = `${appUrl}?invite=${memberId}&company=${companyId}`;
    
    // Update member status to 'invited'
    const { error: updateError } = await supabase
      .from('company_members')
      .update({ 
        status: 'invited',
        invited_at: new Date().toISOString()
      })
      .eq('id', memberId);

    if (updateError) {
      console.error("Error updating member status:", updateError);
    }

    // Send the invite email - use configured sender or fallback
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "Jnana <noreply@mudra.business>";
    
    console.log("📧 Preparing email invite:");
    console.log("  → From:", fromEmail);
    console.log("  → To:", employeeEmail);
    console.log("  → Employee:", employeeName);
    console.log("  → Company:", companyName);
    console.log("  → Signup URL:", signupUrl);
    
    const emailResponse = await resend.emails.send({
      from: fromEmail,
      to: [employeeEmail],
      subject: `${inviterName || companyName} ti ha invitato su Jnana`,
      html: `
        <!DOCTYPE html>
        <html lang="it">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Invito su Jnana</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=DM+Sans:wght@400;500;600&display=swap');
          </style>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 48px 20px;">
            <tr>
              <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.12);">
                  
                  <!-- Header with MUDRA branding -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #4F7066 0%, #3A524B 100%); padding: 48px 40px 40px; text-align: center;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center">
                            <!-- MUDRA Logo Text -->
                            <h1 style="margin: 0; font-family: 'Montserrat', sans-serif; font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #ffffff; text-transform: uppercase;">
                              MUDRA
                            </h1>
                            <p style="margin: 12px 0 0; color: rgba(255,255,255,0.85); font-size: 13px; letter-spacing: 2px; text-transform: uppercase;">
                              People Intelligence Platform
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Jnana Badge -->
                  <tr>
                    <td align="center" style="padding: 0;">
                      <table cellpadding="0" cellspacing="0" style="transform: translateY(-20px);">
                        <tr>
                          <td style="background: linear-gradient(135deg, #4F7066 0%, #3A524B 100%); padding: 10px 24px; border-radius: 50px; box-shadow: 0 8px 24px rgba(79, 112, 102, 0.3);">
                            <span style="color: #ffffff; font-family: 'Montserrat', sans-serif; font-size: 14px; font-weight: 600; letter-spacing: 1px;">
                              ✨ JNANA
                            </span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 20px 48px 48px;">
                      <h2 style="margin: 0 0 20px; color: #1a1a1a; font-family: 'Montserrat', sans-serif; font-size: 28px; font-weight: 700; line-height: 1.3;">
                        Ciao ${employeeName}! 👋
                      </h2>
                      
                      <p style="margin: 0 0 28px; color: #4a5568; font-size: 17px; line-height: 1.7;">
                        ${inviterName ? `<strong style="color: #1a1a1a;">${inviterName}</strong> di` : ''} <strong style="color: #4F7066;">${companyName}</strong> ti ha invitato a completare il tuo profilo professionale su <strong style="color: #4F7066;">Jnana</strong>.
                      </p>
                      
                      <!-- Features Box -->
                      <div style="background: linear-gradient(145deg, #f0fdf4 0%, #e8f5f0 100%); border-radius: 16px; padding: 28px; margin: 28px 0; border: 1px solid rgba(79, 112, 102, 0.15);">
                        <p style="margin: 0 0 16px; color: #3A524B; font-family: 'Montserrat', sans-serif; font-size: 15px; font-weight: 600;">
                          ✨ Cosa ti aspetta:
                        </p>
                        <table cellpadding="0" cellspacing="0" width="100%">
                          <tr>
                            <td style="padding: 8px 0;">
                              <table cellpadding="0" cellspacing="0">
                                <tr>
                                  <td style="width: 32px; vertical-align: top;">
                                    <span style="font-size: 18px;">🎯</span>
                                  </td>
                                  <td style="color: #3A524B; font-size: 15px; line-height: 1.5;">
                                    <strong>Test RIASEC</strong> per scoprire le tue attitudini professionali
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0;">
                              <table cellpadding="0" cellspacing="0">
                                <tr>
                                  <td style="width: 32px; vertical-align: top;">
                                    <span style="font-size: 18px;">🤖</span>
                                  </td>
                                  <td style="color: #3A524B; font-size: 15px; line-height: 1.5;">
                                    <strong>Colloquio con Karma AI</strong> per analizzare le tue soft skills
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0;">
                              <table cellpadding="0" cellspacing="0">
                                <tr>
                                  <td style="width: 32px; vertical-align: top;">
                                    <span style="font-size: 18px;">📊</span>
                                  </td>
                                  <td style="color: #3A524B; font-size: 15px; line-height: 1.5;">
                                    <strong>Report personalizzato</strong> sul tuo profilo professionale
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                      </div>
                      
                      <!-- Time Info -->
                      <div style="text-align: center; margin: 32px 0;">
                        <span style="display: inline-block; background-color: #f0f0f5; color: #6b7280; font-size: 14px; padding: 10px 20px; border-radius: 50px;">
                          ⏱️ Tempo richiesto: <strong style="color: #1a1a1a;">15-20 minuti</strong>
                        </span>
                      </div>
                      
                      <!-- CTA Button -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="padding: 20px 0 32px;">
                            <a href="${signupUrl}" 
                               style="display: inline-block; background: linear-gradient(135deg, #4F7066 0%, #3A524B 100%); color: #ffffff; text-decoration: none; font-family: 'Montserrat', sans-serif; font-size: 16px; font-weight: 600; padding: 18px 48px; border-radius: 14px; box-shadow: 0 10px 30px rgba(79, 112, 102, 0.35); letter-spacing: 0.5px;">
                              Inizia ora →
                            </a>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Link fallback -->
                      <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.6; text-align: center;">
                        Se il pulsante non funziona, copia e incolla questo link nel browser:<br>
                        <a href="${signupUrl}" style="color: #4F7066; word-break: break-all; font-size: 11px;">${signupUrl}</a>
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Divider -->
                  <tr>
                    <td style="padding: 0 48px;">
                      <div style="height: 1px; background: linear-gradient(90deg, transparent 0%, #e5e7eb 50%, transparent 100%);"></div>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 32px 48px 40px; text-align: center;">
                      <!-- MUDRA Footer Logo -->
                      <p style="margin: 0 0 16px; font-family: 'Montserrat', sans-serif; font-size: 14px; font-weight: 700; letter-spacing: 3px; color: #4F7066;">
                        MUDRA
                      </p>
                      
                      <!-- Links -->
                      <p style="margin: 0 0 20px;">
                        <a href="https://mudra.holdings" style="color: #6b7280; text-decoration: none; font-size: 13px; margin: 0 12px;">Website</a>
                        <span style="color: #d1d5db;">•</span>
                        <a href="mailto:info@mudra.business" style="color: #6b7280; text-decoration: none; font-size: 13px; margin: 0 12px;">Contatti</a>
                      </p>
                      
                      <!-- Legal -->
                      <p style="margin: 0; color: #9ca3af; font-size: 11px; line-height: 1.6;">
                        Questa email è stata inviata da <strong>Jnana</strong> per conto di <strong>${companyName}</strong>.<br>
                        Se non riconosci questa richiesta, puoi ignorare questa email.
                      </p>
                      
                      <p style="margin: 16px 0 0; color: #d1d5db; font-size: 10px;">
                        © ${new Date().getFullYear()} MUDRA Srl — Tutti i diritti riservati
                      </p>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    console.log("✅ Email sent successfully:", emailResponse);

    // Check if there was an error in the response
    if ((emailResponse as any)?.error) {
      console.error("❌ Resend API error:", (emailResponse as any).error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: (emailResponse as any).error.message || "Email sending failed"
        }),
        {
          status: 422,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: (emailResponse as any)?.data?.id || (emailResponse as any)?.id || 'sent',
        message: `Invito inviato a ${employeeEmail}` 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("❌ Error in send-invite-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
