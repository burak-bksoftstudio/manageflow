import { createClient } from 'npm:@supabase/supabase-js@2';

const localOrigins = new Set([
  'http://127.0.0.1:5173',
  'http://localhost:5173',
]);
const allowedRoles = new Set(['admin', 'project_manager', 'member']);

function readNamedKey(dictionaryName: string, legacyName: string) {
  const dictionary = Deno.env.get(dictionaryName);
  if (dictionary) {
    const keys = JSON.parse(dictionary);
    if (keys.default) return keys.default as string;
  }
  return Deno.env.get(legacyName);
}

function resolveAppOrigin(requestOrigin: string | null) {
  const configuredOrigin = Deno.env.get('MANAGEFLOW_APP_URL')?.replace(/\/$/, '');
  if (requestOrigin && (localOrigins.has(requestOrigin) || requestOrigin === configuredOrigin)) return requestOrigin;
  if (!requestOrigin) return configuredOrigin || 'http://127.0.0.1:5173';
  return null;
}

function corsHeaders(origin: string | null) {
  return {
    ...(origin ? { 'Access-Control-Allow-Origin': origin } : {}),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
    Vary: 'Origin',
  };
}

function response(body: Record<string, unknown>, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders(origin) });
}

function normalizeText(value: unknown, maxLength: number) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLength);
}

function isExistingUserError(error: { code?: string; message?: string }) {
  const message = String(error.message || '').toLowerCase();
  return error.code === 'user_already_exists'
    || error.code === 'email_exists'
    || message.includes('already registered')
    || message.includes('already exists');
}

async function createTokenHash() {
  const token = crypto.getRandomValues(new Uint8Array(32));
  const digest = await crypto.subtle.digest('SHA-256', token);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async request => {
  const requestOrigin = request.headers.get('Origin');
  const appOrigin = resolveAppOrigin(requestOrigin);

  if (request.method === 'OPTIONS') {
    if (!appOrigin) return response({ error: 'Bu origin için istek izni yok.' }, 403, null);
    return new Response(null, { status: 204, headers: corsHeaders(appOrigin) });
  }
  if (request.method !== 'POST') return response({ error: 'Yalnızca POST isteği desteklenir.' }, 405, appOrigin);
  if (!appOrigin) return response({ error: 'Bu origin için istek izni yok.' }, 403, null);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const publishableKey = readNamedKey('SUPABASE_PUBLISHABLE_KEYS', 'SUPABASE_ANON_KEY');
  const secretKey = readNamedKey('SUPABASE_SECRET_KEYS', 'SUPABASE_SERVICE_ROLE_KEY');
  const authorization = request.headers.get('Authorization');

  if (!supabaseUrl || !publishableKey || !secretKey || !authorization) {
    return response({ error: 'Davet servisi yapılandırması eksik.' }, 500, appOrigin);
  }

  const userClient = createClient(supabaseUrl, publishableKey, {
    global: { headers: { Authorization: authorization } },
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
  const adminClient = createClient(supabaseUrl, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
  const mailClient = createClient(supabaseUrl, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });

  const { data: { user }, error: userError } = await userClient.auth.getUser();
  if (userError || !user) return response({ error: 'Oturum geçersiz veya süresi dolmuş.' }, 401, appOrigin);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return response({ error: 'Geçerli bir JSON gövdesi gönderin.' }, 400, appOrigin);
  }

  const organizationId = normalizeText(body.organizationId, 36);
  const fullName = normalizeText(body.fullName, 120);
  const email = normalizeText(body.email, 254).toLowerCase();
  const role = normalizeText(body.role, 32);
  const department = normalizeText(body.department, 80) || null;
  const title = normalizeText(body.title, 120);

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(organizationId)) {
    return response({ error: 'Organizasyon bilgisi geçersiz.' }, 400, appOrigin);
  }
  if (fullName.length < 3 || !fullName.includes(' ')) return response({ error: 'Ad ve soyadı birlikte girin.' }, 400, appOrigin);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return response({ error: 'Geçerli bir e-posta adresi girin.' }, 400, appOrigin);
  if (!allowedRoles.has(role)) return response({ error: 'Davet rolü geçersiz.' }, 400, appOrigin);
  if (title.length < 2) return response({ error: 'Görev unvanını girin.' }, 400, appOrigin);

  const { data: actorMembership, error: membershipError } = await userClient
    .from('organization_members')
    .select('role, status')
    .eq('organization_id', organizationId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (membershipError || !actorMembership || actorMembership.status !== 'active' || !['owner', 'admin'].includes(actorMembership.role)) {
    return response({ error: 'Bu çalışma alanına ekip üyesi davet etme yetkiniz yok.' }, 403, appOrigin);
  }

  const { data: matchingProfiles } = await userClient
    .from('profiles')
    .select('id')
    .ilike('email', email);
  if (matchingProfiles?.length) {
    const { data: existingMembership } = await userClient
      .from('organization_members')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('user_id', matchingProfiles[0].id)
      .eq('status', 'active')
      .maybeSingle();
    if (existingMembership) return response({ error: 'Bu e-posta adresi çalışma alanında zaten bulunuyor.' }, 409, appOrigin);
  }

  await userClient
    .from('organization_invitations')
    .update({ status: 'expired' })
    .eq('organization_id', organizationId)
    .ilike('email', email)
    .eq('status', 'pending')
    .lte('expires_at', new Date().toISOString());

  const invitationId = crypto.randomUUID();
  const tokenHash = await createTokenHash();
  const { data: invitation, error: invitationError } = await userClient
    .from('organization_invitations')
    .insert({
      id: invitationId,
      organization_id: organizationId,
      email,
      full_name: fullName,
      role,
      department,
      title,
      token_hash: tokenHash,
      invited_by: user.id,
    })
    .select('id, organization_id, email, full_name, role, department, title, status, expires_at, created_at')
    .single();

  if (invitationError) {
    if (invitationError.code === '23505') return response({ error: 'Bu e-posta adresi için zaten bekleyen bir davet var.' }, 409, appOrigin);
    console.error('Invitation insert failed', invitationError.code);
    return response({ error: 'Davet kaydı oluşturulamadı.' }, 500, appOrigin);
  }

  const redirectTo = `${appOrigin}/davet-kabul?davet=${invitationId}`;
  const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName, manageflow_invitation_id: invitationId },
    redirectTo,
  });

  let deliveryMode = 'invite';
  let deliveryError = inviteError;
  if (inviteError && isExistingUserError(inviteError)) {
    const { error: magicLinkError } = await mailClient.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false, emailRedirectTo: redirectTo },
    });
    deliveryMode = 'magic_link';
    deliveryError = magicLinkError;
  }

  if (deliveryError) {
    await adminClient.from('organization_invitations').delete().eq('id', invitationId);
    console.error('Invitation email failed', deliveryError.code || deliveryError.message);
    return response({ error: 'Davet e-postası gönderilemedi. SMTP ve Auth yönlendirme ayarlarını kontrol edin.' }, 502, appOrigin);
  }

  return response({ invitation, deliveryMode }, 201, appOrigin);
});

