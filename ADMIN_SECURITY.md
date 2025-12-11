# Admin Panel Güvenlik Sistemi

## 🔐 Güvenlik Özellikleri

### 1. Kurulum Koruması
- ✅ Admin kurulumu tamamlandıktan sonra `/panel/setup` erişimi engellenir
- ✅ Sadece Google Authenticator ile kurulum sıfırlanabilir
- ✅ Yetkisiz erişim denemeleri loglanır

### 2. Google Authenticator (TOTP) Sistemi
- ✅ 2FA ile güvenli kurulum sıfırlama
- ✅ 30 saniyelik TOTP kodları
- ✅ QR Code ile kolay kurulum

### 3. Erişim Kontrolleri
- ✅ Giriş yapmış kullanıcılar otomatik dashboard'a yönlendirilir
- ✅ Yetkisiz kullanıcılar login sayfasına yönlendirilir
- ✅ Setup sayfası erişim logları tutulur

## 🚨 Güvenlik Senaryoları

### Senaryo 1: Yetkisiz Setup Erişimi
```
Birisi /panel/setup linkine erişir
↓
Kurulum tamamsa → "Kurulum Tamamlandı" ekranı
↓
"Reset Bilgilerini Göster" butonu → Reset URL'ini gösterir
↓
Yetkisiz kişi Google Authenticator kodunu bilmez → Erişim engellenir
```

### Senaryo 2: Reset İsteği
```
Yetkili kişi kurulumu sıfırlamak ister
↓
Admin panelinden reset URL'ini alır
↓
/panel/setup?reset=true linkini kullanır
↓
Google Authenticator'dan 6 haneli kodu girer → Kurulum sıfırlanır
```

### Senaryo 3: Güvenlik İhlali
```
Birisi reset linkini bulur
↓
Google Authenticator kodunu bilmez → Erişim reddedilir
↓
Deneme loglanır → Admin bilgilendirilir
```

## 📱 Google Authenticator Nasıl Çalışır?

### TOTP (Time-based One-Time Password)
```javascript
// 30 saniyelik zaman penceresi
const timeWindow = Math.floor(Date.now() / 30000);
const token = generateTotpToken(secret, timeWindow);
```

### Güvenlik Avantajları
- ✅ 30 saniyede bir değişen kodlar
- ✅ Offline çalışır (internet gerektirmez)
- ✅ Standart TOTP protokolü
- ✅ Fiziksel cihaz gereksinimi

## 📊 Erişim Logları

### Log Yapısı
```json
{
  "timestamp": "2025-01-01T12:00:00.000Z",
  "ip": "client-side",
  "userAgent": "Mozilla/5.0...",
  "url": "https://site.com/panel/setup"
}
```

### Log Görüntüleme
- Admin panelinde erişim logları görüntülenebilir
- Son 50 erişim kaydedilir
- Şüpheli aktivite tespit edilebilir

## 🛡️ Güvenlik Önerileri

### Yöneticiler İçin
1. **Google Authenticator'ı güvenli cihazda kurun**
2. **TOTP secret'ını yedekleyin**
3. **Düzenli olarak erişim loglarını kontrol edin**
4. **Şüpheli aktivite durumunda şifreyi değiştirin**
5. **Reset linkini sadece güvenilir kişilerle paylaşın**

### Geliştiriciler İçin
1. **Production'da IP tabanlı rate limiting ekleyin**
2. **Reset anahtarını daha güçlü hale getirin**
3. **Email ile reset bildirimi gönderin**
4. **2FA (Two-Factor Authentication) ekleyin**

## 🚀 Kullanım Akışı

### Normal Kurulum
1. `site.com/panel/setup` → İlk kurulum
2. Admin hesabı oluştur
3. Google Authenticator'ı kur
4. TOTP secret'ını kaydet

### Kurulum Sıfırlama
1. Admin panelinden reset URL'ini al
2. `site.com/panel/setup?reset=true` linkini kullan
3. Google Authenticator kodunu gir
4. Kurulumu sıfırla

### Güvenlik Kontrolü
1. Admin panelinde erişim loglarını kontrol et
2. Şüpheli aktivite varsa şifreyi değiştir
3. Reset anahtarını yenile

## ⚠️ Önemli Notlar

- Google Authenticator **sadece admin panelinden** kurulabilir
- Kurulum sıfırlama **geri alınamaz** bir işlemdir
- TOTP secret'ını **güvenli yerde** saklayın
- Erişim logları **yerel olarak** saklanır
- Production'da **gerçek TOTP kütüphanesi** kullanın