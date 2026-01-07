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
    const appUrl = Deno.env.get("APP_URL") || "https://e4ad29b8-93fe-4ec2-96d9-004df5b23aa1.lovableproject.com";
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

    // Send the invite email
    const emailResponse = await resend.emails.send({
      from: "Jnana <noreply@resend.dev>", // Replace with your verified domain
      to: [employeeEmail],
      subject: `${inviterName || companyName} ti ha invitato su Jnana`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Invito su Jnana</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #6B9080 0%, #4A7C6F 100%); padding: 40px 40px 30px;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                        Jnana
                      </h1>
                      <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">
                        People Intelligence Platform
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="margin: 0 0 16px; color: #18181b; font-size: 24px; font-weight: 600;">
                        Ciao ${employeeName}! 👋
                      </h2>
                      
                      <p style="margin: 0 0 24px; color: #52525b; font-size: 16px; line-height: 1.6;">
                        ${inviterName ? `<strong>${inviterName}</strong> di` : ''} <strong>${companyName}</strong> ti ha invitato a completare il tuo profilo professionale su Jnana.
                      </p>
                      
                      <div style="background-color: #f0fdf4; border-left: 4px solid #6B9080; padding: 16px 20px; border-radius: 0 8px 8px 0; margin: 24px 0;">
                        <p style="margin: 0; color: #166534; font-size: 14px; font-weight: 500;">
                          ✨ Cosa ti aspetta:
                        </p>
                        <ul style="margin: 12px 0 0 0; padding-left: 20px; color: #166534; font-size: 14px; line-height: 1.8;">
                          <li>Test RIASEC per scoprire le tue attitudini professionali</li>
                          <li>Colloquio con Karma AI per analizzare le tue soft skills</li>
                          <li>Report personalizzato sul tuo profilo professionale</li>
                        </ul>
                      </div>
                      
                      <p style="margin: 24px 0; color: #52525b; font-size: 16px; line-height: 1.6;">
                        Il processo richiede circa <strong>15-20 minuti</strong> e ti aiuterà a comprendere meglio le tue potenzialità.
                      </p>
                      
                      <!-- CTA Button -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="padding: 24px 0;">
                            <a href="${signupUrl}" 
                               style="display: inline-block; background: linear-gradient(135deg, #6B9080 0%, #4A7C6F 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; padding: 16px 40px; border-radius: 12px; box-shadow: 0 4px 14px rgba(107, 144, 128, 0.4);">
                              Inizia ora →
                            </a>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="margin: 24px 0 0; color: #a1a1aa; font-size: 13px; line-height: 1.6;">
                        Se il pulsante non funziona, copia e incolla questo link nel browser:<br>
                        <a href="${signupUrl}" style="color: #6B9080; word-break: break-all;">${signupUrl}</a>
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #fafafa; padding: 24px 40px; border-top: 1px solid #e4e4e7;">
                      <p style="margin: 0; color: #a1a1aa; font-size: 12px; text-align: center;">
                        Questa email è stata inviata da Jnana per conto di ${companyName}.<br>
                        Se non riconosci questa richiesta, puoi ignorare questa email.
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

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: (emailResponse as any)?.id || 'sent',
        message: `Invito inviato a ${employeeEmail}` 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-invite-email function:", error);
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
