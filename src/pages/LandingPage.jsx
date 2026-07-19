import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity, ArrowRight, BookOpenText, Check, CheckCircle2, CheckSquare2,
  ChevronRight, Clock3, FolderKanban, Gauge, Layers3, LockKeyhole, Menu,
  Play, ShieldCheck, Sparkles, TimerReset, UserRound, UsersRound, X,
} from 'lucide-react';
import { Logo } from '../components/Brand';
import { useAuth } from '../features/auth/AuthContext';

const moduleGroups = [
  {
    number: '01', icon: FolderKanban, title: 'Müşteri ve proje',
    description: 'Müşteri ilişkisini projeye, projeyi teslim edilebilir işe dönüştürün.',
    items: ['Müşteri kayıtları', 'Proje yaşam döngüsü', 'Proje ekibi', 'İlerleme ve durumlar'],
  },
  {
    number: '02', icon: CheckSquare2, title: 'Görev ve ekip akışı',
    description: 'Sorumluluğu, önceliği ve ilerlemeyi herkes için görünür tutun.',
    items: ['Liste ve Kanban', 'Alt görevler', 'Checklist ve yorumlar', 'Aktivite geçmişi'],
  },
  {
    number: '03', icon: TimerReset, title: 'Zaman ve raporlama',
    description: 'Emeği proje bağlamında kaydedin; haftalık çalışma görünümünü koruyun.',
    items: ['Canlı sayaç', 'Manuel süre girişi', 'Haftalık geçmiş', 'Proje ve görev filtreleri'],
  },
  {
    number: '04', icon: BookOpenText, title: 'Ortak proje hafızası',
    description: 'Kararları, brief detaylarını ve toplantı çıktılarını projede yaşatın.',
    items: ['Ortak proje notları', 'Yetkili düzenleme', 'Proje filtresi', 'Tam metin arama'],
  },
];

const workflow = [
  ['01', 'Müşteriyi ekle', 'İlişkinin tek ve güncel kaydını oluştur.'],
  ['02', 'Projeyi başlat', 'Kapsamı, ekibi, tarihleri ve ilerlemeyi bağla.'],
  ['03', 'İşi yürüt', 'Görevleri, kararları ve zamanı aynı bağlamda yönet.'],
  ['04', 'Teslimi görünür kıl', 'Geçmişi ve ekip emeğini kaybetmeden ilerle.'],
];

const faqs = [
  ['ManageFlow kimler için geliştiriliyor?', 'İlk odak ajanslar, yaratıcı stüdyolar ve müşteri projeleri yöneten küçük ekiplerdir. Ürün mimarisi ileride freelancer ve farklı ekip tiplerine açılabilecek şekilde kurulmuştur.'],
  ['Ücretsiz denemek için kart gerekiyor mu?', 'Hayır. Hesap ve çalışma alanı oluşturma akışında kart bilgisi istenmez. Fiyatlandırma ve ücretli planlar henüz ürün yol haritasındadır.'],
  ['Veriler ekipler arasında nasıl ayrılıyor?', 'Her iş kaydı organizasyon bağlamına bağlıdır. PostgreSQL Row Level Security politikaları, üyelik ve rol kontrolleriyle farklı organizasyonların verilerini birbirinden ayırır.'],
  ['Şu anda hangi modüller gerçekten çalışıyor?', 'Auth, ekip, müşteri, proje, görev, dashboard, profil/organizasyon ayarları, zaman takibi ve proje notları gerçek Supabase verisiyle çalışır. Dosyalar, bildirimler, takvim, mesajlaşma ve Flow AI yol haritasındadır.'],
  ['Başka bir araçtan geçiş yapılabilir mi?', 'Manuel ve CSV tabanlı içe aktarma henüz yayınlanmadı. Veri taşıma araçları müşteri doğrulamasından sonra geliştirilecek entegrasyon paketinin parçasıdır.'],
];

function LandingDashboardPreview() {
  return (
    <div className="landing-product-frame" aria-label="ManageFlow ürün arayüzü önizlemesi">
      <div className="landing-browser-bar"><i /><i /><i /><span>manageflow.bksoftstudio.com/dashboard</span><em><ShieldCheck /> Güvenli</em></div>
      <div className="landing-app-preview">
        <aside>
          <div className="landing-preview-logo"><span>MF</span><b>Manage<span>Flow</span></b></div>
          <div className="landing-preview-org"><i>BK</i><span><b>BK SoftStudio</b><small>Ajans çalışma alanı</small></span></div>
          <nav>
            <b className="active"><Gauge /> Dashboard</b>
            <small>ÇALIŞMA</small>
            <b><FolderKanban /> Projeler</b>
            <b><CheckSquare2 /> Görevler</b>
            <b><BookOpenText /> Çalışma Alanı</b>
            <b><Clock3 /> Zaman Takibi</b>
            <small>EKİP & MÜŞTERİ</small>
            <b><UsersRound /> Ekipler</b>
            <b><UserRound /> Müşteriler</b>
          </nav>
          <div className="landing-preview-user"><i>BK</i><span><b>Burak Kiriş</b><small>Owner</small></span></div>
        </aside>
        <div className="landing-preview-main">
          <header><span>CANLI ÇALIŞMA ALANI</span><div><i /><i /><i /></div></header>
          <div className="landing-preview-welcome"><small>PAZARTESİ · 20 TEMMUZ</small><h3>İyi çalışmalar, Burak.</h3><p>Ajansındaki işlerin bugünkü görünümü.</p></div>
          <div className="landing-preview-stats">
            <article><span><FolderKanban /></span><small>AKTİF PROJE</small><strong>12</strong><em>3 teslim yaklaşıyor</em></article>
            <article><span><CheckSquare2 /></span><small>AÇIK GÖREV</small><strong>38</strong><em>%68 tamamlanma</em></article>
            <article><span><Clock3 /></span><small>BU HAFTA</small><strong>126s</strong><em>Kaydedilen ekip süresi</em></article>
            <article><span><UsersRound /></span><small>EKİP</small><strong>9</strong><em>8 aktif üye</em></article>
          </div>
          <div className="landing-preview-bottom">
            <section><header><span><Activity /> Haftalık akış</span><small>Görev hareketi</small></header><div className="landing-mini-chart"><i style={{ height: '36%' }} /><i style={{ height: '58%' }} /><i style={{ height: '46%' }} /><i style={{ height: '76%' }} /><i style={{ height: '64%' }} /><i style={{ height: '84%' }} /><i style={{ height: '70%' }} /></div></section>
            <section><header><span><Layers3 /> Proje dağılımı</span><small>Canlı</small></header><div className="landing-mini-donut"><i /><span><b>12</b><small>PROJE</small></span></div><div className="landing-mini-key"><span><i /> Devam ediyor <b>7</b></span><span><i /> Planlandı <b>3</b></span><span><i /> Beklemede <b>2</b></span></div></section>
          </div>
        </div>
      </div>
    </div>
  );
}

function TaskShowcase() {
  return (
    <div className="landing-showcase-ui task-ui">
      <header><span><CheckSquare2 /> Görev panosu</span><em>12 görev</em></header>
      <div className="landing-kanban">
        {[
          ['YAPILACAK', 'Brief içeriklerini düzenle', 'Atlas Labs', 'Normal'],
          ['DEVAM EDİYOR', 'Ana sayfa tasarımını tamamla', 'Web yenileme', 'Yüksek'],
          ['TAMAMLANDI', 'Müşteri sunumunu paylaş', 'Marka kimliği', 'Bitti'],
        ].map(([status, title, project, priority], index) => <section key={status}><header><i /><b>{status}</b><span>{index + 2}</span></header><article><small>{project}</small><strong>{title}</strong><footer><i>BK</i><em>{priority}</em></footer></article>{index !== 2 && <article className="ghost"><small>Yeni çalışma</small><strong>{index ? 'Mobil akışı gözden geçir' : 'İçerik planını hazırla'}</strong></article>}</section>)}
      </div>
    </div>
  );
}

function TimeShowcase() {
  return (
    <div className="landing-showcase-ui time-ui">
      <header><span><Clock3 /> Zaman takibi</span><em>CANLI</em></header>
      <div className="landing-timer"><small>WEB YENİLEME · ANA SAYFA</small><strong>01:42:18</strong><button><i /> Sayacı durdur</button></div>
      <div className="landing-time-list"><article><span><i /><b>Bugünkü çalışma</b><small>3 oturum · 2 proje</small></span><strong>5 sa 24 dk</strong></article><article><span><i /><b>Haftalık toplam</b><small>Pazartesi – Pazar</small></span><strong>26 sa 10 dk</strong></article></div>
    </div>
  );
}

function NoteShowcase() {
  return (
    <div className="landing-showcase-ui note-ui">
      <header><span><BookOpenText /> Proje hafızası</span><button>+ Yeni not</button></header>
      <div className="landing-note-grid"><article><small>WEB YENİLEME</small><strong>Müşteri toplantısı kararları</strong><p>Hero mesajı sadeleştirilecek. Mobil navigasyon tek aksiyonla ilerleyecek ve teslim öncesi içerik onayı alınacak.</p><footer><i>BK</i><span>Bugün, 14:30</span></footer></article><article><small>MARKA KİMLİĞİ</small><strong>Tasarım sistemi notları</strong><p>Renk token'ları ve tipografi ölçeği teslim paketinde tek kaynak olarak paylaşılacak.</p><footer><i>EY</i><span>Dün, 17:10</span></footer></article></div>
    </div>
  );
}

export default function LandingPage() {
  const { session } = useAuth();
  const appTarget = session ? '/dashboard' : '/kayit';

  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'ManageFlow — Ajansınızın tüm iş akışı, tek yerde';
    return () => { document.title = previousTitle; };
  }, []);

  return (
    <div className="landing-page">
      <header className="landing-nav-wrap">
        <nav className="landing-nav" aria-label="Ana navigasyon">
          <Logo to="/" ariaLabel="ManageFlow landing ana sayfası" />
          <div className="landing-nav-links"><a href="#urun">Ürün</a><a href="#ozellikler">Özellikler</a><a href="#akis">Nasıl çalışır?</a><a href="#guvenlik">Güvenlik</a><a href="#sss">SSS</a></div>
          <div className="landing-nav-actions"><Link to="/giris">Giriş yap</Link><Link className="landing-button dark small" to={appTarget}>{session ? 'Uygulamayı aç' : 'Ücretsiz başla'} <ArrowRight /></Link></div>
        </nav>
      </header>

      <main className="landing-main">
        <section className="landing-hero">
          <div className="landing-hero-glow" />
          <div className="landing-container landing-hero-inner">
            <div className="landing-kicker"><span><Sparkles /> AJANSLAR İÇİN OPERASYON SİSTEMİ</span><em>Beta · Canlı ürün</em></div>
            <h1>Müşteriden teslimata.<br /><span>Tek akışta.</span></h1>
            <p>Müşterileri, projeleri, görevleri, ekip bilgisini ve zamanı aynı çalışma bağlamında birleştirin. Ajansınız araçlar arasında değil, işin üzerinde çalışsın.</p>
            <div className="landing-hero-actions"><Link className="landing-button dark" to={appTarget}>{session ? 'Çalışma alanına git' : 'Ücretsiz çalışma alanı oluştur'} <ArrowRight /></Link><a className="landing-button light" href="#urun"><Play /> Ürünü keşfet</a></div>
            <div className="landing-hero-proof"><span><CheckCircle2 /> Kart bilgisi gerekmez</span><span><CheckCircle2 /> Dakikalar içinde kurulum</span><span><ShieldCheck /> Organizasyon bazlı güvenlik</span></div>
          </div>
          <div className="landing-container landing-preview-wrap"><div className="landing-preview-label"><span><i /> GERÇEK ÜRÜN DENEYİMİ</span><em>React · Supabase · Canlı veri</em></div><LandingDashboardPreview /></div>
        </section>

        <section className="landing-signal"><div className="landing-container"><p>Ajans işinin bütün parçaları aynı bağlamda</p><div><span>MÜŞTERİLER</span><i /><span>PROJELER</span><i /><span>GÖREVLER</span><i /><span>EKİP</span><i /><span>ZAMAN</span><i /><span>BİLGİ</span></div></div></section>

        <section className="landing-section landing-intro" id="ozellikler">
          <div className="landing-container">
            <div className="landing-section-head"><span>01 · PLATFORM</span><h2>Dağınık araçlar değil.<br />Bağlantılı bir çalışma sistemi.</h2><p>ManageFlow yalnızca yapılacaklar listesi değildir. Ajans ilişkisinin her adımı önceki adımın bağlamını taşır.</p></div>
            <div className="landing-module-grid">{moduleGroups.map(group => <article key={group.number}><header><span>{group.number}</span><i><group.icon /></i></header><h3>{group.title}</h3><p>{group.description}</p><ul>{group.items.map(item => <li key={item}><Check />{item}</li>)}</ul></article>)}</div>
          </div>
        </section>

        <section className="landing-section landing-workflow" id="akis">
          <div className="landing-container">
            <div className="landing-workflow-copy"><span>02 · TEK AKIŞ</span><h2>Her işin nereden geldiği ve nereye gittiği belli.</h2><p>Müşteri bilgisini projeden, projeyi görevden, görevi ekip emeğinden koparmayın.</p><Link className="landing-text-link" to={appTarget}>ManageFlow ile başlayın <ArrowRight /></Link></div>
            <div className="landing-workflow-steps">{workflow.map(([number, title, copy], index) => <article key={number}><span>{number}</span><div><h3>{title}</h3><p>{copy}</p></div>{index < workflow.length - 1 && <ChevronRight />}</article>)}</div>
          </div>
        </section>

        <section className="landing-section landing-product" id="urun">
          <div className="landing-container">
            <div className="landing-section-head centered"><span>03 · ÜRÜNÜN İÇİNDEN</span><h2>Gösteriş için ekran değil.<br />Günlük iş için netlik.</h2><p>Her ekran aynı tasarım dilini, proje bağlamını ve yetki modelini paylaşır.</p></div>
            <div className="landing-showcase-row"><div className="landing-showcase-copy"><span>GÖREV YÖNETİMİ</span><h3>Ekibin işi, akışıyla birlikte görünür.</h3><p>Liste ve Kanban görünümü, alt görevler, checklist, yorumlar ve otomatik aktivite geçmişiyle işi parçalayın; bağlamı kaybetmeyin.</p><ul><li><Check /> Proje ekibinden sorumlu atama</li><li><Check /> Durum ve öncelik akışı</li><li><Check /> Kalıcı filtre ve sıralama</li></ul></div><TaskShowcase /></div>
            <div className="landing-showcase-row reverse"><div className="landing-showcase-copy"><span>ZAMAN TAKİBİ</span><h3>Emeği tahmin etmeyin. Projede görün.</h3><p>Canlı sayaç veya manuel girişle süreyi projeye ve göreve bağlayın. Yenilemede kaybolmayan, sunucu kontrollü bir çalışma geçmişi oluşturun.</p><ul><li><Check /> Tek aktif sayaç güvencesi</li><li><Check /> Haftalık kişisel görünüm</li><li><Check /> Gelecek zaman bütünlüğü</li></ul></div><TimeShowcase /></div>
            <div className="landing-showcase-row"><div className="landing-showcase-copy"><span>ÇALIŞMA ALANI</span><h3>Projenin hafızası ekipte kalsın.</h3><p>Toplantı kararlarını, brief detaylarını ve kritik notları ilgili projede saklayın. Arama ve rol korumalı düzenlemeyle bilgiye güvenle ulaşın.</p><ul><li><Check /> Ortak proje notları</li><li><Check /> Yazar ve yönetici yetkileri</li><li><Check /> Proje ve tam metin arama</li></ul></div><NoteShowcase /></div>
          </div>
        </section>

        <section className="landing-security" id="guvenlik">
          <div className="landing-container">
            <div className="landing-security-copy"><span>04 · GÜVENLİ TEMEL</span><h2>Yetki, sonradan eklenen bir ayar değil. Sistemin temeli.</h2><p>ManageFlow çok kiracılı veri sınırını arayüzde değil, veritabanında uygular. Her organizasyon yalnız kendi çalışma alanına erişir.</p><Link className="landing-button light-on-dark" to={appTarget}>Güvenli çalışma alanı oluştur <ArrowRight /></Link></div>
            <div className="landing-security-grid"><article><ShieldCheck /><h3>Tenant izolasyonu</h3><p>Her kayıt organizasyon bağlamında korunur ve çapraz erişim RLS ile engellenir.</p></article><article><LockKeyhole /><h3>Rol bazlı erişim</h3><p>Owner, admin, proje yöneticisi ve üye yetkileri sunucu tarafında doğrulanır.</p></article><article><Activity /><h3>Değişiklik bütünlüğü</h3><p>Zaman, arşiv aktörü ve sistem geçmişi gibi kritik alanlar istemciye bırakılmaz.</p></article><article><Gauge /><h3>Test edilen politikalar</h3><p>Yetki matrisi rollback kullanan uzak güvenlik testleriyle sürekli doğrulanır.</p></article></div>
          </div>
        </section>

        <section className="landing-section landing-audience">
          <div className="landing-container"><div className="landing-section-head"><span>05 · KİMLER İÇİN?</span><h2>Müşteri işi yöneten ekipler için tasarlandı.</h2></div><div className="landing-audience-grid"><article><span>AJANSLAR</span><h3>Birden çok müşteriyi aynı netlikle yönetin.</h3><p>Proje, ekip, görev ve süreyi müşteri bağlamında birleştirin.</p><ArrowRight /></article><article><span>YARATICI STÜDYOLAR</span><h3>Brief'ten revizyona bilgi kaybını azaltın.</h3><p>Kararları ve teslim akışını ortak proje hafızasında tutun.</p><ArrowRight /></article><article><span>KÜÇÜK EKİPLER</span><h3>Süreç kurmak için ağır bir sisteme mahkûm olmayın.</h3><p>Sade arayüzle başlayın; ekip ve müşteri sayısı arttıkça ölçekleyin.</p><ArrowRight /></article></div></div>
        </section>

        <section className="landing-section landing-roadmap">
          <div className="landing-container"><div className="landing-roadmap-card"><div><span>ŞİMDİ CANLI</span><h2>Çekirdek ajans operasyonu hazır.</h2><p>Auth, ekip, müşteri, proje, görev, zaman ve ortak proje notları gerçek veriye bağlı.</p></div><div className="landing-roadmap-modules"><span><Check /> Müşteri ve proje</span><span><Check /> Görev ve ekip</span><span><Check /> Zaman takibi</span><span><Check /> Proje notları</span><span className="future"><Sparkles /> Dosyalar · yolda</span><span className="future"><Sparkles /> Bildirimler · yolda</span><span className="future"><Sparkles /> Takvim · yolda</span><span className="future"><Sparkles /> Flow AI · yolda</span></div></div></div>
        </section>

        <section className="landing-section landing-faq" id="sss">
          <div className="landing-container"><div className="landing-section-head"><span>06 · SIK SORULANLAR</span><h2>Başlamadan önce<br />bilmek isteyecekleriniz.</h2></div><div className="landing-faq-list">{faqs.map(([question, answer], index) => <details key={question} open={index === 0}><summary><span>{String(index + 1).padStart(2, '0')}</span>{question}<i><Menu /><X /></i></summary><p>{answer}</p></details>)}</div></div>
        </section>

        <section className="landing-final-cta">
          <div className="landing-container"><div className="landing-final-card"><span><Sparkles /> AJANSINIZIN YENİ ÇALIŞMA AKIŞI</span><h2>Araç yönetmeyi bırakın.<br />İşi birlikte ilerletin.</h2><p>Müşterinizden ekibinize, görevlerden harcanan zamana kadar bütün çalışma bağlamınız tek yerde.</p><div><Link className="landing-button light-on-dark" to={appTarget}>{session ? 'Uygulamayı aç' : 'Ücretsiz başlayın'} <ArrowRight /></Link><Link className="landing-button outline-on-dark" to="/giris">Mevcut hesabımla giriş yap</Link></div></div></div>
        </section>
      </main>

      <footer className="landing-footer"><div className="landing-container"><div className="landing-footer-main"><div><Logo to="/" ariaLabel="ManageFlow landing ana sayfası" /><p>Ajansların müşteri, proje, görev, ekip bilgisi ve zamanı tek bağlamda yönetmesi için geliştirilen modern çalışma platformu.</p></div><div><b>Ürün</b><a href="#ozellikler">Özellikler</a><a href="#urun">Ürün ekranları</a><a href="#guvenlik">Güvenlik</a></div><div><b>Başlayın</b><Link to="/kayit">Hesap oluştur</Link><Link to="/giris">Giriş yap</Link><a href="#sss">SSS</a></div><div><b>Durum</b><span><i /> Beta yayında</span><small>Türkiye'de geliştiriliyor</small></div></div><div className="landing-footer-bottom"><span>© 2026 ManageFlow · BK SoftStudio</span><em>Ajans operasyonu, tek akışta.</em></div></div></footer>
    </div>
  );
}
