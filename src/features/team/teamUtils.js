export function getInitials(name) {
  return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0].toLocaleUpperCase('tr-TR')).join('');
}

export function getTeamStats(members) {
  return {
    total: members.length,
    active: members.filter(member => member.status === 'active').length,
    pending: members.filter(member => member.status === 'pending').length,
    departments: new Set(members.map(member => member.department).filter(Boolean)).size,
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
