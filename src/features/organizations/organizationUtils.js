const TURKISH_CHARACTERS = {
  ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u',
  Ç: 'c', Ğ: 'g', İ: 'i', Ö: 'o', Ş: 's', Ü: 'u',
};

const ROLE_LABELS = {
  owner: 'Sahip',
  admin: 'Yönetici',
  project_manager: 'Proje Yöneticisi',
  member: 'Ekip Üyesi',
};

export function createOrganizationSlug(name) {
  return String(name || '')
    .replace(/[çğıöşüÇĞİÖŞÜ]/g, character => TURKISH_CHARACTERS[character])
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

export function getOrganizationRoleLabel(role) {
  return ROLE_LABELS[role] || 'Ekip Üyesi';
}

export function validateOrganization({ name, slug }) {
  const trimmedName = String(name || '').trim();
  if (trimmedName.length < 2) return 'Ajans adı en az 2 karakter olmalıdır.';
  if (trimmedName.length > 120) return 'Ajans adı en fazla 120 karakter olabilir.';
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return 'Çalışma alanı adresi yalnızca küçük harf, rakam ve tire içerebilir.';
  return '';
}

export function getOrganizationErrorMessage(error) {
  if (error?.code === '23505') return 'Bu çalışma alanı adresi kullanımda. Lütfen farklı bir adres deneyin.';
  if (error?.code === '23514') return 'Ajans adı veya çalışma alanı adresi geçerli değil.';
  return 'Çalışma alanı oluşturulamadı. Lütfen tekrar deneyin.';
}
