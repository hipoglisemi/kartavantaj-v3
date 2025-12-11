# Test Kodları - Geliştirme Modu

## 🧪 Test Amaçlı Doğrulama Kodları

Geliştirme aşamasında Google Authenticator kurulumu olmadan test edebilmek için sabit kodlar kullanılıyor.

### 📱 Kurulum Sıfırlama Test Kodu

**Test Kodu:** `123456`

Bu kod aşağıdaki durumlarda kullanılabilir:
- `/panel/setup?reset=true` sayfasında
- Kurulum sıfırlama işlemlerinde
- 2FA doğrulama ekranlarında

### 🔧 Nasıl Çalışır?

1. **Reset sayfasına git**: `localhost:5173/panel/setup?reset=true`
2. **TOTP kurulum ekranı**: QR kod ve secret gösterilir
3. **"Devam Et" buton**: Kod giriş ekranına geçer
4. **Test kodu gir**: `123456` kodunu gir
5. **Kurulum sıfırlanır**: Tüm admin ayarları temizlenir

### ⚠️ Önemli Notlar

- **Sadece geliştirme için**: Production'da gerçek TOTP kullanılmalı
- **Güvenlik riski**: Test kodları herkesçe bilinir
- **Geçici çözüm**: Gerçek Google Authenticator entegrasyonu yapılacak

### 🚀 Production İçin Yapılacaklar

1. **Gerçek TOTP kütüphanesi**: `otplib` veya benzeri
2. **QR kod oluşturma**: `qrcode` kütüphanesi
3. **Güvenli secret**: Kriptografik güvenli rastgele oluşturma
4. **Test kodlarını kaldır**: Production'da test kodları çalışmamalı

### 🔍 Test Senaryoları

#### Başarılı Reset
```
1. /panel/setup?reset=true → TOTP kurulum ekranı
2. "Devam Et" → Kod giriş ekranı  
3. "123456" gir → Kurulum başarıyla sıfırlanır
```

#### Hatalı Kod
```
1. Kod giriş ekranında
2. "111111" gir → "Geçersiz doğrulama kodu" hatası
3. "123456" gir → Başarılı sıfırlama
```

#### İptal İşlemi
```
1. TOTP kurulum ekranında "İptal" → Ana sayfaya dön
2. Kod giriş ekranında "Geri" → TOTP kurulum ekranına dön
```

### 💡 Geliştirici Notları

- Test kodu `verifyTotpCode()` fonksiyonunda hardcode edilmiş
- Console'da debug mesajları görülebilir
- LocalStorage'da test kodları saklanıyor
- UI'da test modu belirtiliyor

Bu sistem sayesinde Google Authenticator kurulumu olmadan 2FA akışını test edebilirsiniz!