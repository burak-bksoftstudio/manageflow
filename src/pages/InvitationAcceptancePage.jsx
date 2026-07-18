import { useEffect, useState } from 'react';
import {
  ArrowRight, Building2, CheckCircle2, CircleAlert, KeyRound, LoaderCircle, Mail, ShieldCheck,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { AuthShell } from './AuthPages';
import { useAuth } from '../features/auth/AuthContext';
import { validatePassword } from '../features/auth/authUtils';
import { useOrganization } from '../features/organizations/OrganizationContext';
import { getTeamRoleLabel } from '../features/team/teamUtils';
import { requireSupabase } from '../lib/supabase';

const invitationIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function Notice({ children, type = 'error' }) {
  return <div className={`auth-notice ${type}`} role={type === 'error' ? 'alert' : 'status'}>{type === 'error' ? <CircleAlert /> : <CheckCircle2 />}<span>{children}</span></div>;
}

function getInvitationErrorMessage(error) {
  const message = String(error?.message || '').toLowerCase();
  if (message.includes('expired')) return 'Bu davetin süresi dolmuş. Çalışma alanı yöneticisinden yeni bir davet isteyin.';
  if (message.includes('no longer pending')) return 'Bu davet daha önce kullanılmış veya iptal edilmiş.';
  if (message.includes('does not match')) return 'Bu davet, giriş yaptığınız e-posta adresine ait değil.';
  if (message.includes('already an active')) return 'Bu çalışma alanının zaten aktif bir üyesisiniz.';
  return 'Davet bilgileri doğrulanamadı. Bağlantının güncel olduğundan emin olun.';
}

export default function InvitationAcceptancePage() {
  const [searchParams] = useSearchParams();
  const invitationId = searchParams.get('davet') || '';
  const { updatePassword, user } = useAuth();
  const { refreshOrganizations, selectOrganization } = useOrganization();
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [accepted, setAccepted] = useState(null);
  const [passwords, setPasswords] = useState({ password: '', confirmation: '' });
  const requiresPassword = user?.user_metadata?.manageflow_invitation_id === invitationId;

  useEffect(() => {
    let active = true;
    const loadInvitation = async () => {
      if (!invitationIdPattern.test(invitationId)) {
        if (active) { setError('Davet bağlantısı geçersiz veya eksik.'); setLoading(false); }
        return;
      }
      const client = requireSupabase();
      const { data, error: invitationError } = await client.rpc('get_my_organization_invitation', {
        target_invitation_id: invitationId,
      });
      if (!active) return;
      const record = data?.[0];
      if (invitationError || !record) setError(getInvitationErrorMessage(invitationError));
      else if (record.status === 'expired') setError('Bu davetin süresi dolmuş. Çalışma alanı yöneticisinden yeni bir davet isteyin.');
      else if (record.status !== 'pending') setError('Bu davet daha önce kullanılmış veya iptal edilmiş.');
      else setInvitation(record);
      setLoading(false);
    };
    loadInvitation();
    return () => { active = false; };
  }, [invitationId]);

  const acceptInvitation = async event => {
    event.preventDefault();
    setError('');

    if (requiresPassword) {
      const passwordError = validatePassword(passwords.password);
      if (passwordError) { setError(passwordError); return; }
      if (passwords.password !== passwords.confirmation) { setError('Şifreler birbiriyle eşleşmiyor.'); return; }
    }

    setBusy(true);
    if (requiresPassword) {
      const { error: passwordError } = await updatePassword(passwords.password);
      if (passwordError) {
        setBusy(false);
        setError('Şifreniz kaydedilemedi. Kuralları kontrol edip tekrar deneyin.');
        return;
      }
    }

    const client = requireSupabase();
    const { data, error: acceptanceError } = await client.rpc('accept_organization_invitation', {
      target_invitation_id: invitationId,
    });
    if (acceptanceError) {
      setBusy(false);
      setError(getInvitationErrorMessage(acceptanceError));
      return;
    }

    await refreshOrganizations();
    selectOrganization(data.organizationId);
    setAccepted(data);
    setBusy(false);
  };

  if (accepted) {
    return (
      <AuthShell eyebrow="DAVET KABUL EDİLDİ" title={`${accepted.organizationName} ekibine katıldınız`} description="Üyeliğiniz oluşturuldu ve çalışma alanı erişiminiz etkinleştirildi.">
        <div className="auth-success-panel"><CheckCircle2 /><p>Projeleri ve ekip akışını görüntülemek için çalışma alanına devam edebilirsiniz.</p><Link className="auth-submit" to="/ekipler"><span>Ekip ekranına devam et</span><ArrowRight /></Link></div>
      </AuthShell>
    );
  }

  return (
    <AuthShell eyebrow="EKİP DAVETİ" title={loading ? 'Davetiniz kontrol ediliyor' : invitation ? `${invitation.organization_name} sizi bekliyor` : 'Davet doğrulanamadı'} description={invitation ? 'Ajans çalışma alanına katılmadan önce davet ayrıntılarını kontrol edin.' : 'Güvenli davet bağlantısını ve oturum bilgilerinizi doğruluyoruz.'}>
      {loading ? <div className="auth-inline-loading"><LoaderCircle className="spin" /> Davet yükleniyor…</div> : error && !invitation ? (
        <div className="auth-success-panel neutral"><CircleAlert /><p>{error}</p><Link className="auth-submit" to="/giris"><span>Farklı hesapla giriş yap</span><ArrowRight /></Link></div>
      ) : invitation && (
        <form className="auth-form" onSubmit={acceptInvitation}>
          <div className="invitation-summary">
            <div><Building2 /><span><small>ÇALIŞMA ALANI</small><b>{invitation.organization_name}</b></span></div>
            <div><Mail /><span><small>DAVET E-POSTASI</small><b>{invitation.email}</b></span></div>
            <div><ShieldCheck /><span><small>ROL</small><b>{getTeamRoleLabel(invitation.role)}</b></span></div>
          </div>
          {requiresPassword && <div className="invitation-password"><p>Hesabınız için giriş şifresi belirleyin.</p><label className="auth-field"><span>Şifre</span><div><KeyRound /><input type="password" autoComplete="new-password" required placeholder="En az 8 karakter" value={passwords.password} onChange={event => setPasswords(value => ({ ...value, password: event.target.value }))} /></div></label><label className="auth-field"><span>Şifre tekrarı</span><div><KeyRound /><input type="password" autoComplete="new-password" required placeholder="Şifrenizi tekrarlayın" value={passwords.confirmation} onChange={event => setPasswords(value => ({ ...value, confirmation: event.target.value }))} /></div></label></div>}
          {error && <Notice>{error}</Notice>}
          <button className="auth-submit" type="submit" disabled={busy}><span>{busy ? 'Üyeliğiniz oluşturuluyor…' : 'Daveti kabul et'}</span>{busy ? <LoaderCircle className="spin" /> : <ArrowRight />}</button>
        </form>
      )}
    </AuthShell>
  );
}

