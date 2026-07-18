# ManageFlow — Geliştirme ve Ürün Yol Haritası

> Bu belge projenin yaşayan teknik ve ürün kaydıdır. Uygulamada yapılan her anlamlı değişiklikte bu dosya da aynı geliştirme kapsamında güncellenmelidir.

## Belge bilgileri

| Alan | Değer |
|---|---|
| Proje adı | ManageFlow |
| Belge türü | Yaşayan geliştirme dokümanı |
| İlk oluşturulma | 18 Temmuz 2026 |
| Son güncelleme | 19 Temmuz 2026 |
| Mevcut sürüm | `0.6.0-auth-foundation` |
| Mevcut aşama | Supabase Auth arayüzü, oturum yönetimi ve korumalı rotalar hazır |
| Sonraki ana hedef | Gerçek e-posta akışını doğrulama ve organizasyon onboarding |

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
- Dashboard demo verilerle görüntülenmektedir.
- Bazı arayüz etkileşimleri gerçekten çalışmaktadır.
- Supabase istemcisi uzak projeye bağlıdır; mevcut ekranlar henüz demo verileri kullanmaktadır.
- Sayfa yenilendiğinde kullanıcı tarafından eklenen demo veriler sıfırlanır.
- Supabase Auth kayıt, giriş, çıkış, doğrulama ve şifre yenileme arayüzleri bulunmaktadır.
- Uygulama rotaları oturumsuz erişime karşı korunmaktadır; gerçek e-posta akışı henüz test hesabıyla doğrulanmamıştır.
- Mevcut ekran ürün tasarımını ve etkileşim yönünü doğrulamak için hazırlanmıştır.
- Kullanıma hazır olmayan bütün ana modüller arayüzde `Yakında` olarak işaretlenmektedir.

### Modül kullanılabilirliği

| Modül | Durum |
|---|---|
| Kimlik doğrulama | Supabase ile bağlı; canlı e-posta testi bekliyor |
| Dashboard | Demo verilerle kullanılabilir |
| Ekipler | Demo CRUD akışlarıyla kullanılabilir |
| Hızlı proje/görev oluşturma | Demo state ile kullanılabilir |
| Gündem ve bildirimler | Demo içerikle önizlenebilir |
| Projeler, Görevler ve Çalışma Alanı | Yakında |
| Dosyalar ve Zaman Takibi | Yakında |
| Flow AI | Yakında |
| Kanallar, Gelen Kutusu ve Takvim | Yakında |
| Özelleştirme ve organizasyon değiştirme | Yakında |

### Mevcut teknik seviye

| Katman | Durum | Açıklama |
|---|---|---|
| UI tasarımı | Hazır | Dashboard ve ortak tasarım dili oluşturuldu |
| Responsive yapı | Hazır | Masaüstü, tablet ve mobil kırılımlar bulunuyor |
| Frontend etkileşimleri | Kısmen hazır | Modal, drawer, tema, menü ve demo ekleme işlemleri çalışıyor |
| Routing | Hazır | BrowserRouter, gerçek modül URL'leri ve 404 sayfası bulunuyor |
| Backend | Kısmen hazır | Supabase istemci katmanı ve uzak proje bağlantısı hazır; ekran sorguları henüz bağlanmadı |
| Veritabanı | Kısmen hazır | Profil, organizasyon, üyelik ve davet şeması RLS ile uzak veritabanına uygulandı |
| Kimlik doğrulama | Kısmen hazır | Kayıt, giriş, çıkış, doğrulama, şifre yenileme ve kalıcı oturum kodu hazır |
| Yetkilendirme | Kısmen hazır | RLS, rol temeli ve korumalı frontend rotaları var; organizasyon context'i henüz yok |
| Dosya depolama | Başlanmadı | Gerçek dosya yükleme yok |
| Gerçek zamanlı işlemler | Başlanmadı | Mesaj ve canlı bildirim altyapısı yok |
| Test altyapısı | Kısmen hazır | Vitest ve ekip domain testleri bulunuyor; UI/E2E testleri henüz yok |
| Deployment | Başlanmadı | Production ortamı ve domain bağlantısı yok |

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

Mevcut demo kartları:

- Toplam proje
- Görevler
- Mesajlar
- Ekip ve müşteri

Görev kartında ilerleme çubuğu bulunmaktadır. Değerler şu anda demo state üzerinden hesaplanmaktadır.

### 4.5 Haftalık ilerleme

- Haftanın yedi günü için demo grafik
- Görev ve tamamlanan görev göstergeleri
- Responsive grafik alanı
- Proje durumları için donut grafik
- Devam ediyor, incelemede ve planlandı ayrımı

Grafikler şu anda gerçek analitik veriye bağlı değildir.

### 4.6 Aktif projeler

Her proje satırında:

- Proje adı
- Müşteri adı
- Proje durumu
- İlerleme oranı
- Proje ikonu
- Ek işlem ikonu

bulunmaktadır.

### 4.7 Hızlı oluşturma

- Proje veya görev seçilebilir.
- İsim girilebilir.
- Demo müşteri/proje seçilebilir.
- Yeni proje oluşturulunca proje listesine eklenir.
- Yeni görev oluşturulunca görev sayısı artar.

Bu değişiklikler yalnızca React belleğinde tutulur ve sayfa yenilenince kaybolur.

### 4.8 Bugünkü gündem

Sağdan açılan drawer içerisinde:

- Tarih
- Günün odağı
- Tamamlanma sayacı
- Toplantılar
- Görevler
- Saat bilgileri
- Gündeme yeni kayıt ekleme düğmesi

bulunmaktadır. Gündeme ekleme düğmesi henüz gerçek form veya veritabanı işlemi yapmamaktadır.

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

Ekip verileri şu anda demo state'tedir. Davet formu gerçek e-posta göndermez ve sayfa yenilendiğinde yapılan değişiklikler sıfırlanır.

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
- Kullanıcıya gösterilen güvenli Türkçe hata mesajları
- Gerçek kullanıcının ad, e-posta ve avatar baş harflerini sidebar/Dashboard'da gösterme
- Sidebar üzerinden güvenli çıkış
- Supabase bağlantısı olmayan geliştirme ortamında demo arayüzünü koruma

Auth ekranları masaüstü ve mobil yerleşimde görsel olarak doğrulandı. Supabase URL izin listesi ve gerçek e-posta teslimi bir test hesabıyla henüz uçtan uca doğrulanmadı.

---

## 5. Henüz yapılmamış bağlantılar

Aşağıdaki sistemler mevcut prototipin kullanıcı akışlarına henüz bağlı değildir:

- Mevcut ekranların Supabase veritabanı sorguları
- Supabase Auth production Site URL ve yönlendirme adresleri
- Gerçek e-posta doğrulama/şifre yenileme teslim testi
- Google ile giriş
- Organizasyon onboarding ve çalışma alanı değiştirme akışları
- Rol ve izinlerin frontend üzerinde uygulanması
- Kalıcı proje kayıtları
- Kalıcı görev kayıtları
- Müşteri kayıtları
- Dosya yükleme ve depolama
- Gerçek mesajlaşma
- Gerçek bildirimler
- Takvim entegrasyonu
- E-posta gönderimi
- Mana AI
- Ödeme sistemi
- Analitik/telemetri
- Hata izleme
- Production deployment
- Domain

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
- [ ] Organizasyon seçici ve çalışma alanı bilgilerini düzenle
- [ ] Ekip modülünün mobil, boş, yükleniyor ve hata durumlarını tasarla

### Faz 2 — gerçek SaaS altyapısı

Durum: **Devam ediyor**

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
- [ ] Supabase Auth yönlendirme adreslerini yapılandır ve gerçek e-posta akışını test et
- [x] Organizasyon ve organizasyon üyelik tablolarını kur
- [x] Rol ve temel izinlerin veritabanı katmanını kur
- [ ] Ekip ekranını gerçek veritabanına bağla
- [ ] Profil ve organizasyon ayarlarını oluştur
- [ ] RLS politikalarını yaz ve test et

### Faz 3 — müşteri, proje ve görev çekirdeği

Durum: **Planlandı**

- [ ] Müşteri CRUD
- [ ] Proje CRUD
- [ ] Proje üyeleri
- [ ] Görev CRUD
- [ ] Görev atamaları
- [ ] Alt görevler ve checklist
- [ ] Görev yorumları
- [ ] Aktivite geçmişi
- [ ] Dashboard'u gerçek verilere bağla
- [ ] Liste ve Kanban görünümü
- [ ] Arama, filtreleme ve sıralama

### Faz 4 — dosya, bildirim ve zaman

Durum: **Planlandı**

- [ ] Gelişmiş ekip davetleri
- [ ] Gelişmiş rol/izin yönetim ekranı
- [ ] Dosya yükleme ve klasörler
- [ ] Gerçek uygulama içi bildirimler
- [ ] E-posta bildirimleri
- [ ] Zaman takip sayacı
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

Durum: **Planlandı**

- [ ] Production Vercel projesi
- [ ] Domain ve DNS
- [ ] Production Supabase ortamı
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
- Veriler sabit/demo içeriklerden oluşuyor.
- Auth sağlayıcısı, korumalı rota ve organizasyon context'i henüz yok.
- Formlar gelişmiş doğrulama yapmıyor.
- Hızlı görev oluşturma yalnızca sayacı artırıyor.
- Arama gerçek sonuç üretmiyor.
- Bildirimler demo.
- Gündem demo.
- Grafikler gerçek veri kullanmıyor.
- Proje satırı detay sayfasına gitmiyor.
- Placeholder modüller işlevsel değil.
- Domain/config testleri var; UI entegrasyon ve E2E testleri henüz yok.
- ESLint/Prettier yapılandırması bulunmuyor.
- CI/CD bulunmuyor.
- Offline/PWA desteği bulunmuyor.

---

## 14. Bir sonraki geliştirme paketi

Önerilen bir sonraki çalışma sırası:

1. Supabase Auth yerel yönlendirme adreslerini izin listesine ekle.
2. Gerçek test hesabıyla kayıt, doğrulama, giriş, çıkış ve şifre yenilemeyi doğrula.
3. İlk kayıt sonrasında organizasyon oluşturma onboarding akışını bağla.
4. Aktif organizasyon context'i ve çalışma alanı seçicisini oluştur.
5. Auth ve organizasyon akışlarını RLS ile gerçek kullanıcı üzerinden test et.
6. Ekip ekranını Supabase verilerine bağla.

Sıradaki ManageFlow geliştirme paketinin başarı ölçütü:

```text
Kullanıcı güvenli biçimde kayıt olabilir ve giriş yapabilir
→ E-postasını doğrulayabilir
→ Oturumu yenileme sonrasında korunur
→ Yetkisiz kullanıcı uygulama ekranlarına erişemez
→ İlk organizasyonunu oluşturabilir
→ RLS başka organizasyonun verisine erişimi engeller
```

---

## 15. Değişiklik günlüğü

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
