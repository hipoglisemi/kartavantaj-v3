# Email Onay Sistemi Kurulum Rehberi

## Supabase Dashboard Ayarları

Email onay sisteminin çalışması için Supabase Dashboard'da aşağıdaki ayarları yapmanız gerekiyor:

### 1. Authentication Ayarları

1. Supabase Dashboard'a gidin
2. **Authentication** > **Settings** sayfasına gidin
3. **Email** sekmesinde:
   - ✅ **Enable email confirmations** seçeneğini aktif edin
   - **Confirm email** URL'ini şu şekilde ayarlayın: `https://yourdomain.com/auth/confirm`

### 2. Email Templates (Opsiyonel)

**Authentication** > **Email Templates** sayfasında email şablonlarını Türkçe'ye çevirebilirsiniz:

#### Confirm Signup Template:
```html
<h2>Hesabınızı Onaylayın</h2>
<p>Merhaba!</p>
<p>KartAvantaj'a hoş geldiniz! Hesabınızı aktifleştirmek için aşağıdaki butona tıklayın:</p>
<p><a href="{{ .ConfirmationURL }}">Hesabımı Onayla</a></p>
<p>Bu link 24 saat geçerlidir.</p>
<p>Eğer bu işlemi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.</p>
<p>Teşekkürler,<br>KartAvantaj Ekibi</p>
```

### 3. Site URL Ayarları

**Authentication** > **URL Configuration** sayfasında:
- **Site URL**: `https://yourdomain.com`
- **Redirect URLs**: 
  - `https://yourdomain.com/auth/confirm`
  - `https://yourdomain.com`

### 4. Test Etme

1. Yeni bir hesap oluşturun
2. Email gelen kutusunu kontrol edin
3. Onay linkine tıklayın
4. `/auth/confirm` sayfasına yönlendirildiğinizi kontrol edin

## Özellikler

✅ **Üye olurken email onayı zorunlu**
✅ **Giriş yaparken email onay kontrolü**
✅ **Email yeniden gönderme özelliği**
✅ **Onay bekleyen kullanıcılar için uyarı banner'ı**
✅ **Onay sayfası (/auth/confirm)**
✅ **Türkçe hata mesajları**

## Geliştirme Ortamında Test

Geliştirme ortamında test etmek için:
1. Supabase'de **Site URL**'yi `http://localhost:5173` olarak ayarlayın
2. **Redirect URLs**'e `http://localhost:5173/auth/confirm` ekleyin
3. Test email adresi kullanın

## Sorun Giderme

### Email Gelmiyor
- Spam klasörünü kontrol edin
- Supabase Dashboard'da email ayarlarını kontrol edin
- SMTP ayarlarınızı kontrol edin (özel SMTP kullanıyorsanız)

### Onay Linki Çalışmıyor
- URL konfigürasyonunu kontrol edin
- Browser console'da hata mesajlarını kontrol edin
- Network sekmesinde API çağrılarını kontrol edin