export const initialProjects = [
  { id: 'project-web', name: 'Yeni web sitesi', clientId: 'client-atlas', client: 'Atlas Labs', progress: 72, status: 'Devam ediyor', statusValue: 'active', description: 'Kurumsal web sitesi yenileme çalışması', createdAt: '2026-06-15T10:00:00.000Z' },
  { id: 'project-mobile', name: 'Mobil uygulama', clientId: 'client-atlas', client: 'Atlas Labs', progress: 46, status: 'Planlandı', statusValue: 'planned', description: 'Mobil ürün tasarım ve geliştirme süreci', createdAt: '2026-07-01T09:30:00.000Z' },
  { id: 'project-brand', name: 'Marka yenileme', clientId: 'client-mono', client: 'Mono Coffee', progress: 91, status: 'Beklemede', statusValue: 'on_hold', description: 'Marka kimliği ve ambalaj tasarımı', createdAt: '2026-07-08T13:15:00.000Z' },
];

export const initialClients = [
  {
    id: 'client-atlas', name: 'Atlas Labs', initials: 'AL', contactName: 'Ayşe Kaya',
    email: 'ayse@atlaslabs.co', phone: '+90 212 555 12 12', industry: 'Yazılım', status: 'active',
    notes: '', createdAt: '2026-06-12T10:00:00.000Z', createdAtLabel: '12 Haz 2026',
  },
  {
    id: 'client-mono', name: 'Mono Coffee', initials: 'MC', contactName: 'Can Demir',
    email: 'can@monocoffee.co', phone: '+90 532 555 18 24', industry: 'Yiyecek & İçecek', status: 'lead',
    notes: '', createdAt: '2026-07-03T09:30:00.000Z', createdAtLabel: '03 Tem 2026',
  },
];


export const notifications = [
  'Ece yeni görevi sana atadı.',
  'Web sitesi projesinde yorum var.',
  'Toplantın 30 dakika sonra.',
];

export const agendaItems = [
  ['09:30', 'Haftalık ekip toplantısı', 'Toplantı'],
  ['12:00', 'Ana sayfa tasarımını gözden geçir', 'Görev'],
  ['15:30', 'Müşteri sunumu', 'Toplantı'],
];

export const initialTeamMembers = [
  {
    id: 'member-burak', name: 'Burak Enes', email: 'burak@manageflow.co', initials: 'BE',
    role: 'Sahip', department: 'Yönetim', title: 'Kurucu & Ajans Yöneticisi', status: 'active',
    joinedAt: '12 Oca 2026', lastActive: 'Şimdi', color: '#5b5ce2',
  },
  {
    id: 'member-ece', name: 'Ece Yılmaz', email: 'ece@northstudio.co', initials: 'EY',
    role: 'Yönetici', department: 'Tasarım', title: 'Kreatif Direktör', status: 'active',
    joinedAt: '03 Mar 2026', lastActive: '8 dk önce', color: '#e2705b',
  },
  {
    id: 'member-mert', name: 'Mert Kaya', email: 'mert@northstudio.co', initials: 'MK',
    role: 'Proje Yöneticisi', department: 'Operasyon', title: 'Senior Project Manager', status: 'active',
    joinedAt: '18 Mar 2026', lastActive: '24 dk önce', color: '#2f8f78',
  },
  {
    id: 'member-selin', name: 'Selin Akın', email: 'selin@northstudio.co', initials: 'SA',
    role: 'Ekip Üyesi', department: 'Tasarım', title: 'UI/UX Designer', status: 'active',
    joinedAt: '02 Nis 2026', lastActive: '1 sa önce', color: '#bd6aa7',
  },
  {
    id: 'member-can', name: 'Can Demir', email: 'can@northstudio.co', initials: 'CD',
    role: 'Ekip Üyesi', department: 'Yazılım', title: 'Frontend Developer', status: 'active',
    joinedAt: '21 Nis 2026', lastActive: '3 sa önce', color: '#3b82b6',
  },
  {
    id: 'member-deniz', name: 'Deniz Koç', email: 'deniz@northstudio.co', initials: 'DK',
    role: 'Ekip Üyesi', department: 'Pazarlama', title: 'Content Strategist', status: 'pending',
    joinedAt: 'Davet gönderildi', lastActive: 'Henüz katılmadı', color: '#c08b35',
  },
  {
    id: 'member-arda', name: 'Arda Tunç', email: 'arda@northstudio.co', initials: 'AT',
    role: 'Ekip Üyesi', department: 'Yazılım', title: 'Backend Developer', status: 'inactive',
    joinedAt: '14 Şub 2026', lastActive: '18 gün önce', color: '#7e7e78',
  },
];
