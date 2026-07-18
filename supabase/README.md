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

## Kurallar

- Uzak veritabanı tabloları Dashboard üzerinden elle değiştirilmemelidir.
- Her şema değişikliği yeni bir migration dosyası olmalıdır.
- `service_role` anahtarı hiçbir zaman frontend veya `VITE_` değişkeninde bulunmamalıdır.
- Migration uzak projeye uygulanmadan önce RLS politikaları gözden geçirilmelidir.

İlk migration profil, organizasyon, organizasyon üyeliği ve davet altyapısını oluşturur. İkinci migration doğrulanmış Auth e-postasını profile senkronlar ve e-posta alanını yalnızca Auth trigger'larının değiştirebilmesini sağlar. Üçüncü migration davet önizleme/kabul RPC'lerini ve davet edilen kişi adını ekler. Migration'lar `manageflow` uzak projesine uygulanmıştır. CLI bağlantısının ürettiği `supabase/.temp/` klasörü makineye özeldir ve Git'e eklenmez.
