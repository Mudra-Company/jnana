import { supabase } from '../integrations/supabase/client';

export async function seedAdminUser() {
  const adminEmail = 'giuseppe.ciniero@mudra.team';
  const adminPassword = 'Mudra2025!';
  const duurrCompanyId = '11111111-1111-1111-1111-111111111111';
  const rootNodeId = 'd0000001-0000-0000-0000-000000000001';

  console.log('Creating admin user...');

  // 1. Sign up the admin user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: adminEmail,
    password: adminPassword,
    options: {
      emailRedirectTo: window.location.origin,
      data: {
        first_name: 'Giuseppe',
        last_name: 'Ciniero'
      }
    }
  });

  if (authError) {
    if (authError.message.includes('already registered')) {
      console.log('User already exists, fetching...');
      // Try to sign in to get the user ID
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: adminEmail,
        password: adminPassword
      });
      
      if (signInError) {
        console.error('Failed to sign in existing user:', signInError);
        return { success: false, error: signInError };
      }
      
      const userId = signInData.user?.id;
      if (userId) {
        await assignAdminRole(userId, duurrCompanyId, rootNodeId);
        return { success: true, userId };
      }
    }
    console.error('Auth error:', authError);
    return { success: false, error: authError };
  }

  const userId = authData.user?.id;
  if (!userId) {
    return { success: false, error: new Error('No user ID returned') };
  }

  console.log('User created with ID:', userId);

  // Wait a moment for the trigger to create the profile
  await new Promise(resolve => setTimeout(resolve, 1000));

  await assignAdminRole(userId, duurrCompanyId, rootNodeId);

  return { success: true, userId };
}

async function assignAdminRole(userId: string, companyId: string, departmentId: string) {
  // 2. Assign super_admin role
  console.log('Assigning super_admin role...');
  const { error: roleError } = await supabase
    .from('user_roles')
    .upsert({ 
      user_id: userId, 
      role: 'super_admin' 
    }, { 
      onConflict: 'user_id,role' 
    });

  if (roleError) {
    console.error('Role assignment error:', roleError);
  }

  // 3. Add as company admin member
  console.log('Adding to company as admin...');
  const { error: memberError } = await supabase
    .from('company_members')
    .insert([{
      user_id: userId,
      company_id: companyId,
      role: 'admin' as const,
      status: 'completed' as const,
      department_id: departmentId,
      joined_at: new Date().toISOString()
    }]);

  if (memberError) {
    console.error('Company member error:', memberError);
  }

  // 4. Update profile with job title
  console.log('Updating profile...');
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      job_title: 'Super Admin',
      first_name: 'Giuseppe',
      last_name: 'Ciniero'
    })
    .eq('id', userId);

  if (profileError) {
    console.error('Profile update error:', profileError);
  }

  console.log('Admin setup complete!');
}
