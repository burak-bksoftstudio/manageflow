export function mapProjectMember(membership, profile, assignment, currentUserId) {
  const name = profile?.full_name || profile?.email?.split('@')[0] || 'İsimsiz kullanıcı';
  const initials = name.trim().split(/\s+/).filter(Boolean).slice(0, 2)
    .map(part => part[0].toLocaleUpperCase('tr-TR')).join('') || 'MF';
  return {
    membershipId: membership.id,
    userId: membership.user_id,
    name,
    email: profile?.email || 'E-posta bilgisi yok',
    initials,
    role: membership.role,
    title: membership.title || 'Unvan belirtilmedi',
    department: membership.department || 'Belirtilmedi',
    isCurrentUser: membership.user_id === currentUserId,
    assignmentId: assignment?.id || '',
    assignedAt: assignment?.assigned_at || '',
    isAssigned: Boolean(assignment),
  };
}

export function sortProjectMembers(members) {
  const roleOrder = { owner: 0, admin: 1, project_manager: 2, member: 3 };
  return [...members].sort((first, second) => {
    if (first.isAssigned !== second.isAssigned) return first.isAssigned ? -1 : 1;
    const roleDifference = (roleOrder[first.role] ?? 4) - (roleOrder[second.role] ?? 4);
    return roleDifference || first.name.localeCompare(second.name, 'tr-TR');
  });
}

export function getProjectMemberErrorMessage(error) {
  if (error?.code === '23505') return 'Bu ekip üyesi projeye zaten atanmış.';
  if (error?.code === '23503') return 'Seçilen ekip üyesi veya proje artık kullanılamıyor.';
  if (error?.code === '23514') return 'Yalnızca aktif ekip üyeleri aktif projelere atanabilir.';
  if (error?.code === '42501') return 'Proje ekibini değiştirme yetkiniz yok.';
  return 'Proje ekibi güncellenemedi. Bağlantınızı kontrol edip tekrar deneyin.';
}
