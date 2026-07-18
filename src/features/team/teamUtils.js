const DATABASE_ROLE_LABELS = {
  owner: 'Sahip',
  admin: 'Yönetici',
  project_manager: 'Proje Yöneticisi',
  member: 'Ekip Üyesi',
};

const ROLE_DATABASE_VALUES = Object.fromEntries(
  Object.entries(DATABASE_ROLE_LABELS).map(([databaseRole, label]) => [label, databaseRole]),
);

const memberColors = ['#5b5ce2', '#e2705b', '#2f8f78', '#bd6aa7', '#3b82b6', '#c08b35'];

export function getInitials(name) {
  return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0].toLocaleUpperCase('tr-TR')).join('');
}

export function getTeamRoleLabel(databaseRole) {
  return DATABASE_ROLE_LABELS[databaseRole] || 'Ekip Üyesi';
}

export function getTeamRoleValue(label) {
  return ROLE_DATABASE_VALUES[label] || 'member';
}

export function mapMembershipToTeamMember(membership, profile, currentUserId) {
  const name = profile?.full_name || profile?.email?.split('@')[0] || 'İsimsiz kullanıcı';
  const colorIndex = Array.from(String(membership.user_id)).reduce((total, character) => total + character.charCodeAt(0), 0) % memberColors.length;
  const joinedDate = membership.joined_at || membership.created_at;

  return {
    id: membership.id,
    userId: membership.user_id,
    name,
    email: profile?.email || 'E-posta bilgisi yok',
    initials: getInitials(name) || 'MF',
    role: getTeamRoleLabel(membership.role),
    department: membership.department || 'Belirtilmedi',
    title: membership.title || 'Unvan belirtilmedi',
    status: membership.status,
    joinedAt: joinedDate ? new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(joinedDate)) : 'Tarih bilinmiyor',
    lastActive: membership.user_id === currentUserId ? 'Şimdi' : 'Aktif üye',
    color: memberColors[colorIndex],
  };
}

export function mapInvitationToTeamMember(invitation) {
  const name = invitation.full_name || invitation.email?.split('@')[0] || 'Davet edilen kullanıcı';
  const colorIndex = Array.from(String(invitation.email)).reduce((total, character) => total + character.charCodeAt(0), 0) % memberColors.length;

  return {
    id: invitation.id,
    invitationId: invitation.id,
    isInvitation: true,
    userId: null,
    name,
    email: invitation.email,
    initials: getInitials(name) || 'MF',
    role: getTeamRoleLabel(invitation.role),
    department: invitation.department || 'Belirtilmedi',
    title: invitation.title || 'Unvan belirtilmedi',
    status: 'pending',
    joinedAt: 'Davet gönderildi',
    lastActive: 'Henüz katılmadı',
    expiresAt: invitation.expires_at,
    color: memberColors[colorIndex],
  };
}

export function getTeamStats(members) {
  return {
    total: members.length,
    active: members.filter(member => member.status === 'active').length,
    pending: members.filter(member => member.status === 'pending').length,
    departments: new Set(members.map(member => member.department).filter(value => value && value !== 'Belirtilmedi')).size,
  };
}

export function filterTeamMembers(members, filters) {
  const query = filters.query.trim().toLocaleLowerCase('tr-TR');
  return members.filter(member => {
    const searchText = `${member.name} ${member.email} ${member.title}`.toLocaleLowerCase('tr-TR');
    return searchText.includes(query)
      && (filters.role === 'all' || member.role === filters.role)
      && (filters.department === 'all' || member.department === filters.department)
      && (filters.status === 'all' || member.status === filters.status);
  });
}

export function validateInvite(form, members) {
  const name = form.name.trim();
  const email = form.email.trim().toLocaleLowerCase('tr-TR');
  const title = form.title.trim();

  if (name.length < 3 || !name.includes(' ')) return 'Ad ve soyadı birlikte girin.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Geçerli bir e-posta adresi girin.';
  if (members.some(member => member.email.toLocaleLowerCase('tr-TR') === email)) return 'Bu e-posta adresi çalışma alanında zaten bulunuyor.';
  if (title.length < 2) return 'Görev unvanını girin.';
  return null;
}

export function canChangeOwnerAccess(member) {
  return member.role !== 'Sahip';
}

export function canManageTeamMember(actorRole, member) {
  if (!['owner', 'admin'].includes(actorRole)) return false;
  return member.role !== 'Sahip' || actorRole === 'owner';
}
