# ManageFlow Supabase altyapısı

Bu klasör ManageFlow veritabanı şemasının sürümlenmiş migration dosyalarını içerir.

## Uzak proje bağlama

1. Supabase üzerinde yeni bir proje oluşturun.
2. `.env.example` dosyasını `.env.local` adıyla kopyalayın.
3. Project Settings > API bölümündeki proje URL'sini ve publishable key'i yerleştirin.
4. Supabase CLI kurulduktan sonra yerel yapılandırmayı başlatıp projeyi bağlayın:

```bash
supabase init
supabase login
supabase link --project-ref PROJE_REF
supabase db push
```

## Kurallar

- Uzak veritabanı tabloları Dashboard üzerinden elle değiştirilmemelidir.
- Her şema değişikliği yeni bir migration dosyası olmalıdır.
- `service_role` anahtarı hiçbir zaman frontend veya `VITE_` değişkeninde bulunmamalıdır.
- Migration uzak projeye uygulanmadan önce RLS politikaları gözden geçirilmelidir.

İlk migration profil, organizasyon, organizasyon üyeliği ve davet altyapısını oluşturur. Proje anahtarı bulunmadığı için migration henüz uzak veritabanına uygulanmamıştır.
