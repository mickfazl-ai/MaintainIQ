import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify the caller is a master admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('No authorization header')

    // Create a client with the caller's token to verify their role
    const callerClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userErr } = await callerClient.auth.getUser()
    if (userErr || !user) throw new Error('Not authenticated')

    const { data: roleData } = await callerClient
      .from('user_roles')
      .select('role')
      .eq('email', user.email)
      .single()

    if (roleData?.role !== 'master') throw new Error('Not authorised — master role required')

    // Service role client for admin operations
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const body = await req.json()
    const {
      company_name, industry, contact_name, contact_email,
      contact_phone, address, asset_limit, plan, features, temp_password,
    } = body

    if (!company_name || !contact_email) {
      throw new Error('company_name and contact_email are required')
    }

    // 1. Create company record
    const { data: company, error: coErr } = await adminClient
      .from('companies')
      .insert({
        name:          company_name,
        industry,
        contact_name,
        contact_email: contact_email.toLowerCase(),
        contact_phone,
        address,
        asset_limit:   parseInt(asset_limit) || 50,
        plan:          plan || 'standard',
        features:      features || {},
        status:        'active',
        created_at:    new Date().toISOString(),
      })
      .select()
      .single()

    if (coErr) throw new Error('Company creation failed: ' + coErr.message)

    // 2. Create auth user with temp password (service role — allowed server-side)
    const { data: authData, error: authErr } = await adminClient.auth.admin.createUser({
      email:         contact_email.toLowerCase(),
      password:      temp_password,
      email_confirm: true,
      user_metadata: {
        company_id:             company.id,
        company_name,
        role:                   'admin',
        name:                   contact_name || contact_email.split('@')[0],
        force_password_change:  true,
      },
    })

    if (authErr) {
      // Rollback company
      await adminClient.from('companies').delete().eq('id', company.id)
      throw new Error('Auth user creation failed: ' + authErr.message)
    }

    // 3. Create user_roles record
    const { error: roleErr } = await adminClient.from('user_roles').insert({
      email:                  contact_email.toLowerCase(),
      name:                   contact_name || contact_email.split('@')[0],
      role:                   'admin',
      company_id:             company.id,
      force_password_change:  true,
    })

    if (roleErr) {
      // Rollback
      await adminClient.auth.admin.deleteUser(authData.user.id)
      await adminClient.from('companies').delete().eq('id', company.id)
      throw new Error('Role assignment failed: ' + roleErr.message)
    }

    // 4. Log onboarding (non-critical)
    await adminClient.from('company_onboarding_log').insert({
      company_id:         company.id,
      admin_email:        contact_email.toLowerCase(),
      temp_password_hint: temp_password.slice(0, 3) + '***',
      status:             'created',
      created_at:         new Date().toISOString(),
    }).then(() => {})

    return new Response(
      JSON.stringify({ success: true, company }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
