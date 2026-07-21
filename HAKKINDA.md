# ManageFlow — Proje Devir, Bağlam ve Devam Rehberi

> Bu belge, ManageFlow projesini ilk kez gören bir geliştiricinin veya yapay zekâ aracının ürün fikrini, alınan kararları, mevcut teknik yapıyı, güvenlik sınırlarını ve sıradaki işleri tek okumada anlayabilmesi için hazırlanmıştır.

## 1. Projenin kısa tanımı

ManageFlow, öncelikle ajanslar için geliştirilen çok kiracılı bir SaaS çalışma yönetimi platformudur. Ürünün çekirdek akışı şöyledir:

```text
Organizasyon
→ Ekip
→ Müşteri
→ Proje
→ Görev
→ Çalışma notları
→ Zaman takibi
→ Dosyalar, bildirimler, takvim ve raporlama
```

Amaç; ajansların müşteri, proje, görev, ekip, bilgi ve zamanı birbirinden kopuk araçlarda yönetmek yerine aynı bağlamda çalışabilmesidir.

Ürünün mevcut adı **ManageFlow**'dur. Görsel yaklaşımı minimal, monokrom, geniş boşluklu ve kontrollü mor vurgu rengine sahip modern SaaS arayüzüdür.

## 2. Projeyi başlatan ilk istek

Kullanıcının projeyi başlatan ilk mesajı:

> `https://managelify.com/ bu uygulmayı baştan sona incele bu da arayüzü ama sen incele her detayı siteye gir bak en detaylı şekilde`

Bunun hemen ardından gelen uygulama talebi:

> `bunun aynısını yap`

Sonraki konuşmalarda ürünün yalnızca bir arayüz kopyası olarak kalmaması; **ajanslar için gerçek, güvenli, çok kiracılı bir SaaS ürünü** olarak adım adım geliştirilmesi kararlaştırıldı. Marka adı ManageFlow olarak seçildi ve özgün logo/arayüz kimliği oluşturuldu.

Managelify ürün, modül kapsamı ve bilgi mimarisi açısından ilk referanstır. Ancak ManageFlow geliştirilirken başka ürünün marka varlıkları, metinleri veya özel görselleri doğrudan kullanılmamalı; referans alınan fikirler ManageFlow markasına özgü tasarım ve içerikle uygulanmalıdır.

## 3. Kesinleşmiş ürün kararları

- İlk hedef müşteri: ajanslar
- İlk kullanıcı yapısı: owner, admin, proje yöneticisi ve ekip üyesi
- İlk gerçek değer zinciri: müşteri → proje → görev
- Geliştirme yaklaşımı: küçük, test edilebilir ve kullanıcı tarafından doğrulanabilir paketler
- Her ana özellik ayrı Git commit'i olmalı
- Her anlamlı değişiklikte `GELISTIRME.md` güncellenmeli
- Production veritabanı değişiklikleri yalnız migration ile yapılmalı
- UI hazır görünse bile backend bağlantısı olmayan alanlar `Yakında` olarak işaretlenmeli
- Arayüzün mevcut görsel dili korunmalı
- Güvenlik yalnız frontend butonlarıyla değil PostgreSQL RLS ve bütünlük kurallarıyla uygulanmalı
- Kayıtları doğrudan silmek yerine geri alınabilir arşivleme tercih edilmeli
- Kullanıcıdan işlem gerektiğinde açıkça söylenmeli; geri kalan geliştirme otomatik sürdürülmeli

## 4. Mevcut sürüm ve yayın adresleri

Belge oluşturulduğundaki uygulama sürümü:

```text
0.37.0-workspace-lifecycle
```

Adresler:

- Yerel geliştirme: `http://127.0.0.1:5173`
- Birincil production: `https://manageflow.bksoftstudio.com`
- Yedek Vercel adresi: `https://manageflow-seven.vercel.app`
- GitHub: `git@github.com:burak-bksoftstudio/manageflow.git`
- Branch: `main`
- Vercel projesi: `burak-2544s-projects/manageflow`
- Supabase proje ref: `lxmopvovyhkgvkqvphcw`

Not: Bu tanımlayıcılar gizli anahtar değildir. Publishable key yalnız ortam değişkeninde tutulur; secret/service-role anahtarları frontend'e kesinlikle eklenmez.

## 5. Kullanılan teknoloji

### Frontend

- React 19
- Vite
- React Router
- Lucide React ikonları
- Tek merkezi CSS dosyası: `src/styles.css`
- JavaScript/JSX; henüz TypeScript kullanılmıyor
- Vitest

### Backend ve altyapı

- Supabase Auth
- PostgreSQL
- Row Level Security
- Supabase Edge Functions
- Vercel production deployment
- Cloudflare DNS üzerinden özel alt domain
- GitHub ana repository

### Henüz eklenmeyen ama planlanan araçlar

- Supabase Storage
- TanStack Query
- React Hook Form + Zod
- Sentry
- PostHog veya benzeri analitik
- Resend veya production SMTP
- OpenAI API'nin yalnız sunucu tarafı entegrasyonu
- Ödeme sistemi

## 6. Çalışan modüller

### Kimlik doğrulama

- Kayıt
- E-posta doğrulama
- Giriş ve çıkış
- Kalıcı oturum
- Şifremi unuttum
- Güvenli recovery callback'i
- Yeni şifre belirleme
- Korumalı uygulama rotaları

Production özel domain üzerinden şifre sıfırlama gerçek hesapla doğrulanmıştır.

### Organizasyon ve ekip

- İlk organizasyon onboarding'i
- Owner üyeliği
- Aktif organizasyon context'i
- Ekip üyesi listesi
- Rol ve üye bilgilerinin yetkili güncellenmesi
- Owner/admin ekip daveti
- Davet e-postası, görüntüleme ve kabul
- Bekleyen daveti iptal etme
- Owner/admin için normal üyeyi güvenli kaldırma
- Kullanıcı hesabı ve geçmiş iş kayıtlarını koruyan kaldırma davranışı
- Owner koruması
- Member/admin/owner RLS matrisi

### Müşteriler

- Gerçek Supabase listesi
- Müşteri oluşturma
- Detay görüntüleme
- Düzenleme
- Pasife alma
- Arama ve durum filtresi
- Rol bazlı yazma yetkisi

### Projeler

- Zorunlu müşteri bağlantısı
- Oluşturma, görüntüleme ve düzenleme
- Durum ve ilerleme
- Tarih aralığı
- Geri alınabilir arşivleme
- Proje üyesi atama/çıkarma
- Arama ve filtreler

### Görevler

- Zorunlu proje bağlantısı
- Oluşturma ve düzenleme
- Durum, öncelik, sorumlu ve teslim tarihi
- Proje ekibinden atama
- Liste ve Kanban görünümü
- Drag-and-drop durum değişimi
- Checklist
- Yorumlar
- Otomatik aktivite geçmişi
- Üst/alt görev ilişkisi
- Döngü koruması
- Arşivleme
- Organizasyon bazlı kalıcı filtre/sıralama tercihleri

### Dashboard

- Gerçek müşteri, proje, görev ve ekip metrikleri
- Haftalık görev ilerlemesi
- Proje durum dağılımı
- Aktif proje özeti
- Bugünkü görev gündemi

### Profil ve organizasyon ayarları

- Profil adı, telefon ve HTTPS avatar adresi
- Owner/admin için organizasyon adı ve HTTPS logo adresi
- Diğer roller için salt okunur organizasyon bilgisi
- Güvenli görsel fallback'i

### Zaman Takibi v1–v1.3

- Proje zorunlu, görev isteğe bağlı gerçek sayaç
- Sunucu kontrollü başlangıç ve bitiş zamanı
- Kullanıcı başına tek aktif sayaç
- Sayfa yenilemesinde aktif sayacı sürdürme
- Bugünkü toplam, oturum ve proje metrikleri
- Manuel geçmiş süre girişi
- Geleceğe uzanan manuel kayıt engeli
- Haftalık kişisel geçmiş
- Proje/görev filtresi
- Doğrudan tablo insert'i yerine güvenli RPC sınırı
- Tamamlanmış zaman kaydında proje, görev, başlangıç, süre ve not düzeltme
- Düzeltme zamanı ve aktörünün denetlenebilir kaydı
- Fiziksel silme yerine geri alınabilir arşivleme
- Aktif/arşivlenen/tüm kayıt filtreleri
- Sayaç durdurma dahil bütün değişikliklerde doğrudan tablo update'i yerine güvenli RPC sınırı
- Kişisel kayıt izolasyonu
- Owner/admin için haftalık salt okunur ekip raporu
- Ekip üyesi ve proje filtreleriyle ekip zaman metrikleri
- Aktif hafta, üye ve proje filtrelerine uyan UTF-8 CSV dışa aktarma
- CSV formül enjeksiyonuna karşı güvenli hücre kaçışı
- Proje ve müşteri bazlı süre, kayıt ve çalışan kişi dağılımı
- Owner/admin rolünü sunucuda doğrulayan, 31 günlük aralıkla sınırlı güvenli raporlama RPC'si
- Normal üyenin ekip raporuna erişimini reddeden ayrı rollback güvenlik testi

### Çalışma Alanı v1–v1.2

- Organizasyon geneli bağımsız veya projeye bağlı ortak notlar
- Not oluşturma ve tam içerik görüntüleme
- Yazar veya yönetici tarafından düzenleme
- İsteğe bağlı proje bağlamı
- Bağımsız not ve proje filtreleri
- Başlık, içerik, proje ve yazar araması
- Virgülle girilen, normalize edilen ve en fazla 8 adet etiket
- Etiketleri de kapsayan Türkçe uyumlu arama
- Yetkili kullanıcı için not sabitleme ve sabitleri önce gösterme
- Aktif, arşivlenen ve tüm notlar filtresi
- Yazar/yönetici yetkisine bağlı geri alınabilir arşivleme
- Arşivlenen notlarda salt okunur içerik ve doğrulanmış arşiv aktörü
- Organizasyon içi ortak okuma
- Çapraz organizasyon izolasyonu
- Arşivli projede yeni not/değişiklik engeli
- Fiziksel silme kapalı; kayıtlar geri alınabilir arşivle korunur

### Merkezi Arşiv v1–v1.1

- Arşivlenen proje, görev, çalışma alanı notu ve kişisel zaman kayıtlarını tek listede gösterme
- Metin araması ve kayıt türü filtresi
- Proje, görev, çalışma alanı notu ve zaman kaydı metrikleri
- Mevcut rol/RPC yetkileriyle güvenli geri yükleme
- Arşivli üst proje varken alt görev, not veya zaman kaydını geri yüklemeyi engelleme
- Member rolünde proje/görev kayıtlarını salt okunur gösterme

## 7. Henüz çalışmayan veya kısmi alanlar

Sidebar'da `Yakında` görünen alanlar gerçek backend bağlantısına sahip değildir:

- Flow AI
- Dosyalar
- Kanallar
- Gelen Kutusu
- Takvim

Kısmi alanlar:

- Header bildirimleri demo verisi kullanıyor
- Gündem yalnız gerçek görevleri içeriyor; toplantı/takvim bağlı değil
- Organizasyon menüsü ayarlara bağlı; birden fazla organizasyon arasında değiştirme henüz çalışmıyor
- Google ile giriş yok
- Production SMTP yok
- Ekip timesheet PDF dışa aktarma ve ileri bütçe/faturalandırma raporları yok
- Çalışma notlarında arşiv, sabitleme, etiket ve sürüm geçmişi yok
- UI E2E test altyapısı yok

## 8. Uygulama rotaları

### Herkese açık Auth rotaları

```text
/giris
/kayit
/sifremi-unuttum
/eposta-dogrula
/sifre-yenile
```

### Oturum gerektiren özel akışlar

```text
/davet-kabul
/kurulum
```

### Organizasyon gerektiren uygulama rotaları

```text
/dashboard
/ekipler
/musteriler
/projeler
/gorevler
/zaman-takibi
/calisma-alani
/arsiv
/ozellestirme
```

Placeholder rotalar:

```text
/flow-ai
/dosyalar
/kanallar
/gelen-kutusu
/takvim
```

`/` herkese açık SaaS ürün sayfasıdır. Oturum açmış kullanıcı burada `Uygulamayı aç` CTA'sını, oturumu olmayan kullanıcı kayıt CTA'sını görür; uygulamanın ana çalışma ekranı `/dashboard` rotasındadır.

## 9. Önemli klasör ve dosyalar

```text
src/App.jsx                         Rotalar ve ana shell
src/components/                    Header, sidebar, logo ve overlay'ler
src/components/TeamTimesheet.jsx   Owner/admin haftalık ekip zaman raporu
src/pages/                         Sayfa bileşenleri
src/features/                      Domain yardımcıları, hook'lar ve testler
src/features/time-tracking/        Kişisel/ekip zaman veri erişimi ve hesaplamaları
src/lib/supabase.js                Supabase istemcisi
src/lib/supabaseConfig.js          Ortam doğrulaması
src/styles.css                     Ortak tasarım sistemi ve responsive kurallar
src/data/demo.js                   Demo/placeholder verileri
supabase/migrations/               Sıralı production şema değişiklikleri
supabase/tests/                    Rollback kullanan uzak güvenlik testleri
supabase/functions/invite-member/  Güvenli ekip daveti Edge Function'ı
GELISTIRME.md                       Yaşayan ayrıntılı ürün/teknik günlük
HAKKINDA.md                         Bu devir ve devam rehberi
vercel.json                         SPA rewrite, build ve güvenlik başlıkları
```

## 10. Veritabanı modeli

Başlıca tablolar:

```text
profiles
organizations
organization_members
organization_invitations
clients
projects
project_members
tasks
task_checklist_items
task_comments
task_activities
time_entries
project_notes
```

Temel bütünlük ilişkileri:

```text
organization_id her iş kaydının tenant sınırıdır
client organization'a aittir
project aynı organization içindeki client'a aittir
task aynı organization içindeki project'e aittir
project_member aynı organization/project içinde kalır
checklist, comment ve activity task bağlamından çıkamaz
time_entry aynı organization/project/task bağlamında kalır
project_note aynı organization/project bağlamında kalır
```

## 11. Güvenlik modeli

Bu proje için frontend'de butonu gizlemek güvenlik sayılmaz. Yetki PostgreSQL tarafında uygulanır.

Ana kurallar:

- Tüm gerçek iş tablolarında RLS açık olmalı
- `organization_id` üzerinden tenant izolasyonu zorunlu
- Kullanıcının aktif organizasyon üyeliği kontrol edilmeli
- Owner başka bir role düşürülememeli
- Çapraz organizasyon foreign key bağlantıları composite constraint ile engellenmeli
- Arşiv aktörü `auth.uid()` ile eşleşmeli
- Server tarafından hesaplanması gereken zaman/aktivite alanlarına istemci güvenilmemeli
- `SECURITY DEFINER` fonksiyonları minimum yüzeye sahip olmalı, `search_path = ''` kullanmalı ve public/anon execute yetkileri geri alınmalı
- Secret/service-role anahtarı frontend'e veya Git'e eklenmemeli
- Yıkıcı işlemler ilk sürümlerde açıkça revoke edilmeli

Uzak güvenlik testleri:

```bash
npx supabase db query --linked --file supabase/tests/rls_smoke.sql
npx supabase db query --linked --file supabase/tests/time_tracking_rls_smoke.sql
npx supabase db query --linked --file supabase/tests/project_notes_rls_smoke.sql
npx supabase db lint --linked --level warning
```

Smoke testleri tek transaction içinde geçici veri oluşturur ve `ROLLBACK` ile bütün değişiklikleri geri alır.

## 12. Ortam değişkenleri

`.env.example` beklenen isimleri gösterir:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_APP_URL
```

Kurallar:

- `.env.local` Git'e eklenmez
- Yalnız publishable key tarayıcıya verilebilir
- `VITE_APP_URL` production ve preview ortamlarında `https://manageflow.bksoftstudio.com` olmalıdır
- Edge Function production origin'i `MANAGEFLOW_APP_URL` secret'ından alır
- Auth redirect listesinde yerel, özel domain ve yedek Vercel callback'leri tanımlıdır

## 13. Yerelde çalıştırma

```bash
npm install
cp .env.example .env.local
npm run dev
```

Varsayılan yerel adres:

```text
http://127.0.0.1:5173
```

Kontroller:

```bash
npm test
npm run build
git diff --check
```

## 14. Migration ve Supabase çalışma düzeni

Yeni tablo veya politika için mevcut migration değiştirilmemeli; daha ileri zaman damgalı yeni migration eklenmelidir.

```bash
npx supabase migration list --linked
npx supabase db push --linked --yes
npx supabase db lint --linked --level warning
```

Supabase Dashboard üzerinden elle yapılan şema değişiklikleri kaynak kontrolünü bozar ve kaçınılmalıdır.

Migration uygulandıktan sonra ilgili modül smoke testi ve tam RLS regresyon testi çalıştırılmalıdır.

## 15. Git ve yayın çalışma düzeni

Her ana özellik ayrı commit:

```text
feat: ...
fix: ...
test: ...
docs: ...
infra: ...
```

Önerilen sıra:

```text
incele
→ küçük kapsamı belirle
→ migration/RLS
→ domain yardımcıları ve testler
→ hook/veri bağlantısı
→ UI ve responsive durumlar
→ npm test
→ npm run build
→ uzak güvenlik testleri
→ GELISTIRME.md
→ commit/push
→ Vercel production
→ gerçek kullanıcı kabulü
```

Manuel production yayını gerekirse:

```bash
npx vercel deploy --prod --yes
```

Yayın sonrası özel domain rotası `200` dönmeli, güvenlik başlıkları bulunmalı ve canlı bundle yeni özellik metinlerini içermelidir.

## 16. Tasarım dili

- Açık tema temel zemin: sıcak beyaz/gri
- Koyu tema desteklenir
- Ana metin siyaha yakın
- Kontrollü vurgu: mor/lila
- Büyük, düşük ağırlıklı başlıklar
- Geniş boşluklar
- 18–24px yuvarlatılmış ana kartlar
- İnce border ve çok hafif gölge
- Lucide çizgi ikonları
- Masaüstü, tablet ve mobil kırılımlar
- Loading, error, empty, readonly ve disabled durumları zorunlu
- Kullanıma hazır olmayan özellikler `Yakında` etiketi taşır

Landing page aynı marka dilini sürdürür ancak uygulama shell'inden bağımsız, herkese açık bir pazarlama deneyimidir. Yeni bölümler eklenirken canlı olmayan özellikler açıkça yol haritası olarak işaretlenmeli; gerçek dışı fiyat, kullanıcı veya başarı iddiası kullanılmamalıdır.

## 17. Mevcut test durumu

Belge hazırlanırken:

```text
16 test dosyası
104 otomatik test
25 uzak migration
```

Başarılı uzak testler:

- Tam organizasyon/RLS matrisi
- Zaman takibi bütünlük ve izolasyonu
- Owner/admin ekip timesheet erişimi ve member reddi
- Proje notları bütünlük ve izolasyonu
- Uzak schema lint

Eksik test katmanı:

- Browser tabanlı UI entegrasyon testleri
- E2E Auth akışları
- Görsel regresyon testleri
- GitHub Actions kalite kapısı

## 18. Bugüne kadar izlenen geliştirme sırası

Özet kronoloji:

1. Statik ManageFlow prototipi ve marka kimliği
2. React Router ve uygulama mimarisi
3. Ekip ekranı ve `Yakında` durumları
4. Supabase SaaS temeli
5. Auth ve organizasyon onboarding
6. Gerçek ekip üyeleri ve güvenli davet
7. RLS rol matrisi
8. Müşteri yönetimi
9. Proje yaşam döngüsü ve proje ekibi
10. Görev yaşam döngüsü
11. Kanban, checklist, yorum, aktivite ve alt görevler
12. Gerçek dashboard
13. Profil ve organizasyon ayarları
14. Vercel, özel domain ve Auth callback'leri
15. Zaman Takibi v1
16. Manuel süre ve haftalık kişisel geçmiş
17. Çalışma Alanı v1 proje notları
18. Herkese açık, responsive SaaS landing page ve SEO temeli
19. Zaman Takibi v1.2 güvenli düzeltme ve geri alınabilir arşivleme
20. Sidebar çalışma alanı ve profil navigasyonu
21. Owner/admin haftalık ekip timesheet görünümü
22. Çalışma Alanı bağımsız ekip notları
23. Owner/admin ekip timesheet CSV dışa aktarma
24. Proje ve müşteri bazlı haftalık zaman özeti
25. Owner/admin güvenli ekip üyesi kaldırma
26. Merkezi proje, görev ve kişisel zaman arşivi
27. Çalışma Alanı not sabitleme, etiket ve geri alınabilir arşivleme
28. Çalışma Alanı notlarının Merkezi Arşiv'e bağlanması

Ayrıntılı commit geçmişi için:

```bash
git log --oneline --reverse
```

## 19. Sıradaki ürün planı

Öncelik sırası:

1. Supabase Storage tabanlı Dosyalar modülü
2. Gerçek uygulama içi bildirimler
3. Takvim ve toplantı temeli
4. Kanallar ve mesajlaşma
5. Sunucu tarafı Flow AI
6. Planlar, abonelik ve ödeme sistemi

## 20. Yeni bir yapay zekâ bu projeye nasıl devam etmeli?

İlk olarak şu dosyaları tamamen oku:

```text
HAKKINDA.md
GELISTIRME.md
package.json
src/App.jsx
src/styles.css
ilgili src/features/<modül>/ dosyaları
ilgili supabase/migrations dosyaları
ilgili supabase/tests dosyaları
```

Ardından:

1. `git status --short` ile kullanıcı değişikliklerini kontrol et.
2. Mevcut davranışı ve RLS sınırını anlamadan kod yazma.
3. Ana özelliği küçük ve doğrulanabilir kapsamda tanımla.
4. Veri değişikliği varsa önce migration ve güvenlik senaryosunu tasarla.
5. Mevcut UI dilini koru.
6. Test, build ve smoke kontrollerini çalıştır.
7. `GELISTIRME.md` ve gerekirse bu belgeyi güncelle.
8. Ana özellik için ayrı commit/push yap.
9. Production yayını doğrula.
10. Gerçek hesapla yapılması gereken kısa kabul adımlarını kullanıcıya söyle.

## 21. Yeni yapay zekâya verilebilecek başlangıç prompt'u

```text
Bu repository ManageFlow isimli, ajanslar için geliştirilen çok kiracılı bir SaaS iş yönetimi platformudur.

Önce HAKKINDA.md ve GELISTIRME.md dosyalarını tamamen oku. Ardından git durumunu, mevcut rotaları, ilgili feature hook/domain testlerini ve Supabase migration/RLS yapısını incele. Kullanıcı değişikliklerini koru.

Proje React + Vite + Supabase + PostgreSQL RLS + Vercel kullanıyor. Her ana özellik ayrı commit olmalı, GELISTIRME.md her anlamlı değişiklikte güncellenmeli, hazır olmayan modüller Yakında olarak kalmalı ve güvenlik yalnız frontend'e bırakılmamalıdır.

Mevcut tasarım dilini bozma. Küçük bir özellik paketi seç; migration, RLS, domain testleri, UI, responsive durumlar, test/build, uzak smoke testleri, dokümantasyon, commit/push ve production doğrulamasını tamamla. Kullanıcıdan yalnız gerçek hesap kabul testi gerektiğinde işlem iste.

Sıradaki iş için HAKKINDA.md içindeki “Sıradaki ürün planı” bölümünü ve GELISTIRME.md içindeki “Bir sonraki geliştirme paketi” bölümünü esas al.
```

## 22. Değiştirilmemesi gereken önemli ilkeler

- ManageFlow marka adı ve mevcut logo sistemi
- Organizasyon bazlı tenant izolasyonu
- Owner koruması
- Migration tabanlı şema yönetimi
- RLS zorunluluğu
- Server kontrollü zaman bütünlüğü
- Hassas anahtarların frontend dışında tutulması
- Ayrı ana özellik commit'leri
- Yaşayan `GELISTIRME.md` kaydı
- Mevcut kullanıcı verisini koruyan, geri alınabilir yaşam döngüleri

## 23. Kaynak doğruluğu

Bu belge yüksek seviyeli devir rehberidir. Çelişki halinde doğruluk sırası:

1. Uygulanmış migration ve mevcut kaynak kod
2. Otomatik testler ve uzak smoke testleri
3. `GELISTIRME.md`
4. `HAKKINDA.md`
5. Eski konuşma notları

Kod ile belge ayrışırsa önce davranış güvenli biçimde doğrulanmalı, ardından iki doküman da güncellenmelidir.
