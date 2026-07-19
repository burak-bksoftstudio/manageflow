import { useEffect, useMemo, useState } from 'react';
import {
  Building2, Check, CircleAlert, Factory, FileText, LoaderCircle, Mail, Pencil, Phone, Plus,
  RefreshCw, Search, ShieldCheck, Sparkles, UserRound, UsersRound, X,
} from 'lucide-react';
import { useClients } from '../features/clients/useClients';
import {
  canManageClients, CLIENT_STATUS_LABELS, filterClients, getClientErrorMessage, getClientStats, validateClient,
} from '../features/clients/clientUtils';
import { useOrganization } from '../features/organizations/OrganizationContext';

const statusOptions = Object.entries(CLIENT_STATUS_LABELS);

function ClientStat({ label, value, helper, icon: Icon }) {
  return <article className="client-stat"><span><Icon /></span><div><small>{label}</small><strong>{value}</strong><p>{helper}</p></div></article>;
}

function useModalDismiss(close, disabled) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = event => event.key === 'Escape' && !disabled && close();
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [close, disabled]);
}

function CreateClientModal({ close, createClient }) {
  const [form, setForm] = useState({
    name: '', contactName: '', email: '', phone: '', industry: '', status: 'lead', notes: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  useModalDismiss(close, saving);
  const update = event => {
    setError('');
    setForm(value => ({ ...value, [event.target.name]: event.target.value }));
  };
  const submit = async event => {
    event.preventDefault();
    const validationError = validateClient(form);
    if (validationError) { setError(validationError); return; }
    setSaving(true);
    const result = await createClient(form);
    setSaving(false);
    if (result.error) { setError(getClientErrorMessage(result.error)); return; }
    close({ created: result.data });
  };

  return (
    <div className="modal-layer" onMouseDown={saving ? undefined : close} role="presentation">
      <form className="modal client-modal" onSubmit={submit} onMouseDown={event => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="client-modal-title">
        <div className="modal-head"><div><span>YENİ MÜŞTERİ</span><h2 id="client-modal-title">Müşteri kaydı oluşturun</h2><p>İlk iletişim bilgilerini çalışma alanınıza ekleyin.</p></div><button type="button" className="icon-button" onClick={close} disabled={saving} aria-label="Pencereyi kapat"><X /></button></div>
        <div className="client-form-grid">
          <label className="full-field">Firma veya müşteri adı<input autoFocus required name="name" maxLength="160" value={form.name} onChange={update} placeholder="Örn. Atlas Labs" /></label>
          <label>Yetkili kişi<input name="contactName" maxLength="120" value={form.contactName} onChange={update} placeholder="Örn. Ayşe Yılmaz" /></label>
          <label>Sektör<input name="industry" maxLength="100" value={form.industry} onChange={update} placeholder="Örn. Yazılım" /></label>
          <label>E-posta<input name="email" type="email" value={form.email} onChange={update} placeholder="ayse@atlaslabs.co" /></label>
          <label>Telefon<input name="phone" maxLength="40" value={form.phone} onChange={update} placeholder="+90 5xx xxx xx xx" /></label>
          <label className="full-field">Durum<select name="status" value={form.status} onChange={update}>{statusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label className="full-field">Not<textarea name="notes" maxLength="2000" value={form.notes} onChange={update} placeholder="Müşteriyle ilgili ilk notunuzu yazın…" /></label>
        </div>
        {error && <div className="form-error" role="alert">{error}</div>}
        <div className="modal-actions"><button type="button" className="soft-button" onClick={close} disabled={saving}>Vazgeç</button><button className="agenda-button" disabled={saving}>{saving ? <LoaderCircle className="spin" /> : <Plus />}{saving ? 'Kaydediliyor…' : 'Müşteriyi kaydet'}</button></div>
      </form>
    </div>
  );
}

function ClientDrawer({ client, close, updateClient, canManage }) {
  const [draft, setDraft] = useState(client);
  const [editing, setEditing] = useState(false);
  const [confirmingInactive, setConfirmingInactive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  useModalDismiss(close, saving);
  const update = event => {
    setError('');
    setDraft(value => ({ ...value, [event.target.name]: event.target.value }));
  };
  const persist = async nextDraft => {
    const validationError = validateClient(nextDraft);
    if (validationError) { setError(validationError); return; }
    setSaving(true);
    const result = await updateClient(client.id, nextDraft);
    setSaving(false);
    if (result.error) { setError(getClientErrorMessage(result.error)); return; }
    setDraft(result.data);
    setEditing(false);
    setConfirmingInactive(false);
  };
  const save = () => {
    if (client.status !== 'inactive' && draft.status === 'inactive') {
      setConfirmingInactive(true);
      return;
    }
    persist(draft);
  };
  const deactivate = () => persist({ ...draft, status: 'inactive' });

  return (
    <div className="drawer-layer" onMouseDown={saving ? undefined : close} role="presentation">
      <aside className="drawer client-drawer" onMouseDown={event => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="client-drawer-title">
        <div className="drawer-head"><div><span>MÜŞTERİ DETAYI</span><h2 id="client-drawer-title">Müşteri profili</h2></div><button className="icon-button" onClick={close} disabled={saving} aria-label="Paneli kapat"><X /></button></div>
        <div className="client-drawer-profile"><i>{draft.initials}</i><h3>{draft.name}</h3><p>{draft.industry || 'Sektör belirtilmedi'}</p><span className={`client-status ${draft.status}`}>{CLIENT_STATUS_LABELS[draft.status]}</span></div>

        {editing ? (
          <div className="drawer-form client-drawer-form">
            <label>Firma veya müşteri adı<input required name="name" maxLength="160" value={draft.name} onChange={update} /></label>
            <label>Yetkili kişi<input name="contactName" maxLength="120" value={draft.contactName} onChange={update} /></label>
            <label>Sektör<input name="industry" maxLength="100" value={draft.industry} onChange={update} /></label>
            <label>E-posta<input name="email" type="email" value={draft.email} onChange={update} /></label>
            <label>Telefon<input name="phone" maxLength="40" value={draft.phone} onChange={update} /></label>
            <label>Durum<select name="status" value={draft.status} onChange={update}>{statusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label>Not<textarea name="notes" maxLength="2000" value={draft.notes} onChange={update} placeholder="Müşteriyle ilgili notlar…" /></label>
            {error && <div className="form-error" role="alert">{error}</div>}
          </div>
        ) : (
          <>
            <div className="client-details">
              <div><UserRound /><span><small>YETKİLİ KİŞİ</small><b>{draft.contactName || 'Belirtilmedi'}</b></span></div>
              <div><Mail /><span><small>E-POSTA</small><b>{draft.email || 'Belirtilmedi'}</b></span></div>
              <div><Phone /><span><small>TELEFON</small><b>{draft.phone || 'Belirtilmedi'}</b></span></div>
              <div><Factory /><span><small>SEKTÖR</small><b>{draft.industry || 'Belirtilmedi'}</b></span></div>
              <div><FileText /><span><small>NOTLAR</small><b className="client-notes">{draft.notes || 'Henüz not eklenmedi.'}</b></span></div>
            </div>
            {!canManage && <p className="owner-note"><ShieldCheck /> Bu müşteriyi görüntüleyebilirsiniz; düzenleme için yönetici veya proje yöneticisi rolü gerekir.</p>}
          </>
        )}

        {confirmingInactive && <div className="deactivate-confirm" role="alert"><b>Müşteri pasife alınsın mı?</b><p>Kayıt silinmeyecek; geçmiş proje bağlamı korunacak ve daha sonra yeniden aktifleştirilebilecek.</p>{error && <div className="form-error">{error}</div>}<div><button className="soft-button" onClick={() => { setConfirmingInactive(false); setDraft(client); }} disabled={saving}>Vazgeç</button><button className="danger-button" onClick={deactivate} disabled={saving}>{saving ? 'Kaydediliyor…' : 'Pasife al'}</button></div></div>}
        {!confirmingInactive && canManage && <div className="drawer-actions client-drawer-actions">
          {editing ? <><button className="soft-button" onClick={() => { setDraft(client); setEditing(false); setError(''); }} disabled={saving}>Vazgeç</button><button className="agenda-button" onClick={save} disabled={saving}>{saving ? <LoaderCircle className="spin" /> : <Check />}{saving ? 'Kaydediliyor…' : 'Kaydet'}</button></> : <><button className="agenda-button" onClick={() => setEditing(true)}><Pencil /> Düzenle</button>{draft.status !== 'inactive' && <button className="soft-button client-inactive-button" onClick={() => setConfirmingInactive(true)}>Pasife al</button>}</>}
        </div>}
      </aside>
    </div>
  );
}

export default function ClientsPage() {
  const {
    clients, createClient, error, loading, refresh, updateClient: persistClient,
  } = useClients();
  const { activeOrganization } = useOrganization();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [toast, setToast] = useState('');
  const canManage = canManageClients(activeOrganization?.role);
  const stats = useMemo(() => getClientStats(clients), [clients]);
  const filteredClients = useMemo(() => filterClients(clients, { query, status }), [clients, query, status]);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(''), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const closeModal = result => {
    setModalOpen(false);
    if (result?.created) setToast(`${result.created.name} müşteri listenize eklendi.`);
  };
  const updateClient = async (clientId, form) => {
    const result = await persistClient(clientId, form);
    if (!result.error) {
      setSelectedClient(result.data);
      setToast(`${result.data.name} güncellendi.`);
    }
    return result;
  };

  return (
    <>
      <section className="client-hero"><div><div className="eyebrow"><i /> MÜŞTERİ YÖNETİMİ</div><h1>Müşterileriniz, tek yerde.</h1><p>Ajans ilişkilerini düzenleyin; projeleri doğru müşteri bağlamında başlatın.</p></div><button className="agenda-button client-primary" onClick={() => setModalOpen(true)} disabled={!canManage} title={!canManage ? 'Müşteri oluşturmak için yönetici veya proje yöneticisi rolü gerekir' : undefined}><Plus /> Yeni müşteri</button></section>

      <section className="client-stats-grid">
        <ClientStat label="TOPLAM MÜŞTERİ" value={stats.total} helper="Çalışma alanındaki kayıtlar" icon={UsersRound} />
        <ClientStat label="AKTİF MÜŞTERİ" value={stats.active} helper="Devam eden iş ilişkileri" icon={Check} />
        <ClientStat label="POTANSİYEL" value={stats.leads} helper="Yeni fırsat ve görüşmeler" icon={Sparkles} />
        <ClientStat label="SEKTÖR" value={stats.industries} helper="Hizmet verilen alanlar" icon={Factory} />
      </section>

      <section className="clients-card">
        <div className="clients-card-head"><div><h2>Müşteri listesi</h2><p>{filteredClients.length} kayıt görüntüleniyor</p></div></div>
        <div className="clients-toolbar"><label className="clients-search"><Search /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Müşteri, yetkili, e-posta veya sektör ara" /></label><select value={status} onChange={event => setStatus(event.target.value)} aria-label="Müşteri durumuna göre filtrele"><option value="all">Tüm durumlar</option>{statusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
        <div className="clients-table">
          <div className="clients-table-head"><span>MÜŞTERİ</span><span>YETKİLİ</span><span>SEKTÖR</span><span>DURUM</span><span>İLETİŞİM</span><span>EKLENME</span></div>
          {loading && <div className="clients-state" role="status"><LoaderCircle className="spin" /><span>Müşteriler yükleniyor…</span></div>}
          {!loading && error && <div className="clients-state error"><CircleAlert /><h3>Müşteriler yüklenemedi</h3><p>Bağlantınızı kontrol edip tekrar deneyin.</p><button className="soft-button" onClick={refresh}><RefreshCw /> Yeniden dene</button></div>}
          {!loading && !error && filteredClients.map(client => (
            <button className="client-row" key={client.id} onClick={() => setSelectedClient(client)}>
              <span className="client-identity"><i>{client.initials}</i><span><b>{client.name}</b><small>{client.email || 'E-posta belirtilmedi'}</small></span></span>
              <span className="client-copy"><UserRound /><span><b>{client.contactName || 'Yetkili belirtilmedi'}</b><small>Yetkili kişi</small></span></span>
              <span className="client-industry"><Building2 />{client.industry || 'Sektör belirtilmedi'}</span>
              <span className={`client-status ${client.status}`}>{CLIENT_STATUS_LABELS[client.status]}</span>
              <span className="client-contact"><span><Mail />{client.email || 'E-posta belirtilmedi'}</span><span><Phone />{client.phone || 'Telefon belirtilmedi'}</span></span>
              <span className="client-date">{client.createdAtLabel}</span>
            </button>
          ))}
          {!loading && !error && clients.length === 0 && <div className="clients-state empty"><Building2 /><h3>İlk müşterinizi ekleyin</h3><p>Müşteri kayıtları projelerinizin başlangıç noktası olacak.</p>{canManage && <button className="soft-button" onClick={() => setModalOpen(true)}><Plus /> Müşteri oluştur</button>}</div>}
          {!loading && !error && clients.length > 0 && filteredClients.length === 0 && <div className="clients-state empty"><Search /><h3>Eşleşen müşteri bulunamadı</h3><p>Arama metnini veya durum filtresini değiştirin.</p></div>}
        </div>
      </section>

      {toast && <div className="app-toast" role="status"><Check />{toast}</div>}
      {modalOpen && <CreateClientModal close={closeModal} createClient={createClient} />}
      {selectedClient && <ClientDrawer client={selectedClient} close={() => setSelectedClient(null)} updateClient={updateClient} canManage={canManage} />}
    </>
  );
}
