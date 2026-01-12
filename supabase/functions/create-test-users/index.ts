// deno-lint-ignore-file
// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TEST_USERS = [
  {
    email: 'eva.squarcia@test.mudra.team',
    password: 'TestKarma2025!',
    firstName: 'Eva',
    lastName: 'Squarcia',
  },
  {
    email: 'francesca.arbitani@test.mudra.team',
    password: 'TestKarma2025!',
    firstName: 'Francesca',
    lastName: 'Arbitani',
  },
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const results = [];

    for (const user of TEST_USERS) {
      try {
        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
          user_metadata: {
            first_name: user.firstName,
            last_name: user.lastName,
          },
        });

        if (authError) {
          // Check if user already exists
          if (authError.message?.includes('already been registered')) {
            results.push({
              email: user.email,
              password: user.password,
              success: true,
              message: 'User already exists - you can login with these credentials',
            });
            continue;
          }
          throw authError;
        }

        const userId = authData.user?.id;

        if (userId) {
          // The handle_new_user trigger should create the profile automatically
          // But let's ensure it exists with correct data
          await supabase.from('profiles').upsert({
            id: userId,
            email: user.email,
            first_name: user.firstName,
            last_name: user.lastName,
          }, { onConflict: 'id' });

          results.push({
            email: user.email,
            password: user.password,
            userId,
            success: true,
            message: 'User created successfully',
          });
        }
      } catch (error) {
        results.push({
          email: user.email,
          password: user.password,
          success: false,
          error: error.message,
        });
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Test users creation completed',
        results,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
