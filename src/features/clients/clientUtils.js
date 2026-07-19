export const CLIENT_STATUS_LABELS = {
  lead: 'Potansiyel',
  active: 'Aktif',
  inactive: 'Pasif',
};

export const CLIENT_STATUS_VALUES = Object.fromEntries(
  Object.entries(CLIENT_STATUS_LABELS).map(([value, label]) => [label, value]),
);

export function canManageClients(role) {
  return ['owner', 'admin', 'project_manager'].includes(role);
}

export function getClientInitials(name) {
  return String(name || '').trim().split(/\s+/).filter(Boolean).slice(0, 2)
    .map(part => part[0].toLocaleUpperCase('tr-TR')).join('') || 'MF';
}

export function validateClient(form) {
  const name = String(form.name || '').trim();
  const contactName = String(form.contactName || '').trim();
  const email = String(form.email || '').trim();
  const phone = String(form.phone || '').trim();
  const industry = String(form.industry || '').trim();
  const notes = String(form.notes || '').trim();

  if (name.length < 2) return 'Müşteri veya firma adı en az 2 karakter olmalıdır.';
  if (name.length > 160) return 'Müşteri veya firma adı en fazla 160 karakter olabilir.';
  if (contactName.length > 120) return 'Yetkili kişi adı en fazla 120 karakter olabilir.';
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Geçerli bir e-posta adresi girin.';
  if (phone.length > 40) return 'Telefon bilgisi en fazla 40 karakter olabilir.';
  if (industry.length > 100) return 'Sektör bilgisi en fazla 100 karakter olabilir.';
  if (notes.length > 2000) return 'Notlar en fazla 2000 karakter olabilir.';
  if (!CLIENT_STATUS_LABELS[form.status]) return 'Geçerli bir müşteri durumu seçin.';
  return '';
}

export function mapDatabaseClient(client) {
  return {
    id: client.id,
    name: client.name,
    initials: getClientInitials(client.name),
    contactName: client.contact_name || 'Yetkili belirtilmedi',
    email: client.email || 'E-posta belirtilmedi',
    phone: client.phone || 'Telefon belirtilmedi',
    industry: client.industry || 'Sektör belirtilmedi',
    status: client.status,
    notes: client.notes || '',
    createdAt: client.created_at,
    createdAtLabel: new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit', month: 'short', year: 'numeric',
    }).format(new Date(client.created_at)),
  };
}

export function filterClients(clients, { query, status }) {
  const normalizedQuery = query.trim().toLocaleLowerCase('tr-TR');
  return clients.filter(client => {
    const searchText = `${client.name} ${client.contactName} ${client.email} ${client.industry}`.toLocaleLowerCase('tr-TR');
    return searchText.includes(normalizedQuery) && (status === 'all' || client.status === status);
  });
}

export function getClientStats(clients) {
  return {
    total: clients.length,
    active: clients.filter(client => client.status === 'active').length,
    leads: clients.filter(client => client.status === 'lead').length,
    industries: new Set(
      clients.map(client => client.industry).filter(industry => industry && industry !== 'Sektör belirtilmedi'),
    ).size,
  };
}

export function getClientErrorMessage(error) {
  if (error?.code === '23505') return 'Bu isimde bir müşteri çalışma alanında zaten bulunuyor.';
  if (error?.code === '23514') return 'Müşteri bilgilerinden biri geçerli değil.';
  if (error?.code === '42501') return 'Bu çalışma alanında müşteri oluşturma yetkiniz yok.';
  return 'Müşteri kaydedilemedi. Bağlantınızı kontrol edip tekrar deneyin.';
}
