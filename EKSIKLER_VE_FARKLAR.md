# ManageFlow — Eksikler, Farklar ve Özellik Eşleşme Planı

Bu belge ManageFlow'un referans alınan Managelify ürün anlatımına göre mevcut durumunu, eksiklerini ve geliştirme sırasını kaydeder. İlgili her ana özellik tamamlandığında durum sütunu ve değişiklik günlüğü güncellenmelidir.

## 1. Ürün yaklaşımı

ManageFlow; ajansların müşteri, proje, görev, ekip, iletişim ve ticari süreçlerini tek çalışma alanında yönetmesini hedefler.

Referans ürüne yakın tutulacak alanlar:

- Modül kapsamı
- Temel kullanıcı akışları
- Ajans odaklı bilgi mimarisi
- Proje, görev, müşteri ve ekip bağlamlarının birbirine bağlanması
- Hazır olmayan özelliklerin açıkça belirtilmesi

Özgün kalacak alanlar:

- ManageFlow marka adı ve logosu
- Arayüz metinleri ve pazarlama dili
- Renk, tipografi ve görsel ayrıntılar
- Kaynak kodu, veritabanı modeli ve güvenlik uygulaması
- Özelliklerin ekran içi yerleşiminde küçük deneyim farklılıkları

Başka ürüne ait logo, özel görsel, metin veya kaynak kod doğrudan kullanılmamalıdır. Hedef, özellik ve iş akışı bakımından güçlü bir alternatif üretmektir.

## 2. Karşılaştırma kaynağı ve not

Karşılaştırma, 22 Temmuz 2026 tarihinde `Managelify Nedir? | Proje, Görev ve Ekip Yönetimini Tek Platformda Birleştiren (WRM)` videosunun bölüm bölüm incelenmesiyle hazırlanmıştır:

`https://www.youtube.com/watch?v=tXzW-LF24A8`

Videoda yayında olan özellikler ile geliştirilmekte veya planlanmakta olduğu söylenen özellikler birlikte anlatılmaktadır. Bu nedenle `Referansta var` ifadesi her özelliğin eksiksiz biçimde production ortamında çalıştığı anlamına gelmez.

## 3. Mevcut eşleşme özeti

Yaklaşık ve ürün kapsamına dayalı değerlendirme:

- Proje, görev, ekip ve müşteri çekirdeği eşleşmesi: `%70`
- Videoda anlatılan bütün platform kapsamının ManageFlow'daki çalışan karşılığı: `%40`
- Yol haritası dahil hedef kapsam eşleşmesi: yüksek

Bu oranlar otomatik test sonucu değil; özellik genişliği ve mevcut uygulama derinliğine göre yön gösteren ürün tahminidir.

## 4. Modül bazında eksikler ve farklar

Durumlar:

- `Hazır`: Gerçek backend verisiyle kullanılabilir.
- `Kısmi`: Temel karşılığı çalışır, referanstaki kapsamın tamamı yoktur.
- `Planlandı`: Yol haritasında vardır, gerçek modül henüz yoktur.
- `Referans yol haritası`: Videoda gelecek özellik olarak anlatılmıştır.

| Alan | Referansta anlatılan kapsam | ManageFlow mevcut durumu | Durum | Kalan ana işler |
|---|---|---|---|---|
| Kimlik doğrulama | Kayıt, giriş ve hesap erişimi | Supabase Auth, doğrulama, şifre yenileme ve korumalı rotalar çalışıyor | Hazır | Oturum/cihaz yönetimi ve sosyal girişler daha sonra eklenebilir |
| Organizasyon | Organizasyon çalışma alanı | Onboarding, aktif organizasyon ve RLS izolasyonu çalışıyor | Hazır | Çoklu organizasyon değiştirme |
| Ekip ve roller | Üye, takım ve rol görünümü | Davet, kabul, iptal, üye listesi ve temel roller çalışıyor | Kısmi | Gelişmiş izin matrisi ve bağımsız takım grupları |
| Müşteriler | Marka, iletişim kişileri, sorumlular ve müşteri hesabı | Temel müşteri CRUD ve detay ekranı çalışıyor | Kısmi | Çoklu iletişim kişisi, ajans sorumlusu, müşteri hesabı ve görünürlük ayarları |
| Projeler | Müşteriye bağlı proje, ekip ve ilerleme | CRUD, ekip atama, durum, ilerleme ve arşiv çalışıyor | Hazır | Proje şablonları, özel durumlar ve dosya bağlamı |
| Görevler | Sorumlu, tarih, tekrar, alt görev, yorum, dosya ve şablon | CRUD, liste/Kanban, alt görev, checklist, yorum, aktivite ve filtreler çalışıyor | Kısmi | Tekrarlı görevler, görev şablonları ve görev dosyaları |
| Dashboard | Günlük iş, metrik ve proje görünümü | Gerçek KPI, haftalık ilerleme, proje özeti ve gündem çalışıyor | Kısmi | Widget seçimi, kişiselleştirme ve daha kapsamlı raporlar |
| Zaman takibi | Proje/görev süresi ve ekip görünümü | Sayaç, manuel kayıt, düzeltme, arşiv ve ekip timesheet çalışıyor | Hazır | CSV dışa aktarma ve proje/müşteri raporları |
| Çalışma Alanı | Notion benzeri, proje dışı bilgi alanı | Projeye bağlı ortak notlar çalışıyor | Kısmi | Bağımsız not, sabitleme, etiket, arşiv ve zengin metin |
| Dosyalar | Klasörler, merkezi dosyalar ve proje/görev dosyaları | Gerçek dosya depolama yok | Planlandı | Supabase Storage, klasör, yükleme, indirme, arşiv ve bağlam ilişkileri |
| Kanallar | Genel/özel kanal, müşteri kanalı, mention, arama ve dosyalar | Placeholder | Planlandı | Kanal üyeliği, gerçek zamanlı mesaj, thread, mention, tepki ve kanal dosyaları |
| Gelen Kutusu | Ekip/müşteriyle birebir mesajlaşma | Placeholder | Planlandı | Direkt konuşma, okunma bilgisi, bildirim ve arama |
| Sesli odalar | Kanal içinde sesli görüşme | Yok | Planlandı | Gerçek zamanlı ses altyapısı; MVP sonrasına bırakılacak |
| Bildirimler | Uygulama, e-posta ve mobil bildirim tercihleri | Gündem gerçek, bildirim merkezi demo | Planlandı | Bildirim tablosu, tetikleyiciler, okundu durumu ve tercihler |
| Takvim | Günlük/haftalık takvim ve etkinlikler | Placeholder | Planlandı | Etkinlik CRUD, görev tarihleri ve ekip takvimi |
| Harici takvim | Google/Zoom/Meet bağlantıları | Yok | Planlandı | OAuth, takvim eşitleme ve toplantı bağlantıları |
| Rezervasyon sayfası | Dış dünyaya açık müsaitlik ve randevu | Yok | Planlandı | Müsaitlik kuralları, public rezervasyon ve doğrulama |
| Toplantı | Uygulama içi görüşme, kayıt ve transkript | Yok | Planlandı | Görüşme sağlayıcısı, kayıt izinleri ve transkript altyapısı |
| Müşteri portalı | Müşterinin izinli proje/görevleri görmesi | Yok | Planlandı | Müşteri rolü, davet, proje görünürlüğü, yorum/onay akışları |
| CRM | Yaşam döngüsü, müşteri sorumlusu ve ekip bağlamı | Yalnız temel müşteri yönetimi var | Planlandı | Pipeline, durumlar, sorumlular, aktiviteler ve lead yönetimi |
| Ürün/hizmet kataloğu | Tekliflerde kullanılacak kalemler | Yok | Planlandı | Katalog CRUD, fiyat, vergi ve para birimi |
| Teklifler | Teklif oluşturma, PDF, canlı URL ve müşteri kabulü | Yok | Planlandı | Teklif editörü, kalemler, paylaşım, süre ve kabul kaydı |
| Formlar | Sürükle-bırak form ve dış yanıt toplama | Yok | Planlandı | Form şeması, public form, yanıtlar ve CRM dönüşümü |
| Harici API | Lead ve kayıtlar için API; Make/Zapier kullanımı | Public ürün API'si yok | Planlandı | API anahtarı, kapsam, limit, audit ve dokümantasyon |
| Sözleşmeler | Yükleme, şablon, müşteri görüntüleme ve onay | Yok | Planlandı | Güvenli doküman, paylaşım, zaman damgalı onay ve şablonlar |
| Operasyonel finans | Gelir, gider, tekrar eden gider ve satın alma onayı | Yok | Planlandı | Gelir/gider, abonelik, onay, fatura eki ve yetkilendirme |
| Özelleştirme | Proje/görev/CRM durum ve öncelikleri | Profil ve organizasyon ayarları çalışıyor | Kısmi | Özel durumlar, öncelikler, yaşam döngüleri ve alanlar |
| Destek | Bilgi, destek ve geliştirme ticket'ları | Yok | Planlandı | Ticket oluşturma, durum, yanıt ve yönetim görünümü |
| Duyurular | Uygulama içi, e-posta ve ileride WhatsApp duyurusu | Header bildirimi demo | Planlandı | Duyuru akışı ve kanal tercihleri |
| Satış ortaklığı | Benzersiz URL, ziyaret/deneme/satış ve komisyon | Yok | Planlandı | Referral takibi, dönüşüm ve ödeme raporu; büyüme sonrası |
| Flow AI | Proje/görev oluşturma, gündem, ekip ve müşteri özeti | Placeholder | Planlandı | Sunucu tarafı model, araç çağrıları, önizleme/onay ve audit |
| Planlar ve ödeme | Organizasyon bazlı ücretli kullanım | Yok | Planlandı | Paketler, kota, abonelik, fatura ve ödeme sağlayıcısı |

## 5. Uygulama sırası

Sıra; kullanıcıdan ek bilgi istemeden uygulanabilme, mevcut altyapıyı kullanma, güvenlik riski ve ürün etkisine göre belirlenmiştir.

### A. Hızlı eşleşme kazanımları

1. Çalışma Alanı bağımsız not desteği
2. Zaman kayıtlarını CSV dışa aktarma
3. Proje ve müşteri bazlı zaman özeti
4. Çalışma Alanı not sabitleme, etiket ve arşivleme
5. Merkezi arşiv görünümü

### B. Çekirdek platform tamamlamaları

6. Supabase Storage tabanlı Dosyalar v1
7. Gerçek uygulama içi Bildirimler v1
8. Takvim v1
9. Tekrarlı görevler ve görev şablonları
10. Gelişmiş rol ve takım grupları

### C. Ajans iletişimi ve müşteri deneyimi

11. Müşteri portalı v1
12. Organizasyon/proje kanalları
13. Gelen Kutusu ve birebir mesajlaşma
14. Mention, thread, tepki ve mesajdan görev
15. E-posta bildirim tercihleri

### D. Ticari süreçler

16. CRM pipeline
17. Ürün/hizmet kataloğu
18. Teklif oluşturma ve paylaşılabilir teklif sayfası
19. Formlar ve lead toplama
20. Sözleşmeler
21. Operasyonel finans

### E. Entegrasyon, AI ve ölçekleme

22. Google/Outlook takvim entegrasyonu
23. Public API ve webhook altyapısı
24. Flow AI güvenli komut önizleme ve onay akışı
25. Planlar, abonelik ve ödeme
26. Destek, duyuru ve satış ortaklığı

Sesli oda, uygulama içi görüntülü toplantı ve toplantı kaydı/transkripti yüksek operasyon ve gizlilik maliyeti nedeniyle çekirdek SaaS doğrulandıktan sonra ele alınmalıdır.

## 6. Pazarlama farklılaştırması

Ürün fonksiyonları referansa yakın olsa da pazarlamada aşağıdaki ManageFlow anlatımı kullanılmalıdır:

- Ana hedef kitle: küçük ve orta ölçekli ajans ekipleri
- Ana vaat: `Müşteri işinden ekip zamanına kadar ajansınızın tek akışı.`
- CTA: `Fiyat teklifi al`
- Güçlü yön: proje, görev, ekip zamanı ve müşteri bağlamının aynı veri modeli üzerinde birleşmesi
- Güven mesajı: organizasyon bazlı veri izolasyonu ve rol korumalı işlemler
- Ton: sade, güvenilir, operasyon odaklı ve abartısız

Henüz çalışmayan özellikler landing veya uygulama içinde varmış gibi gösterilmemeli; `Yakında` ya da `Yol haritasında` olarak açıkça ayrılmalıdır.

## 7. Tamamlanma kuralı

Bir madde yalnızca şu koşullar sağlandığında `Hazır` kabul edilir:

1. Arayüz tamamlanmış olmalı.
2. Gerçek Supabase verisine bağlanmalı.
3. Organizasyon izolasyonu ve rol kuralları veritabanında uygulanmalı.
4. En az domain testi ve gerekli RLS smoke testi bulunmalı.
5. Production build başarılı olmalı.
6. `GELISTIRME.md`, `HAKKINDA.md` ve bu belge güncellenmeli.
7. Ana özellik ayrı commit edilmelidir.

## 8. Değişiklik günlüğü

### 22 Temmuz 2026 — İlk karşılaştırma

- Referans videodaki özellikler modül bazında çıkarıldı.
- ManageFlow'un çalışan, kısmi ve planlanan karşılıkları belgelendi.
- Hızlı kazanımlardan başlayıp iletişim, ticari süreç ve AI katmanına ilerleyen uygulama sırası oluşturuldu.

