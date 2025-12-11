# Admin Panel URL Yapısı

## 🚀 Yeni URL Yapısı

### Ana Erişim Noktaları

| URL | Açıklama | Yönlendirme |
|-----|----------|-------------|
| `/panel` | Ana admin giriş sayfası | Login ekranı |
| `/panel/setup` | İlk kurulum sayfası | Admin hesabı oluşturma |
| `/panel/login` | Direkt giriş sayfası | Login formu |

### Admin Panel Sayfaları

| URL | Sayfa | Açıklama |
|-----|-------|----------|
| `/panel/dashboard` | Dashboard | Ana kontrol paneli |
| `/panel/analytics` | Trafik Analizi | Site istatistikleri |
| `/panel/members` | Üye Yönetimi | Kullanıcı ve admin yönetimi |
| `/panel/campaigns` | Kampanyalar | Kampanya yönetimi |
| `/panel/bulk-upload` | Toplu Yükleme | Kampanya toplu ekleme |
| `/panel/newsletter` | Bülten Yönetimi | Email bülteni |
| `/panel/scrapers` | Scraper Araçları | Veri çekme araçları |
| `/panel/ai` | AI Asistan | Yapay zeka araçları |
| `/panel/seo` | SEO Paneli | Arama motoru optimizasyonu |
| `/panel/settings` | Ayarlar | Site ve entegrasyon ayarları |
| `/panel/logos` | Logo Yönetimi | Logo ve görsel yönetimi |
| `/panel/design` | Site Tasarımı | Tasarım özelleştirme |
| `/panel/backup` | Yedekleme | Veri yedekleme ve kurtarma |

### Eski URL'ler (Otomatik Yönlendirme)

| Eski URL | Yeni URL |
|----------|----------|
| `/admin/login` | `/panel/login` |
| `/admin/setup` | `/panel/setup` |
| `/admin/*` | `/panel/dashboard` |

## 🔐 Güvenlik Akışı

### 1. İlk Kurulum
```
/panel → Kurulum kontrolü → /panel/setup
```

### 2. Normal Giriş
```
/panel → Giriş kontrolü → /panel/login → /panel/dashboard
```

### 3. Oturum Kontrolü
```
Her admin sayfası → Yetki kontrolü → /panel/login (yetkisiz ise)
```

## 🎯 Kullanım Senaryoları

### Yeni Kullanıcı
1. `kartavantaj.vercel.app/panel` → Kurulum sayfası
2. Admin hesabı oluştur
3. Otomatik giriş → Dashboard

### Mevcut Kullanıcı
1. `kartavantaj.vercel.app/panel` → Giriş sayfası
2. Kullanıcı adı/şifre gir
3. Dashboard'a yönlendir

### Oturum Açık Kullanıcı
1. `kartavantaj.vercel.app/panel` → Direkt dashboard
2. Herhangi bir admin sayfası → Direkt erişim

## 🔗 Footer Linki

Ana sayfanın footer'ında "Panel" linki ile `/panel` erişimi sağlanır.

## ✅ Test Edilecek Durumlar

- [ ] `/panel` → İlk kurulum akışı
- [ ] `/panel` → Normal giriş akışı  
- [ ] `/panel/dashboard` → Yetki kontrolü
- [ ] Logout → `/panel/login` yönlendirme
- [ ] Eski URL'ler → Yeni URL'lere yönlendirme
- [ ] Footer "Panel" linki → `/panel` erişimi