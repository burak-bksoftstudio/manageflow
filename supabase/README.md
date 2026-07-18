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
```

Production yayını alındığında `Site URL` canlı domain olarak güncellenmeli ve aynı iki yol canlı domain ile ayrıca tanımlanmalıdır. Production ortamında genel wildcard yerine kesin adresler kullanılmalıdır.

## Kurallar

- Uzak veritabanı tabloları Dashboard üzerinden elle değiştirilmemelidir.
- Her şema değişikliği yeni bir migration dosyası olmalıdır.
- `service_role` anahtarı hiçbir zaman frontend veya `VITE_` değişkeninde bulunmamalıdır.
- Migration uzak projeye uygulanmadan önce RLS politikaları gözden geçirilmelidir.

İlk migration profil, organizasyon, organizasyon üyeliği ve davet altyapısını oluşturur. Migration, `manageflow` uzak projesine uygulanmıştır. CLI bağlantısının ürettiği `supabase/.temp/` klasörü makineye özeldir ve Git'e eklenmez.
