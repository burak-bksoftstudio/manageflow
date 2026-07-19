const HTTPS_URL_PATTERN = /^https:\/\//i;

export function canManageOrganizationSettings(role) {
  return ['owner', 'admin'].includes(role);
}

export function getSettingsInitials(name) {
  return String(name || '').trim().split(/\s+/).filter(Boolean).slice(0, 2)
    .map(part => part[0]?.toLocaleUpperCase('tr-TR')).join('') || 'MF';
}

function validateOptionalUrl(value, label) {
  const url = String(value || '').trim();
  if (!url) return '';
  if (url.length > 2048) return `${label} en fazla 2048 karakter olabilir.`;
  if (!HTTPS_URL_PATTERN.test(url)) return `${label} https:// ile başlamalıdır.`;
  try {
    new URL(url);
  } catch {
    return `${label} geçerli bir web adresi olmalıdır.`;
  }
  return '';
}

export function validateProfileSettings(form) {
  const fullName = String(form.fullName || '').trim();
  const phone = String(form.phone || '').trim();
  if (fullName.length < 2) return 'Ad soyad en az 2 karakter olmalıdır.';
  if (fullName.length > 120) return 'Ad soyad en fazla 120 karakter olabilir.';
  if (phone.length > 30) return 'Telefon numarası en fazla 30 karakter olabilir.';
  if (phone && !/^[0-9+().\s-]+$/.test(phone)) return 'Telefon numarası yalnızca rakam ve telefon işaretleri içerebilir.';
  return validateOptionalUrl(form.avatarUrl, 'Profil görseli adresi');
}

export function validateOrganizationSettings(form) {
  const name = String(form.name || '').trim();
  if (name.length < 2) return 'Ajans adı en az 2 karakter olmalıdır.';
  if (name.length > 120) return 'Ajans adı en fazla 120 karakter olabilir.';
  return validateOptionalUrl(form.logoUrl, 'Logo adresi');
}

export function normalizeProfileSettings(form) {
  return {
    fullName: String(form.fullName || '').trim(),
    phone: String(form.phone || '').trim(),
    avatarUrl: String(form.avatarUrl || '').trim(),
  };
}

export function normalizeOrganizationSettings(form) {
  return {
    name: String(form.name || '').trim(),
    logoUrl: String(form.logoUrl || '').trim(),
  };
}

export function mapDatabaseProfile(profile) {
  return {
    id: profile.id,
    fullName: profile.full_name || '',
    email: profile.email || '',
    phone: profile.phone || '',
    avatarUrl: profile.avatar_url || '',
  };
}

export function getSettingsErrorMessage(error, scope = 'settings') {
  if (error?.code === '42501') return scope === 'organization'
    ? 'Bu çalışma alanının ayarlarını değiştirme yetkiniz yok.'
    : 'Bu profil bilgilerini değiştirme yetkiniz yok.';
  if (error?.code === '23514') return 'Girilen bilgiler veritabanı kurallarıyla eşleşmiyor.';
  return 'Ayarlar kaydedilemedi. Bağlantınızı kontrol edip tekrar deneyin.';
}
