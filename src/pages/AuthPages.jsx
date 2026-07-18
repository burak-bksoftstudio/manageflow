import { useMemo, useState } from 'react';
import {
  ArrowRight, CheckCircle2, CircleAlert, Eye, EyeOff, KeyRound,
  LockKeyhole, Mail, ShieldCheck, Sparkles, UserRound,
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Logo } from '../components/Brand';
import { useAuth } from '../features/auth/AuthContext';
import { getAuthErrorMessage, validatePassword } from '../features/auth/authUtils';

function AuthShell({ eyebrow, title, description, children }) {
  const { isDemoMode, initializationError } = useAuth();

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <div className="auth-brand"><Logo /></div>
        <div className="auth-form-wrap">
          <span className="auth-eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <p className="auth-description">{description}</p>
          {isDemoMode && (
            <AuthNotice type="error">Supabase bağlantısı yapılandırılmadığı için hesap işlemleri kullanılamıyor.</AuthNotice>
          )}
          {initializationError && (
            <AuthNotice type="error">Oturum servisine ulaşılamadı. Sayfayı yenileyip tekrar deneyin.</AuthNotice>
          )}
          {children}
        </div>
        <small className="auth-legal">© 2026 ManageFlow · Ajans çalışma alanı</small>
      </section>
      <aside className="auth-showcase" aria-hidden="true">
        <div className="auth-showcase-orbit orbit-one" />
        <div className="auth-showcase-orbit orbit-two" />
        <div className="auth-showcase-copy">
          <span><Sparkles /> AJANSLAR İÇİN TASARLANDI</span>
          <h2>Ekibinizin bütün akışı, tek çalışma alanında.</h2>
          <p>Müşterilerden projelere, görevlerden teslimlere kadar herkes aynı bağlamda çalışır.</p>
        </div>
        <div className="auth-feature-card">
          <ShieldCheck />
          <div><b>Güvenli organizasyon yapısı</b><small>Her ajansın verisi RLS politikalarıyla ayrılır.</small></div>
        </div>
      </aside>
    </main>
  );
}

function AuthNotice({ children, type = 'success' }) {
  return (
    <div className={`auth-notice ${type}`} role={type === 'error' ? 'alert' : 'status'}>
      {type === 'error' ? <CircleAlert /> : <CheckCircle2 />}
      <span>{children}</span>
    </div>
  );
}

function AuthField({ icon: Icon, label, type = 'text', password, ...props }) {
  const [visible, setVisible] = useState(false);
  const inputType = password ? (visible ? 'text' : 'password') : type;
  return (
    <label className="auth-field">
      <span>{label}</span>
      <div>
        <Icon />
        <input type={inputType} {...props} />
        {password && (
          <button type="button" onClick={() => setVisible(value => !value)} aria-label={visible ? 'Şifreyi gizle' : 'Şifreyi göster'}>
            {visible ? <EyeOff /> : <Eye />}
          </button>
        )}
      </div>
    </label>
  );
}

function SubmitButton({ busy, children, disabled = false }) {
  return (
    <button className="auth-submit" type="submit" disabled={busy || disabled}>
      <span>{busy ? 'İşlem yapılıyor…' : children}</span><ArrowRight />
    </button>
  );
}

export function LoginPage() {
  const { isDemoMode, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const destination = location.state?.from || '/dashboard';

  const submit = async event => {
    event.preventDefault();
    setError('');
    setBusy(true);
    const { error: authError } = await signIn({ email: form.email.trim(), password: form.password });
    setBusy(false);
    if (authError) return setError(getAuthErrorMessage(authError));
    navigate(destination, { replace: true });
  };

  return (
    <AuthShell eyebrow="TEKRAR HOŞ GELDİNİZ" title="Çalışma alanınıza giriş yapın" description="Ajansınızın projelerine, ekibine ve günlük akışına kaldığınız yerden devam edin.">
      <form className="auth-form" onSubmit={submit}>
        <AuthField icon={Mail} label="E-posta adresi" type="email" autoComplete="email" required placeholder="siz@ajansiniz.com" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} />
        <AuthField icon={LockKeyhole} label="Şifre" password autoComplete="current-password" required placeholder="Şifrenizi girin" value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} />
        <div className="auth-form-meta"><span /><Link to="/sifremi-unuttum">Şifremi unuttum</Link></div>
        {error && <AuthNotice type="error">{error}</AuthNotice>}
        <SubmitButton busy={busy} disabled={isDemoMode}>Giriş yap</SubmitButton>
      </form>
      <p className="auth-switch">ManageFlow'da yeni misiniz? <Link to="/kayit">Ücretsiz hesap oluşturun</Link></p>
    </AuthShell>
  );
}

export function RegisterPage() {
  const { isDemoMode, signUp } = useAuth();
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmation: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const submit = async event => {
    event.preventDefault();
    setError('');
    const passwordError = validatePassword(form.password);
    if (passwordError) return setError(passwordError);
    if (form.password !== form.confirmation) return setError('Şifreler birbiriyle eşleşmiyor.');

    setBusy(true);
    const { data, error: authError } = await signUp({
      email: form.email.trim(), password: form.password, fullName: form.fullName.trim(),
    });
    setBusy(false);
    if (authError) return setError(getAuthErrorMessage(authError));
    if (data.session) window.location.assign('/dashboard');
    else setSent(true);
  };

  if (sent) {
    return (
      <AuthShell eyebrow="E-POSTANIZI KONTROL EDİN" title="Hesabınız neredeyse hazır" description={`${form.email} adresine bir doğrulama bağlantısı gönderdik.`}>
        <div className="auth-success-panel"><Mail /><p>Bağlantıya tıkladıktan sonra ManageFlow çalışma alanınıza döneceksiniz.</p><Link className="auth-submit" to="/giris"><span>Giriş ekranına dön</span><ArrowRight /></Link></div>
      </AuthShell>
    );
  }

  return (
    <AuthShell eyebrow="AJANSINIZI OLUŞTURUN" title="ManageFlow'a katılın" description="İlk çalışma alanınızı oluşturmak için hesabınızı birkaç adımda hazırlayın.">
      <form className="auth-form" onSubmit={submit}>
        <AuthField icon={UserRound} label="Ad soyad" autoComplete="name" required minLength="2" maxLength="120" placeholder="Adınız ve soyadınız" value={form.fullName} onChange={event => setForm({ ...form, fullName: event.target.value })} />
        <AuthField icon={Mail} label="İş e-postası" type="email" autoComplete="email" required placeholder="siz@ajansiniz.com" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} />
        <div className="auth-form-columns">
          <AuthField icon={LockKeyhole} label="Şifre" password autoComplete="new-password" required placeholder="En az 8 karakter" value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} />
          <AuthField icon={KeyRound} label="Şifre tekrarı" password autoComplete="new-password" required placeholder="Şifrenizi tekrarlayın" value={form.confirmation} onChange={event => setForm({ ...form, confirmation: event.target.value })} />
        </div>
        <p className="auth-password-hint">En az 8 karakter, bir harf ve bir rakam kullanın.</p>
        {error && <AuthNotice type="error">{error}</AuthNotice>}
        <SubmitButton busy={busy} disabled={isDemoMode}>Hesabımı oluştur</SubmitButton>
      </form>
      <p className="auth-switch">Zaten hesabınız var mı? <Link to="/giris">Giriş yapın</Link></p>
    </AuthShell>
  );
}

export function ForgotPasswordPage() {
  const { isDemoMode, sendPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const submit = async event => {
    event.preventDefault();
    setError('');
    setBusy(true);
    const { error: authError } = await sendPasswordReset(email.trim());
    setBusy(false);
    if (authError) return setError(getAuthErrorMessage(authError));
    setSent(true);
  };

  return (
    <AuthShell eyebrow="HESAP KURTARMA" title="Şifrenizi yenileyin" description="Hesabınıza bağlı e-posta adresini yazın; size güvenli bir yenileme bağlantısı gönderelim.">
      {sent ? (
        <div className="auth-success-panel"><Mail /><p>Hesap bu adresle kayıtlıysa şifre yenileme bağlantısı gönderildi. Gelen kutunuzu ve spam klasörünü kontrol edin.</p><Link className="auth-submit" to="/giris"><span>Giriş ekranına dön</span><ArrowRight /></Link></div>
      ) : (
        <form className="auth-form" onSubmit={submit}>
          <AuthField icon={Mail} label="E-posta adresi" type="email" autoComplete="email" required placeholder="siz@ajansiniz.com" value={email} onChange={event => setEmail(event.target.value)} />
          {error && <AuthNotice type="error">{error}</AuthNotice>}
          <SubmitButton busy={busy} disabled={isDemoMode}>Yenileme bağlantısı gönder</SubmitButton>
          <p className="auth-switch"><Link to="/giris">Giriş ekranına dön</Link></p>
        </form>
      )}
    </AuthShell>
  );
}

export function VerifyEmailPage() {
  const { loading, session } = useAuth();
  const params = useMemo(() => new URLSearchParams(window.location.hash.slice(1)), []);
  const authError = params.get('error_description');

  return (
    <AuthShell eyebrow="E-POSTA DOĞRULAMA" title={session ? 'E-posta adresiniz doğrulandı' : 'Doğrulama bağlantısı kontrol ediliyor'} description={session ? 'ManageFlow hesabınız kullanıma hazır.' : 'Bu işlem yalnızca birkaç saniye sürecek.'}>
      {authError ? <AuthNotice type="error">Doğrulama bağlantısı geçersiz veya süresi dolmuş. Lütfen yeniden kayıt olmayı deneyin.</AuthNotice> : session ? (
        <div className="auth-success-panel"><CheckCircle2 /><p>Kimliğiniz doğrulandı. Artık güvenli çalışma alanınıza devam edebilirsiniz.</p><Link className="auth-submit" to="/dashboard"><span>ManageFlow'a devam et</span><ArrowRight /></Link></div>
      ) : loading ? <div className="auth-inline-loading">Doğrulanıyor…</div> : (
        <div className="auth-success-panel neutral"><Mail /><p>Doğrulama bağlantısını e-postanızdaki son mesajdan açın. Bağlantı kullanıldıysa giriş yapabilirsiniz.</p><Link className="auth-submit" to="/giris"><span>Giriş ekranına dön</span><ArrowRight /></Link></div>
      )}
    </AuthShell>
  );
}

export function ResetPasswordPage() {
  const { loading, session, updatePassword } = useAuth();
  const [form, setForm] = useState({ password: '', confirmation: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [complete, setComplete] = useState(false);

  const submit = async event => {
    event.preventDefault();
    setError('');
    const passwordError = validatePassword(form.password);
    if (passwordError) return setError(passwordError);
    if (form.password !== form.confirmation) return setError('Şifreler birbiriyle eşleşmiyor.');
    setBusy(true);
    const { error: authError } = await updatePassword(form.password);
    setBusy(false);
    if (authError) return setError(getAuthErrorMessage(authError));
    setComplete(true);
  };

  return (
    <AuthShell eyebrow="YENİ ŞİFRE" title="Hesabınızı yeniden güvene alın" description="Daha önce kullanmadığınız güçlü bir şifre belirleyin.">
      {complete ? (
        <div className="auth-success-panel"><CheckCircle2 /><p>Şifreniz başarıyla değiştirildi. Çalışma alanınıza devam edebilirsiniz.</p><Link className="auth-submit" to="/dashboard"><span>ManageFlow'a devam et</span><ArrowRight /></Link></div>
      ) : !loading && !session ? (
        <div className="auth-success-panel neutral"><KeyRound /><p>Bu şifre yenileme bağlantısı geçersiz veya süresi dolmuş.</p><Link className="auth-submit" to="/sifremi-unuttum"><span>Yeni bağlantı iste</span><ArrowRight /></Link></div>
      ) : (
        <form className="auth-form" onSubmit={submit}>
          <AuthField icon={LockKeyhole} label="Yeni şifre" password autoComplete="new-password" required placeholder="En az 8 karakter" value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} />
          <AuthField icon={KeyRound} label="Yeni şifre tekrarı" password autoComplete="new-password" required placeholder="Şifrenizi tekrarlayın" value={form.confirmation} onChange={event => setForm({ ...form, confirmation: event.target.value })} />
          {error && <AuthNotice type="error">{error}</AuthNotice>}
          <SubmitButton busy={busy}>Şifremi güncelle</SubmitButton>
        </form>
      )}
    </AuthShell>
  );
}
