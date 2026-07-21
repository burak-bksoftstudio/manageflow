# ManageFlow — Geliştirme ve Ürün Yol Haritası

> Bu belge projenin yaşayan teknik ve ürün kaydıdır. Uygulamada yapılan her anlamlı değişiklikte bu dosya da aynı geliştirme kapsamında güncellenmelidir.

## Belge bilgileri

| Alan | Değer |
|---|---|
| Proje adı | ManageFlow |
| Belge türü | Yaşayan geliştirme dokümanı |
| İlk oluşturulma | 18 Temmuz 2026 |
| Son güncelleme | 22 Temmuz 2026 |
| Mevcut sürüm | `0.35.0-member-removal` |
| Mevcut aşama | Owner/admin normal ekip üyelerini sunucu doğrulamalı akışla çalışma alanından güvenle kaldırabiliyor |
| Sonraki ana hedef | Merkezi arşiv görünümü ve Çalışma Alanı not düzeni |

---

## 1. Ürün vizyonu

ManageFlow; öncelikle ajansların ekiplerini, müşterilerini, projelerini ve görevlerini tek çalışma alanından yönetmesini sağlayan bir SaaS iş yönetim platformu olacaktır. Ürün ilerleyen aşamalarda freelancerlara ve diğer küçük ekiplere açılabilecek; ilk ürün kararları ajansların ihtiyaçlarına göre verilecektir.

### Kesinleşen ürün kararları

- İlk hedef kitle: **Ajanslar**
- Geliştirmenin başlangıç alanı: **Ekip ve organizasyon temeli**
- İlk uçtan uca iş akışı: **Müşteri → Proje → Görev**
- Görsel karakter: **Minimal monokrom**
- Marka yaklaşımı: Özgün ManageFlow logosu ve kontrollü tek vurgu rengi
- Geliştirme yaklaşımı: Küçük, doğrulanabilir adımlar; her aşama tamamlanmadan sonraki aşamaya geçmeme

Ürünün temel değer zinciri:

```text
Müşteri
→ Proje
→ Görev
→ Ekip çalışması
→ Zaman ve dosyalar
→ Teslim
→ Raporlama
```

Uzun vadede bu çekirdek yapının çevresine CRM, satış, teklifler, sözleşmeler, finans, otomasyonlar ve AI destekli çalışma katmanı eklenecektir.

Ürünün amacı birbirinden kopuk çok sayıda aracı yalnızca aynı menü altında toplamak değildir. Bütün modüllerin müşteri, proje, görev ve organizasyon bağlamında birbiriyle ilişkili çalışması hedeflenmektedir.

---

## 2. Mevcut durum özeti

Uygulama şu anda çalışan ve responsive bir frontend prototipidir. Arayüz React ile hazırlanmıştır ve Vite üzerinde çalışmaktadır.

Mevcut sürümde:

- Uygulama yerel ortamda açılmaktadır.
- Production derlemesi başarıyla alınmaktadır.
- Masaüstü ve mobil arayüz bulunmaktadır.
- Dashboard aktif organizasyonun gerçek müşteri, proje, görev ve ekip verileriyle görüntülenmektedir.
- Bazı arayüz etkileşimleri gerçekten çalışmaktadır.
- Supabase istemcisi uzak projeye bağlıdır; Auth, organizasyon ve ekip ekranları gerçek veriyi kullanmaktadır.
- Dashboard, `/musteriler`, `/projeler`, `/gorevler`, `/zaman-takibi`, `/ekipler` ve `/ozellestirme` gerçek Supabase verisini kullanmaktadır; tamamlanmamış modüller demo/placeholder durumundadır.
- Supabase Auth kayıt, giriş, çıkış, doğrulama ve şifre yenileme arayüzleri bulunmaktadır.
- Uygulama rotaları oturumsuz erişime karşı korunmaktadır; kayıt, e-posta doğrulama, çıkış ve yeniden giriş gerçek hesapla doğrulanmıştır.
- Production Supabase Auth adresleri tanımlanmış; gerçek şifre sıfırlama e-postası, recovery callback'i ve yeni şifre kaydı canlı ortamda uçtan uca doğrulanmıştır.
- İlk organizasyon onboarding akışı, aktif organizasyon context'i ve owner üyeliği gerçek Supabase verisiyle çalışmaktadır.
- Owner/admin güvenli davet e-postası gönderebilir; alıcı doğrulanmış e-postasıyla daveti kabul ederek gerçek üyelik oluşturabilir.
- Bekleyen davetler ekip listesinde görünür ve yetkili kullanıcı tarafından iptal edilebilir.
- Member, admin ve owner veritabanı yetkileri rollback kullanan uzak RLS smoke testiyle doğrulanmıştır.
- Başka organizasyonların organizasyon, üyelik ve davet kayıtları member/admin oturumlarından gizlenmektedir.
- Müşteri kayıtları aktif organizasyona bağlı gerçek Supabase verisiyle listelenip yönetilebilmektedir.
- Projeler aktif organizasyona ve zorunlu müşteriye bağlı gerçek Supabase verisiyle oluşturulup düzenlenebilmekte ve geri alınabilir biçimde arşivlenebilmektedir.
- Görevler aktif organizasyona ve zorunlu projeye bağlı gerçek Supabase verisiyle oluşturulup düzenlenebilmekte, yeniden atanabilmekte ve geri alınabilir biçimde arşivlenebilmektedir; üst/alt görev ilişkileri, checklist, yorumlar, otomatik aktivite geçmişi ve organizasyon bazlı kalıcı gelişmiş filtre/sıralama tercihleri çalışmaktadır.
- Kullanıcı sidebar hesap kartından doğrudan kendi profil ayarına; çalışma alanı menüsünden ajans ayarına gidebilir. Profil adı, telefon ve HTTPS avatar adresi güncellenebilir; owner/admin organizasyon adı ve logo adresini değiştirebilir, diğer roller organizasyon ayarlarını salt okunur görür.
- Kullanıcı bir projeye ve isteğe bağlı göreve bağlı tek aktif zaman sayacı başlatıp durdurabilir; geçmiş çalışmayı güvenli manuel süre olarak ekleyebilir ve haftalık kişisel geçmişini proje/görev bağlamında filtreleyebilir. Owner/admin aynı ekrandaki rol korumalı Ekip Raporu görünümünden haftalık organizasyon sürelerini üye, proje ve müşteri kırılımında inceleyip filtrelenmiş CSV olarak indirebilir.
- Ekip üyeleri organizasyon geneline bağımsız veya aktif projeye bağlı ortak not ekleyebilir, bağlam/metinle arayabilir ve yetkileri kapsamındaki notları düzenleyebilir.
- Uygulama `https://manageflow.bksoftstudio.com` özel domaininde yayınlanmaktadır; eski `vercel.app` adresi yedek erişim olarak korunmaktadır.
- Mevcut ekran ürün tasarımını ve etkileşim yönünü doğrulamak için hazırlanmıştır.
- Kullanıma hazır olmayan bütün ana modüller arayüzde `Yakında` olarak işaretlenmektedir.

### Modül kullanılabilirliği

| Modül | Durum |
|---|---|
| Kimlik doğrulama | Supabase ile bağlı; kayıt/doğrulama/giriş/çıkış/şifre yenileme doğrulandı |
| Organizasyon onboarding | Gerçek Supabase verisiyle kullanılabilir |
| Dashboard | Gerçek metrik, haftalık görev hareketi, proje dağılımı, aktif proje özeti ve bugünkü gündem bağlı |
| Ekipler | Gerçek üye listesi, yetkili güncelleme, güvenli davet, kabul ve iptal akışları bağlı |
| Müşteriler | Gerçek liste, oluşturma, detay, düzenleme ve pasife alma akışları Supabase ile bağlı |
| Projeler | Gerçek CRUD yaşam döngüsü ve ekip üyesi atama/çıkarma Supabase ile bağlı |
| Görevler | Gerçek CRUD, hiyerarşi, proje ekibi ataması, güvenli arşivleme, Liste/Kanban, checklist, yorumlar, aktivite geçmişi ve kalıcı gelişmiş filtre/sıralama bağlı |
| Hızlı proje/görev oluşturma | Gerçek Proje ve Görev oluşturma ekranlarına güvenli yönlendirme yapıyor |
| Gündem ve bildirimler | Bugünkü görev gündemi gerçek; bildirimler demo |
| Çalışma Alanı | Gerçek bağımsız/proje bağlantılı ortak notlar, bağlam filtresi, arama, oluşturma, görüntüleme ve rol korumalı düzenleme Supabase ile bağlı |
| Dosyalar | Yakında |
| Zaman Takibi | Gerçek sayaç, manuel süre, haftalık kişisel geçmiş, güvenli düzeltme/arşivleme, owner/admin ekip timesheet, proje/müşteri kırılımı ve filtrelenmiş CSV dışa aktarma Supabase ile bağlı |
| Flow AI | Yakında |
| Kanallar, Gelen Kutusu ve Takvim | Yakında |
| Profil ve özelleştirme | Gerçek profil ve rol korumalı organizasyon ayarları Supabase ile bağlı |
| Production yayını | Vercel, GitHub deployment, özel domain, HTTPS ve production Auth origin bağlantıları çalışıyor |
| Herkese açık landing | `/` rotasında ürün anlatımı, canlı modüller/yol haritası ayrımı, FAQ, güvenlik anlatımı ve kayıt/giriş CTA'ları hazır |
| Organizasyon değiştirme | Yakında |

### Mevcut teknik seviye

| Katman | Durum | Açıklama |
|---|---|---|
| UI tasarımı | Hazır | Dashboard ve ortak tasarım dili oluşturuldu |
| Responsive yapı | Hazır | Masaüstü, tablet ve mobil kırılımlar bulunuyor |
| Frontend etkileşimleri | Kısmen hazır | Modal, drawer, tema, menü ve demo ekleme işlemleri çalışıyor |
| Routing | Hazır | BrowserRouter, gerçek modül URL'leri ve 404 sayfası bulunuyor |
| Backend | Kısmen hazır | Auth, profil/organizasyon ayarları, ekip, müşteri, proje, görev, kişisel/ekip zaman takibi ve proje notları bağlı; diğer iş modülleri henüz bağlı değil |
| Veritabanı | Kısmen hazır | Çekirdek SaaS, `time_entries`, rol korumalı ekip timesheet RPC'si ve `project_notes` şemaları RLS/bütünlük kurallarıyla uzak veritabanına uygulandı |
| Kimlik doğrulama | Hazır | Kayıt, doğrulama, giriş, çıkış, kalıcı oturum ve güvenli şifre yenileme canlı hesapla doğrulandı |
| Yetkilendirme | Kısmen hazır | Owner/admin/member matrisi, owner koruması ve çapraz organizasyon izolasyonu gerçek RLS testiyle doğrulandı |
| Dosya depolama | Başlanmadı | Gerçek dosya yükleme yok |
| Gerçek zamanlı işlemler | Başlanmadı | Mesaj ve canlı bildirim altyapısı yok |
| Test altyapısı | Kısmen hazır | Vitest ve çekirdek domain/zaman takibi testleri ile ayrı uzak RLS smoke testleri bulunuyor; UI/E2E testleri henüz yok |
| Deployment | Hazır | Vercel production yayını, GitHub bağlantısı, SPA rewrite, özel domain, HTTPS, ortam değişkenleri ve Auth callback'leri çalışıyor |

---

## 3. Kullanılan teknoloji ve proje yapısı

### Mevcut teknolojiler

- React
- React DOM
- Vite
- JavaScript/JSX
- Vanilla CSS
- Lucide React ikonları
- Google Fonts üzerinden Archivo yazı tipi
- Supabase JavaScript istemcisi
- Supabase Auth
- Supabase Edge Functions
- PostgreSQL/Supabase migration ve RLS altyapısı

### Mevcut komutlar

Geliştirme sunucusu:

```bash
npm run dev
```

Production derlemesi:

```bash
npm run build
```

Derlemeyi yerelde önizleme:

```bash
npm run preview
```

### Mevcut dosyalar

```text
manage/
├── .env.example
├── GELISTIRME.md
├── index.html
├── package.json
├── package-lock.json
├── public/
│   ├── manageflow-logo.svg
│   └── manageflow-mark.svg
├── supabase/
│   ├── functions/
│   ├── migrations/
│   └── README.md
└── src/
    ├── components/
    ├── data/
    ├── features/
    ├── lib/
    ├── pages/
    ├── App.jsx
    ├── main.jsx
    └── styles.css
```

### Mevcut mimari hakkında not

Prototip; ortak layout, overlay, marka, demo veri ve sayfa bileşenlerine ayrılmıştır. Özellik sayısı büyüdükçe domain bazlı `features/`, servis, hook ve veri tipi katmanları eklenmelidir.

Hedef frontend yapısı:

```text
src/
├── app/
│   ├── App.jsx
│   ├── router.jsx
│   └── providers.jsx
├── components/
│   ├── common/
│   ├── layout/
│   ├── feedback/
│   └── forms/
├── features/
│   ├── auth/
│   ├── organizations/
│   ├── dashboard/
│   ├── customers/
│   ├── projects/
│   ├── tasks/
│   ├── messages/
│   ├── calendar/
│   ├── files/
│   ├── time-tracking/
│   └── ai/
├── hooks/
├── lib/
├── services/
├── styles/
├── types/
└── utils/
```

---

## 4. Şu anda çalışan arayüz özellikleri

### 4.1 Genel uygulama kabuğu

- Sabit sol navigasyon
- Daraltılabilir masaüstü sidebar
- Mobil ekranlarda açılır menü
- Menü dışına tıklayınca kapanan mobil scrim
- Kullanıcı ve organizasyon alanı
- Ana içerik alanı
- Üst hızlı işlem çubuğu
- Açık ve koyu tema
- Responsive yerleşim
- `prefers-reduced-motion` desteği
- Klavye odağı için temel focus stilleri

### 4.2 Sidebar

Şu menü öğeleri bulunmaktadır:

- Dashboard
- Mana AI
- Projeler
- Görevler
- Çalışma Alanı
- Dosyalar
- Zaman Takibi
- Takımlar
- Özelleştirme
- Kanallar
- Gelen Kutusu
- Takvim

Çalışan davranışlar:

- Menü daraltılabilir.
- Menü grupları açılıp kapatılabilir.
- Menü öğesine basıldığında aktif sayfa değişir.
- Mobil menü açılıp kapatılabilir.
- Dashboard dışındaki sayfalar geçici placeholder ekran göstermektedir.

### 4.3 Dashboard başlığı

- Dashboard bağlam etiketi
- Kullanıcıya özel karşılama metni
- Kullanıcı avatarı
- Canlı veri görsel göstergesi
- Günün gündemine erişim
- Projeler kısayolu
- Hızlı oluşturma düğmesi
- Tema değiştirme düğmesi
- Arama düğmesi
- Bildirim düğmesi
- Duyuru düğmesi

### 4.4 KPI kartları

Aktif organizasyonun gerçek verisinden hesaplanan kartlar:

- Arşiv dışındaki toplam ve devam eden projeler
- Arşiv dışındaki toplam/tamamlanan görevler ve tamamlanma oranı
- Toplam ve aktif müşteriler
- Davetler hariç toplam ve aktif ekip üyeleri

Arşivlenmiş görevlere veya arşivlenmiş projelere bağlı görevlere Dashboard metriklerinde yer verilmez.

### 4.5 Haftalık ilerleme

- Son yedi gün için gerçek görev oluşturma/tamamlama grafiği
- Oluşturulan ve tamamlanan görev serileri
- Responsive grafik alanı
- Arşiv dışındaki projeler için dinamik donut grafik
- Devam ediyor, beklemede, planlandı ve tamamlandı durum ayrımı

### 4.6 Aktif projeler

Her proje satırında:

- Proje adı
- Müşteri adı
- Proje durumu
- İlerleme oranı
- Proje ikonu
- Teslim tarihi

bulunmaktadır. Son oluşturulan ve henüz tamamlanmamış en fazla beş proje gösterilir; satır ve “Tümünü gör” bağlantısı gerçek Projeler ekranına gider.

### 4.7 Hızlı oluşturma

- Üst “+” düğmesi proje veya görev başlangıcını seçtirir.
- Proje seçimi gerçek müşteri bağlantılı Projeler ekranına gider.
- Görev seçimi gerçek proje/görevli bağlantılı Görevler ekranına gider.
- Kalıcı olmayan sahte sayaç ve demo oluşturma state'i kaldırılmıştır.

### 4.8 Bugünkü gündem

Sağdan açılan drawer içerisinde:

- Tarih
- Günün odağı
- Tamamlanma sayacı
- Teslim tarihi bugün olan gerçek görevler
- Görev önceliği, proje ve durum bilgisi
- Gerçek Görevler ekranına bağlantı

bulunmaktadır. Arşivlenmiş görevler ve arşivlenmiş projelerin görevleri gündemde gösterilmez. Toplantı/takvim olayları henüz bağlı değildir.

### 4.9 Arama

- Arama overlay'i açılmaktadır.
- Arama input'u otomatik odaklanmaktadır.
- Proje, görev, kişi ve dosya araması için görsel tasarım hazırdır.

Gerçek arama motoru veya veri kaynağı bulunmamaktadır.

### 4.10 Bildirimler

- Bildirim popover'ı açılıp kapanmaktadır.
- Okunmamış bildirim sayısı gösterilmektedir.
- Demo bildirim listesi bulunmaktadır.

Bildirimler henüz kullanıcı hesabına veya gerçek olaylara bağlı değildir.

### 4.11 Ekip yönetimi

- `/ekipler` gerçek URL'si
- Toplam, aktif ve davet bekleyen üye metrikleri
- Departman sayısı
- İsim, e-posta ve unvan araması
- Rol, departman ve durum filtreleri
- Masaüstü ekip tablosu
- Responsive ekip üyesi kart davranışı
- Üye detay drawer'ı
- Üye bilgisi, rolü, departmanı ve durumunu düzenleme
- Yeni ekip üyesi davet formu
- Filtre sonucu boş durumu
- Tekrarlayan e-posta ve form doğrulaması
- Çalışma alanı sahibi rol/erişim koruması
- Devre dışı bırakma onayı
- İşlem başarı toast mesajları
- Escape ile modal/drawer kapatma ve arka plan kaydırma kilidi
- Aktif organizasyonun gerçek üyelik ve profil kayıtlarını RLS altında okuma
- Profil e-postasını Supabase Auth kaynağından güvenli biçimde senkronlama
- Loading, backend hata, yeniden deneme ve gerçek boş durumları
- Owner/admin rollerine göre düzenleme yetkisi
- Üyelik rolü, durum, departman ve unvanını Supabase'e kaydetme
- Owner rolü ve erişimini arayüz/veritabanı seviyesinde koruma
- Profil adı ve e-posta alanlarını ekip yöneticisinin değişikliğine kapatma
- Owner/admin rolüyle gerçek davet e-postası gönderme
- Owner/admin için normal üyeyi güvenli onayla çalışma alanından kaldırma
- Üye kaldırılırken kullanıcı hesabını ve tarihsel iş kayıtlarını koruma
- Organizasyon sahibini, yöneticinin kendisini ve doğrudan tablo silmeyi sunucuda engelleme
- Daveti Supabase Edge Function içinde server-side oluşturma ve gönderme
- Yeni hesap için Auth invite, mevcut hesap için güvenli magic link geri dönüşü
- Bekleyen davetleri gerçek ekip listesi ve metriklerine ekleme
- Bekleyen davetin ayrıntılarını görüntüleme ve iptal etme
- `/davet-kabul` rotasında davet e-postası ile oturum e-postasını eşleştirme
- Yeni davet edilen kullanıcı için ilk giriş şifresi belirleme
- Daveti transaction içinde gerçek aktif organizasyon üyeliğine dönüştürme
- Süresi dolan, tekrarlanan, yanlış hesapla açılan ve owner rolü isteyen davetleri engelleme

Supabase yapılandırılmış ortamda ekip listesi, üyelik güncellemeleri ve davetler gerçek veriyi kullanır. Supabase bağlantısı olmayan demo ortamında önceki örnek veri davranışı korunur. Gerçek davet butonundaki `Yakında` durumu kaldırılmıştır. İkinci gerçek e-posta hesabına davet teslimi, ilk giriş, kabul ve aktif üyeliğe dönüşüm uçtan uca doğrulanmıştır.

### 4.12 Kimlik doğrulama

- `/giris`, `/kayit` ve `/sifremi-unuttum` genel erişim rotaları
- `/eposta-dogrula` ve `/sifre-yenile` callback rotaları
- Supabase oturumunun uygulama seviyesinde merkezi yönetimi
- Oturumun tarayıcıda korunması ve token yenileme desteği
- Oturumsuz kullanıcıyı giriş ekranına yönlendiren korumalı rotalar
- Oturum açıkken giriş/kayıt ekranlarından Dashboard'a yönlendirme
- Ad soyad metadata'sı ile kullanıcı kaydı
- E-posta doğrulama bağlantısı
- Şifre sıfırlama e-postası ve yeni şifre formu
- Yeni şifre formunu yalnızca gerçek `PASSWORD_RECOVERY` callback oturumu için açma
- Süresi dolmuş, hatalı veya normal giriş oturumuyla açılmış reset bağlantısını güvenli biçimde reddetme
- `VITE_APP_URL` ile production callback'lerini sabit ve doğrulanmış HTTPS origin'ine yönlendirme
- Kullanıcıya gösterilen güvenli Türkçe hata mesajları
- Gerçek kullanıcının ad, e-posta ve avatar baş harflerini sidebar/Dashboard'da gösterme
- Sidebar üzerinden güvenli çıkış
- Supabase bağlantısı olmayan geliştirme ortamında demo arayüzünü koruma

Auth ekranları masaüstü ve mobil yerleşimde görsel olarak doğrulandı. Yerel ve production URL izin listeleri yapılandırıldı; gerçek hesapla kayıt, e-posta doğrulama, çıkış, yeniden giriş ve production şifre yenileme akışı tamamlandı.

### 4.13 Organizasyon onboarding

- Organizasyonu olmayan kullanıcıyı `/kurulum` rotasına yönlendirme
- Ajans/ekip adı ve otomatik URL slug alanı
- Türkçe karakterleri güvenli slug değerine dönüştürme
- Organizasyon adı ve slug doğrulaması
- Slug çakışması için kullanıcıya anlaşılır hata durumu
- `organizations` tablosuna gerçek Supabase insert işlemi
- Yeni organizasyon için veritabanı trigger'ıyla otomatik owner üyeliği
- Kullanıcının organizasyon üyeliklerini RLS altında okuyan merkezi organization provider
- Aktif organizasyonu tarayıcıda hatırlama
- Organizasyonu olan kullanıcıyı kurulumdan Dashboard'a yönlendirme
- Gerçek organizasyon adı ve rolünü sidebar'da gösterme
- Supabase bağlantısı olmayan ortamda demo organizasyonu koruma

Gerçek hesapla ilk organizasyon oluşturuldu; uzak veritabanında 1 organizasyon ve ona bağlı 1 owner üyeliği bulunduğu doğrulandı.

### 4.14 Müşteri yönetimi

- Sidebar'da gerçek `Müşteriler` menüsü ve `/musteriler` rotası
- Aktif organizasyona bağlı Supabase `clients` tablosu
- Firma/müşteri adı, yetkili kişi, e-posta, telefon, sektör, durum ve not alanları
- Potansiyel, aktif ve pasif müşteri durumları
- Toplam, aktif, potansiyel ve sektör metrikleri
- Müşteri, yetkili, e-posta ve sektör araması
- Duruma göre müşteri filtresi
- Responsive müşteri listesi
- Loading, backend hata, yeniden deneme, gerçek boş durum ve filtre boş durumu
- Owner/admin/proje yöneticisi için gerçek müşteri oluşturma modalı
- Member rolünde oluşturma düğmesini devre dışı bırakma
- Form ve veritabanı constraint hatalarını Türkçe kullanıcı mesajlarına dönüştürme
- Aynı organizasyonda büyük/küçük harf duyarsız tekrarlayan müşteri adını engelleme
- Müşteriyi başka organizasyona taşıma ve oluşturucu kimliğini değiştirme koruması
- Supabase olmayan ortam için demo müşteri listesi ve oluşturma fallback'i
- Müşteri satırından açılan detay drawer'ı
- İletişim, sektör, durum ve notların gerçek Supabase update işlemi
- Member rolünde salt okunur detay görünümü
- Fiziksel silme yerine onaylı pasife alma ve yeniden aktifleştirme desteği
- Düzenleme/pasife alma loading, doğrulama, hata ve başarı durumları

Müşteri çekirdeğinin listeleme, oluşturma, detay, düzenleme ve pasife alma altyapısı tamamlanmıştır. Müşteri bağlantısı proje temelinde kullanılmaktadır.

### 4.15 Proje yönetimi temeli

- Sidebar'da aktif `Projeler` menüsü ve lazy-loaded `/projeler` rotası
- Aktif organizasyona ve zorunlu müşteriye bağlı Supabase `projects` tablosu
- Planlandı, devam ediyor, beklemede ve tamamlandı proje durumları
- Proje adı, müşteri, açıklama, durum, ilerleme, başlangıç ve bitiş tarihi alanları
- Proje ile müşterinin aynı organizasyonda olmasını zorunlu kılan bileşik foreign key
- Organizasyon içinde büyük/küçük harf duyarsız benzersiz proje adı
- Proje adı/açıklaması normalizasyonu, tarih sırası ve ilerleme constraint'leri
- Organizasyon üyeleri için proje okuma RLS policy'si
- Owner/admin/proje yöneticisi için proje oluşturma ve güncelleme RLS policy'leri
- Member rolünde yeni proje düğmesini devre dışı bırakma
- Yalnızca aktif müşterileri proje oluşturma seçiminde gösterme
- Toplam, devam eden, planlanan ve tamamlanan proje metrikleri
- Proje/müşteri/açıklama araması; durum ve müşteri filtreleri
- Responsive gerçek proje listesi ve ilerleme göstergeleri
- Loading, backend hata, yeniden deneme, boş liste ve filtre boş durumu
- Gerçek Supabase insert işlemi yapan proje oluşturma modalı
- Başlangıç/bitiş tarihi sırası için istemci ve veritabanı doğrulaması
- Supabase olmayan ortam için demo proje listesi ve oluşturma fallback'i
- Proje satırından açılan detay drawer'ı
- Proje adı, müşteri, açıklama, durum, ilerleme ve tarihleri güncelleme
- Member rolünde salt okunur proje detayı
- Tamamlanan projeyi veritabanında zorunlu yüzde 100 ilerlemeye getirme
- Tamamlanmış proje yeniden açıldığında ilerlemeyi güvenli yüzde 90 değerine çekme
- Proje silmek yerine `archived_at` ve `archived_by` alanlarıyla geri alınabilir arşivleme
- Arşivleyen kullanıcının oturum kimliğiyle eşleşmesini zorunlu kılan trigger
- Aktif, arşivlenmiş ve tüm projeler filtreleri
- Arşiv dışındaki projelerden hesaplanan güncel metrikler
- Yetkili kullanıcı için arşivden geri çıkarma akışı
- Organizasyon ve proje arasında güvenli çoklu üye ilişkisi kuran `project_members` tablosu
- Proje oluşturucusunu otomatik proje üyesi yapan veritabanı trigger'ı
- Yalnızca aynı organizasyonun aktif üyelerini projeye atama
- Owner/admin/proje yöneticisi için ekip üyesi ekleme ve çıkarma
- Member rolü için salt okunur proje ekibi görünümü
- Arşivlenmiş projelerde ekip değişikliğini arayüz ve RLS seviyesinde kapatma
- Tekrar eden, pasif ve çapraz organizasyon üye atamalarını engelleme
- Proje drawer'ında atanan kişi sayısı, üye kartları, unvan ve departman görünümü
- Supabase olmayan ortam için proje ekibi demo fallback'i

Proje CRUD yaşam döngüsü ve proje ekibi yönetimi tamamlanmıştır.

### 4.16 Görev yönetimi ve yaşam döngüsü

- Sidebar'da aktif `Görevler` menüsü ve lazy-loaded `/gorevler` rotası
- Aktif organizasyona ve zorunlu projeye bağlı Supabase `tasks` tablosu
- Yapılacak, devam ediyor, incelemede ve tamamlandı görev durumları
- Düşük, normal, yüksek ve acil görev öncelikleri
- Başlık, açıklama, proje, isteğe bağlı görevli ve bitiş tarihi alanları
- Görev ile projenin aynı organizasyonda olmasını zorunlu kılan bileşik foreign key
- Görevlinin seçilen projenin ekip üyesi olmasını zorunlu kılan bileşik foreign key
- Proje üyesi çıkarıldığında mevcut görev atamasını güvenli biçimde boşaltma
- Tamamlanan görev için `completed_at` zamanını otomatik oluşturma ve yeniden açıldığında temizleme
- Organizasyon üyeleri için görev okuma RLS policy'si
- Owner/admin/proje yöneticisi için görev oluşturma ve güncelleme RLS policy'leri
- Arşivlenmiş projelerde yeni görev oluşturmayı veritabanında reddetme
- Toplam, yapılacak, devam eden ve tamamlanan görev metrikleri
- Görev/proje/görevli/açıklama araması; durum ve proje filtreleri
- Responsive gerçek görev listesi, durum ve öncelik göstergeleri
- Loading, backend hata, yeniden deneme, boş liste ve filtre boş durumu
- Gerçek proje ve proje ekibi seçimli görev oluşturma modalı
- Member rolünde yeni görev düğmesini devre dışı bırakma
- Görev satırından açılan gerçek detay drawer'ı
- Başlık, açıklama, proje, durum, öncelik, bitiş tarihi ve görevli güncelleme
- Proje değiştiğinde görevliyi sıfırlama ve yalnızca yeni projenin ekibini listeleme
- Tamamlama ve yeniden açma sırasında veritabanı tarafından yönetilen `completed_at`
- Fiziksel silme yerine `archived_at` ve doğrulanmış `archived_by` kullanan geri alınabilir arşivleme
- Aktif, arşivlenen ve tüm görevler filtreleri; metriklerden arşiv görevlerini hariç tutma
- Arşivlenmiş projeye bağlı görevleri salt okunur tutma
- Member için detay görünümü ve yönetici/proje yöneticisi için düzenleme/arşiv yetkisi
- Supabase olmayan ortam için demo görev liste/oluşturma/güncelleme/arşivleme fallback'i
- Kullanıcının tercihini tarayıcıda koruyan Liste/Kanban görünüm seçicisi
- Yapılacak, devam ediyor, incelemede ve tamamlandı durum sütunları
- Liste ve Kanban arasında ortak arama, proje, durum ve arşiv filtreleri
- Yetkili roller için masaüstü sürükle-bırak ile gerçek Supabase durum güncellemesi
- Klavye, dokunmatik ekran ve erişilebilir kullanım için kart içi durum seçicisi
- Member rolü ile arşivlenmiş görev/proje kartlarında salt okunur Kanban davranışı
- Durum güncellenirken kart loading durumu ve başarısız güncellemede görünümü koruyan hata bildirimi
- Mobilde yatay kaydırılabilir, sütunları snap eden responsive Kanban panosu
- Göreve ve organizasyona bileşik foreign key ile bağlı gerçek `task_checklist_items` tablosu
- Checklist başlığı, kalıcı sırası, tamamlanma durumu, tamamlanma zamanı ve oluşturan kullanıcı alanları
- Görev detay drawer'ında gerçek checklist listesi, tamamlanan/toplam sayısı ve ilerleme çubuğu
- Yetkili roller için checklist öğesi ekleme, tamamlama, yeniden açma ve silme
- Member rolü ile arşivlenmiş görev/proje bağlamında salt okunur checklist davranışı
- Tamamlama zamanını veritabanı trigger'ıyla ayarlama ve yeniden açmada temizleme
- Arşivlenmiş görev veya projede checklist değişikliğini arayüz ve RLS seviyesinde engelleme
- Organizasyon üyeleri için okuma; owner/admin/proje yöneticisi için değişiklik RLS policy'leri
- Checklist loading, hata, yeniden deneme ve boş durumları
- Supabase olmayan ortam için görev bazlı kalıcı oturum içi demo checklist fallback'i
- Göreve ve organizasyona bileşik foreign key ile bağlı gerçek `task_comments` tablosu
- Aktif organizasyon üyelerinin arşivlenmemiş görevlerde yorum yazabilmesi
- Görev drawer'ında kronolojik yorum akışı, yazar adı, avatar baş harfleri ve zaman bilgisi
- Yorum yazarının kendi yorumunu düzenlemesi ve kalıcı silme onayıyla kaldırması
- Owner/admin rollerinin başka kullanıcı yorumunu silerek moderasyon yapabilmesi
- Başka bir yazarın yorum metnini değiştirmeyi tüm roller için reddeden RLS kuralı
- Yorum değiştiğinde `edited_at` zamanını otomatik kaydeden trigger
- Yorumun organizasyon, görev, yazar ve oluşturulma kimliğini değişmez tutan bütünlük koruması
- Yorum loading, hata, yeniden deneme, boş liste, gönderim ve salt okunur durumları
- Supabase olmayan ortam için görev bazlı oturum içi demo yorum fallback'i
- Göreve ve organizasyona bileşik foreign key ile bağlı append-only `task_activities` tablosu
- Mevcut görevler için oluşturulma aktivitelerini güvenli biçimde üreten migration backfill'i
- Görev oluşturma, başlık, açıklama, proje, durum, öncelik, görevli ve tarih değişikliklerini otomatik kaydetme
- Görev arşivleme ve geri açma olaylarını gerçek aktörle otomatik kaydetme
- Olayları kullanıcı isteğine güvenmeden `SECURITY DEFINER` veritabanı trigger'ıyla üretme
- Eski/yeni değerleri olay tipine göre JSON metadata içinde saklama
- Aktivite kayıtlarında frontend insert/update/delete yetkisini tamamen kapatan append-only güvenlik
- Görev drawer'ında gerçek aktör, zaman, değişiklik açıklaması ve son 60 hareketi gösteren zaman çizelgesi
- Aktivite loading, hata, yeniden deneme, boş liste ve limit durumları
- Görevleri aynı proje içinde birbirine bağlayan isteğe bağlı `parent_task_id` ilişkisi
- Organizasyon, proje ve üst görev bütünlüğünü zorunlu kılan bileşik self foreign key
- Görevin kendisini üst görev seçmesini ve döngüsel hiyerarşiyi reddeden veritabanı trigger'ı
- Yeni ilişki kurulurken arşivlenmiş görevi üst görev seçmeyi reddetme
- Görev oluşturma ve düzenleme formlarında projeye göre filtrelenen üst görev seçimi
- Düzenleme sırasında görev ve tüm torunlarını üst görev seçeneklerinden çıkarma
- Üst görev detayında doğrudan alt görev listesi, durum/görevli bilgisi ve gerçek tamamlanma oranı
- Alt görev satırından ilgili görev drawer'ına güvenli geçiş
- Liste ve Kanban kartlarında üst görev ve alt görev ilerleme bağlamı
- Üst görev bağlantısı değişikliklerini append-only aktivite geçmişine otomatik kaydetme
- Görevli, atanmamış görev ve ana/alt/alt görevi olan yapı filtreleri
- Oluşturulma, bitiş tarihi, öncelik, başlık ve durum alanlarında artan/azalan sıralama
- Bitiş tarihi olmayan görevleri her iki sıralama yönünde de sonuçların sonunda tutma
- Kaldırılabilir aktif filtre etiketleri ve bütün filtreleri tek işlemle varsayılana döndürme
- Arama, filtre, sıralama ve Liste/Kanban tercihlerinin organizasyon bazında tarayıcıda saklanması
- Kayıtlı tercihlerin güvenli biçimde normalize edilmesi ve geçersiz proje/görevli seçimlerinin temizlenmesi
- Masaüstü, tablet ve mobil için taşmayan iki katmanlı responsive görev toolbar'ı

Görev CRUD yaşam döngüsü, hiyerarşi, proje ekibi atama, Liste/Kanban, checklist, yorum, aktivite geçmişi ve gelişmiş filtre/sıralama akışları tamamlanmıştır.

### 4.17 Profil ve organizasyon ayarları

- Sidebar'da aktif, lazy-loaded gerçek `/ozellestirme` rotası
- Oturum sahibinin gerçek `profiles` kaydından ad-soyad, doğrulanmış e-posta, telefon ve avatar adresini görüntüleme
- Ad-soyad, telefon ve HTTPS avatar adresi için istemci doğrulaması ve normalize edilmiş kayıt
- Profil e-postasını salt okunur tutma; e-posta değişikliğini Supabase Auth kapsamına bırakma
- Profil adı ve avatar değişikliklerini Auth kullanıcı metadata'sına yansıtarak sidebar ve dashboard'u anında güncelleme
- Owner/admin için organizasyon adı ve HTTPS logo adresi düzenleme
- Member ve proje yöneticisi rolleri için salt okunur organizasyon ayarları
- Organizasyon slug ve kurucu alanlarını arayüzde salt okunur, veritabanı sütun yetkilerinde değiştirilemez tutma
- Organizasyon context'ini kayıt sonrasında doğrudan güncelleyerek sidebar adını ve logosunu yenileme
- Avatar ve logo için URL önizlemesi, görsel hatasında güvenli baş harf fallback'i
- Profil/organizasyon loading, hata, yeniden deneme, doğrulama ve başarı durumları
- Masaüstü, tablet, mobil ve koyu tema uyumlu ayarlar kartları
- Profil telefon/avatar ve organizasyon logo alanları için veritabanı uzunluk bütünlüğü
- Profil self-update, başka profil reddi, member organizasyon reddi, admin organizasyon izni ve slug koruması için uzak RLS smoke kontrolleri

Profil ve organizasyon ayarlarının ilk güvenli yaşam döngüsü tamamlanmıştır. Dosya yükleme gelene kadar avatar ve logo için yalnızca HTTPS görsel adresi kullanılmaktadır.

### 4.18 Production yayın temeli

- Vercel `burak-2544s-projects/manageflow` production projesi
- GitHub `burak-bksoftstudio/manageflow` repository bağlantısı
- Birincil canlı uygulama adresi: `https://manageflow.bksoftstudio.com`
- Yedek Vercel adresi: `https://manageflow-seven.vercel.app`
- Vite build ve `dist` yayın ayarı
- Yenilenen veya doğrudan açılan React Router rotaları için SPA rewrite
- `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` ve `Permissions-Policy` güvenlik başlıkları
- Production ve Preview ortamlarında Supabase URL/publishable key değişkenleri
- Auth e-posta bağlantılarını kararlı canlı adrese üreten `VITE_APP_URL`
- Ekip davet fonksiyonunda production origin'i kullanan `MANAGEFLOW_APP_URL` secret'ı
- Ana sayfa, Auth callback'leri ve korumalı uygulama rotaları için canlı HTTP smoke kontrolü

Vercel production yayını özel domain üzerinden çalışmaktadır. Cloudflare DNS'teki `manageflow` CNAME kaydı Vercel'in projeye özel hedefine DNS-only olarak yönlenir. Supabase `Site URL`, Auth redirect izinleri, Vercel `VITE_APP_URL` ve Edge Function `MANAGEFLOW_APP_URL` origin'i özel domaine taşınmıştır. Gerçek şifre yenileme e-postası, özel domain callback'i ve yeni şifre kaydı uçtan uca doğrulanmıştır.

### 4.19 Zaman Takibi v1

- Sidebar'da aktif, lazy-loaded gerçek `/zaman-takibi` rotası
- Aktif organizasyon ve oturum sahibine bağlı `time_entries` tablosu
- Zorunlu proje ve isteğe bağlı görev bağlantısı
- Arşivli proje/görevlerde yeni sayaç başlatmayı engelleyen veritabanı kontrolü
- Başlangıç/bitiş saatini ve süreyi istemciden bağımsız sunucu trigger'ıyla belirleme
- Kullanıcı başına organizasyonlardan bağımsız tek aktif sayaç garantisi
- Sayfa yenilemesi ve sekme değişimi sonrasında sunucu kaydından aktif sayacı sürdürme
- Bugünkü toplam süre, oturum ve proje metrikleri
- Aktif sayaç için saniyelik canlı görünüm
- Bugünkü kişisel zaman kayıtları ve proje/görev bağlamı
- Not alanı, proje/görev doğrulaması ve güvenli Türkçe hata mesajları
- Kullanıcının yalnız kendi kayıtlarını okuyup başlatıp durdurabildiği RLS politikaları
- V1 kapsamında silmeyi `DELETE/TRUNCATE` yetkisi ve RLS seviyesinde kapatma
- Masaüstü, tablet, mobil, koyu tema, boş, yükleniyor ve hata durumları
- Süre hesaplama, günlük kesişim, formatlama ve hata davranışları için 7 otomatik test
- Tek transaction ve `ROLLBACK` kullanan ayrı uzak zaman takibi güvenlik smoke testi

Veritabanı migration'ları uzak projeye uygulanmış, zaman takibi RLS testi ve mevcut tam RLS regresyon testi `passed`, schema lint temizdir. Gerçek hesapla sayaç başlatma, sayfayı yeniledikten sonra aynı sunucu başlangıç zamanıyla sürdürme, durdurma ve kaydı listede koruma production ortamında doğrulanmıştır.

### 4.20 Zaman Takibi v1.1 — manuel süre ve haftalık geçmiş

- Geçmiş tarih, yerel başlangıç saati, dakika cinsinden süre, proje, isteğe bağlı görev ve not alanlarıyla manuel kayıt modalı
- İstemci ve sunucuda 1–1440 dakika sınırı; gelecekte başlayan veya geleceğe uzanan kayıtları reddetme
- Sayaç başlatma işlemini `start_time_entry` güvenli sunucu fonksiyonuna taşıma
- Manuel kayıtları yalnızca `create_manual_time_entry` güvenli sunucu fonksiyonundan oluşturma
- Authenticated rolünün `time_entries` tablosuna doğrudan `INSERT` yetkisini ve insert RLS politikasını kaldırma
- Sunucuda aktif organizasyon üyeliği, arşivlenmemiş proje/görev, not uzunluğu ve zaman bütünlüğü doğrulaması
- Sayaç ve manuel kayıtları ayıran değiştirilemez `entry_type` alanı
- Pazartesi–pazar haftaları arasında ileri/geri gezinme
- Haftalık toplam süre ile proje ve görev filtreleri
- Bugünün akışı ve haftalık geçmişte manuel kayıt etiketi
- Masaüstü, tablet, mobil, açık/koyu tema, boş ve hata durumları
- Manuel form ve haftalık hesaplamalarla birlikte 89 otomatik test
- Doğrudan insert reddi, RPC sınırı, manuel süre hesabı, geleceğe kayıt reddi ve mevcut sayaç/RLS regresyonlarını kapsayan rollback smoke testi

Uzak migration sayısı 18'e yükselmiştir. Yeni zaman takibi güvenlik testi `result: passed`, tam RLS regresyon testi `result: passed` ve uzak schema lint temizdir. Production kullanıcı kabulünde geçmiş bir manuel kaydın eklenmesi, yenilemede korunması ve haftalık proje/görev filtrelerinde görünmesi doğrulanacaktır.

### 4.21 Çalışma Alanı v1 — proje notları

- Sidebar'da aktif, lazy-loaded gerçek `/calisma-alani` rotası
- Aktif organizasyon, zorunlu proje ve not yazarıyla ilişkili `project_notes` tablosu
- 2–160 karakter başlık ve 1–10.000 karakter düz metin içerik bütünlüğü
- Proje listesinden tüm notlara veya tek proje bağlamına geçiş
- Başlık, içerik, proje ve yazar alanlarında Türkçe uyumlu arama
- Toplam not, not bulunan proje, kullanıcının notları ve bu hafta güncellenen not metrikleri
- Not oluşturma, tam içerik görüntüleme ve düzenleme modalı
- Bütün üyeler için organizasyon notlarını okuma ve aktif projeye not ekleme
- Yazarın kendi notunu; owner/admin/project manager rollerinin organizasyon notlarını düzenleyebilmesi
- Arşivli projede yeni not veya not düzenleme engeli
- Organizasyon/proje/yazar/oluşturulma bağlamını değiştirilemez tutan trigger
- V1 kapsamında not silmeyi tablo yetkisi ve RLS seviyesinde kapatma
- Masaüstü, tablet, mobil, açık/koyu tema, loading, hata, boş ve salt okunur durumları
- Not doğrulama, eşleme, izin, arama, metrik ve hata davranışları için 5 yeni otomatik test
- Çapraz organizasyon izolasyonu, yazar sahteciliği, üye/yönetici düzenleme ve arşivli proje engelini kapsayan ayrı rollback güvenlik testi

Uzak migration sayısı 19'a yükselmiştir. Proje notları güvenlik testi `result: passed`, tam RLS ve zaman takibi regresyon testleri `result: passed`, uzak schema lint temizdir. Production kabulünde not oluşturma, sayfa yenilemesinde kalıcılık, proje/arama filtresi ve ikinci üyeyle salt okunur/yönetici davranışı doğrulanacaktır.

### 4.22 Herkese açık SaaS landing page

- Uygulama shell'inden bağımsız, herkese açık gerçek `/` rotası
- Özgün ManageFlow metinleri ve görsel bileşenleriyle ajans odaklı hero alanı
- Kodla oluşturulan dashboard, Kanban, zaman takibi ve proje notları ürün önizlemeleri
- Müşteri → proje → iş yürütme → teslim çalışma akışı
- Mevcut modüller ile yol haritasındaki özellikleri açıkça ayıran ürün durumu alanı
- Çok kiracılı veri izolasyonu, RLS ve rol tabanlı erişimi anlatan güvenlik bölümü
- Ajans, yaratıcı stüdyo ve küçük ekip kullanım senaryoları
- SSS, final CTA ve kapsamlı footer
- Oturum durumuna göre kayıt veya `/dashboard` aksiyonu gösteren CTA'lar
- Giriş ve kayıt akışlarına doğrudan bağlantı
- Masaüstü, tablet ve mobil kırılımlar; bağımsız landing tasarım tokenları
- Sayfa başlığı, açıklama, canonical, robots, Open Graph ve Twitter metadata temeli
- Landing sayfasının ayrı lazy-loaded route chunk'ı

Landing bilgi mimarisi pazar referansı olarak incelenen Managelify yaklaşımından esinlenmiştir; marka, metin, arayüz önizlemeleri ve kod ManageFlow için özgün hazırlanmıştır. Fiyatlandırma henüz kesinleşmediği için gerçekte bulunmayan paket veya ticari iddia eklenmemiştir.

Landing page Vercel production'a alınmış ve `https://manageflow.bksoftstudio.com/` özel domaininde yayınlanmıştır. Ana sayfa, giriş, kayıt ve dashboard SPA rotaları teknik smoke kontrolünde `200` dönmüş; production HTML başlığı, canonical adresi, güvenlik başlıkları ve lazy landing bundle içeriği doğrulanmıştır.

### 4.23 Zaman Takibi v1.2 — düzeltme ve arşivleme

- Tamamlanmış kişisel kayıtlarda proje, görev, tarih, başlangıç, toplam süre ve açıklama düzeltme
- Aktif sayacın düzeltme ve arşivleme işlemlerine kapalı tutulması
- 1–1440 dakika, geçmiş zaman, aktif proje/görev ve not uzunluğu kontrollerinin sunucuda yeniden doğrulanması
- `corrected_at` ve `corrected_by` alanlarıyla değişiklik zamanı/aktörü denetimi
- `archived_at` ve `archived_by` alanlarıyla fiziksel silme yerine geri alınabilir arşivleme
- Aktif, arşivlenen ve tüm kayıtlar için haftalık geçmiş filtresi
- Arşivlenen kayıtları kişisel metrik ve varsayılan toplamların dışında tutma
- Arşivden geri çıkarma ve kaydı yeniden kişisel toplamlara dahil etme
- Sayaç durdurmayı `stop_time_entry` güvenli sunucu fonksiyonuna taşıma
- Düzeltme, arşivleme ve geri alma işlemleri için ayrı `SECURITY DEFINER` RPC sınırları
- Authenticated rolünün `time_entries` tablosuna doğrudan `UPDATE` yetkisini kaldırma
- Kullanıcının kendi kaydı; owner/admin için ilerideki ekip timesheet ekranına hazır yönetim yetkisi
- Düzenleme modalı, arşiv onayı, durum etiketleri, hata ve mobil görünüm
- Arşiv davranışı ve metrik dışlama için yeni domain testi
- RPC sınırı, düzeltme aktörü, başka kullanıcı reddi, arşiv ve geri alma için genişletilmiş rollback güvenlik testi

Uzak migration sayısı 21'e yükselmiştir. Zaman takibi v1.2 güvenlik testi, tam RLS regresyon testi ve proje notları regresyon testi `result: passed`; uzak schema lint temiz ve yerel/uzak migration geçmişi eşleşmektedir.

### 4.24 Zaman Takibi v1.3 — owner/admin ekip timesheet

- Zaman Takibi ekranında `Kendi zamanım` ve yalnız owner/admin rollerine gösterilen `Ekip raporu` görünüm sekmeleri
- Pazartesi–pazar haftaları arasında gezinme; ekip üyesi ve proje filtreleri
- Seçili görünüm için toplam süre, kayıt, süre girişi bulunan ekip üyesi ve proje metrikleri
- Ekip üyesi, proje/görev, tarih/saat, not, manuel/düzeltildi/aktif durumu ve kesişen süre ayrıntıları
- Loading, boş, hata, yeniden deneme, masaüstü, tablet, mobil ve koyu tema durumları
- Normal üyenin mevcut kişisel `time_entries` RLS kapsamını değiştirmeyen salt okunur raporlama sınırı
- Yalnız aktif owner/admin üyeliğini kabul eden `get_organization_timesheet` güvenli sunucu fonksiyonu
- Tek sorguda en fazla 31 günlük tarih aralığı ve 5.000 kayıt sınırı
- Arşivlenen süreleri ekip raporunun ve toplamlarının dışında tutma
- Rol görünürlüğü, veritabanı eşleme, filtreleme ve kesişen süre toplamları için domain testleri
- Owner erişimi, member reddi, organizasyon kapsamı ve tarih sınırını rollback ile doğrulayan ayrı uzak güvenlik testi

Uzak migration sayısı 22'ye yükselmiştir. Yeni ekip timesheet güvenlik testi, kişisel zaman takibi regresyonu, tam RLS matrisi ve proje notları regresyonu `result: passed`; uzak schema lint temiz ve yerel/uzak migration geçmişi eşleşmektedir.

### 4.25 Çalışma Alanı v1.1 — bağımsız ekip notları

- Notları bir projeye bağlamadan organizasyon genelinde oluşturabilme
- Yeni not formunda isteğe bağlı bağlam seçimi ve `Bağımsız ekip notu` seçeneği
- Sidebar içi bağımsız not filtresi ve bağlam bazlı not sayacı
- Projesi olmayan organizasyonda da ilk notu oluşturabilme
- Bağımsız notlarda yazar/yönetici düzenleme izinlerini koruma
- Nullable proje bağlamını destekleyen bütünlük trigger'ı ve RLS yardımcı fonksiyonu
- Null/değer bağlam değişikliklerini `IS DISTINCT FROM` ile engelleyen güvenli güncelleme sınırı
- Bağımsız not doğrulama, eşleme, filtreleme ve metrik regresyon testleri
- Bağımsız not oluşturma ve güncellemeyi gerçek member rolüyle doğrulayan genişletilmiş rollback testi

Uzak migration sayısı 23'e yükselmiştir. Proje notları güvenlik testi bağımsız not kontrolüyle `result: passed`; uzak schema lint temizdir. Yerel 97 otomatik test ve production build başarılıdır.

### 4.26 Ekip timesheet CSV dışa aktarma

- Seçilen hafta, ekip üyesi ve proje filtrelerine birebir uyan CSV çıktısı
- Üye, e-posta, proje, görev, başlangıç/bitiş, saniye, okunabilir süre, kayıt türü, durum ve not sütunları
- Türkçe karakterler için UTF-8 BOM ve Excel uyumlu noktalı virgül ayracı
- Kullanıcı tarafından girilen hücrelerde CSV formül enjeksiyonuna karşı güvenli kaçış
- Seçilen haftayı içeren kararlı ve okunabilir dosya adı
- Yükleniyor, hata ve boş sonuç durumlarında indirme butonunu güvenli biçimde kapatma
- Masaüstü, tablet ve mobil toolbar yerleşimi
- CSV içerik, kaçış, toplam süre ve dosya adı için otomatik test

Yerel test sayısı 98'e yükselmiştir; production build başarılıdır. Yeni veritabanı migration'ı gerekmemiş, mevcut owner/admin-only raporlama RPC sınırı korunmuştur.

### 4.27 Proje ve müşteri bazlı zaman özeti

- Ekip raporunun aktif hafta, üye ve proje filtrelerini kullanan iki görsel dağılım kartı
- Proje başına toplam süre, kayıt sayısı, çalışan kişi sayısı ve yüzde dağılımı
- Aynı müşteriye bağlı birden fazla projeyi tek müşteri toplamında birleştirme
- Süreye göre azalan sıralama ve en yoğun beş proje/müşteri görünümü
- Proje sorgusunda müşteri kimliği ve adını güvenli organizasyon RLS kapsamından alma
- Masaüstünde yan yana, tablet ve mobilde tek kolon responsive düzen
- Gruplama, kişi/kayıt sayısı, süre ve yüzde hesabı için otomatik test

Yerel test sayısı 99'a yükselmiştir; production build başarılıdır. Rapor mevcut owner/admin-only RPC verisini kullandığı için yeni migration veya genişletilmiş tablo yetkisi gerekmemiştir.

### 4.28 Güvenli ekip üyesi kaldırma

- Üye detay çekmecesinde owner/admin için `Üyeyi kaldır` aksiyonu
- Erişim ve aktif proje atamalarının kaldırılacağını, geçmiş kayıtların korunacağını açıklayan onay adımı
- Organizasyon sahibini ve işlemi yapan yöneticinin kendi üyeliğini kaldırmayı engelleme
- Normal member ve project manager rollerinin kaldırma RPC'sine erişimini reddetme
- Authenticated rolünden doğrudan `organization_members DELETE` yetkisini kaldırma
- Organizasyon ve üyelik kimliğini sunucuda yeniden doğrulayan `remove_organization_member` RPC'si
- Üyelik kaldırıldığında proje üyeliklerini cascade ile temizleme ve atanmış görevleri güvenli biçimde boşa çıkarma
- Kullanıcı Auth hesabı, geçmiş zaman kayıtları, yorumlar ve aktiviteleri koruma
- Yetki görünürlüğü ve güvenli hata mesajları için domain testleri
- Member reddi, direct-delete reddi, owner koruması ve owner kaldırma yetkisi için rollback güvenlik testi

Uzak migration sayısı 24'e yükselmiştir. Üye kaldırma güvenlik testi `result: passed`, uzak schema lint temizdir. Yerel test sayısı 101'e yükselmiş ve production build başarılıdır.

---

## 5. Henüz yapılmamış bağlantılar

Aşağıdaki sistemler mevcut prototipin kullanıcı akışlarına henüz bağlı değildir:

- Dosya, mesaj, bildirim ve takvim modüllerinin Supabase sorguları
- Ekip zaman raporu PDF dışa aktarma ve faturalandırılabilir süre/bütçe raporları
- Özel domainde production kayıt doğrulama ve davet kabul callback'lerinin canlı hesaplarla smoke testi
- Google ile giriş
- Birden fazla organizasyon arasında çalışma alanı değiştirme akışı
- Rol ve izinlerin kalan iş modüllerinde uygulanması
- Dosya yükleme ve depolama
- Gerçek mesajlaşma
- Gerçek bildirimler
- Takvim entegrasyonu
- E-posta gönderimi
- Mana AI
- Ödeme sistemi
- Analitik/telemetri
- Hata izleme

---

## 6. Önerilen altyapı

İlk ürün sürümü için önerilen altyapı:

| İhtiyaç | Önerilen çözüm |
|---|---|
| Frontend | React + Vite |
| Dil ve tip güvenliği | TypeScript'e geçiş |
| Routing | React Router |
| Sunucu durumu | TanStack Query |
| Formlar | React Hook Form + Zod |
| Backend/veritabanı | Supabase + PostgreSQL |
| Kimlik doğrulama | Supabase Auth |
| Dosya depolama | Supabase Storage |
| Gerçek zamanlı mesajlar | Supabase Realtime |
| Sunucu fonksiyonları | Supabase Edge Functions |
| AI | OpenAI API; yalnızca sunucu tarafından çağrılmalı |
| E-posta | Resend |
| Ödeme | iyzico veya Paddle/Stripe |
| Deployment | Vercel |
| Hata takibi | Sentry |
| Ürün analitiği | PostHog veya privacy-first alternatif |
| Test | Vitest + React Testing Library + Playwright |

Bu seçimler uygulamaya bağlanmadan önce ortam, maliyet, Türkiye'deki ödeme gereksinimleri ve veri güvenliği yeniden değerlendirilmelidir.

---

## 7. Planlanan ürün modülleri

### 7.1 Kullanıcı ve kimlik doğrulama

- Kayıt olma
- Giriş yapma
- Çıkış yapma
- Şifre sıfırlama
- E-posta doğrulama
- Google ile giriş
- Profil fotoğrafı
- Kullanıcı adı ve iletişim bilgileri
- Dil ve tema tercihi
- Hesabı devre dışı bırakma
- Oturum ve cihaz yönetimi

### 7.2 Organizasyon ve roller

- Organizasyon oluşturma
- Birden fazla organizasyona üyelik
- Organizasyon değiştirme
- E-posta ile ekip daveti
- Davet bağlantısı
- Organizasyondan çıkarma
- Kullanıcıyı devre dışı bırakma
- Organizasyon sahibi
- Yönetici
- Proje yöneticisi
- Ekip üyesi
- Müşteri
- Misafir
- Özelleştirilebilir roller ve izinler

Temel izin örnekleri:

- Proje oluşturma
- Proje düzenleme/silme
- Görev oluşturma/silme
- Ekip yönetme
- Müşterileri görme
- Finans verilerini görme
- Dosya indirme
- Rapor dışa aktarma

### 7.3 Dashboard

- Gerçek aktif proje sayısı
- Tamamlanan görev oranı
- Geciken görevler
- Bugünkü görevler
- Okunmamış mesajlar
- Yaklaşan toplantılar
- Yaklaşan teslimler
- Ekip iş yükü
- Çalışılan süre
- Müşteri sayısı
- Satış pipeline değeri
- Proje sağlık durumları
- Tarih, ekip, müşteri ve proje filtreleri
- Sürüklenebilir widget'lar
- Widget gizleme
- PDF/Excel raporu
- Günlük ve haftalık özetler

### 7.4 Müşteriler ve CRM

Müşteri alanları:

- Şirket/kişi adı
- Yetkili kişiler
- Telefon
- E-posta
- Adres
- Vergi bilgileri
- Sektör
- Kaynak
- Etiketler
- Müşteri sorumlusu
- Durum
- Notlar

Müşteri detayında:

- Projeler
- Görevler
- Toplantılar
- Dosyalar
- Teklifler
- Sözleşmeler
- Faturalar
- Ödemeler
- Mesajlar
- Harcanan zaman
- Aktivite geçmişi

Planlanan satış akışı:

```text
Yeni potansiyel müşteri
→ İletişime geçildi
→ Toplantı yapıldı
→ Teklif gönderildi
→ Pazarlık
→ Kazanıldı
→ Projeye dönüştürüldü
```

### 7.5 Projeler

Proje alanları:

- Ad
- Açıklama
- Müşteri
- Proje yöneticisi
- Başlangıç/bitiş tarihi
- Durum
- Öncelik
- Bütçe
- Etiketler
- Kapak rengi/görseli
- İlerleme oranı
- Proje üyeleri

Proje sekmeleri:

- Genel bakış
- Görevler
- Kanban
- Takvim
- Notlar
- Dosyalar
- Ekip
- Zaman kayıtları
- Bütçe
- Aktivite geçmişi
- AI özeti

Önerilen varsayılan durumlar:

- Planlandı
- Devam ediyor
- Beklemede
- İncelemede
- Tamamlandı
- İptal edildi

### 7.6 Görevler

- Başlık ve açıklama
- Proje ilişkisi
- Sorumlular ve takipçiler
- Durum ve öncelik
- Başlangıç/teslim tarihi
- Tahmini süre
- Harcanan süre
- Alt görevler
- Checklist
- Etiketler
- Yorumlar
- Dosyalar
- Tekrarlama
- Bağımlılıklar
- Aktivite geçmişi
- Liste, Kanban, takvim, timeline ve Gantt görünümü
- Bana atananlar
- Bugünkü ve geciken görevler
- Sürükle-bırak durum değiştirme
- Toplu işlemler
- Görev şablonları
- Kopyalama ve başka projeye taşıma

### 7.7 Ekip yönetimi

- Ekip üyeleri
- Departmanlar
- Roller
- Çalışma saatleri
- İzin günleri
- Çevrimiçi durumu
- İş yükü
- Atanan görevler
- Zaman kayıtları
- Proje bazlı üyelik

Performans ölçümleri yalnızca tamamlanan görev sayısına dayandırılmamalıdır. Görev karmaşıklığı, tahmin doğruluğu ve ekip bağlamı dikkate alınmalıdır.

### 7.8 Mesajlaşma

- Organizasyon kanalları
- Proje kanalları
- Direkt mesajlar
- Grup mesajları
- Thread yanıtları
- Emoji tepkileri
- Dosya paylaşımı
- Kullanıcı etiketleme
- Sabitleme
- Düzenleme/silme
- Okundu bilgisi
- Çevrimiçi durumu
- Mesaj arama
- Mesajdan görev oluşturma

### 7.9 Bildirimler

Olay örnekleri:

- Görev atandı
- Görev tarihi yaklaşıyor
- Görev gecikti
- Projeye eklendin
- Yorumda etiketlendin
- Yeni mesaj
- Dosya yüklendi
- Toplantı yaklaşıyor
- Teklif görüntülendi
- Ödeme alındı

Bildirim kanalları:

- Uygulama içi
- E-posta
- Tarayıcı bildirimi
- İleride mobil push
- İsteğe bağlı WhatsApp

### 7.10 Takvim ve gündem

- Günlük/haftalık/aylık görünüm
- Proje görevleri
- Toplantılar
- Hatırlatmalar
- Ekip takvimi
- Resmî tatiller
- Sürükle-bırak tarih değiştirme
- Tekrarlayan etkinlikler
- Google Calendar entegrasyonu
- Outlook Calendar entegrasyonu
- Paylaşılabilir randevu sayfası

### 7.11 Zaman takibi

- Görev üzerinde kronometre
- Manuel süre girişi
- Başlangıç/bitiş
- Açıklama
- Faturalandırılabilir süre
- Kullanıcı/proje/müşteri bazlı zaman kayıtları
- Haftalık timesheet
- Onay sistemi
- CSV/PDF dışa aktarma

Kârlılık hesabı:

```text
Proje geliri
- Çalışan ve zaman maliyeti
- Diğer proje giderleri
= Proje kârı
```

### 7.12 Dosyalar ve bilgi alanı

- Dosya yükleme
- Klasörler
- Sürükle-bırak
- Önizleme
- Versiyonlama
- Paylaşım bağlantısı
- Süreli bağlantı
- Erişim izinleri
- Proje/müşteri bağlantısı
- Etiketler
- Çöp kutusu
- Depolama kotası
- Dokümanlar
- Toplantı notları
- Proje kararları
- Şirket prosedürleri
- Zengin metin editörü
- Sayfa hiyerarşisi
- Versiyon geçmişi

### 7.13 Formlar

- Form oluşturucu
- Metin, seçim, tarih ve dosya alanları
- Müşteri talep formu
- Brief formu
- İş başvuru formu
- Destek formu
- Herkese açık bağlantılar
- Form yanıtını CRM kaydına dönüştürme
- Form yanıtından müşteri/proje oluşturma

### 7.14 Teklif ve sözleşmeler

- Ürün/hizmet kataloğu
- Teklif oluşturma
- İndirim ve vergi
- PDF üretimi
- Müşteriye bağlantı gönderme
- Görüntülenme bilgisi
- Kabul/ret
- Dijital onay
- Sözleşme şablonları
- İmza süreci
- Versiyon geçmişi

### 7.15 Operasyonel finans

İlk aşamada tam muhasebe ürünü yerine şunlar hedeflenmelidir:

- Proje bütçesi
- Gelir/gider
- Teklif
- Fatura kaydı
- Ödeme durumu
- Vade tarihi
- Para birimi
- Vergi/KDV
- Proje ve müşteri kârlılığı
- Müşteri bakiyesi

İleri aşamada Paraşüt, Logo veya benzeri muhasebe entegrasyonları değerlendirilebilir.

### 7.16 Mana AI

Örnek komutlar:

- Bir müşteri için yeni proje oluşturma
- Projeyi haftalık görevlere bölme
- Geciken görevleri listeleme
- Ekip özeti hazırlama
- Toplantı notlarından görev çıkarma
- Müşteri ilerleme e-postası hazırlama
- Riskli projeleri tespit etme
- İş yükü dağılımı önerme
- Proje özeti oluşturma
- Teklif taslağı hazırlama

AI güvenlik gereksinimleri:

- Kullanıcı yetkileri dışında veri okuyamamalı.
- İşlem öncesi değişiklik önizlemesi göstermeli.
- Kritik işlemlerde kullanıcı onayı almalı.
- İşlemler geri alınabilmeli.
- AI işlemleri aktivite günlüğüne kaydedilmeli.
- API anahtarları frontend'e konulmamalı.

### 7.17 Otomasyonlar

Örnek otomasyonlar:

```text
Görev tamamlanınca
→ Proje yöneticisine bildirim gönder
```

```text
Form gönderilince
→ CRM müşterisi oluştur
→ Sorumlu ata
→ Hoş geldin e-postası gönder
```

```text
Teslim tarihi geçince
→ Görevi gecikti durumuna al
→ Sorumluya bildirim gönder
```

```text
Teklif kabul edilince
→ Proje oluştur
→ Proje şablonunu uygula
```

### 7.18 Arama ve raporlama

Global arama hedefleri:

- Projeler
- Görevler
- Müşteriler
- Mesajlar
- Dosyalar
- Notlar
- Ekip üyeleri
- Sözleşmeler
- Toplantılar

Raporlama hedefleri:

- Proje ilerlemesi
- Geciken görevler
- Ekip iş yükü
- Harcanan zaman
- Müşteri/proje kârlılığı
- Satış dönüşümü
- Yaklaşan tahsilatlar
- AI haftalık raporu
- PDF/Excel dışa aktarma
- Zamanlanmış e-posta raporları

---

## 8. Önerilen temel veri modeli

Başlangıç tabloları:

```text
profiles
organizations
organization_members
roles
permissions
role_permissions

customers
customer_contacts

projects
project_members
project_statuses
project_notes

tasks
task_assignees
subtasks
task_checklists
task_comments
task_dependencies

files
folders

channels
channel_members
messages
message_reactions

calendar_events
meetings
time_entries

notifications
activity_logs

crm_leads
crm_stages
proposals
contracts
invoices
payments

ai_conversations
ai_actions
automations
```

Uygulanmış `time_entries` v1.2 modeli şu bağlamı taşır:

```text
id
organization_id
project_id
task_id (isteğe bağlı)
user_id
note
started_at
ended_at
duration_seconds
entry_type
archived_at
archived_by
corrected_at
corrected_by
created_at
updated_at
```

Başlangıç/bitiş ve süre alanları sunucu trigger'ı tarafından yönetilir. Sayaç durdurma, tamamlanmış kayıt düzeltme, arşivleme ve geri alma yalnız yetki kontrollü RPC fonksiyonları üzerinden yapılır; authenticated rolünün doğrudan insert/update/delete yetkisi yoktur.

Organizasyona ait bütün ana tablolarda en az şu ortak alanlar bulunmalıdır:

```text
id
organization_id
created_by
created_at
updated_at
deleted_at
```

### Veri izolasyonu

- `organization_id` çok kiracılı sistemin temel izolasyon alanıdır.
- Supabase kullanılması halinde Row Level Security zorunlu olmalıdır.
- Organizasyon üyeliği olmayan kullanıcı ilgili veriyi okuyamamalı veya değiştirememelidir.
- Silme işlemlerinin çoğunda önce soft delete uygulanmalıdır.
- Kritik işlemler `activity_logs` tablosuna kaydedilmelidir.

---

## 9. Geliştirme aşamaları

### Faz 0 — prototip ve temel düzenleme

Durum: **Devam ediyor**

- [x] React/Vite projesini oluştur
- [x] Dashboard arayüzünü oluştur
- [x] Responsive sidebar oluştur
- [x] Koyu tema ekle
- [x] Demo grafikler ekle
- [x] Hızlı oluşturma modalı ekle
- [x] Gündem drawer'ı ekle
- [x] Bildirim popover'ı ekle
- [x] Global arama görünümü ekle
- [x] Production derlemesini doğrula
- [x] Yaşayan geliştirme dokümanını oluştur
- [x] `main.jsx` dosyasını modüler bileşenlere ayır
- [x] React Router ekle
- [ ] TypeScript'e geç
- [ ] Tasarım tokenlarını ayrı dosyaya taşı
- [x] Toast ve hata durumları ekle
- [x] Test altyapısını kur

### Faz 1 — ManageFlow marka ve ekip temeli

Durum: **Devam ediyor**

- [x] Uygulama adını ve metinlerini ManageFlow olarak güncelle
- [x] Özgün ManageFlow logosunu oluştur ve uygulamaya ekle
- [x] Marka tokenlarını tanımla
- [x] Ekip sayfasının gerçek frontend arayüzünü oluştur
- [x] Ekip üyesi ekleme/düzenleme/devre dışı bırakma akışlarını demo veriyle doğrula
- [ ] Birden fazla organizasyon arasında çalışma alanı seçici oluştur
- [x] Çalışma alanı bilgilerini düzenle
- [x] Ekip modülünün mobil, boş, yükleniyor ve hata durumlarını tasarla

### Faz 2 — gerçek SaaS altyapısı

Durum: **Tamamlandı**

- [x] Supabase projesi oluştur
- [x] Ortam değişkenlerini tanımla
- [x] Güvenli Supabase istemci ve demo fallback katmanını kur
- [x] Veritabanı migration yapısını kur
- [x] Profil, organizasyon, üyelik ve davet tablolarını tanımla
- [x] İlk RLS politikalarını ve son sahip korumasını yaz
- [x] Uzak Supabase projesini CLI ile bağla
- [x] İlk migration'ı uzak veritabanına uygula
- [x] Auth kayıt/giriş/çıkış akışını oluştur
- [x] E-posta doğrulama ve şifre sıfırlama ekranlarını ekle
- [x] Auth oturum sağlayıcısı ve korumalı rotaları ekle
- [x] Supabase Auth yerel yönlendirme adreslerini yapılandır
- [x] Gerçek hesapla kayıt, e-posta doğrulama, çıkış ve yeniden giriş akışını test et
- [x] Gerçek şifre yenileme e-posta akışını test et
- [x] Organizasyon ve organizasyon üyelik tablolarını kur
- [x] Rol ve temel izinlerin veritabanı katmanını kur
- [x] İlk organizasyon onboarding akışını oluştur
- [x] Aktif organizasyon context'ini ve owner üyeliğini gerçek veride doğrula
- [x] Ekip ekranını gerçek veritabanına bağla
- [x] Ekip loading, boş, backend hata ve yeniden deneme durumlarını ekle
- [x] Owner/admin üyelik güncelleme yetkisini uygula
- [x] Owner/admin güvenli ekip daveti Edge Function'ını oluştur
- [x] Davet görüntüleme, ilk şifre ve kabul rotasını oluştur
- [x] Bekleyen davet listeleme ve iptal akışını ekle
- [x] İkinci e-posta hesabıyla davet teslimi ve kabulünü uçtan uca test et
- [x] Admin/member ve çapraz organizasyon RLS matrisini ikinci kullanıcıyla test et
- [x] Profil ve organizasyon ayarlarını oluştur
- [x] İlk RLS politikalarını yaz ve uzak şema linter'ıyla doğrula

### Faz 3 — müşteri, proje ve görev çekirdeği

Durum: **Tamamlandı**

- [x] Müşteri veri modeli, listeleme ve oluşturma
- [x] Müşteri detay, düzenleme ve pasife alma
- [x] Proje veri modeli, müşteri bağlantısı, listeleme ve oluşturma
- [x] Proje CRUD
- [x] Proje üyeleri
- [x] Görev veri modeli, listeleme ve oluşturma
- [x] Görev CRUD
- [x] Görev atamaları
- [x] Görev checklist'i
- [x] Alt görev ilişkileri
- [x] Görev yorumları
- [x] Aktivite geçmişi
- [x] Dashboard'u gerçek verilere bağla
- [x] Liste ve Kanban görünümü
- [x] Arama, filtreleme ve sıralama

### Faz 4 — dosya, bildirim ve zaman

Durum: **Devam ediyor**

- [ ] Gelişmiş ekip davetleri
- [ ] Gelişmiş rol/izin yönetim ekranı
- [ ] Dosya yükleme ve klasörler
- [ ] Gerçek uygulama içi bildirimler
- [ ] E-posta bildirimleri
- [x] Zaman takip sayacı altyapısı ve gerçek arayüzü
- [x] Zaman takip sayacı gerçek kullanıcı kabul testi
- [x] Güvenli manuel süre girişi
- [x] Haftalık kişisel geçmiş ve proje/görev filtreleri
- [x] Proje bazlı ortak Çalışma Alanı notları
- [ ] Timesheet
- [ ] Proje raporları
- [ ] Global arama

### Faz 5 — iletişim ve takvim

Durum: **Planlandı**

- [ ] Organizasyon ve proje kanalları
- [ ] Direkt mesajlaşma
- [ ] Thread ve tepkiler
- [ ] Mesajdan görev oluşturma
- [ ] Günlük/haftalık/aylık takvim
- [ ] Toplantılar
- [ ] Google Calendar entegrasyonu
- [ ] Outlook Calendar entegrasyonu

### Faz 6 — AI ve otomasyon

Durum: **Planlandı**

- [ ] Güvenli sunucu tarafı OpenAI entegrasyonu
- [ ] Mana sohbet arayüzü
- [ ] Proje/görev bağlamı
- [ ] Komut önizleme ve onay
- [ ] AI işlem günlüğü
- [ ] Toplantı notlarından görev çıkarma
- [ ] Proje sağlık ve risk özeti
- [ ] Otomasyon oluşturucu

### Faz 7 — CRM ve ticari süreçler

Durum: **Planlandı**

- [ ] CRM pipeline
- [ ] Form oluşturucu
- [ ] Ürün/hizmet kataloğu
- [ ] Teklifler
- [ ] Sözleşmeler
- [ ] Operasyonel finans
- [ ] Ödeme sistemi
- [ ] Abonelik ve plan limitleri

### Faz 8 — yayın ve ölçekleme

Durum: **Devam ediyor**

- [x] Production Vercel projesi
- [x] Domain ve DNS
- [x] Production Supabase backend ve environment bağlantısı
- [x] Supabase Auth production Site URL ve redirect adresleri
- [x] Herkese açık SaaS landing page ve temel SEO metadata
- [ ] Sentry hata takibi
- [ ] Ürün analitiği
- [ ] Yedekleme ve geri yükleme planı
- [ ] Güvenlik denetimi
- [ ] Performans ve erişilebilirlik denetimi
- [ ] KVKK ve gizlilik süreçleri
- [ ] Kullanım koşulları
- [ ] Beta kullanıcı testleri

---

## 10. MVP kapsamı ve kapsam dışı özellikler

İlk satılabilir MVP'nin odak noktası:

> Müşteriyi ekle, projeyi oluştur, ekibi ata, görevleri yürüt, dosyaları paylaş, zamanı takip et ve ilerlemeyi raporla.

### MVP içinde

- Auth
- Organizasyon
- Ekip daveti
- Temel roller
- Müşteriler
- Projeler
- Görevler
- Alt görev/checklist
- Yorumlar
- Dosyalar
- Dashboard
- Bildirimler
- Aktivite geçmişi
- Temel zaman takibi

### MVP sonrasına bırakılacaklar

- Yerleşik görüntülü toplantı
- Gelişmiş CRM
- Tam muhasebe sistemi
- Gelişmiş sözleşme/e-imza
- Mobil native uygulama
- Çok kapsamlı otomasyon sistemi
- Multi-agent AI
- Gelişmiş Gantt ve kapasite planlama

Yerleşik görüntülü toplantı yüksek altyapı, maliyet ve operasyon gerektirdiği için ilk sürümde Google Meet/Zoom bağlantısı kullanılması daha uygundur.

---

## 11. Güvenlik ve gizlilik gereksinimleri

- API anahtarları frontend koduna yazılmamalıdır.
- Ortam değişkenleri `.env` dosyalarında tutulmalı; örnek değerler `.env.example` içinde belgelenmelidir.
- Organizasyon verileri RLS ile ayrılmalıdır.
- Hassas işlemler sunucu tarafında yapılmalıdır.
- Dosya bağlantıları süreli ve yetki kontrollü olmalıdır.
- Herkese açık form/paylaşım tokenları tahmin edilemez olmalıdır.
- Auth rate limiting ve brute-force koruması uygulanmalıdır.
- Kritik hareketler aktivite günlüğüne yazılmalıdır.
- Kullanıcı verisi silme ve dışa aktarma akışları bulunmalıdır.
- KVKK/GDPR gereksinimleri production öncesinde tamamlanmalıdır.
- Analitik ve oturum kaydı araçları hassas verileri maskelemelidir.
- AI servislerine gönderilen veriler kullanıcıya açıkça bildirilmelidir.

---

## 12. Kalite standartları

Her özellik tamamlanmış sayılmadan önce:

- Masaüstünde çalışmalı.
- Mobilde çalışmalı.
- Açık ve koyu temada kontrol edilmeli.
- Loading durumu bulunmalı.
- Boş durum bulunmalı.
- Hata durumu bulunmalı.
- Yetkisiz kullanıcı davranışı tanımlanmalı.
- Form doğrulaması olmalı.
- Klavye ile kullanılabilmeli.
- Erişilebilir isim ve etiketler bulunmalı.
- İlgili testler yazılmalı.
- Production derlemesi geçmeli.
- Bu belge güncellenmeli.

---

## 13. Bilinen mevcut eksikler ve teknik borç

- TypeScript kullanılmıyor.
- Sunucu verisi/cache yönetim katmanı henüz yok; ekran state'i yerel React state ile yönetiliyor.
- Sunucu sorguları için merkezi cache/invalidation katmanı henüz yok.
- Formlar gelişmiş doğrulama yapmıyor.
- Global arama gerçek sonuç üretmiyor.
- Bildirimler demo.
- Gündem yalnızca görevleri içeriyor; toplantı ve takvim olayları henüz bağlı değil.
- Placeholder modüller işlevsel değil.
- Domain/config testleri var; UI entegrasyon ve E2E testleri henüz yok.
- ESLint/Prettier yapılandırması bulunmuyor.
- GitHub → Vercel production deployment bağlantısı bulunuyor; test/build için ayrı GitHub Actions kalite kapısı henüz yok.
- Route bazlı code splitting çalışıyor; ilerleyen modüllerde ana bundle boyutu izlenmeye devam edilmeli.
- Offline/PWA desteği bulunmuyor.

---

## 14. Bir sonraki geliştirme paketi

Önerilen bir sonraki çalışma sırası:

1. Production owner hesabıyla Zaman Takibi → Ekip raporu görünümünü aç.
2. Bu hafta, önceki hafta, ekip üyesi ve proje filtrelerini gerçek kayıtlarla doğrula.
3. Normal üye hesabında Ekip raporu sekmesinin görünmediğini ve kişisel kayıt izolasyonunun korunduğunu doğrula.
4. Kabul sonrasında filtrelenmiş ekip raporunu CSV olarak dışa aktarma paketine geç.
5. Ardından proje/müşteri bazlı zaman özeti ve merkezi raporlama ekranını planla.

Sıradaki ManageFlow geliştirme paketinin başarı ölçütü:

```text
Kullanıcı aktif sayacı sayfa yenilemesinden sonra aynı sunucu başlangıç zamanıyla görür
→ Sayacı durdurunca sunucu hesaplı süre kalıcı kayda dönüşür
→ Manuel süre kayıtları tarih, proje ve isteğe bağlı görev bağlamıyla eklenebilir
→ Kullanıcı günlük/haftalık geçmişini filtreleyebilir
→ Tamamlanmış kayıt güvenli RPC ile düzeltilebilir ve aktörü kaydedilir
→ Arşivlenen kayıt silinmez, varsayılan toplamdan çıkar ve geri alınabilir
→ Başka kullanıcı veya organizasyonun süre kayıtlarına erişemez
```

---

## 15. Değişiklik günlüğü

### 22 Temmuz 2026 — `0.35.0-member-removal`

Eklenenler:

- Owner/admin için ekip üyesi kaldırma butonu ve onay akışı
- Sunucu doğrulamalı `remove_organization_member` RPC'si
- Organizasyon sahibi, kendi üyeliği ve doğrudan tablo silme korumaları
- Kaldırma sonrasında açıklayıcı toast ve güvenli hata mesajları

Doğrulama:

- `npm test` — 15 dosyada 101/101 test başarılı
- `npm run build` — başarılı
- `member_removal_rls_smoke.sql` — `result: passed`
- Uzak Supabase schema lint — hata/uyarı yok
- Uzak migration sayısı 24

### 22 Temmuz 2026 — `0.34.0-time-breakdown`

Eklenenler:

- Haftalık ekip zamanlarında proje bazlı süre dağılımı
- Aynı müşteriye bağlı projeleri birleştiren müşteri zaman özeti
- Süre, kayıt, çalışan kişi ve yüzde göstergeleri
- Responsive rapor kartları

Doğrulama:

- `npm test` — 15 dosyada 99/99 test başarılı
- `npm run build` — başarılı
- Mevcut owner/admin rapor yetki sınırı değiştirilmedi

### 22 Temmuz 2026 — `0.33.0-timesheet-csv`

Eklenenler:

- Filtrelenmiş owner/admin ekip timesheet CSV dışa aktarması
- Excel uyumlu UTF-8 çıktı ve tarih aralıklı dosya adı
- Formül enjeksiyonuna karşı güvenli hücre kaçışı
- Responsive `CSV indir` aksiyonu

Doğrulama:

- `npm test` — 15 dosyada 98/98 test başarılı
- `npm run build` — başarılı
- Veritabanı yetki modeli değişmeden mevcut owner/admin rapor RPC'si kullanıldı

### 22 Temmuz 2026 — `0.32.0-independent-workspace-notes`

Eklenenler:

- Projeden bağımsız organizasyon geneli ekip notları
- İsteğe bağlı proje bağlamı ve bağımsız not filtresi
- Projesiz çalışma alanlarında not oluşturma desteği
- Nullable proje bağlamını güvenli yöneten migration ve RLS güncellemesi
- `EKSIKLER_VE_FARKLAR.md` ürün karşılaştırma ve uygulama sırası belgesi

Doğrulama:

- `npm test` — 15 dosyada 97/97 test başarılı
- `npm run build` — başarılı
- `project_notes_rls_smoke.sql` — bağımsız not kontrolü dahil `result: passed`
- Uzak Supabase schema lint — hata/uyarı yok
- Uzak migration sayısı 23

### 20 Temmuz 2026 — `0.31.0-team-timesheet`

Eklenenler:

- Owner/admin için Zaman Takibi içinde salt okunur `Ekip raporu` görünümü
- Haftalık gezinme ile ekip üyesi ve proje filtreleri
- Toplam süre, kayıt, çalışan ekip üyesi ve proje metrikleri
- Üye, proje/görev, tarih/saat, not, kayıt türü ve durum ayrıntılarını içeren responsive rapor listesi
- 31 günlük aralık ve 5.000 kayıt sınırına sahip owner/admin-only `get_organization_timesheet` RPC'si
- Ayrı rollback tabanlı ekip timesheet güvenlik testi

Güvenlik:

- Normal üyelerin kişisel `time_entries` select RLS politikası değiştirilmedi
- Ekip verisi yalnız aktif owner/admin rolünü sunucuda doğrulayan salt okunur fonksiyondan döndürülüyor
- Arşivli kayıtlar ve farklı organizasyon kapsamı rapora alınmıyor
- Member erişimi ve aşırı tarih aralığı sunucuda reddediliyor

Doğrulama:

- `npm test` — 15 dosyada 97/97 test başarılı
- `npm run build` — başarılı
- `team_timesheet_rls_smoke.sql` — `result: passed`
- Zaman takibi, tam RLS ve proje notları regresyon testleri — `result: passed`
- Uzak Supabase schema lint — hata/uyarı yok
- Uzak migration sayısı 22; yerel ve uzak geçmiş eşleşiyor

Kabul testi:

- Production owner hesabıyla ekip görünümü ve filtrelerin gerçek süre kayıtlarıyla doğrulanması bekleniyor.

### 20 Temmuz 2026 — `0.30.1-sidebar-navigation`

Eklenenler:

- Sidebar organizasyon kartına aktif çalışma alanı özeti ve erişilebilir açılır menü
- Çalışma alanı menüsünden ilgili ajans ayar kartına doğrudan bağlantı
- Organizasyon değiştirme için yanıltıcı olmayan `Yakında` durumu
- Kullanıcı adı, e-posta ve avatar alanından kişisel profil ayarına doğrudan bağlantı
- Profil ve çalışma alanı ayar kartları için URL fragment'iyle derin bağlantı ve otomatik kaydırma

Düzeltilenler:

- Tıklanabilir görünen fakat tepki vermeyen organizasyon kartı işlevsel hale getirildi
- Hesap kartının boş alanları profil navigasyonuna bağlandı; bağımsız çıkış aksiyonu korundu
- Açılır menü dışarı tıklama ve `Escape` tuşuyla kapanacak şekilde tamamlandı
- Daraltılmış ve mobil sidebar davranışları yeni kontrollerle uyumlu hale getirildi

Doğrulama:

- `npm test`
- `npm run build`
- Masaüstü, daraltılmış sidebar ve mobil navigasyon davranış kontrolü

### 20 Temmuz 2026 — `0.30.0-time-corrections`

Eklenenler:

- Tamamlanmış zaman kayıtları için düzenleme modalı ve sunucu doğrulamalı düzeltme RPC'si
- Düzeltme zamanı/aktörü ile arşiv zamanı/aktörü alanları
- Geri alınabilir zaman kaydı arşivleme ve arşivden çıkarma
- Aktif, arşivlenen ve tüm kayıt geçmişi filtresi
- Düzeltildi ve Arşivde durum etiketleri
- Arşiv onay ekranı ve responsive kayıt aksiyonları

Güvenlik:

- Doğrudan `time_entries UPDATE` yetkisi kaldırıldı
- Sayaç durdurma `stop_time_entry` RPC'sine taşındı
- Düzeltme, arşivleme ve geri alma ayrı yetki kontrollü sunucu fonksiyonlarına ayrıldı
- Aktif sayaç düzeltme/arşivlemeye, arşivlenmiş kayıt düzeltmeye kapatıldı
- Test fixture'ları pasif ekip üyesi durumunda rollback içinde güvenle çalışacak hale getirildi

Doğrulama:

- `npm test` — 15 dosyada 95/95 test başarılı
- `npm run build` — başarılı; Zaman Takibi lazy chunk'ı yaklaşık 29,8 kB / 8,4 kB gzip
- `time_tracking_rls_smoke.sql` — `result: passed`, düzeltme/arşivleme dahil 17 güvenlik alanı `true`
- Tam RLS regresyon testi ve proje notları regresyon testi — `result: passed`
- Uzak Supabase schema lint — hata/uyarı yok
- Uzak migration sayısı 21; yerel ve uzak geçmiş eşleşiyor

Kabul testi:

- Production hesabıyla düzeltme, arşiv filtresi ve geri alma arayüz doğrulaması bekleniyor.

### 20 Temmuz 2026 — `0.29.1-quote-cta`

Değiştirilenler:

- Landing navigasyon, hero, çalışma akışı, güvenlik ve final CTA metinleri “Fiyat teklifi al” olarak birleştirildi
- Oturumsuz satış CTA'ları; ajans adı, ekip büyüklüğü ve modül ihtiyacını isteyen hazır e-posta talebine bağlandı
- Oturum açmış kullanıcılar için çalışma alanına gitme davranışı korundu
- Ücretsiz/kart söylemi, ihtiyaca özel teklif ve canlı ürün demosu anlatımıyla değiştirildi
- Fiyat teklifi SSS içeriği yeni satış akışına göre güncellendi

Doğrulama:

- `npm test`
- `npm run build`
- Teklif bağlantısı ve oturum duyarlı CTA kontrolü

Bilinen sınırlamalar:

- Teklif talebi şimdilik kullanıcının varsayılan e-posta uygulamasını açar; uygulama içi teklif formu ve CRM kaydı henüz yoktur.

### 20 Temmuz 2026 — `0.29.0-public-landing`

Eklenenler:

- Herkese açık `/` SaaS landing page
- Ajans odaklı hero, kod tabanlı ürün önizlemesi, özellik grupları ve çalışma akışı
- Görev, zaman takibi ve proje notları ekran turları
- Güvenlik, hedef kitle, canlı modüller/yol haritası, SSS, final CTA ve footer bölümleri
- Oturum duyarlı uygulama/kayıt aksiyonları
- Canonical, robots, Open Graph ve Twitter SEO metadata
- Projeyi başka geliştirici veya yapay zekâya devretmek için kapsamlı `HAKKINDA.md`

Değiştirilenler:

- Uygulama içi logonun varsayılan davranışı korunurken landing için hedef rota ve erişilebilir etiket desteği eklendi
- Korumalı uygulama başlangıcı `/dashboard`, herkese açık ürün başlangıcı `/` olacak şekilde rota ayrımı netleştirildi
- Sürüm `0.29.0` olarak yükseltildi

Doğrulama:

- `npm test` — 15 dosyada 94/94 test başarılı
- `npm run build` — başarılı; lazy-loaded landing sayfası yaklaşık 25,0 kB / 6,4 kB gzip
- Yerel `/` ve `/giris` doğrudan HTTP kontrolleri `200`
- 1440px masaüstü ve dar ekran tarayıcı render kontrolleri
- Vercel production deployment `READY`; özel domainde `/`, `/giris`, `/kayit` ve `/dashboard` rotaları `200`
- Production HTML title/canonical, güvenlik başlıkları ve `LandingPage` lazy bundle içeriği doğrulandı

Bilinen sınırlamalar:

- Cookie/analitik, yasal sayfalar, fiyatlandırma ve müşteri referansları henüz bulunmuyor.
- UI entegrasyon, görsel regresyon ve E2E test altyapısı henüz bulunmuyor.
- Teknik production smoke kontrolü tamamlandı; gerçek cihazda kullanıcı görsel kabulü bekleniyor.

### 20 Temmuz 2026 — `0.28.0-workspace-notes`

Eklenenler:

- Gerçek `/calisma-alani` sayfası ve aktif sidebar bağlantısı
- Proje gezgini, ortak not kartları, tam not görünümü ve arama
- Not oluşturma ve rol/yazar korumalı düzenleme
- Çalışma alanı not/proje/yazar/haftalık güncelleme metrikleri
- Responsive açık/koyu tema, loading, hata, boş ve salt okunur durumları
- `project_notes` tablosu, alan bütünlüğü, bağlam trigger'ları ve organizasyon izole RLS politikaları
- V1 not silme yetkilerini açıkça kapatan güvenlik sınırı
- Not domain davranışlarına ait 5 yeni otomatik test
- Ayrı, rollback kullanan proje notları RLS/bütünlük smoke testi

Doğrulama:

- `npm test` — 15 dosyada 94/94 test başarılı
- `npm run build` — başarılı; lazy-loaded Çalışma Alanı sayfası yaklaşık 15,0 kB
- Uzak migration sayısı 19; yerel ve uzak migration geçmişi eşleşiyor
- Proje notları güvenlik smoke testi — `result: passed`, 11 güvenlik/bütünlük alanı `true`
- Mevcut tam RLS ve zaman takibi regresyon testleri — `result: passed`
- Uzak Supabase schema lint — hata/uyarı yok

Kabul testi:

- Production hesabıyla not oluşturma, yenilemede kalıcılık, proje/arama filtresi ve düzenleme kullanıcı doğrulaması bekliyor.

Bilinen sınırlamalar:

- Not silme/arşivleme, sabitleme, etiketler, zengin metin, sürüm geçmişi ve eşzamanlı düzenleme henüz yok.
- UI entegrasyon/E2E test altyapısı henüz bulunmuyor.

### 20 Temmuz 2026 — `0.27.0-time-history`

Eklenenler:

- Sunucu doğrulamalı manuel süre kayıt modalı
- Pazartesi–pazar haftalık kişisel geçmiş, haftalar arası gezinme ve toplam süre
- Proje ve görev geçmiş filtreleri
- Bugün ve geçmiş listelerinde manuel kayıt ayrımı
- Sayaç başlatma ve manuel ekleme için iki güvenli RPC sınırı
- `entry_type` bütünlük alanı ve doğrudan authenticated tablo insert'ini kapatan migration
- Manuel form, hafta sınırı, filtre ve toplam hesaplarına ait 2 yeni domain testi
- Manuel kayıt güvenliği ve mevcut sayaç regresyonlarını birlikte kapsayan genişletilmiş uzak smoke testi

Doğrulama:

- `npm test` — 14 dosyada 89/89 test başarılı
- `npm run build` — başarılı; Zaman Takibi lazy chunk'ı yaklaşık 23,8 kB, ana chunk yaklaşık 302,2 kB
- Uzak migration sayısı 18; yerel ve uzak migration geçmişi eşleşiyor
- Zaman takibi güvenlik smoke testi — `result: passed`, 12 güvenlik/bütünlük alanı `true`
- Mevcut tam RLS regresyon testi — `result: passed`
- Uzak Supabase schema lint — hata/uyarı yok

Kabul testi:

- Production hesabıyla manuel kayıt oluşturma, yenilemede kalıcılık ve haftalık filtre davranışı kullanıcı doğrulaması bekliyor.

Bilinen sınırlamalar:

- Kayıt düzeltme/arşivleme, ekip timesheet'i, dışa aktarma ve ekip raporları henüz yok.
- UI entegrasyon/E2E test altyapısı henüz bulunmuyor.

### 20 Temmuz 2026 — `0.26.0-time-tracking`

Eklenenler:

- Gerçek `/zaman-takibi` sayfası ve aktif sidebar bağlantısı
- Proje zorunlu, görev isteğe bağlı zaman sayacı başlatma/durdurma akışı
- Canlı sayaç, bugünkü toplam/oturum/proje metrikleri ve kişisel kayıt listesi
- Responsive açık/koyu tema, loading, hata ve boş durumları
- Zaman domain hesaplamaları için 7 yeni otomatik test
- `time_entries` tablosu, sunucu zaman trigger'ı, tek aktif sayaç index'i ve kişisel RLS politikaları
- V1 kayıt silme yetkilerini açıkça kapatan ek hardening migration'ı
- Ayrı, rollback kullanan zaman takibi RLS/bütünlük smoke testi

Doğrulama:

- `npm test` — 14 dosyada 87/87 test başarılı
- `npm run build` — başarılı; yeni lazy-loaded Zaman Takibi sayfası üretildi
- Uzak migration sayısı 17'ye yükseldi.
- Zaman takibi RLS smoke testi — `result: passed`, 9 güvenlik/bütünlük kontrolü `true`
- Mevcut tam RLS regresyon testi — `result: passed`
- Uzak Supabase schema lint — hata/uyarı yok
- Gerçek hesapla production başlatma → sayfa yenileme → aynı sayacı sürdürme → durdurma → kalıcı listede gösterme akışı başarılı

Bilinen sınırlamalar:

- Düzenleme/arşivleme, haftalık ekip timesheet'i ve ekip raporları henüz yok.

### 19 Temmuz 2026 — `0.25.1-custom-domain`

Altyapı:

- `manageflow.bksoftstudio.com` Vercel ManageFlow projesine eklendi ve DNS sahipliği doğrulandı.
- Cloudflare üzerinde projeye özel Vercel CNAME hedefi DNS-only olarak yapılandırıldı.
- Vercel HTTPS sertifikası ve doğrudan SPA rota erişimi doğrulandı.
- Production/Preview `VITE_APP_URL` değeri özel domaine taşındı.
- Supabase Auth `Site URL` ve kesin redirect izinlerine özel domain yolları eklendi; eski Vercel ve yerel adresler yedek olarak korundu.
- Supabase Edge Function `MANAGEFLOW_APP_URL` secret'ı özel domaine taşındı.

Doğrulama:

- Özel domain ve yedek Vercel adresinde 7 temel rota `200` döndürdü.
- Özel domain SPA yanıtında dört production güvenlik başlığı doğrulandı.
- Production JavaScript bundle'ında Auth callback origin'inin `https://manageflow.bksoftstudio.com` olduğu doğrulandı.
- Gerçek şifre sıfırlama e-postası özel domaindeki `/sifre-yenile` callback'ine döndü ve yeni şifre kaydı başarıyla tamamlandı.

Bilinen sınırlamalar:

- Kayıt doğrulama ve davet kabul e-postaları özel domain callback'leriyle ayrıca kullanıcı smoke testinden geçirilmelidir.
- Production SMTP ve GitHub Actions kalite kapısı henüz yok.

### 19 Temmuz 2026 — `0.25.0-production-foundation`

Eklenenler:

- Vercel production proje yapılandırması ve Vite SPA route rewrite
- Temel tarayıcı güvenlik başlıkları
- Production Auth callback'leri için güvenli `VITE_APP_URL` origin çözümleyicisi
- Şifre değiştirme formunu yalnızca gerçek recovery callback oturumuna açan kontrol
- Geçersiz ve süresi dolmuş şifre yenileme bağlantısı durumu
- Auth URL ve recovery davranışları için 6 yeni test senaryosu

Altyapı:

- Vercel projesi GitHub repository'sine bağlandı.
- Supabase URL ve publishable key Production/Preview ortamlarına güvenli biçimde tanımlandı.
- `VITE_APP_URL` production ve preview callback'leri için kararlı canlı adrese ayarlandı.
- Edge Function `MANAGEFLOW_APP_URL` secret'ı canlı adrese güncellendi.
- Uygulama `https://manageflow-seven.vercel.app` adresinde yayına alındı.
- Supabase Auth `Site URL` ve kesin yerel/production redirect izinleri canlı adrese göre yapılandırıldı.

Doğrulama:

- `npm test` — 80/80 test başarılı
- `npm run build` — başarılı
- `/`, `/giris`, `/dashboard`, `/sifre-yenile`, `/davet-kabul` ve `/ozellestirme` doğrudan canlı rota kontrolleri `200` döndürdü.
- SPA yanıtlarında dört production güvenlik başlığı doğrulandı.
- Gerçek şifre sıfırlama e-postası, `PASSWORD_RECOVERY` callback'i ve yeni şifre kaydı production ortamında uçtan uca doğrulandı.

Bilinen sınırlamalar:

- Production kayıt doğrulama ve davet kabul callback'leri yeni canlı adresle ayrıca smoke test edilmelidir.
- Özel domain, production SMTP ve GitHub Actions kalite kapısı henüz yok.

### 19 Temmuz 2026 — `0.24.0-settings`

Eklenenler:

- Gerçek `/ozellestirme` profil ve çalışma alanı ayarları ekranı
- Kullanıcının kendi ad-soyad, telefon ve HTTPS avatar adresini güncelleme akışı
- Owner/admin için organizasyon adı ve HTTPS logo adresi güncelleme akışı
- Member/proje yöneticisi için salt okunur organizasyon ayarı görünümü
- Avatar ve logo önizlemesi ile güvenli baş harf fallback'i
- Profil/organizasyon doğrulama, normalize etme, permission ve hata yardımcıları
- 5 yeni ayarlar domain testi
- Profil ve organizasyon görsel alanları için uzunluk constraint'leri
- Organizasyon güncellemelerini yalnızca `name` ve `logo_url` sütunlarıyla sınırlayan yetki migration'ı
- RLS smoke testine profil self-update, başka profil reddi, member/admin organizasyon matrisi ve slug koruması

Değiştirilenler:

- Sidebar'daki `Özelleştirme` modülünün `Yakında` işareti kaldırıldı.
- Profil adı/avatarı Auth metadata ile eşlenerek sidebar ve dashboard kimliği anında yenilenir.
- Organizasyon context'i ayar kaydından sonra ad ve logoyu yeniden sorgu beklemeden günceller.
- Sidebar avatarları profil görselini, organizasyon alanı ise kaydedilen logoyu gösterebilir.
- Uzak Supabase migration sayısı 15'e yükseldi.

Doğrulama:

- `npm test` — 13 dosyada 79/79 test başarılı
- `npm run build`
- `npx supabase db push --linked`
- Uzak RLS smoke testi — `result: passed`, bütün ayarlar ve önceki güvenlik kontrolleri `true`
- Uzak schema lint — hata/uyarı yok

Bilinen sınırlamalar:

- Avatar ve logo dosyası henüz Supabase Storage'a yüklenmez; HTTPS URL kullanılır.
- E-posta değişikliği arayüzü bu pakete dahil değildir.
- UI entegrasyon ve uçtan uca tarayıcı testleri henüz bulunmuyor.

### 19 Temmuz 2026 — `0.23.0-task-filters`

Eklenenler:

- Görevli ve atanmamış görev filtreleri
- Ana görev, alt görev ve alt görevi olan görev filtreleri
- Oluşturulma, bitiş tarihi, öncelik, başlık ve duruma göre artan/azalan sıralama
- Tek tek kaldırılabilen aktif filtre etiketleri ve tümünü temizleme işlemi
- Arama, filtre, sıralama ve Liste/Kanban görünümünü organizasyon bazında saklayan tercihler
- Bozuk veya artık desteklenmeyen kayıtlı tercihleri güvenli varsayılanlara döndüren normalizasyon
- Yeni filtre katmanı için responsive masaüstü, tablet ve mobil stilleri
- Filtre, sıralama ve tercih normalizasyonu için 3 yeni domain testi

Değiştirilenler:

- Liste ve Kanban görünümü aynı filtrelenmiş ve sıralanmış görev koleksiyonunu kullanır.
- Bitiş tarihi bulunmayan görevler sıralama yönünden bağımsız olarak listenin sonunda tutulur.
- Eski global Liste/Kanban tercihi yerini organizasyon kapsamlı tek tercih kaydına bıraktı.
- Faz 3 müşteri, proje ve görev çekirdeği tamamlandı olarak işaretlendi.

Doğrulama:

- `npm test` — 12 dosyada 74/74 test başarılı
- `npm run build`
- Bu paket veritabanı şemasını veya mevcut RLS politikalarını değiştirmedi.

Bilinen sınırlamalar:

- Tercihler şu anda kullanıcı profiline senkronize edilmez; aynı tarayıcı ve cihazda saklanır.
- UI entegrasyon ve uçtan uca tarayıcı testleri henüz bulunmuyor.

### 19 Temmuz 2026 — `0.22.0-task-hierarchy`

Eklenenler:

- Görevlere isteğe bağlı `parent_task_id` alanı ve aynı tabloya güvenli üst görev ilişkisi
- Organizasyon, proje ve görev kapsamını birlikte koruyan bileşik self foreign key
- Görevin kendisini üst görev seçmesini ve tüm döngüsel hiyerarşileri reddeden trigger
- Yeni bağlantılarda arşivlenmiş üst görevi reddeden bütünlük kontrolü
- Üst görev bağlantısı değişiklikleri için `parent_changed` aktivite olayı
- Görev oluşturma ve düzenleme formlarında projeye göre filtrelenen üst görev seçimi
- Düzenleme formunda kendisi ve tüm torun görevlerini seçeneklerden çıkaran döngü önleme
- Görev drawer'ında alt görev listesi, görevli/durum bilgisi ve gerçek tamamlanma oranı
- Alt görev satırından ilgili görev detayına geçiş
- Liste ve Kanban kartlarında üst görev ve alt görev ilerleme göstergeleri
- Hiyerarşi eşleme, ilerleme ve torun bulma domain yardımcılarıyla yeni otomatik test

Yetkilendirme ve güvenlik:

- Mevcut görev rol matrisi üst görev alanı değişikliklerinde de aynen uygulanır.
- Member rolü hiyerarşiyi okuyabilir fakat değiştiremez.
- Farklı organizasyon veya projedeki görev üst görev olarak seçilemez.
- Self-reference ve dolaylı döngüler veritabanı seviyesinde reddedilir.
- Üst görev değişiklikleri güvenilir trigger ile append-only aktivite geçmişine yazılır.
- Uzak RLS smoke testine geçerli bağlama/ayırma, self-reference, cycle ve çapraz organizasyon kontrolleri eklendi.

Doğrulama:

- `npm test -- --run` — 12 test dosyasında 71 test geçti
- `npm run build`
- `git diff --check`
- `npx supabase db lint --linked --level error` — şema hatası bulunmadı
- `npx supabase db query --linked --file supabase/tests/rls_smoke.sql` — `result: passed`
- `npx supabase migration list --linked` — 14 yerel/uzak migration eşleşiyor

Bilinen sınırlamalar:

- Drawer ilerlemesi doğrudan alt görevlerden hesaplanır; tüm torunları birleştiren genel ilerleme henüz yoktur.
- Üst görev tamamlanınca alt görevleri otomatik kapatma gibi bir davranış uygulanmaz.
- Hiyerarşik sürükle-bırak ve manuel alt görev sıralaması henüz yoktur.
- UI entegrasyon ve E2E testleri henüz bulunmuyor.

### 19 Temmuz 2026 — `0.21.0-task-activity`

Eklenenler:

- Göreve ve organizasyona bağlı append-only `task_activities` tablosu
- Oluşturma, başlık, açıklama, proje, durum, öncelik, görevli, tarih, arşivleme ve geri açma olay tipleri
- Mevcut görevlerin ilk oluşturulma aktivitelerini gerçek oluşturucu ve tarihle ekleyen backfill
- Görev değişikliklerini frontend payload'ına güvenmeden otomatik kaydeden veritabanı trigger'ı
- Olay aktörü, güvenli eski/yeni değer metadata'sı ve değişmez oluşturulma zamanı
- Görev drawer'ında son 60 hareketi gösteren kronolojik aktivite zaman çizelgesi
- Aktör adı/baş harfleri, okunabilir Türkçe olay açıklaması ve zaman bilgisi
- Loading, hata, yeniden deneme, boş geçmiş ve liste limiti durumları
- Aktivite bağlam kimlikleri, açıklama, eşleme ve hata yardımcıları için 4 otomatik test

Yetkilendirme ve güvenlik:

- Aktif organizasyon üyeleri kendi organizasyonlarındaki görev aktivitelerini okuyabilir.
- Authenticated frontend rolünden aktivite insert, update, delete ve truncate yetkileri kaldırıldı.
- Aktivite kayıtları yalnızca güvenilir `SECURITY DEFINER` görev trigger'ı tarafından oluşturulur.
- Aktivite ile görevin aynı organizasyonda bulunması bileşik foreign key ile zorunludur.
- Başka organizasyon aktiviteleri RLS ile gizlenir.
- Uzak RLS smoke testine otomatik durum/arşiv olayları, doğrudan yazma reddi ve çapraz organizasyon görünürlüğü eklendi.

Doğrulama:

- `npm test -- --run` — 12 test dosyasında 70 test geçti
- `npm run build`
- `git diff --check`
- `npx supabase db lint --linked --level error` — şema hatası bulunmadı
- `npx supabase db query --linked --file supabase/tests/rls_smoke.sql` — `result: passed`
- `npx supabase migration list --linked` — 13 yerel/uzak migration eşleşiyor

Bilinen sınırlamalar:

- Drawer yalnızca en güncel 60 hareketi gösterir; sayfalama henüz yoktur.
- Checklist ve yorum olayları aktivite akışına henüz eklenmemiştir.
- Aktivite geçmişi gerçek zamanlı abonelik kullanmaz; drawer yeniden açıldığında yenilenir.
- UI entegrasyon ve E2E testleri henüz bulunmuyor.

### 19 Temmuz 2026 — `0.20.0-task-comments`

Eklenenler:

- Göreve ve organizasyona bağlı gerçek `task_comments` tablosu
- Yorum metni, yazar, düzenlenme zamanı ve standart zaman damgası alanları
- Organizasyon/görev bağlantısını koruyan bileşik foreign key ve görev silindiğinde cascade temizleme
- Yorum değiştiğinde `edited_at` zamanını otomatik kaydeden veritabanı trigger'ı
- Yorumun organizasyon, görev, yazar ve oluşturulma kimliğini değişmez tutan bütünlük koruması
- Görev detay drawer'ında kronolojik yorum listesi, yazar baş harfleri ve zaman bilgisi
- Yorum oluşturma, kendi yorumunu düzenleme ve onaylı kalıcı silme akışları
- Owner/admin için başka kullanıcı yorumunu silen moderasyon kontrolü
- Loading, hata, yeniden deneme, boş liste, gönderim ve salt okunur durumlar
- Supabase olmayan demo ortamı için görev bazlı yorum fallback'i
- Yorum doğrulama, eşleme, yazar görünümü, yetki ve hata yardımcıları için 4 otomatik test

Yetkilendirme ve güvenlik:

- Tüm aktif organizasyon üyeleri aktif proje içindeki arşivlenmemiş görevlere yorum yazabilir.
- Her kullanıcı yalnızca kendi yorum metnini düzenleyebilir.
- Yazar kendi yorumunu; owner/admin ise moderasyon amacıyla diğer yorumları silebilir.
- Başka bir yazarın yorum metnini admin dahil hiçbir rol değiştiremez.
- Arşivlenmiş görev ve projelerde yorum değişiklikleri RLS seviyesinde reddedilir.
- Başka organizasyona ait görev/yorum ilişkisi bileşik foreign key ve RLS ile engellenir.
- Uzak RLS smoke testine üye yazarlığı, admin moderasyonu, arşivli görev ve çapraz organizasyon kontrolleri eklendi.

Doğrulama:

- `npm test -- --run` — 11 test dosyasında 66 test geçti
- `npm run build`
- `git diff --check`
- `npx supabase db lint --linked --level error` — şema hatası bulunmadı
- `npx supabase db query --linked --file supabase/tests/rls_smoke.sql` — `result: passed`
- `npx supabase migration list --linked` — 12 yerel/uzak migration eşleşiyor

Bilinen sınırlamalar:

- Yorumlarda mention, dosya eki, emoji tepkisi ve gerçek zamanlı güncelleme henüz yoktur.
- Görev aktivite geçmişi ve bildirim üretimi henüz bağlı değildir.
- UI entegrasyon ve E2E testleri henüz bulunmuyor.

### 19 Temmuz 2026 — `0.19.0-task-checklist`

Eklenenler:

- Göreve ve organizasyona bağlı gerçek `task_checklist_items` tablosu
- Checklist başlığı, sıra, tamamlanma zamanı, oluşturan kullanıcı ve zaman damgası alanları
- Organizasyon/görev bağlantısını koruyan bileşik foreign key ve görev silindiğinde cascade temizleme
- Tamamlanma zamanını güvenli biçimde oluşturan ve yeniden açmada temizleyen veritabanı trigger'ı
- Checklist kaydının organizasyon, görev ve oluşturucu kimliğini değişmez tutan bütünlük koruması
- Görev detay drawer'ında tamamlanan/toplam sayısı ve gerçek ilerleme çubuğu
- Checklist öğesi ekleme, tamamlama, yeniden açma ve silme işlemleri
- Loading, hata, yeniden deneme, boş liste ve salt okunur durumlar
- Supabase olmayan demo ortamı için görev bazlı checklist fallback'i
- Checklist doğrulama, eşleme, ilerleme ve hata yardımcıları için 4 otomatik test

Yetkilendirme ve güvenlik:

- Organizasyon üyeleri checklist öğelerini okuyabilir.
- Owner, admin ve proje yöneticisi aktif proje içindeki arşivlenmemiş görevlerde checklist yönetebilir.
- Member rolü checklist'i salt okunur görür.
- Arşivlenmiş görev ve projelerde yeni checklist işlemleri RLS seviyesinde reddedilir.
- Başka organizasyona ait görev/checklist ilişkisi bileşik foreign key ve RLS ile engellenir.
- Uzak RLS smoke testine member/admin/proje yöneticisi checklist yetki matrisi, tamamlanma zamanı ve çapraz organizasyon kontrolleri eklendi.

Doğrulama:

- `npm test -- --run` — 10 test dosyasında 62 test geçti
- `npm run build`
- `git diff --check`
- `npx supabase db lint --linked --level error` — şema hatası bulunmadı
- `npx supabase db query --linked --file supabase/tests/rls_smoke.sql` — `result: passed`
- `npx supabase migration list --linked` — 11 yerel/uzak migration eşleşiyor

Bilinen sınırlamalar:

- Checklist öğeleri oluşturulma sırasına göre saklanır; sürükle-bırak ile özel sıralama henüz yoktur.
- Ayrı alt görev ilişkileri, görev yorumları ve aktivite geçmişi henüz yoktur.
- UI entegrasyon ve E2E testleri henüz bulunmuyor.

### 19 Temmuz 2026 — `0.18.0-task-kanban`

Eklenenler:

- Görevler ekranında tercihi tarayıcıda korunan Liste/Kanban görünüm seçicisi
- Yapılacak, devam ediyor, incelemede ve tamamlandı durumları için gerçek görev sütunları
- Yetkili kullanıcılar için HTML5 sürükle-bırak ile Supabase durum güncellemesi
- Dokunmatik, klavye ve erişilebilir kullanım için her kartta durum seçicisi
- Görev başlığı, proje, görevli, öncelik ve bitiş tarihini gösteren Kanban kartları
- Tek durum filtresinde odaklı sütun ve tüm durumlarda yatay pano görünümü
- Boş sütun, taşınıyor ve durum güncelleme hata durumları
- Mobilde yatay kaydırma ve sütun snap davranışı
- Kanban gruplama ve taşıma yetkileri için domain testleri

Değiştirilenler:

- Arama, proje, durum ve arşiv filtreleri Liste/Kanban görünümünde ortak kullanılacak şekilde düzenlendi.
- Görev güncelleme/oluşturma/arşivleme sonrası veri yenileme, tüm ekranı loading durumuna almayan arka plan yenilemesine çevrildi.
- Member rolü ile arşiv görev/proje kartlarının durum kontrolleri salt okunur tutuldu.
- Liste ve Kanban görev kartları aynı gerçek detay drawer'ını açacak şekilde bağlandı.
- Kanban durum güncellemesi tamamlanana kadar ilgili kart kilitlenerek tekrar eden istek engellendi.

Doğrulama:

- `npm test -- --run` — 9 test dosyasında 58 test geçti
- `npm run build`
- `git diff --check`
- `http://127.0.0.1:5173/gorevler` yerel sunucu erişimi

Bilinen sınırlamalar:

- Masaüstü sürükle-bırak tarayıcının HTML5 API'sini kullanır; mobilde durum seçicisi kullanılır.
- Kanban içinde kartların aynı sütundaki özel sıralaması henüz kalıcı değildir.
- Alt görev/checklist ve yorumlar henüz yoktur.

### 19 Temmuz 2026 — `0.17.0-real-dashboard`

Eklenenler:

- Aktif organizasyondaki müşteri, proje, görev ve ekip verilerini birleştiren gerçek Dashboard akışı
- Arşiv dışındaki proje ve görevlerden hesaplanan gerçek KPI kartları
- Son yedi günün görev oluşturma ve tamamlama sayılarını gösteren çift serili grafik
- Proje durumlarından dinamik oluşturulan donut dağılımı ve açıklama listesi
- Son oluşturulan, arşiv dışı ve tamamlanmamış beş proje için gerçek aktif proje özeti
- Dashboard genel loading, veri kaynağı hata, yeniden deneme ve proje boş durumları
- Teslim tarihi bugün olan gerçek görevlerden üretilen Bugünkü Gündem drawer'ı
- Dashboard hesapları, haftalık seri, proje dağılımı ve gündem sıralaması için domain testleri

Değiştirilenler:

- Mesaj veri modeli bulunmadığı için sahte Mesajlar KPI'ı kaldırıldı; müşteri ve ekip ayrı gerçek kartlara dönüştürüldü.
- Arşivlenmiş görevler ve arşivlenmiş projelerin görevleri Dashboard/gündem hesaplarından çıkarıldı.
- Üst Projeler kısayolundaki `Yakında` işareti kaldırıldı.
- Hızlı oluşturma modalındaki kalıcı olmayan demo state kaldırıldı; gerçek Projeler ve Görevler ekranlarına yönlendirme eklendi.
- Aktif proje satırları gerçek Projeler ekranına bağlandı ve teslim tarihi bilgisi eklendi.
- Bugünkü Gündem'in sabit tarihi ve demo toplantıları kaldırıldı; tarih çalışma gününe göre dinamik hale getirildi.

Doğrulama:

- `npm test -- --run` — 9 test dosyasında 56 test geçti
- `npm run build`
- `git diff --check`
- `http://127.0.0.1:5173/dashboard` yerel sunucu erişimi

Bilinen sınırlamalar:

- Dashboard sorguları ortak bir istemci cache katmanı kullanmadığı için modül hook'ları ayrı sorgular çalıştırır.
- Gündem toplantı veya harici takvim olaylarını henüz içermez.
- Gerçek bildirimler ve global arama henüz bağlı değildir.

### 19 Temmuz 2026 — `0.16.0-task-lifecycle`

Eklenenler:

- Görev satırından açılan responsive görev detay drawer'ı
- Başlık, açıklama, bağlı proje, durum, öncelik, bitiş tarihi ve görevli düzenleme akışı
- Proje değişiminde yalnızca yeni projenin atanmış ekip üyelerini sunan görevli seçimi
- Aktif/arşivlenen/tüm görevler filtreleri
- `archived_at` ve `archived_by` alanlarıyla geri alınabilir görev arşivleme migration'ı
- Arşiv aktörünü oturum açmış kullanıcıyla eşleştiren veritabanı trigger'ı
- Admin görev arşivleme ve sahte arşiv aktörü reddi için uzak RLS smoke kontrolleri
- Görev arşiv filtresi ve metrik davranışı için domain testleri

Değiştirilenler:

- Görev veri hook'u gerçek güncelleme, yeniden atama, durum geçişi, arşivleme ve geri açmayı destekleyecek şekilde genişletildi.
- Arşiv görevleri aktif dashboard sayaçlarından çıkarıldı.
- Arşivlenmiş projeye bağlı görevler veri bütünlüğü için salt okunur tutuldu.
- Member rolüne detay görüntüleme sunulurken düzenleme ve arşiv işlemleri kapalı tutuldu.
- Görev liste satırları erişilebilir detay açma düğmelerine dönüştürüldü.
- Supabase migration zinciri uzak projede `20260719090000` sürümüne çıkarıldı.

Doğrulama:

- `npm test -- --run` — 8 test dosyasında 51 test geçti
- `npm run build`
- `git diff --check`
- `npx supabase db lint --linked --level error` — şema hatası yok
- `npx supabase db query --linked --file supabase/tests/rls_smoke.sql` — `result: passed`
- `npx supabase migration list` — 10 yerel/uzak migration eşleşiyor
- Kullanıcı gerçek görev oluşturma ve sayfa yenileme sonrasında kalıcılığı tarayıcıda doğruladı

Bilinen sınırlamalar:

- Alt görevler, checklist, yorumlar ve aktivite geçmişi henüz yok.
- UI entegrasyon ve E2E testleri henüz bulunmuyor.
- Dashboard görev/proje özetleri hâlâ demo verileri kullanıyor.

### 19 Temmuz 2026 — `0.15.0-task-foundation`

Eklenenler:

- Organizasyona ve zorunlu projeye bağlı `tasks` tablosu
- `task_status` ve `task_priority` enum'ları
- Yapılacak, devam ediyor, incelemede ve tamamlandı görev durumları
- Düşük, normal, yüksek ve acil öncelik seviyeleri
- Başlık/açıklama normalizasyonu ve uzunluk constraint'leri
- Görev ile projenin organizasyon bütünlüğünü koruyan bileşik foreign key
- Görevlinin seçili projenin ekip üyesi olmasını zorunlu kılan bileşik foreign key
- Proje üyesi çıkarıldığında görev atamasını yalnızca `assignee_id` alanında null yapan güvenli foreign key davranışı
- Tamamlanan görev zamanını otomatik ekleyen ve yeniden açıldığında temizleyen trigger
- Görev organizasyon/oluşturucu kimliğini koruyan trigger
- Tüm organizasyon üyeleri için görev okuma RLS policy'si
- Owner/admin/proje yöneticisi için görev insert/update RLS policy'leri
- Arşivlenmiş projede görev oluşturmayı reddeden RLS kuralı
- Sidebar'da aktif `Görevler` bağlantısı ve gerçek `/gorevler` sayfası
- Responsive görev metrikleri, liste, arama, durum ve proje filtreleri
- Gerçek proje ve isteğe bağlı proje ekibi üyesi seçimiyle Supabase görev insert işlemi
- Member rolü için arayüz ve veritabanı seviyesinde salt okunur davranış
- Loading, hata, yeniden deneme, boş ve filtre boş durumları
- Demo ortamı için görev listesi ve oluşturma fallback'i
- Görev rol, doğrulama, normalizasyon, eşleme, filtre, metrik ve hata yardımcıları
- Görev domain kuralları için 6 yeni otomatik test
- RLS smoke testine member/admin/project manager görev erişim matrisi
- RLS smoke testine proje üyesi, arşivli proje ve çapraz organizasyon bütünlük kontrolleri

Doğrulama:

- `20260719080000_create_tasks.sql` uzak Supabase veritabanına uygulandı.
- Uzak şema linter'ı hata bulmadı.
- RLS smoke testi `result: passed` döndürdü.
- Member görev okuma ve yazma reddi kontrolleri geçti.
- Admin/proje yöneticisi görev yazma kontrolleri geçti.
- Tamamlanma zamanı ekleme ve yeniden açınca temizleme kontrolleri geçti.
- Proje üyesi çıkarıldığında görev atamasını temizleme kontrolü geçti.
- Arşivlenmiş proje, başka organizasyon projesi ve proje dışı görevli reddi kontrolleri geçti.
- `npm test` — 50/50 test başarılı
- `npm run build` — uyarısız başarılı

Kullanıcı doğrulaması bekleyenler:

- Gerçek aktif proje ve isteğe bağlı proje üyesi seçilerek ilk görev tarayıcıda oluşturulmalıdır.
- Sayfa yenileme sonrasında görev, proje ve görevli bağlantılarının korunduğu doğrulanmalıdır.

### 19 Temmuz 2026 — `0.14.0-project-team`

Eklenenler:

- Organizasyon, proje ve kullanıcı ilişkisini güvenli tutan `project_members` tablosu
- Proje ve kullanıcı için organizasyon kapsamlı bileşik foreign key'ler
- Aynı üyenin aynı projeye tekrar atanmasını engelleyen unique constraint
- Yalnızca aktif organizasyon üyelerini aktif projelere atayan doğrulama trigger'ı
- Yeni proje oluşturucusunu otomatik proje ekibine ekleyen veritabanı trigger'ı
- Mevcut aktif projeler için oluşturucu üyeliklerinin güvenli backfill işlemi
- Tüm organizasyon üyeleri için proje ekibini okuma RLS policy'si
- Owner/admin/proje yöneticisi için atama ekleme ve çıkarma RLS policy'leri
- Arşivlenmiş projelerde ekip değişikliğini engelleyen ortak veritabanı yardımcısı
- Aktif organizasyon üyeleri, profiller ve proje atamalarını birleştiren `useProjectMembers` veri katmanı
- Proje drawer'ında atanmış üye sayısı, avatar, unvan ve departman görünümü
- Yetkili kullanıcı için ekip üyesi seçme, ekleme ve çıkarma işlemleri
- Member rolünde salt okunur proje ekibi görünümü
- Arşivlenmiş projede ekip değişikliği kilidi ve açıklaması
- Loading, hata, yeniden deneme, boş ekip ve tüm üyeler atanmış durumları
- Demo ortamı için proje sahibi otomatik ataması ve ekip değişikliği fallback'i
- Proje üyesi eşleme, sıralama ve hata mesajları için 3 yeni otomatik test
- RLS smoke testine proje ekibi okuma/yazma rol matrisi
- RLS smoke testine tekrar, pasif üye, arşivli proje ve çapraz organizasyon atama korumaları

Doğrulama:

- `20260719070000_create_project_members.sql` uzak Supabase veritabanına uygulandı.
- Uzak şema linter'ı hata bulmadı.
- RLS smoke testi `result: passed` döndürdü.
- Member proje ekibi okuma ve yazma reddi kontrolleri geçti.
- Admin/proje yöneticisi proje ekibi yazma kontrolleri geçti.
- Tekrar eden ve pasif üye atama reddi kontrolleri geçti.
- Arşivlenmiş proje ve çapraz organizasyon atama reddi kontrolleri geçti.
- Proje oluşturma kilidinin aktif müşteriyle açıldığı ve oluşturma akışının çalıştığı kullanıcı tarafından doğrulandı.
- `npm test` — 44/44 test başarılı
- `npm run build` — uyarısız başarılı

Kullanıcı doğrulaması bekleyenler:

- Proje drawer'ından ikinci ekip üyesi ekleme ve çıkarma tarayıcıda test edilmelidir.
- Sayfa yenileme sonrasında proje ekibi atamalarının korunduğu doğrulanmalıdır.

### 19 Temmuz 2026 — `0.13.0-project-lifecycle`

Eklenenler ve iyileştirmeler:

- Proje satırından açılan gerçek detay drawer'ı
- Müşteri, durum, ilerleme, takvim ve açıklama bilgilerinin detay görünümü
- Owner/admin/proje yöneticisi için proje adı, müşteri, açıklama, durum, ilerleme ve tarih güncelleme formu
- `useProjects` veri katmanında gerçek Supabase update işlemi
- Member rolünde salt okunur proje detay paneli ve yetki açıklaması
- Tamamlanan projeyi istemci ve veritabanında otomatik yüzde 100 ilerlemeye getirme
- Tamamlanmış proje tekrar açıldığında yüzde 100 ilerlemeyi güvenli yüzde 90 değerine çekme
- İlerlemeyi 0-100 aralığında tam sayı olarak doğrulama
- `archived_at` ve `archived_by` alanlarıyla fiziksel silme yerine geri alınabilir arşivleme
- Arşivleyen kimliğin oturum kullanıcısıyla eşleşmesini zorunlu kılan veritabanı trigger'ı
- Onaylı arşivleme ve arşivden geri çıkarma işlemleri
- Aktif, arşivlenmiş ve tüm projeler liste filtreleri
- Arşivlenmiş projeleri metriklerden çıkarma
- Proje güncelleme ve arşivleme için demo fallback'i
- Tamamlanma/yeniden açma ilerleme ve arşiv filtreleri için 2 yeni otomatik test
- RLS smoke testinde gerçek admin arşivleme ve geri açma doğrulaması
- RLS smoke testinde sahte arşivleyen kullanıcı kimliğinin reddi

Doğrulama:

- `20260719060000_add_project_archiving.sql` uzak Supabase veritabanına uygulandı.
- Uzak şema linter'ı hata bulmadı.
- RLS smoke testi `result: passed` döndürdü.
- `admin_project_archive_allowed` kontrolü geçti.
- `completed_project_progress_enforced` ve `completed_project_reopen_progress_safe` kontrolleri geçti.
- `project_archive_actor_protected` kontrolü geçti.
- `npm test` — 41/41 test başarılı
- `npm run build` — uyarısız başarılı

Kullanıcı doğrulaması bekleyenler:

- Gerçek proje detayında alan ve ilerleme güncellemesi tarayıcıda test edilmelidir.
- Tamamlama, yeniden açma, arşivleme ve arşivden çıkarma işlemleri yenileme sonrasında doğrulanmalıdır.

### 19 Temmuz 2026 — `0.12.0-project-foundation`

Eklenenler:

- Organizasyona ve zorunlu müşteriye bağlı `projects` tablosu ve `project_status` enum'u
- Planlandı, devam ediyor, beklemede ve tamamlandı durumları
- Proje adı, açıklama, ilerleme, başlangıç ve bitiş tarihi constraint'leri
- Projeyi başka organizasyondaki müşteriye bağlamayı engelleyen bileşik foreign key
- Organizasyon içinde büyük/küçük harf duyarsız benzersiz proje adı
- Proje normalizasyon, kimlik koruma ve `updated_at` trigger'ları
- Tüm aktif üyeler için proje okuma RLS policy'si
- Owner/admin/proje yöneticisi için proje insert/update RLS policy'leri
- Sidebar'da aktif `Projeler` bağlantısı ve gerçek `/projeler` sayfası
- Responsive proje metrikleri, liste, arama, durum ve müşteri filtreleri
- Loading, hata, yeniden deneme, boş ve filtre boş durumları
- Gerçek aktif müşteri seçimiyle Supabase proje insert işlemi
- Member rolü için arayüz ve veritabanı seviyesinde salt okunur davranış
- Demo ortamı için müşteri bağlantılı proje listesi ve oluşturma fallback'i
- Proje rol, doğrulama, normalizasyon, eşleme, filtre, metrik ve hata yardımcıları
- Proje domain kuralları için 7 yeni otomatik test
- RLS smoke testine member/admin/project manager/owner proje erişim matrisi
- RLS smoke testine çapraz organizasyon proje ve müşteri bağlantısı izolasyonu

Doğrulama:

- `20260719050000_create_projects.sql` uzak Supabase veritabanına uygulandı.
- Yerel ve uzak migration geçmişleri `20260719050000` sürümünde eşleşti.
- Uzak şema linter'ı hata bulmadı.
- RLS smoke testi `result: passed` döndürdü.
- Member proje okuma izni ve proje yazma reddi doğrulandı.
- Owner/admin/proje yöneticisi proje yazma kontrolleri geçti.
- Çapraz organizasyon proje görünürlüğü ve müşteri bağlantısı reddi doğrulandı.
- `/projeler` yerel geliştirme sunucusunda HTTP 200 döndürdü.
- `npm test` — 39/39 test başarılı
- `npm run build` — uyarısız başarılı

Kullanıcı doğrulaması bekleyenler:

- Gerçek aktif müşteri seçilerek ilk proje tarayıcıda oluşturulmalıdır.
- Sayfa yenileme sonrasında proje ve müşteri bağlantısının korunduğu doğrulanmalıdır.

### 19 Temmuz 2026 — `0.11.0-client-details`

Eklenenler ve iyileştirmeler:

- Müşteri satırını etkileşimli detay açma aksiyonuna dönüştürme
- Müşteri kimliği, durum, iletişim, sektör ve not alanlarını gösteren detay drawer'ı
- Owner/admin/proje yöneticisi için tüm müşteri alanlarını düzenleme formu
- `useClients` veri katmanında gerçek Supabase update işlemi
- Güncelleme sonrasında liste, drawer, metrik ve filtreleri eşzamanlı yenileme
- Member rolünde salt okunur detay paneli ve yetki açıklaması
- Fiziksel silme yerine onay isteyen `Pasife al` akışı
- Pasif müşteriyi düzenleyerek yeniden aktifleştirme desteği
- Demo ortamında müşteri update fallback'i
- Form değerlerini merkezi biçimde trim/lowercase yapan `normalizeClientForm`
- Türkçe locale'in `INFO@...` adresini hatalı `ınfo@...` değerine dönüştürmesini engelleyen dil bağımsız e-posta normalizasyonu
- Aynı e-posta düzeltmesinin ekip daveti doğrulama ve gönderme akışına uygulanması
- Form normalizasyonu ve Türkçe locale e-posta regresyonu için 2 yeni otomatik test

Doğrulama:

- Owner hesabından ilk gerçek aktif müşteri tarayıcıda oluşturuldu.
- Sayfa yenileme sonrasında müşteri kaydının korunduğu kullanıcı tarafından doğrulandı.
- Uzak veritabanı sorgusu `real_client_count: 1`, `active_clients: 1` döndürdü.
- Müşteri update RLS matrisi yeniden `result: passed` döndürdü.
- Owner/admin/proje yöneticisi update izni ve member write reddi doğrulandı.
- `npm test` — 32/32 test başarılı
- `npm run build` — uyarısız başarılı

Kullanıcı doğrulaması:

- Gerçek müşteri detay/düzenleme ve sayfa yenileme kalıcılığı kullanıcı tarafından çalışır olarak doğrulandı.

### 19 Temmuz 2026 — `0.10.0-client-foundation`

Eklenenler:

- Organizasyona bağlı `clients` tablosu ve `client_status` enum'u
- Firma adı, yetkili, e-posta, telefon, sektör, durum ve not constraint'leri
- Organizasyon içinde büyük/küçük harf duyarsız benzersiz müşteri adı
- Müşteri normalizasyon, kimlik koruma ve `updated_at` trigger'ları
- Tüm aktif üyeler için müşteri okuma RLS policy'si
- Owner/admin/proje yöneticisi için müşteri insert/update RLS policy'leri
- Member rolü için veritabanı ve arayüz seviyesinde salt okunur davranış
- Sidebar `Müşteriler` bağlantısı ve lazy-loaded `/musteriler` rotası
- Responsive müşteri listesi, metrik kartları, arama ve durum filtresi
- Loading, hata, yeniden deneme, gerçek boş ve filtre boş durumları
- Gerçek Supabase insert işlemi yapan müşteri oluşturma modalı
- Supabase bağlantısı olmayan ortamda demo müşteri verisi ve oluşturma fallback'i
- Müşteri doğrulama, rol, eşleme, filtre, metrik ve hata yardımcıları
- Müşteri domain kuralları için 7 yeni otomatik test
- RLS smoke testine member/admin/project manager/owner müşteri erişim matrisi
- RLS smoke testine çapraz organizasyon müşteri izolasyonu

Doğrulama:

- `20260719040000_create_clients.sql` uzak Supabase veritabanına uygulandı.
- Yerel ve uzak migration geçmişleri `20260719040000` sürümünde eşleşti.
- Uzak şema linter'ı hata bulmadı.
- RLS smoke testi `result: passed` döndürdü.
- `member_client_read_allowed` ve `member_client_write_denied` kontrolleri geçti.
- Owner, admin ve proje yöneticisi müşteri yazma kontrolleri geçti.
- `cross_organization_clients_hidden` kontrolü geçti.
- Rollback sonrasında probe müşteri, davet ve organizasyon sayıları `0` olarak doğrulandı.
- `npm test` — 30/30 test başarılı
- `npm run build` — uyarısız başarılı

Kullanıcı doğrulaması:

- Owner hesabından ilk gerçek müşteri oluşturuldu ve sayfa yenileme kalıcılığı doğrulandı.
- Member müşteri okuma/write reddi uzak RLS testinde doğrulandı; tarayıcı görünümü ayrıca kontrol edilebilir.

### 19 Temmuz 2026 — `0.9.1-rls-hardening`

Eklenenler ve iyileştirmeler:

- Uzak Supabase veritabanında çalışabilen, bütün deneme değişikliklerini rollback eden `supabase/tests/rls_smoke.sql`
- Gerçek owner/member kimliklerinden JWT claim bağlamı oluşturan yetki testi
- Member'ın kendi organizasyonunu okuyabilmesi fakat üye güncelleme ve davet oluşturma işlemlerinin reddedilmesi
- Member ve admin için geçici ikinci organizasyonun organizasyon/üyelik/davet kayıtlarını gizleme kontrolü
- Admin'in normal üyeyi güncelleyebilmesi ve owner üyeliğini değiştirememesi kontrolü
- Admin ve owner'ın davet üzerinden `owner` rolü atayamaması kontrolü
- Davet insert/update RLS policy'lerinde `owner` rolünü veritabanı seviyesinde engelleyen hardening migration'ı
- Admin arayüzünde owner üyeliği için düzenleme aksiyonunu gizleyen frontend-policy uyumu
- Aktör rolü ile hedef üyeyi değerlendiren `canManageTeamMember` domain yardımcısı ve otomatik testi

Doğrulama:

- İkinci kullanıcı davette belirlediği şifreyle çıkış sonrasında yeniden giriş yaptı; üyelik ve aktif organizasyon kalıcı kaldı.
- İlk RLS koşusu member update işlemini `42501` ile reddederek veritabanı korumasını doğruladı.
- Tam RLS smoke testi `result: passed` döndürdü.
- `member_read_own_organization`, `member_write_denied` ve `member_invitation_denied` kontrolleri geçti.
- `admin_write_allowed`, `owner_membership_protected_from_admin` ve owner atama engelleri geçti.
- `cross_organization_reads_hidden` kontrolü geçti.
- Rollback sonrasında probe organizasyon ve davet sayıları ayrı sorguyla `0` olarak doğrulandı.
- `20260719030000_harden_invitation_permissions.sql` uzak veritabanına uygulandı.
- Yerel ve uzak migration geçmişleri `20260719030000` sürümünde eşleşti.
- Uzak şema linter'ı hata bulmadı.
- `npm test` — 23/23 test başarılı
- `npm run build` — uyarısız başarılı

Güvenlik danışmanı notları:

- Davet önizleme ve kabul RPC'lerinin `SECURITY DEFINER` uyarıları bilinçlidir; davet edilen kullanıcı henüz organizasyon üyesi olmadığı için RLS'yi kontrollü geçmeleri gerekir. Her iki fonksiyon `auth.uid()`, doğrulanmış Auth e-postası ve davet e-postası eşleşmesini zorunlu tutar.
- Supabase Free planda sızdırılmış parola koruması bulunmadığı için `auth_leaked_password_protection` uyarısı açıktır. Pro plana geçildiğinde Auth Password Security ayarından etkinleştirilmelidir.

### 19 Temmuz 2026 — `0.9.0-team-invitations`

Eklenenler:

- Yalnızca owner/admin tarafından çağrılabilen `invite-member` Supabase Edge Function
- Service/secret key'i tarayıcıya çıkarmadan Auth Admin daveti gönderen server-side katman
- Daha önce kayıtlı kullanıcı için magic link ile güvenli davet geri dönüşü
- Origin izin kontrolü, JWT zorunluluğu, sunucu doğrulaması ve güvenli hata yanıtları
- Davet alanlarını tutan `full_name` şema alanı ve bütünlük kısıtı
- Oturum e-postasıyla davet e-postasını karşılaştıran güvenli davet önizleme RPC'si
- Daveti tek işlemde aktif organizasyon üyeliğine dönüştüren acceptance RPC'si
- Owner rolünün davetle atanmasını ve hatalı/expired/kullanılmış davetleri engelleyen kontroller
- `/davet-kabul` arayüzü, davet özeti ve yeni kullanıcı için ilk şifre formu
- Bekleyen davetleri ekip listesi, filtre ve metriklerde gösterme
- Gerçek davet gönderme loading/hata/başarı durumları
- Bekleyen davet ayrıntısı ve owner/admin davet iptal akışı
- Davet callback sorgusunu giriş yönlendirmesinde koruyan rota iyileştirmesi
- Davet görünüm modeli için 1 yeni otomatik test

Uzak ortam doğrulaması:

- `20260719013000_create_secure_team_invitations.sql` migration'ı uzak Supabase veritabanına uygulandı.
- Yerel ve uzak migration geçmişleri `20260719013000` sürümünde eşleşti.
- Uzak şema linter'ı hata bulmadı.
- `invite-member` Edge Function sürüm 1 olarak ACTIVE duruma geçti.
- Edge Function JWT doğrulaması açık (`verify_jwt: true`).
- Yetkisiz HTTP çağrısı `401 UNAUTHORIZED_NO_AUTH_HEADER` ile reddedildi.
- `npm test` — 22/22 test başarılı
- `npm run build` — uyarısız başarılı
- Yerel uygulama `http://127.0.0.1:5173/` adresinde erişilebilir.
- İkinci gerçek e-posta hesabı davet mesajını aldı ve güvenli bağlantı üzerinden giriş yaptı.
- Davet kabulünden sonra bekleyen davet sayısı `1 → 0`, toplam/aktif üye sayısı `1 → 2` oldu.
- İkinci hesap ekip listesinde `Ekip Üyesi`, `Yazılım`, `Aktif` değerleriyle görüntülendi.
- İkinci hesabın sidebar organizasyon rolü `Ekip Üyesi` olarak yüklendi.
- Ekip üyesi davet butonu member hesabında devre dışı kalarak frontend yetki sınırını doğruladı.

Bilinen sınırlamalar / sıradaki doğrulama:

- Supabase Auth izin listesinde `http://127.0.0.1:5173/davet-kabul` adresi bulunmalıdır.
- Canlıya geçerken özel SMTP, production Site URL/redirect URL ve `MANAGEFLOW_APP_URL` secret'ı zorunludur.
- Daveti yeniden gönderme butonu henüz yoktur; iptalden sonra yeni davet oluşturulabilir.
- İkinci kullanıcıyla davet teslimi/kabulü doğrulandı; şifreyle yeniden giriş ve RLS matrisi `0.9.1` paketinde ayrıca doğrulandı.

### 19 Temmuz 2026 — `0.8.0-real-team`

Eklenenler:

- Aktif organizasyon üyeliklerini Supabase'ten okuyan `useTeamMembers` veri katmanı
- Üyelik ve profil sorgularını birleştiren gerçek ekip görünüm modeli
- Auth e-postasını profile güvenli biçimde senkronlayan ikinci veritabanı migration'ı
- E-postanın istemci tarafından değiştirilmesini engelleyen kolon bazlı update yetkisi
- Gerçek ekip loading, boş, hata ve yeniden deneme durumları
- Owner/admin rollerine bağlı ekip düzenleme kontrolü
- Rol, durum, departman ve unvan için gerçek Supabase update işlemi
- Profil adı/e-postası ile organizasyon üyeliği alanlarının güvenli biçimde ayrılması
- Gerçek davet akışı hazır olana kadar davet butonunda `Yakında` durumu
- Veritabanı rolü ve ekip görünüm modeli için 3 yeni otomatik test
- Departmanı belirtilmeyen üyelerin departman metriğine eklenmemesi

Doğrulama:

- Profil e-posta migration'ı uzak Supabase veritabanına uygulandı.
- Yerel ve uzak migration geçmişleri `20260718225500` sürümünde eşleşti.
- Uzak şema linter'ı hata bulmadı.
- Demo ekip yerine aktif organizasyonun tek gerçek owner üyesi görüntülendi.
- Gerçek ad, e-posta, owner rolü ve aktif durumu RLS altında okundu.
- Owner rolü/durumu korunurken departman ve unvan Supabase'e kaydedildi.
- Sayfa yenileme sonrasında güncellenen üyelik değerlerinin kalıcı olduğu doğrulandı.
- `npm test` — 21/21 test başarılı
- `npm run build` — uyarısız başarılı

Bilinen sınırlamalar:

- Davet butonu gerçek e-posta ve kabul akışı tamamlanana kadar devre dışıdır.
- Son aktiflik bilgisi için ayrı presence/activity altyapısı henüz yoktur.
- İkinci kullanıcıyla admin/member yetki matrisi ve çapraz organizasyon RLS izolasyonu henüz test edilmedi.

### 19 Temmuz 2026 — `0.7.0-organization-onboarding`

Eklenenler:

- Merkezi organization provider ve aktif çalışma alanı durumu
- Organizasyonu olmayan kullanıcılar için `/kurulum` rota koruması
- Ajans adı ve düzenlenebilir slug içeren onboarding formu
- Türkçe ajans adlarından URL güvenli slug üretimi
- Form, unique slug ve veritabanı hata durumları
- Gerçek Supabase organizasyon oluşturma işlemi
- Otomatik owner üyeliğini uygulamaya okutan üyelik sorgusu
- Aktif organizasyonu localStorage içinde hatırlama
- Sidebar'da gerçek organizasyon adı ve Türkçe rol etiketi
- Organizasyon yardımcıları için 4 yeni otomatik test
- Ekip ve onboarding sayfaları için lazy loading/code splitting

Doğrulama:

- Auth kayıt, e-posta doğrulama, çıkış ve yeniden giriş gerçek hesapla tamamlandı.
- `profiles` trigger'ının gerçek kullanıcı için 1 profil oluşturduğu doğrulandı.
- Organizasyonu olmayan gerçek kullanıcı `/kurulum` rotasına yönlendirildi.
- Onboarding sonrasında Dashboard'a dönüldü ve gerçek organizasyon sidebar'da `Sahip` rolüyle gösterildi.
- Sayfa yenileme sonrasında oturum ve aktif organizasyon korunarak Dashboard rotasında kalındı.
- Uzak veritabanında 1 organizasyon ve 1 organization membership bulunduğu doğrulandı.
- `npm test` — 18/18 test başarılı
- `npm run build` — code-splitting sonrasında uyarısız başarılı

Bilinen sınırlamalar:

- Çalışma alanı seçici henüz birden fazla organizasyon arasında geçiş yapmıyor.
- Ekip ekranı hâlâ demo üyeleri gösteriyor.
- Gerçek davet e-postası ve üyelik kabul akışı henüz yok.
- Organizasyonlar arası RLS izolasyonu ikinci test hesabıyla henüz doğrulanmadı.

### 19 Temmuz 2026 — `0.6.0-auth-foundation`

Eklenenler:

- Supabase session lifecycle'ını yöneten merkezi Auth provider
- Gerçek kayıt, giriş, çıkış ve şifre sıfırlama API işlemleri
- E-posta doğrulama ve yeni şifre callback ekranları
- `/giris`, `/kayit`, `/sifremi-unuttum`, `/eposta-dogrula` ve `/sifre-yenile` rotaları
- Oturumsuz erişimi `/giris` rotasına gönderen protected route katmanı
- Oturum açıkken genel Auth ekranlarını engelleyen public-only route katmanı
- Masaüstü ve mobil için özgün ManageFlow Auth arayüzü
- Şifre görünürlüğü, form doğrulaması, loading, başarı ve güvenli hata durumları
- Gerçek kullanıcı adı/e-postasıyla Dashboard ve sidebar kimliği
- Sidebar çıkış kontrolü
- Auth yardımcıları için 4 yeni otomatik test

Doğrulama:

- Oturumsuz `/dashboard` isteği `/giris` rotasına yönlendirildi.
- Uzak Supabase Auth API bağlantısı ve `invalid_credentials` hata davranışı doğrulandı.
- 1998 × 1246 masaüstü giriş ekranı görsel kontrolü
- 430 × 900 mobil kayıt ekranı görsel kontrolü
- `npm test` — 14/14 test başarılı
- `npm run build` — başarılı

Bilinen sınırlamalar:

- Supabase Auth URL izin listesi henüz yerel callback yollarıyla yapılandırılmadı.
- Gerçek e-posta doğrulama ve şifre yenileme bağlantısı henüz test hesabıyla doğrulanmadı.
- İlk giriş sonrası organizasyon onboarding akışı henüz yok.

### 19 Temmuz 2026 — `0.5.1-supabase-connected`

Tamamlananlar:

- Yerel uygulama `manageflow` Supabase projesine bağlandı.
- Proje URL'si ve publishable key yalnızca Git tarafından yok sayılan `.env.local` içinde tanımlandı.
- Supabase CLI cihaz doğrulamasıyla güvenli biçimde yetkilendirildi.
- Yerel migration geçmişi uzak proje ile eşleştirildi.
- Profil, organizasyon, üyelik ve davet şeması uzak PostgreSQL veritabanına uygulandı.
- RLS politikaları, rol kontrolleri, otomatik profil/owner trigger'ları ve son owner koruması etkinleştirildi.
- CLI'nin makineye özel `supabase/.temp/` çıktısı Git kapsamı dışında bırakıldı.

Doğrulama:

- Yerel ve uzak migration sürümleri: `20260718220000`
- Anonim profil tablo isteği yetki verilmediği için `401` ile engellendi; tablo artık Data API tarafından bulunuyor.
- `npm test` — 10/10 test başarılı
- `npm run build` — başarılı
- Publishable key dışında herhangi bir Supabase sırrı repository'ye eklenmedi.

Bilinen sınırlamalar:

- Auth arayüzü ve gerçek kullanıcı oturumu henüz bulunmuyor.
- Authenticated RLS akışları gerçek test kullanıcısıyla henüz uçtan uca doğrulanmadı.
- Ekip ekranı hâlâ demo state kullanıyor.

### 19 Temmuz 2026 — `0.5.0-supabase-foundation`

Eklenenler:

- Supabase JavaScript istemcisi
- Güvenli `VITE_SUPABASE_URL` ve publishable key yapılandırması
- Bağlantı bilgileri yokken mevcut demo arayüzünü koruyan fallback davranışı
- `.env.example` ve Supabase bağlantı rehberi
- Profil, organizasyon, organizasyon üyeliği ve davet tabloları için migration
- Owner, admin, proje yöneticisi ve ekip üyesi rolleri
- Aktif, davet bekleyen ve devre dışı üyelik durumları
- Organizasyon bazlı RLS yardımcıları ve politikaları
- Son aktif sahibin silinmesini/devre dışı bırakılmasını engelleyen veritabanı koruması
- Organizasyon kurucusu ve davet e-postası bütünlük korumaları
- Supabase yapılandırması için 3 otomatik test

Doğrulama:

- `npm test` — 10/10 test başarılı
- `npm run build`
- Hassas `service_role` anahtarının frontend'e eklenmediği kontrol edildi.
- Demo modunda mevcut arayüzün build çıktısı korundu.

Bilinen sınırlamalar:

- Supabase uzak projesi henüz oluşturulmadı veya bağlanmadı.
- Migration henüz gerçek PostgreSQL veritabanında uygulanıp test edilmedi.
- Auth ekranı ve kullanıcı oturumu henüz bulunmuyor.
- Ekip ekranı henüz Supabase sorgularını kullanmıyor.

### 19 Temmuz 2026 — `0.4.3-avatar-fix`

Düzeltilenler:

- Sidebar altındaki profil avatarının yatay olarak esneyip oval görünmesi düzeltildi.
- Profil metni ve avatar için CSS seçicileri ayrıştırıldı.
- Daraltılmış ve mobil sidebar davranışı korundu.

Doğrulama:

- `npm test` — 7/7 test başarılı
- `npm run build`
- 1200 × 850 sidebar ve dashboard görsel kontrolü

### 19 Temmuz 2026 — `0.4.2-availability`

Eklenenler:

- Kullanıma hazır olmayan sidebar modüllerinde `Yakında` rozetleri
- Placeholder sayfalarda belirgin geliştirme durumu
- Global arama, duyurular ve projeler kısayolunda kullanılabilirlik açıklamaları
- Dashboard proje detayları için `Yakında` işareti
- Organizasyon değiştirme durumu için açıklama

Değiştirilenler:

- İşlem yapmayan placeholder CTA'ları devre dışı bırakıldı.
- Bildirimlerin demo içerik olduğu açıkça belirtildi.
- Dashboard ve Ekipler aktif modül olarak rozetsiz bırakıldı.

Doğrulama:

- `npm test` — 7/7 test başarılı
- `npm run build`
- 1440 × 1000 dashboard görsel kontrolü
- 1200 × 850 placeholder modül görsel kontrolü

### 19 Temmuz 2026 — `0.4.1-team-quality`

Eklenenler:

- Vitest test altyapısı ve `npm test` komutu
- Ekip arama, filtre, metrik, davet doğrulama ve sahip koruması için 7 otomatik test
- Davet formu e-posta, ad soyad, unvan ve tekrar eden üye doğrulaması
- Üyeyi devre dışı bırakmadan önce onay akışı
- Çalışma alanı sahibinin rol ve erişimini koruyan kurallar
- Ekip işlemleri için başarı toast mesajları
- Modal/drawer için Escape ile kapatma ve arka plan kaydırma kilidi
- Tema tercihinin tarayıcıda saklanması

Doğrulama:

- `npm test` — 7/7 test başarılı
- `npm run build`
- 500 × 900 mobil ekip ekranı görsel kontrolü
- Koyu tema değişkenleri ve kalıcı tema davranışı kontrolü

Bilinen sınırlamalar:

- UI ve uçtan uca tarayıcı testleri henüz bulunmuyor.
- Ekip verileri sayfa yenilemesinde sıfırlanır.
- Gerçek davet e-postası ve yetki kontrolü backend aşamasını bekliyor.

### 19 Temmuz 2026 — `0.4.0-team`

Eklenenler:

- Ajans odaklı Ekipler sayfası
- Ekip özet metrikleri
- İsim/e-posta/unvan araması
- Rol, departman ve durum filtreleri
- Üye detay drawer'ı
- Üye bilgisi, rolü, departmanı ve durumunu düzenleme akışı
- Yeni üye davet formu ve bekleyen davet durumu
- Filtre sonucu boş ekranı

Doğrulama:

- `npm run build`
- `/ekipler` doğrudan erişim kontrolü
- 1440 × 1000 masaüstü görsel kontrolü

Bilinen sınırlamalar:

- Ekip verileri demo state'te ve geçicidir.
- Davet e-postası gönderilmez.
- Backend, Auth ve organizasyon üyeliği henüz bağlı değildir.

### 19 Temmuz 2026 — `0.3.0-architecture`

Eklenenler:

- React Router tabanlı gerçek URL yönlendirmesi
- Ortak uygulama layout'u
- Dashboard ve bütün menü modülleri için adreslenebilir rotalar
- Bilinmeyen adresler için 404 ekranı
- Arama overlay'i için Escape klavye davranışı

Değiştirilenler:

- Tek dosyalı prototip; layout, overlay, marka, veri ve sayfa bileşenlerine ayrıldı.
- Sidebar butonları gerçek ve yenilenebilir bağlantılara dönüştürüldü.
- Projeler üst menü kısayolu gerçek rotaya bağlandı.

Doğrulama:

- `npm run build`
- `/dashboard`, `/ekipler` ve bilinmeyen URL için doğrudan erişim kontrolü
- 1440 × 1000 masaüstü görsel regresyon kontrolü

Bilinen sınırlamalar:

- Ekipler rotası henüz placeholder ekran gösteriyor.
- Backend ve kalıcı veri bulunmuyor.

### 18 Temmuz 2026 — `0.2.0-brand`

Eklenenler:

- `M` harfi ile ileri akış okunu birleştiren özgün ManageFlow logo sembolü
- Sidebar için ManageFlow wordmark
- SVG favicon ve paylaşım logosu
- `#5B5CE2` kontrollü marka vurgu rengi
- Açık/koyu temayla uyumlu marka tokenları

Değiştirilenler:

- Uygulama adı ve metadata ManageFlow olarak güncellendi.
- Paket adı `manageflow` olarak değiştirildi.
- AI menü adı Flow AI olarak güncellendi.
- Demo kullanıcı e-posta alan adı ManageFlow olarak değiştirildi.
- Aktif navigasyon, grafik, ilerleme ve focus durumları marka rengine bağlandı.

Doğrulama:

- `npm install`
- `npm run build`
- 1440 × 1000 masaüstü tarayıcı görsel kontrolü

Bilinen sınırlamalar:

- Ekip sayfası henüz placeholder durumunda.
- Backend ve veritabanı bağlantısı bulunmuyor.

### 18 Temmuz 2026 — `0.1.1-product-plan`

Değiştirilenler:

- Ürün adı ManageFlow olarak kesinleştirildi.
- İlk hedef kitle ajanslar olarak belirlendi.
- Geliştirmenin ekip ve organizasyon temelinden başlamasına karar verildi.
- İlk iş akışı `Müşteri → Proje → Görev` olarak kesinleştirildi.
- Minimal monokrom marka yönü kabul edildi.
- Fazlar ekip modülü önce gelecek şekilde yeniden sıralandı.
- Bir sonraki geliştirme paketinin kabul kriterleri tanımlandı.

Bilinen sınırlamalar:

- Marka değişiklikleri henüz uygulama koduna uygulanmadı.
- ManageFlow logosu henüz tasarlanmadı.
- Ekip sayfası henüz placeholder durumunda.
- Backend ve veritabanı bağlantısı bulunmuyor.

### 18 Temmuz 2026 — `0.1.0-prototype`

Eklenenler:

- React/Vite başlangıç projesi
- Managelify benzeri özgün dashboard arayüzü
- Responsive masaüstü ve mobil tasarım
- Daraltılabilir sidebar
- Açık/koyu tema
- KPI kartları
- Haftalık ilerleme grafiği
- Proje durum donut grafiği
- Aktif proje listesi
- Hızlı proje/görev oluşturma modalı
- Bugünkü gündem drawer'ı
- Bildirim popover'ı
- Global arama görünümü
- Placeholder modül sayfaları
- Production build doğrulaması
- Yaşayan geliştirme belgesi

Bilinen sınırlamalar:

- Backend ve veritabanı yok.
- Kimlik doğrulama yok.
- Tüm iş verileri demo ve geçici.
- Dashboard dışındaki modüller henüz uygulanmadı.

---

## 16. Bu belge nasıl güncellenecek?

Her geliştirme tamamlandığında en az şu alanlar kontrol edilmelidir:

1. **Belge bilgileri:** Son güncelleme tarihi ve sürüm.
2. **Mevcut durum:** Yeni özellik artık gerçekten çalışıyorsa açıklaması.
3. **Teknik durum tablosu:** İlgili katmanın durumu.
4. **Faz checklist'i:** Tamamlanan işaretlenmeli.
5. **Bilinen eksikler:** Çözülen madde çıkarılmalı, yeni borç eklenmeli.
6. **Değişiklik günlüğü:** Tarih ve sürüm altında yapılan işler yazılmalı.
7. **Dosya/mimari:** Dosya yapısı değiştiyse güncellenmeli.
8. **Veri modeli:** Migration veya tablo değiştiyse belgeye yansıtılmalı.

Durum ifadeleri tutarlı kullanılmalıdır:

- **Başlanmadı:** Henüz uygulama kodu yok.
- **Planlandı:** Kapsamı belli fakat geliştirme başlamadı.
- **Devam ediyor:** Aktif geliştirme var, tamamlanmadı.
- **Kısmen hazır:** Kullanılabiliyor fakat önemli parçaları eksik.
- **Hazır:** İstenen kapsam uygulanmış ve doğrulanmış.
- **Bloke:** İlerlemek için dış karar veya erişim gerekiyor.

Yeni changelog formatı:

```markdown
### GG Ay YYYY — `sürüm`

Eklenenler:

- ...

Değiştirilenler:

- ...

Düzeltilenler:

- ...

Doğrulama:

- `npm run build`
- İlgili test komutları

Bilinen sınırlamalar:

- ...
```

Bu belgedeki bir özelliğin yazılmış olması, özelliğin uygulamada bulunduğu anlamına gelmez. Gerçek durum her zaman “Mevcut durum”, faz checklist'leri ve değişiklik günlüğü üzerinden anlaşılmalıdır.
