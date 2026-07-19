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

Production yayını alındığında `Site URL` canlı domain olarak güncellenmeli ve aynı üç yol canlı domain ile ayrıca tanımlanmalıdır. Production ortamında genel wildcard yerine kesin adresler kullanılmalıdır.

## Ekip daveti Edge Function

`invite-member` fonksiyonu oturum açmış owner/admin kullanıcının isteğini doğrular, davet kaydını RLS altında oluşturur ve e-postayı Supabase Auth üzerinden gönderir. Fonksiyon uzak ortama şu komutla dağıtılır:

```bash
supabase functions deploy invite-member
```

Yerel origin otomatik olarak desteklenir. Canlı domain yayınında yalnızca production origin'ine izin vermek için Edge Function secret'ı eklenmelidir:

```bash
supabase secrets set MANAGEFLOW_APP_URL=https://app.manageflow.example
```

Supabase'in varsayılan SMTP servisi production kullanımı için uygun değildir. Gerçek müşteri adreslerine davet gönderilmeden önce Authentication > SMTP Settings alanında özel SMTP yapılandırılmalıdır.

## Uzak RLS smoke testi

Owner/admin/member yetki matrisi ile organizasyonlar arası izolasyon bağlı projede şu komutla doğrulanır:

```bash
supabase db query --linked --file supabase/tests/rls_smoke.sql
```

Test geçici ikinci organizasyon, davet, müşteri, proje, görev, checklist, yorum ve aktivite kayıtları üretir; bütün işlemler tek transaction içinde çalışır ve en sonda `ROLLBACK` uygular. Başarılı sonuç `result: passed` değerini ve bütün güvenlik kontrollerini `true` olarak döndürür. Testin gerçek member hesabı bulabilmesi için bağlı projede en az bir aktif `member` üyeliği olmalıdır.

Supabase Security Advisor davet önizleme/kabul RPC'lerini çağrılabilir `SECURITY DEFINER` fonksiyonlar olarak raporlar. Bu iki uyarı beklenir: davet edilen kullanıcı kabulden önce organizasyon RLS kapsamına girmediği için fonksiyonlar doğrulanmış Auth e-postasını davet e-postasıyla eşleştirerek kontrollü erişim sağlar. Free planda sızdırılmış parola kontrolü bulunmaz; production Pro plana geçtiğinde Auth Password Security bölümünden açılmalıdır.

## Kurallar

- Uzak veritabanı tabloları Dashboard üzerinden elle değiştirilmemelidir.
- Her şema değişikliği yeni bir migration dosyası olmalıdır.
- `service_role` anahtarı hiçbir zaman frontend veya `VITE_` değişkeninde bulunmamalıdır.
- Migration uzak projeye uygulanmadan önce RLS politikaları gözden geçirilmelidir.

İlk migration profil, organizasyon, organizasyon üyeliği ve davet altyapısını oluşturur. İkinci migration doğrulanmış Auth e-postasını profile senkronlar ve e-posta alanını yalnızca Auth trigger'larının değiştirebilmesini sağlar. Üçüncü migration davet önizleme/kabul RPC'lerini ve davet edilen kişi adını ekler. Dördüncü migration davet üzerinden owner atamasını RLS seviyesinde kapatır. Beşinci migration organizasyona bağlı müşteri tablosunu ve rol bazlı erişim kurallarını ekler. Altıncı migration müşteriye bağlı proje tablosunu, organizasyon-müşteri bütünlüğünü ve proje RLS kurallarını ekler. Yedinci migration proje tamamlanma ilerlemesini ve geri alınabilir arşivleme yaşam döngüsünü uygular. Sekizinci migration organizasyon güvenli proje üyesi atamalarını ve otomatik proje sahibi üyeliğini ekler. Dokuzuncu migration projeye bağlı görevleri, durum/öncelik yaşam döngüsünü ve proje üyesi atama bütünlüğünü ekler. Onuncu migration görevlerin geri alınabilir arşivleme yaşam döngüsünü ve doğrulanmış arşiv aktörünü ekler. On birinci migration görev checklist öğelerini, tamamlanma zamanını, görev kapsamı bütünlüğünü ve rol bazlı RLS kurallarını ekler. On ikinci migration görev yorumlarını, yazar bütünlüğünü, düzenleme zamanını ve üye/moderatör RLS kurallarını ekler. On üçüncü migration görev aktivitelerini, mevcut görev backfill'ini, otomatik değişiklik trigger'ını ve append-only RLS kurallarını ekler. Migration'lar `manageflow` uzak projesine uygulanmıştır. CLI bağlantısının ürettiği `supabase/.temp/` klasörü makineye özeldir ve Git'e eklenmez.
