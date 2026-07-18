import { useMemo, useState } from 'react';
import {
  BriefcaseBusiness, Building2, CalendarDays, Check, ChevronRight,
  Mail, MailCheck, MoreHorizontal, Search, ShieldCheck, UserCheck,
  UserPlus, Users, X,
} from 'lucide-react';
import { initialTeamMembers } from '../data/demo';

const roles = ['Sahip', 'Yönetici', 'Proje Yöneticisi', 'Ekip Üyesi'];
const departments = ['Yönetim', 'Tasarım', 'Yazılım', 'Pazarlama', 'Operasyon'];

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

function InviteMemberModal({ close, addMember }) {
  const [form, setForm] = useState({ name: '', email: '', role: 'Ekip Üyesi', department: 'Tasarım', title: '' });
  const update = event => setForm(value => ({ ...value, [event.target.name]: event.target.value }));
  const submit = event => {
    event.preventDefault();
    const initials = form.name.trim().split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase()).join('');
    addMember({
      ...form, id: `member-${Date.now()}`, initials: initials || 'YK', status: 'pending',
      joinedAt: 'Davet gönderildi', lastActive: 'Henüz katılmadı', color: '#5b5ce2',
    });
    close();
  };

  return (
    <div className="modal-layer" onMouseDown={close}>
      <form className="modal team-modal" onSubmit={submit} onMouseDown={event => event.stopPropagation()}>
        <div className="modal-head">
          <div><span>EKİP DAVETİ</span><h2>Yeni ekip üyesi</h2><p>Kişiyi ajans çalışma alanınıza davet edin.</p></div>
          <button type="button" className="icon-button" onClick={close} aria-label="Pencereyi kapat"><X /></button>
        </div>
        <div className="team-form-grid">
          <label className="full-field">Ad soyad<input name="name" required autoFocus value={form.name} onChange={update} placeholder="Örn. Ayşe Yılmaz" /></label>
          <label className="full-field">E-posta<input name="email" required type="email" value={form.email} onChange={update} placeholder="ayse@ajans.com" /></label>
          <label>Rol<select name="role" value={form.role} onChange={update}>{roles.filter(role => role !== 'Sahip').map(role => <option key={role}>{role}</option>)}</select></label>
          <label>Departman<select name="department" value={form.department} onChange={update}>{departments.map(item => <option key={item}>{item}</option>)}</select></label>
          <label className="full-field">Görev unvanı<input name="title" required value={form.title} onChange={update} placeholder="Örn. Senior Designer" /></label>
        </div>
        <div className="invite-note"><Mail /><span><b>Davet e-postası hazır</b><small>Backend bağlandığında davet bağlantısı bu adrese gönderilecek.</small></span></div>
        <div className="modal-actions">
          <button type="button" className="soft-button" onClick={close}>Vazgeç</button>
          <button className="agenda-button"><UserPlus /> Davet oluştur</button>
        </div>
      </form>
    </div>
  );
}

function MemberDrawer({ member, close, updateMember }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(member);
  const update = event => setDraft(value => ({ ...value, [event.target.name]: event.target.value }));
  const save = () => { updateMember(draft); setEditing(false); };

  return (
    <div className="drawer-layer" onMouseDown={close}>
      <aside className="drawer member-drawer" onMouseDown={event => event.stopPropagation()}>
        <div className="drawer-head">
          <div><span>EKİP ÜYESİ</span><h2>Üye detayları</h2></div>
          <button className="icon-button" onClick={close} aria-label="Paneli kapat"><X /></button>
        </div>
        <div className="member-profile">
          <MemberAvatar member={draft} large />
          <h3>{draft.name}</h3><p>{draft.title}</p>
          <span className={`member-status ${draft.status}`}>{statusLabels[draft.status]}</span>
        </div>

        {editing ? (
          <div className="drawer-form">
            <label>Ad soyad<input name="name" value={draft.name} onChange={update} /></label>
            <label>Görev unvanı<input name="title" value={draft.title} onChange={update} /></label>
            <label>Rol<select name="role" value={draft.role} onChange={update}>{roles.map(role => <option key={role}>{role}</option>)}</select></label>
            <label>Departman<select name="department" value={draft.department} onChange={update}>{departments.map(item => <option key={item}>{item}</option>)}</select></label>
            <label>Durum<select name="status" value={draft.status} onChange={update}><option value="active">Aktif</option><option value="pending">Davet bekliyor</option><option value="inactive">Devre dışı</option></select></label>
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

        <div className="drawer-actions">
          {editing ? <><button className="soft-button" onClick={() => { setDraft(member); setEditing(false); }}>Vazgeç</button><button className="agenda-button" onClick={save}><Check /> Kaydet</button></> : <button className="agenda-button full" onClick={() => setEditing(true)}>Bilgileri düzenle</button>}
        </div>
      </aside>
    </div>
  );
}

export default function TeamPage() {
  const [members, setMembers] = useState(initialTeamMembers);
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('all');
  const [department, setDepartment] = useState('all');
  const [status, setStatus] = useState('all');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  const stats = useMemo(() => ({
    total: members.length,
    active: members.filter(member => member.status === 'active').length,
    pending: members.filter(member => member.status === 'pending').length,
    departments: new Set(members.map(member => member.department)).size,
  }), [members]);

  const filteredMembers = useMemo(() => members.filter(member => {
    const searchText = `${member.name} ${member.email} ${member.title}`.toLocaleLowerCase('tr-TR');
    return searchText.includes(query.toLocaleLowerCase('tr-TR'))
      && (role === 'all' || member.role === role)
      && (department === 'all' || member.department === department)
      && (status === 'all' || member.status === status);
  }), [members, query, role, department, status]);

  const addMember = member => setMembers(value => [member, ...value]);
  const updateMember = updated => {
    setMembers(value => value.map(member => member.id === updated.id ? updated : member));
    setSelectedMember(updated);
  };

  return (
    <>
      <section className="team-hero">
        <div>
          <div className="eyebrow"><i /> EKİP YÖNETİMİ</div>
          <h1>Ekibiniz, tek akışta.</h1>
          <p>Ajansınızdaki rolleri, departmanları ve erişimleri tek yerden yönetin.</p>
        </div>
        <button className="agenda-button team-primary" onClick={() => setInviteOpen(true)}><UserPlus /> Ekip üyesi davet et</button>
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
          <button className="icon-button"><MoreHorizontal /></button>
        </div>
        <div className="team-toolbar">
          <label className="team-search"><Search /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="İsim, e-posta veya unvan ara" /></label>
          <select value={role} onChange={event => setRole(event.target.value)} aria-label="Role göre filtrele"><option value="all">Tüm roller</option>{roles.map(item => <option key={item}>{item}</option>)}</select>
          <select value={department} onChange={event => setDepartment(event.target.value)} aria-label="Departmana göre filtrele"><option value="all">Tüm departmanlar</option>{departments.map(item => <option key={item}>{item}</option>)}</select>
          <select value={status} onChange={event => setStatus(event.target.value)} aria-label="Duruma göre filtrele"><option value="all">Tüm durumlar</option><option value="active">Aktif</option><option value="pending">Davet bekliyor</option><option value="inactive">Devre dışı</option></select>
        </div>

        <div className="team-table">
          <div className="team-table-head"><span>ÜYE</span><span>ROL</span><span>DEPARTMAN</span><span>DURUM</span><span>SON AKTİFLİK</span><span /></div>
          {filteredMembers.map(member => (
            <button className="team-member-row" key={member.id} onClick={() => setSelectedMember(member)}>
              <span className="member-identity"><MemberAvatar member={member} /><span><b>{member.name}</b><small>{member.email}</small></span></span>
              <span className="cell-copy"><b>{member.role}</b><small>{member.title}</small></span>
              <span className="department-pill">{member.department}</span>
              <span className={`member-status ${member.status}`}>{statusLabels[member.status]}</span>
              <span className="last-active">{member.lastActive}</span>
              <ChevronRight />
            </button>
          ))}
          {filteredMembers.length === 0 && <div className="team-empty"><Search /><h3>Eşleşen ekip üyesi yok</h3><p>Filtreleri değiştirerek tekrar deneyin.</p></div>}
        </div>
      </section>

      {inviteOpen && <InviteMemberModal close={() => setInviteOpen(false)} addMember={addMember} />}
      {selectedMember && <MemberDrawer member={selectedMember} close={() => setSelectedMember(null)} updateMember={updateMember} />}
    </>
  );
}
