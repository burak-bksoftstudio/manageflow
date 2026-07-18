import { useState } from 'react';
import {
  ArrowRight, Building2, CheckCircle2, CircleAlert, Link2, ShieldCheck,
} from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AuthShell } from './AuthPages';
import { useAuth } from '../features/auth/AuthContext';
import { getUserIdentity } from '../features/auth/authUtils';
import { useOrganization } from '../features/organizations/OrganizationContext';
import {
  createOrganizationSlug, getOrganizationErrorMessage, validateOrganization,
} from '../features/organizations/organizationUtils';

export default function OrganizationOnboardingPage() {
  const { user } = useAuth();
  const { activeOrganization, createOrganization, loading } = useOrganization();
  const navigate = useNavigate();
  const identity = getUserIdentity(user);
  const [form, setForm] = useState({ name: '', slug: '' });
  const [slugEdited, setSlugEdited] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!loading && activeOrganization) return <Navigate to="/dashboard" replace />;

  const updateName = name => {
    setForm(value => ({ ...value, name, slug: slugEdited ? value.slug : createOrganizationSlug(name) }));
  };

  const updateSlug = slug => {
    setSlugEdited(true);
    setForm(value => ({ ...value, slug: createOrganizationSlug(slug) }));
  };

  const submit = async event => {
    event.preventDefault();
    setError('');
    const validationError = validateOrganization(form);
    if (validationError) return setError(validationError);

    setBusy(true);
    const { error: createError } = await createOrganization(form);
    setBusy(false);
    if (createError) return setError(getOrganizationErrorMessage(createError));
    navigate('/dashboard', { replace: true });
  };

  return (
    <AuthShell eyebrow="İLK ÇALIŞMA ALANINIZ" title={`Ajansınızı kuralım, ${identity.firstName}`} description="Ekibiniz, müşterileriniz ve projeleriniz bu güvenli çalışma alanının altında birleşecek.">
      <form className="auth-form organization-setup-form" onSubmit={submit}>
        <label className="auth-field">
          <span>Ajans veya ekip adı</span>
          <div><Building2 /><input autoFocus required minLength="2" maxLength="120" placeholder="Örn. BK Studio" value={form.name} onChange={event => updateName(event.target.value)} /></div>
        </label>
        <label className="auth-field">
          <span>Çalışma alanı adresi</span>
          <div><Link2 /><input required maxLength="64" placeholder="bk-studio" value={form.slug} onChange={event => updateSlug(event.target.value)} /></div>
        </label>
        <div className="organization-slug-preview"><span>manageflow.app/</span><b>{form.slug || 'ajansiniz'}</b></div>
        <div className="organization-owner-note"><ShieldCheck /><span><b>İlk sahip siz olacaksınız</b><small>Üye davet etme ve çalışma alanı ayarlarını yönetme yetkisi hesabınıza atanacak.</small></span></div>
        {error && <div className="auth-notice error" role="alert"><CircleAlert /><span>{error}</span></div>}
        <button className="auth-submit" type="submit" disabled={busy || loading}>
          <span>{busy ? 'Çalışma alanı oluşturuluyor…' : 'Çalışma alanını oluştur'}</span>
          {busy ? <CheckCircle2 /> : <ArrowRight />}
        </button>
      </form>
    </AuthShell>
  );
}
