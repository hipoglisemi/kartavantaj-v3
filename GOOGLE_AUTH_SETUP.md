# Google Auth Kurulum Rehberi

## 🚀 Admin Panel Google Authentication

Admin panelinde Google ile giriş yapmak için aşağıdaki adımları takip edin.

## 📋 Gereksinimler

- ✅ Supabase projesi
- ✅ Google Cloud Console erişimi
- ✅ Admin panel kurulumu tamamlanmış

## 🔧 1. Google Cloud Console Ayarları

### Google OAuth Client Oluşturma

1. [Google Cloud Console](https://console.cloud.google.com/) açın
2. Proje seçin veya yeni proje oluşturun
3. **APIs & Services > Credentials** bölümüne gidin
4. **Create Credentials > OAuth 2.0 Client IDs** seçin
5. **Application type**: Web application
6. **Name**: KartAvantaj Admin Panel
7. **Authorized redirect URIs** ekleyin:
   ```
   https://your-project.supabase.co/auth/v1/callback
   ```

### Client ID ve Secret Alın
- **Client ID**: `123456789-abc.apps.googleusercontent.com`
- **Client Secret**: `GOCSPX-abcdefghijklmnop`

## 🔧 2. Supabase Ayarları

### Authentication Providers

1. Supabase Dashboard açın
2. **Authentication > Providers** bölümüne gidin
3. **Google** provider'ı etkinleştirin
4. Google Cloud Console'dan aldığınız bilgileri girin:
   - **Client ID**: `123456789-abc.apps.googleusercontent.com`
   - **Client Secret**: `GOCSPX-abcdefghijklmnop`
5. **Redirect URL** kontrol edin:
   ```
   https://your-project.supabase.co/auth/v1/callback
   ```

### Site URL Ayarları

**Authentication > URL Configuration** bölümünde:
- **Site URL**: `https://kartavantaj.vercel.app`
- **Redirect URLs**: 
  ```
  https://kartavantaj.vercel.app/panel
  https://kartavantaj.vercel.app/panel/**
  ```

## 🔧 3. Admin Panel Ayarları

### Yetkili Email'leri Ekleme

1. `/panel/setup` sayfasından admin kurulumu yapın
2. **Google Auth Email'leri** bölümünde yetkili email'leri ekleyin:
   ```
   admin@kartavantaj.com
   manager@kartavantaj.com
   ```
3. Bu email'ler Google ile giriş yapabilir

### Güvenlik Kontrolleri

- ✅ Sadece yetkili email'ler giriş yapabilir
- ✅ Yetkisiz email'ler otomatik reddedilir
- ✅ Giriş denemeleri loglanır

## 🧪 4. Test Etme

### Google Auth Testi

1. `/panel` sayfasına gidin
2. **Google ile Giriş Yap** butonuna tıklayın
3. Google hesabınızı seçin
4. Yetkili email ise admin paneline yönlendirilirsiniz

### Hata Durumları

**"Bu Google hesabı admin paneline erişim yetkisine sahip değil"**
- Email adresiniz yetkili listede değil
- Admin setup'tan email'inizi ekleyin

**"Supabase bağlantısı eksik"**
- Supabase anahtarları eksik
- Entegrasyonlar sayfasından anahtarları girin

**"Google OAuth yapılandırması eksik"**
- Google Cloud Console ayarları eksik
- Supabase'de Google provider ayarları kontrol edin

## 📱 5. Mobil Uyumluluk

Google Auth mobil cihazlarda da çalışır:
- ✅ iOS Safari
- ✅ Android Chrome
- ✅ Responsive tasarım

## 🔒 6. Güvenlik Özellikleri

### Email Doğrulama
```javascript
// Yetkili email kontrolü
const adminEmails = getAdminEmails();
if (adminEmails.includes(user.email)) {
    // Giriş izni ver
} else {
    // Erişim reddet
}
```

### Oturum Yönetimi
- Google oturumu ile admin oturumu senkronize
- Çıkış yapıldığında her iki oturum da sonlanır
- Güvenli token yönetimi

## 🚀 7. Production Checklist

- [ ] Google Cloud Console production ayarları
- [ ] Supabase production URL'leri
- [ ] SSL sertifikası aktif
- [ ] Yetkili email listesi güncel
- [ ] Rate limiting aktif
- [ ] Monitoring kurulu

## 📞 Destek

Sorun yaşıyorsanız:
1. Browser console'u kontrol edin
2. Supabase logs'ları inceleyin
3. Google Cloud Console quota'larını kontrol edin
4. Network bağlantısını test edin

---

**Not**: Bu rehber geliştirme ortamı içindir. Production'da ek güvenlik önlemleri alın.