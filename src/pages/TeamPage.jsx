import { useEffect, useMemo, useState } from 'react';
import {
  BriefcaseBusiness, Building2, CalendarDays, Check, ChevronRight,
  CircleAlert, LoaderCircle, Mail, MailCheck, MoreHorizontal, RefreshCw,
  Search, ShieldCheck, UserCheck, UserPlus, Users, X,
} from 'lucide-react';
import { useOrganization } from '../features/organizations/OrganizationContext';
import {
  canChangeOwnerAccess, canManageTeamMember, filterTeamMembers, getTeamStats, validateInvite,
} from '../features/team/teamUtils';
import { useTeamMembers } from '../features/team/useTeamMembers';

const roles = ['Sahip', 'Yönetici', 'Proje Yöneticisi', 'Ekip Üyesi'];
const departments = ['Yönetim', 'Tasarım', 'Yazılım', 'Pazarlama', 'Operasyon', 'Belirtilmedi'];

const statusLabels = {
  active: 'Aktif',
  pending: 'Davet bekliyor',
  inactive: 'Devre dışı',
};

function TeamStat({ label, value, helper, icon: Icon }) {
  return (
    <article className="team-stat">
      <span><Icon /></span>
      <div><small>{label}</small><strong>{value}</strong><p>{helper}</p></div>
    </article>
  );
}

function MemberAvatar({ member, large = false }) {
  return (
    <span className={`member-avatar ${large ? 'large' : ''}`} style={{ '--member-color': member.color }}>
      {member.initials}
      {member.status === 'active' && <i />}
    </span>
  );
}

function useOverlayDismiss(close) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = event => event.key === 'Escape' && close();
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [close]);
}

function InviteMemberModal({ close, inviteMember, members }) {
  const [form, setForm] = useState({ name: '', email: '', role: 'Ekip Üyesi', department: 'Tasarım', title: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  useOverlayDismiss(close);
  const update = event => { setError(''); setForm(value => ({ ...value, [event.target.name]: event.target.value })); };
  const submit = async event => {
    event.preventDefault();
    const validationError = validateInvite(form, members);
    if (validationError) { setError(validationError); return; }
    setSaving(true);
    const result = await inviteMember({
      ...form,
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      title: form.title.trim(),
    });
    setSaving(false);
    if (result?.error) { setError(result.error.message); return; }
    close();
  };

  return (
    <div className="modal-layer" onMouseDown={close} role="presentation">
      <form className="modal team-modal" onSubmit={submit} onMouseDown={event => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="invite-title">
        <div className="modal-head">
          <div><span>EKİP DAVETİ</span><h2 id="invite-title">Yeni ekip üyesi</h2><p>Kişiyi ajans çalışma alanınıza davet edin.</p></div>
          <button type="button" className="icon-button" onClick={close} aria-label="Pencereyi kapat" disabled={saving}><X /></button>
        </div>
        <div className="team-form-grid">
          <label className="full-field">Ad soyad<input name="name" required autoFocus value={form.name} onChange={update} placeholder="Örn. Ayşe Yılmaz" /></label>
          <label className="full-field">E-posta<input name="email" required type="email" value={form.email} onChange={update} placeholder="ayse@ajans.com" /></label>
          <label>Rol<select name="role" value={form.role} onChange={update}>{roles.filter(role => role !== 'Sahip').map(role => <option key={role}>{role}</option>)}</select></label>
          <label>Departman<select name="department" value={form.department} onChange={update}>{departments.map(item => <option key={item}>{item}</option>)}</select></label>
          <label className="full-field">Görev unvanı<input name="title" required value={form.title} onChange={update} placeholder="Örn. Senior Designer" /></label>
        </div>
        {error && <div className="form-error" role="alert">{error}</div>}
        <div className="invite-note"><Mail /><span><b>Güvenli davet bağlantısı</b><small>Bağlantı yalnızca bu e-posta adresiyle doğrulanan hesap tarafından kabul edilebilir.</small></span></div>
        <div className="modal-actions">
          <button type="button" className="soft-button" onClick={close} disabled={saving}>Vazgeç</button>
          <button className="agenda-button" disabled={saving}>{saving ? <LoaderCircle className="spin" /> : <UserPlus />} {saving ? 'Gönderiliyor…' : 'Daveti gönder'}</button>
        </div>
      </form>
    </div>
  );
}

function MemberDrawer({ member, close, updateMember, revokeInvitation, canManage, canEditIdentity }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(member);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmingRevoke, setConfirmingRevoke] = useState(false);
  useOverlayDismiss(close);
  const update = event => setDraft(value => ({ ...value, [event.target.name]: event.target.value }));
  const persist = async () => {
    setSaving(true);
    setError('');
    const result = await updateMember(draft);
    setSaving(false);
    if (result?.error) { setError(result.error); setConfirming(false); return; }
    setEditing(false);
    setConfirming(false);
  };
  const save = () => {
    if (draft.name.trim().length < 3 || draft.title.trim().length < 2) { setError('Ad soyad ve görev unvanı boş bırakılamaz.'); return; }
    if (member.status !== 'inactive' && draft.status === 'inactive') { setConfirming(true); return; }
    persist();
  };
  const ownerProtected = !canChangeOwnerAccess(member);
  const revoke = async () => {
    setSaving(true);
    setError('');
    const result = await revokeInvitation(member.invitationId);
    setSaving(false);
    if (result?.error) { setError('Davet iptal edilemedi. Yetkinizi ve bağlantınızı kontrol edip tekrar deneyin.'); return; }
    close({ revoked: true, member });
  };

  return (
    <div className="drawer-layer" onMouseDown={close} role="presentation">
      <aside className="drawer member-drawer" onMouseDown={event => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="member-title">
        <div className="drawer-head">
          <div><span>{member.isInvitation ? 'BEKLEYEN DAVET' : 'EKİP ÜYESİ'}</span><h2 id="member-title">{member.isInvitation ? 'Davet detayları' : 'Üye detayları'}</h2></div>
          <button className="icon-button" onClick={close} aria-label="Paneli kapat"><X /></button>
        </div>
        <div className="member-profile">
          <MemberAvatar member={draft} large />
          <h3>{draft.name}</h3><p>{draft.title}</p>
          <span className={`member-status ${draft.status}`}>{statusLabels[draft.status]}</span>
        </div>

        {editing ? (
          <div className="drawer-form">
            <label>Ad soyad<input name="name" value={draft.name} onChange={update} disabled={!canEditIdentity} /></label>
            <label>Görev unvanı<input name="title" value={draft.title} onChange={update} /></label>
            <label>Rol<select name="role" value={draft.role} onChange={update} disabled={ownerProtected}>{(ownerProtected ? roles : roles.filter(role => role !== 'Sahip')).map(role => <option key={role}>{role}</option>)}</select></label>
            <label>Departman<select name="department" value={draft.department} onChange={update}>{departments.map(item => <option key={item}>{item}</option>)}</select></label>
            <label>Durum<select name="status" value={draft.status} onChange={update} disabled={ownerProtected}><option value="active">Aktif</option><option value="pending">Davet bekliyor</option><option value="inactive">Devre dışı</option></select></label>
            {ownerProtected && <p className="owner-note"><ShieldCheck /> Çalışma alanı sahibinin rolü ve erişimi değiştirilemez.</p>}
            {!canEditIdentity && <p className="owner-note"><ShieldCheck /> Ad ve e-posta bilgileri kullanıcı profilinden yönetilir.</p>}
            {error && <div className="form-error" role="alert">{error}</div>}
          </div>
        ) : (
          <div className="member-details">
            <div><Mail /><span><small>E-POSTA</small><b>{draft.email}</b></span></div>
            <div><ShieldCheck /><span><small>ROL</small><b>{draft.role}</b></span></div>
            <div><Building2 /><span><small>DEPARTMAN</small><b>{draft.department}</b></span></div>
            <div><BriefcaseBusiness /><span><small>UNVAN</small><b>{draft.title}</b></span></div>
            <div><CalendarDays /><span><small>KATILIM</small><b>{draft.joinedAt}</b></span></div>
          </div>
        )}

        {confirming && <div className="deactivate-confirm" role="alert"><b>Üyenin erişimi kapatılsın mı?</b><p>Üye çalışma alanına erişemez; geçmiş kayıtları korunur.</p>{error && <div className="form-error">{error}</div>}<div><button className="soft-button" onClick={() => setConfirming(false)} disabled={saving}>Vazgeç</button><button className="danger-button" onClick={persist} disabled={saving}>{saving ? 'Kaydediliyor…' : 'Erişimi kapat'}</button></div></div>}
        {confirmingRevoke && <div className="deactivate-confirm" role="alert"><b>Davet iptal edilsin mi?</b><p>Bu bağlantı artık üyelik oluşturamaz. Gerekirse daha sonra yeni davet gönderebilirsiniz.</p>{error && <div className="form-error">{error}</div>}<div><button className="soft-button" onClick={() => setConfirmingRevoke(false)} disabled={saving}>Vazgeç</button><button className="danger-button" onClick={revoke} disabled={saving}>{saving ? 'İptal ediliyor…' : 'Daveti iptal et'}</button></div></div>}
        {!confirming && !confirmingRevoke && member.isInvitation && canManage && <div className="drawer-actions"><button className="soft-button full" onClick={() => setConfirmingRevoke(true)}>Daveti iptal et</button></div>}
        {!confirming && !confirmingRevoke && !member.isInvitation && canManage && <div className="drawer-actions">
          {editing ? <><button className="soft-button" onClick={() => { setDraft(member); setEditing(false); setError(''); }} disabled={saving}>Vazgeç</button><button className="agenda-button" onClick={save} disabled={saving}>{saving ? <LoaderCircle className="spin" /> : <Check />} {saving ? 'Kaydediliyor…' : 'Kaydet'}</button></> : <button className="agenda-button full" onClick={() => setEditing(true)}>Bilgileri düzenle</button>}
        </div>}
      </aside>
    </div>
  );
}

export default function TeamPage() {
  const {
    error: teamError, inviteMember, isDemoMode, loading, members, refresh, revokeInvitation,
    updateMember: persistMember,
  } = useTeamMembers();
  const { activeOrganization } = useOrganization();
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('all');
  const [department, setDepartment] = useState('all');
  const [status, setStatus] = useState('all');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [toast, setToast] = useState('');
  const canManage = isDemoMode || ['owner', 'admin'].includes(activeOrganization?.role);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(''), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const stats = useMemo(() => getTeamStats(members), [members]);

  const filteredMembers = useMemo(() => filterTeamMembers(members, { query, role, department, status }), [members, query, role, department, status]);

  const sendInvite = async form => {
    const result = await inviteMember(form);
    if (!result.error) setToast(`${form.name} için davet e-postası gönderildi.`);
    return result;
  };
  const closeMemberDrawer = result => {
    setSelectedMember(null);
    if (result?.revoked) setToast(`${result.member.name} için bekleyen davet iptal edildi.`);
  };
  const updateMember = async updated => {
    const { error } = await persistMember(updated);
    if (error) return { error: 'Üye bilgileri güncellenemedi. Yetkinizi ve bağlantınızı kontrol edip tekrar deneyin.' };
    setSelectedMember(updated);
    setToast(`${updated.name} güncellendi.`);
    return { error: null };
  };

  return (
    <>
      <section className="team-hero">
        <div>
          <div className="eyebrow"><i /> EKİP YÖNETİMİ</div>
          <h1>Ekibiniz, tek akışta.</h1>
          <p>Ajansınızdaki rolleri, departmanları ve erişimleri tek yerden yönetin.</p>
        </div>
        <button
          className="agenda-button team-primary"
          onClick={() => setInviteOpen(true)}
          disabled={!canManage}
          title={!canManage ? 'Yalnızca çalışma alanı sahibi veya yöneticisi davet gönderebilir' : undefined}
        >
          <UserPlus /> Ekip üyesi davet et
        </button>
      </section>

      <section className="team-stats-grid">
        <TeamStat label="TOPLAM ÜYE" value={stats.total} helper="Çalışma alanındaki herkes" icon={Users} />
        <TeamStat label="AKTİF ÜYE" value={stats.active} helper="Şu an erişimi olanlar" icon={UserCheck} />
        <TeamStat label="BEKLEYEN DAVET" value={stats.pending} helper="Katılım bekleniyor" icon={MailCheck} />
        <TeamStat label="DEPARTMAN" value={stats.departments} helper="Ajans ekip yapısı" icon={Building2} />
      </section>

      <section className="team-card">
        <div className="team-card-head">
          <div><h2>Ekip üyeleri</h2><p>{filteredMembers.length} kişi görüntüleniyor</p></div>
          <button className="icon-button" disabled title="Toplu ekip işlemleri yakında" aria-label="Toplu ekip işlemleri yakında"><MoreHorizontal /></button>
        </div>
        <div className="team-toolbar">
          <label className="team-search"><Search /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="İsim, e-posta veya unvan ara" /></label>
          <select value={role} onChange={event => setRole(event.target.value)} aria-label="Role göre filtrele"><option value="all">Tüm roller</option>{roles.map(item => <option key={item}>{item}</option>)}</select>
          <select value={department} onChange={event => setDepartment(event.target.value)} aria-label="Departmana göre filtrele"><option value="all">Tüm departmanlar</option>{departments.map(item => <option key={item}>{item}</option>)}</select>
          <select value={status} onChange={event => setStatus(event.target.value)} aria-label="Duruma göre filtrele"><option value="all">Tüm durumlar</option><option value="active">Aktif</option><option value="pending">Davet bekliyor</option><option value="inactive">Devre dışı</option></select>
        </div>

        <div className="team-table">
          <div className="team-table-head"><span>ÜYE</span><span>ROL</span><span>DEPARTMAN</span><span>DURUM</span><span>SON AKTİFLİK</span><span /></div>
          {loading && <div className="team-loading" role="status"><LoaderCircle className="spin" /><span>Organizasyon üyeleri yükleniyor…</span></div>}
          {!loading && teamError && <div className="team-state-message error"><CircleAlert /><h3>Ekip verisi yüklenemedi</h3><p>Bağlantınızı kontrol edip tekrar deneyin.</p><button className="soft-button" onClick={refresh}><RefreshCw /> Yeniden dene</button></div>}
          {!loading && !teamError && filteredMembers.map(member => (
            <button className="team-member-row" key={member.id} onClick={() => setSelectedMember(member)}>
              <span className="member-identity"><MemberAvatar member={member} /><span><b>{member.name}</b><small>{member.email}</small></span></span>
              <span className="cell-copy"><b>{member.role}</b><small>{member.title}</small></span>
              <span className="department-pill">{member.department}</span>
              <span className={`member-status ${member.status}`}>{statusLabels[member.status]}</span>
              <span className="last-active">{member.lastActive}</span>
              <ChevronRight />
            </button>
          ))}
          {!loading && !teamError && members.length === 0 && <div className="team-empty"><Users /><h3>Henüz ekip üyesi yok</h3><p>İlk üyelik oluşturulduğunda burada görünecek.</p></div>}
          {!loading && !teamError && members.length > 0 && filteredMembers.length === 0 && <div className="team-empty"><Search /><h3>Eşleşen ekip üyesi yok</h3><p>Filtreleri değiştirerek tekrar deneyin.</p></div>}
        </div>
      </section>

      {toast && <div className="app-toast" role="status"><Check />{toast}</div>}
      {inviteOpen && <InviteMemberModal close={() => setInviteOpen(false)} inviteMember={sendInvite} members={members} />}
      {selectedMember && <MemberDrawer member={selectedMember} close={closeMemberDrawer} updateMember={updateMember} revokeInvitation={revokeInvitation} canManage={isDemoMode || canManageTeamMember(activeOrganization?.role, selectedMember)} canEditIdentity={isDemoMode} />}
    </>
  );
}
