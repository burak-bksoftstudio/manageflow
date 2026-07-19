const AUTH_ERROR_MESSAGES = {
  email_not_confirmed: 'Giriş yapmadan önce e-posta adresinizi doğrulamanız gerekiyor.',
  invalid_credentials: 'E-posta adresi veya şifre hatalı.',
  over_request_rate_limit: 'Çok fazla deneme yapıldı. Lütfen kısa bir süre sonra tekrar deneyin.',
  same_password: 'Yeni şifreniz mevcut şifrenizden farklı olmalıdır.',
  signup_disabled: 'Yeni kullanıcı kaydı şu anda kapalı.',
  user_already_exists: 'Bu e-posta adresiyle daha önce bir hesap oluşturulmuş.',
  weak_password: 'Şifreniz yeterince güçlü değil.',
};

export function getAuthErrorMessage(error) {
  if (!error) return '';
  if (error.code && AUTH_ERROR_MESSAGES[error.code]) return AUTH_ERROR_MESSAGES[error.code];

  const message = String(error.message || '').toLowerCase();
  if (message.includes('invalid login credentials')) return AUTH_ERROR_MESSAGES.invalid_credentials;
  if (message.includes('email not confirmed')) return AUTH_ERROR_MESSAGES.email_not_confirmed;
  if (message.includes('already registered') || message.includes('already exists')) return AUTH_ERROR_MESSAGES.user_already_exists;
  if (message.includes('password')) return 'Şifre işlemi tamamlanamadı. Şifre kurallarını kontrol edip tekrar deneyin.';
  return 'İşlem şu anda tamamlanamadı. Lütfen tekrar deneyin.';
}

export function resolveAppUrl(configuredUrl = '', runtimeOrigin = window.location.origin) {
  const candidate = String(configuredUrl || '').trim() || runtimeOrigin;
  try {
    const url = new URL(candidate);
    const localHttp = url.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(url.hostname);
    if (url.protocol !== 'https:' && !localHttp) return String(runtimeOrigin).replace(/\/$/, '');
    return url.origin;
  } catch {
    return String(runtimeOrigin).replace(/\/$/, '');
  }
}

export function getAuthRedirectUrl(path, origin = resolveAppUrl(import.meta.env.VITE_APP_URL, window.location.origin)) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${origin.replace(/\/$/, '')}${normalizedPath}`;
}

function getAuthCallbackParameters(hash = '', search = '') {
  const hashParams = new URLSearchParams(String(hash).replace(/^#/, ''));
  const searchParams = new URLSearchParams(String(search).replace(/^\?/, ''));
  return {
    errorDescription: hashParams.get('error_description') || searchParams.get('error_description') || '',
    type: hashParams.get('type') || searchParams.get('type') || '',
  };
}

export function getPasswordRecoveryState({ event, session, hash = '', search = '' }) {
  const parameters = getAuthCallbackParameters(hash, search);
  const recoveryEvent = event === 'PASSWORD_RECOVERY' || parameters.type === 'recovery';
  return {
    errorDescription: parameters.errorDescription,
    ready: Boolean(session && recoveryEvent && !parameters.errorDescription),
  };
}

export function getUserIdentity(user) {
  const email = user?.email || '';
  const emailName = email.split('@')[0] || 'Kullanıcı';
  const fullName = String(user?.user_metadata?.full_name || emailName).trim();
  const parts = fullName.split(/\s+/).filter(Boolean);
  const initials = parts.slice(0, 2).map(part => part[0]?.toLocaleUpperCase('tr-TR')).join('') || 'MF';

  return {
    avatarUrl: user?.user_metadata?.avatar_url || '',
    email,
    fullName,
    firstName: parts[0] || 'Kullanıcı',
    initials,
  };
}

export function validatePassword(password) {
  if (password.length < 8) return 'Şifre en az 8 karakter olmalıdır.';
  if (!/[a-zçğıöşü]/i.test(password) || !/\d/.test(password)) {
    return 'Şifre en az bir harf ve bir rakam içermelidir.';
  }
  return '';
}
