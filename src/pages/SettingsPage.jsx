import { useEffect, useState } from 'react';
import {
  Building2, Check, CircleAlert, Image, LoaderCircle, RefreshCw, Save,
  ShieldCheck, UserRound,
} from 'lucide-react';
import { getOrganizationRoleLabel } from '../features/organizations/organizationUtils';
import {
  canManageOrganizationSettings, getSettingsErrorMessage, getSettingsInitials,
  validateOrganizationSettings, validateProfileSettings,
} from '../features/settings/settingsUtils';
import { useSettings } from '../features/settings/useSettings';

const emptyProfileForm = { fullName: '', email: '', phone: '', avatarUrl: '' };
const emptyOrganizationForm = { name: '', slug: '', logoUrl: '' };

function SettingsPreview({ imageUrl, initials, icon: Icon, imageFailed, setImageFailed }) {
  return (
    <div className="settings-preview">
      <div className="settings-preview-image">
        {imageUrl && !imageFailed
          ? <img src={imageUrl} alt="" onError={() => setImageFailed(true)} />
          : initials ? <b>{initials}</b> : <Icon />}
      </div>
      <span><small>CANLI ÖNİZLEME</small><strong>{imageUrl ? 'Görsel adresinden yükleniyor' : 'Baş harf görünümü kullanılıyor'}</strong></span>
    </div>
  );
}

export default function SettingsPage() {
  const {
    activeOrganization, error: loadError, loading, profile, refresh, saveOrganization, saveProfile,
  } = useSettings();
  const [profileForm, setProfileForm] = useState(emptyProfileForm);
  const [organizationForm, setOrganizationForm] = useState(emptyOrganizationForm);
  const [profileError, setProfileError] = useState('');
  const [organizationError, setOrganizationError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingOrganization, setSavingOrganization] = useState(false);
  const [profileImageFailed, setProfileImageFailed] = useState(false);
  const [logoImageFailed, setLogoImageFailed] = useState(false);
  const [toast, setToast] = useState('');
  const canManageOrganization = canManageOrganizationSettings(activeOrganization?.role);

  useEffect(() => {
    if (!profile) return;
    setProfileForm({
      fullName: profile.fullName, email: profile.email, phone: profile.phone, avatarUrl: profile.avatarUrl,
    });
  }, [profile]);

  useEffect(() => {
    if (!activeOrganization) return;
    setOrganizationForm({
      name: activeOrganization.name, slug: activeOrganization.slug, logoUrl: activeOrganization.logoUrl || '',
    });
  }, [activeOrganization]);

  useEffect(() => {
    setProfileImageFailed(false);
  }, [profileForm.avatarUrl]);

  useEffect(() => {
    setLogoImageFailed(false);
  }, [organizationForm.logoUrl]);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(''), 3400);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const updateProfileForm = event => {
    const { name, value } = event.target;
    setProfileError('');
    setProfileForm(current => ({ ...current, [name]: value }));
  };
  const updateOrganizationForm = event => {
    const { name, value } = event.target;
    setOrganizationError('');
    setOrganizationForm(current => ({ ...current, [name]: value }));
  };

  const submitProfile = async event => {
    event.preventDefault();
    const validationError = validateProfileSettings(profileForm);
    if (validationError) { setProfileError(validationError); return; }
    setSavingProfile(true);
    setProfileError('');
    const result = await saveProfile(profileForm);
    setSavingProfile(false);
    if (result.error) { setProfileError(getSettingsErrorMessage(result.error, 'profile')); return; }
    setToast(result.metadataError ? 'Profil kaydedildi; sidebar adı bir sonraki oturumda yenilenecek.' : 'Profil bilgileriniz güncellendi.');
  };

  const submitOrganization = async event => {
    event.preventDefault();
    if (!canManageOrganization) return;
    const validationError = validateOrganizationSettings(organizationForm);
    if (validationError) { setOrganizationError(validationError); return; }
    setSavingOrganization(true);
    setOrganizationError('');
    const result = await saveOrganization(organizationForm);
    setSavingOrganization(false);
    if (result.error) { setOrganizationError(getSettingsErrorMessage(result.error, 'organization')); return; }
    setToast('Çalışma alanı bilgileri güncellendi.');
  };

  if (loading) return <section className="settings-state" role="status"><LoaderCircle className="spin" /><span>Ayarlarınız hazırlanıyor…</span></section>;
  if (loadError) return <section className="settings-state error"><CircleAlert /><h2>Ayarlar yüklenemedi</h2><p>Profil verisi alınamadı. Bağlantınızı kontrol edip tekrar deneyin.</p><button className="soft-button" onClick={refresh}><RefreshCw /> Yeniden dene</button></section>;

  return (
    <>
      <section className="settings-hero">
        <div><div className="eyebrow"><i /> PROFİL & ÇALIŞMA ALANI</div><h1>Kimliğiniz, akışınızla uyumlu.</h1><p>Kişisel profilinizi ve yetkiniz varsa ajansınızın görünen bilgilerini yönetin.</p></div>
        <span><ShieldCheck /><b>Güvenli ayarlar</b><small>Rol ve kullanıcı kapsamı veritabanında korunur</small></span>
      </section>

      <div className="settings-grid">
        <form className="settings-card" onSubmit={submitProfile}>
          <header><span><UserRound /></span><div><small>KİŞİSEL PROFİL</small><h2>Hesap görünümünüz</h2><p>Bu bilgiler ekip, görev ve aktivite alanlarında görünür.</p></div></header>
          <SettingsPreview imageUrl={profileForm.avatarUrl} initials={getSettingsInitials(profileForm.fullName)} icon={UserRound} imageFailed={profileImageFailed} setImageFailed={setProfileImageFailed} />
          <div className="settings-fields">
            <label>Ad soyad<input name="fullName" maxLength="120" value={profileForm.fullName} onChange={updateProfileForm} placeholder="Adınız ve soyadınız" /></label>
            <label>E-posta<input value={profileForm.email} readOnly disabled /><small>Giriş e-postası Supabase Auth üzerinden yönetilir.</small></label>
            <label>Telefon<input name="phone" maxLength="30" value={profileForm.phone} onChange={updateProfileForm} placeholder="+90 5xx xxx xx xx" /></label>
            <label>Profil görseli URL<input name="avatarUrl" maxLength="2048" value={profileForm.avatarUrl} onChange={updateProfileForm} placeholder="https://…" /><small>Şimdilik güvenli bir HTTPS görsel adresi kullanın; dosya yükleme sonraki fazda eklenecek.</small></label>
          </div>
          {profileError && <div className="form-error" role="alert">{profileError}</div>}
          <footer><span><ShieldCheck /> Yalnızca kendi profilinizi değiştirebilirsiniz.</span><button className="agenda-button" disabled={savingProfile}>{savingProfile ? <LoaderCircle className="spin" /> : <Save />}{savingProfile ? 'Kaydediliyor…' : 'Profili kaydet'}</button></footer>
        </form>

        <form className={`settings-card ${!canManageOrganization ? 'is-readonly' : ''}`} onSubmit={submitOrganization}>
          <header><span><Building2 /></span><div><small>ÇALIŞMA ALANI</small><h2>Ajans kimliği</h2><p>ManageFlow içinde ekip üyelerinin gördüğü çalışma alanı bilgileri.</p></div><em>{getOrganizationRoleLabel(activeOrganization?.role)}</em></header>
          <SettingsPreview imageUrl={organizationForm.logoUrl} initials={getSettingsInitials(organizationForm.name)} icon={Image} imageFailed={logoImageFailed} setImageFailed={setLogoImageFailed} />
          <div className="settings-fields">
            <label>Ajans adı<input name="name" maxLength="120" value={organizationForm.name} onChange={updateOrganizationForm} disabled={!canManageOrganization} /></label>
            <label>Çalışma alanı kimliği<input value={organizationForm.slug} readOnly disabled /><small>Kalıcı bağlantı kimliği güvenlik nedeniyle buradan değiştirilemez.</small></label>
            <label className="settings-wide-field">Logo URL<input name="logoUrl" maxLength="2048" value={organizationForm.logoUrl} onChange={updateOrganizationForm} disabled={!canManageOrganization} placeholder="https://…" /><small>Şeffaf arka planlı kare veya yatay HTTPS görsel önerilir.</small></label>
          </div>
          {!canManageOrganization && <div className="settings-readonly-note"><ShieldCheck /><span><b>Salt okunur çalışma alanı</b><small>Bu bölümü yalnızca sahip veya yönetici rolündeki kullanıcılar değiştirebilir.</small></span></div>}
          {organizationError && <div className="form-error" role="alert">{organizationError}</div>}
          <footer><span><ShieldCheck /> Slug ve kurucu bilgisi değiştirilemez.</span>{canManageOrganization && <button className="agenda-button" disabled={savingOrganization}>{savingOrganization ? <LoaderCircle className="spin" /> : <Save />}{savingOrganization ? 'Kaydediliyor…' : 'Alanı kaydet'}</button>}</footer>
        </form>
      </div>

      {toast && <div className="app-toast" role="status"><Check />{toast}</div>}
    </>
  );
}
