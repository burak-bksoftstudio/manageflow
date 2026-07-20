# ManageFlow Supabase altyapısı

Bu klasör ManageFlow veritabanı şemasının sürümlenmiş migration dosyalarını içerir.

## Uzak proje bağlama

1. Supabase üzerinde yeni bir proje oluşturun.
2. `.env.example` dosyasını `.env.local` adıyla kopyalayın.
3. Project Settings > API bölümündeki proje URL'sini ve publishable key'i yerleştirin.
4. Supabase CLI kurulduktan sonra hesabı ve projeyi bağlayın:

```bash
supabase login
supabase link --project-ref PROJE_REF
supabase db push
```

## Auth yönlendirme adresleri

Yerel kayıt doğrulama ve şifre yenileme akışları için Supabase Dashboard > Authentication > URL Configuration alanında şu adresler izin listesinde olmalıdır:

```text
http://127.0.0.1:5173/eposta-dogrula
http://127.0.0.1:5173/sifre-yenile
http://127.0.0.1:5173/davet-kabul
```

Production uygulamasının birincil adresi:

```text
https://manageflow.bksoftstudio.com
```

Supabase Dashboard > Authentication > URL Configuration alanında `Site URL` bu origin olarak ayarlanmalı ve aşağıdaki kesin production adresleri redirect izin listesine eklenmelidir:

```text
https://manageflow.bksoftstudio.com/eposta-dogrula
https://manageflow.bksoftstudio.com/sifre-yenile
https://manageflow.bksoftstudio.com/davet-kabul
```

`https://manageflow-seven.vercel.app` altındaki aynı üç yol ve yerel üç adres yedek/geliştirme için listede tutulmalıdır. Production ortamında genel wildcard yerine kesin adresler kullanılmalıdır. Vercel Preview ortamı e-posta callback'leri için `VITE_APP_URL` üzerinden aynı kararlı özel domain origin'ini kullanır.

Bu `Site URL` ve redirect listesi production projesinde tanımlanmış; gerçek şifre sıfırlama e-postası özel domaindeki `/sifre-yenile` callback'ine dönmüş ve yeni şifre kaydı canlı hesapla doğrulanmıştır.

## Ekip daveti Edge Function

`invite-member` fonksiyonu oturum açmış owner/admin kullanıcının isteğini doğrular, davet kaydını RLS altında oluşturur ve e-postayı Supabase Auth üzerinden gönderir. Fonksiyon uzak ortama şu komutla dağıtılır:

```bash
supabase functions deploy invite-member
```

Yerel origin otomatik olarak desteklenir. Canlı domain yayınında yalnızca production origin'ine izin vermek için Edge Function secret'ı eklenmelidir:

```bash
supabase secrets set MANAGEFLOW_APP_URL=https://manageflow.bksoftstudio.com
```

Bu production secret'ı bağlı `manageflow` projesinde tanımlanmıştır.

Supabase'in varsayılan SMTP servisi production kullanımı için uygun değildir. Gerçek müşteri adreslerine davet gönderilmeden önce Authentication > SMTP Settings alanında özel SMTP yapılandırılmalıdır.

## Uzak RLS smoke testi

Owner/admin/member yetki matrisi ile organizasyonlar arası izolasyon bağlı projede şu komutla doğrulanır:

```bash
supabase db query --linked --file supabase/tests/rls_smoke.sql
```

Test geçici ikinci organizasyon, davet, müşteri, proje, görev, checklist, yorum ve aktivite kayıtları üretir; bütün işlemler tek transaction içinde çalışır ve en sonda `ROLLBACK` uygular. Başarılı sonuç `result: passed` değerini ve bütün güvenlik kontrollerini `true` olarak döndürür. Bağlı projede en az bir `member` üyeliği bulunmalıdır; üyelik pasifse test yalnız transaction içinde geçici olarak aktifleştirir ve değişikliği rollback eder.

Zaman takibinin kişisel görünürlüğü, tek aktif sayaç, sunucu zaman yaşam döngüsü, doğrudan tablo yazma reddi, denetlenebilir düzeltme, geri alınabilir arşivleme ve arşivli proje koruması ayrıca şu komutla doğrulanır:

```bash
supabase db query --linked --file supabase/tests/time_tracking_rls_smoke.sql
```

Bu test de geçici süre/proje/görev kayıtlarını tek transaction içinde oluşturur ve sonda `ROLLBACK` uygular. Başarılı sonuç `result: passed` ve bütün zaman güvenliği alanlarını `true` döndürür.

Supabase Security Advisor davet önizleme/kabul RPC'lerini çağrılabilir `SECURITY DEFINER` fonksiyonlar olarak raporlar. Bu iki uyarı beklenir: davet edilen kullanıcı kabulden önce organizasyon RLS kapsamına girmediği için fonksiyonlar doğrulanmış Auth e-postasını davet e-postasıyla eşleştirerek kontrollü erişim sağlar. Free planda sızdırılmış parola kontrolü bulunmaz; production Pro plana geçtiğinde Auth Password Security bölümünden açılmalıdır.

## Kurallar

- Uzak veritabanı tabloları Dashboard üzerinden elle değiştirilmemelidir.
- Her şema değişikliği yeni bir migration dosyası olmalıdır.
- `service_role` anahtarı hiçbir zaman frontend veya `VITE_` değişkeninde bulunmamalıdır.
- Migration uzak projeye uygulanmadan önce RLS politikaları gözden geçirilmelidir.

İlk on beş migration kimlik, organizasyon, davet, müşteri, proje, proje ekibi, görev, checklist, yorum, aktivite, görev hiyerarşisi ve güvenli ayar temelini kurar. On altıncı migration kişisel zaman kayıtlarını, sunucu zamanı yaşam döngüsünü ve tek aktif sayaç garantisini ekler; on yedinci migration yıkıcı tablo yetkilerini kaldırır. On sekizinci migration güvenli manuel süre RPC'sini ve haftalık geçmiş temelini, on dokuzuncu migration proje notlarını, yirminci migration denetlenebilir zaman düzeltme ve geri alınabilir arşivleme RPC'lerini, yirmi birinci migration ise hesap silme sonrasında tarihsel aktör bütünlüğünü ekler. Bütün migration'lar `manageflow` uzak projesine uygulanmıştır. CLI bağlantısının ürettiği `supabase/.temp/` klasörü makineye özeldir ve Git'e eklenmez.
