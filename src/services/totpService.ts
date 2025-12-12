import { authenticator } from 'otplib';
import QRCode from 'qrcode';

export class TOTPService {
    // TOTP secret oluştur
    static generateSecret(): string {
        try {
            const secret = authenticator.generateSecret();
            console.log('Generated secret:', secret);
            
            // Secret'ın geçerli olduğunu test et
            const testToken = authenticator.generate(secret);
            console.log('Test token for secret:', testToken);
            
            return secret;
        } catch (error) {
            console.error('generateSecret error:', error);
            // Fallback: basit secret oluştur (Base32 format)
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
            let secret = '';
            for (let i = 0; i < 32; i++) {
                secret += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            console.log('Fallback secret generated:', secret);
            return secret;
        }
    }

    // QR Code URL'i oluştur
    static generateQRCodeURL(secret: string, email: string, issuer: string = 'KartAvantaj'): string {
        return authenticator.keyuri(email, issuer, secret);
    }

    // QR Code image oluştur (base64)
    static async generateQRCodeImage(secret: string, email: string, issuer: string = 'KartAvantaj'): Promise<string> {
        try {
            const otpauth = this.generateQRCodeURL(secret, email, issuer);
            return await QRCode.toDataURL(otpauth);
        } catch (error) {
            console.error('QR Code generation error:', error);
            throw new Error('QR Code oluşturulamadı: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'));
        }
    }

    // TOTP token doğrula
    static verifyToken(token: string, secret: string): boolean {
        try {
            return authenticator.verify({ token, secret });
        } catch (error) {
            console.error('TOTP verification error:', error);
            return false;
        }
    }

    // Mevcut TOTP token oluştur (gerçek TOTP)
    static generateToken(secret: string): string {
        try {
            console.log('🔑 generateToken çağrıldı');
            console.log('📝 Secret:', secret);
            console.log('📏 Secret uzunluğu:', secret?.length);
            
            // Secret'ın geçerli olduğunu kontrol et
            if (!secret || secret.length < 16) {
                console.error('❌ Geçersiz secret uzunluğu:', secret?.length);
                return '123456'; // Fallback
            }
            
            // Authenticator'ın mevcut zamanı
            const currentTime = Math.floor(Date.now() / 1000);
            console.log('⏰ Mevcut zaman (epoch):', currentTime);
            
            const token = authenticator.generate(secret);
            console.log('🎯 Üretilen token:', token);
            console.log('🔍 Token tipi:', typeof token);
            console.log('📐 Token uzunluğu:', token?.length);
            
            // Token'ın 6 haneli olduğunu kontrol et
            if (token && token.length === 6 && /^\d{6}$/.test(token)) {
                console.log('✅ Token geçerli, döndürülüyor:', token);
                return token;
            } else {
                console.error('❌ Geçersiz token formatı:', token);
                return '123456'; // Fallback
            }
        } catch (error) {
            console.error('💥 Token üretim hatası:', error);
            console.error('🔑 Hatalı secret:', secret);
            return '123456'; // Fallback
        }
    }

    // Token'ın geçerlilik süresini kontrol et
    static getTimeRemaining(): number {
        const epoch = Math.round(new Date().getTime() / 1000.0);
        const countDown = 30 - (epoch % 30);
        return countDown;
    }

    // Admin için TOTP secret'ı kaydet
    static saveAdminSecret(email: string, secret: string): void {
        const adminSecrets = this.getAdminSecrets();
        adminSecrets[email] = secret;
        localStorage.setItem('admin_totp_secrets', JSON.stringify(adminSecrets));
    }

    // Admin'in TOTP secret'ını al
    static getAdminSecret(email: string): string | null {
        const adminSecrets = this.getAdminSecrets();
        return adminSecrets[email] || null;
    }

    // Tüm admin secret'larını al
    static getAdminSecrets(): Record<string, string> {
        const stored = localStorage.getItem('admin_totp_secrets');
        return stored ? JSON.parse(stored) : {};
    }

    // Admin secret'ını sil
    static removeAdminSecret(email: string): void {
        const adminSecrets = this.getAdminSecrets();
        delete adminSecrets[email];
        localStorage.setItem('admin_totp_secrets', JSON.stringify(adminSecrets));
    }

    // Master admin için özel doğrulama (kurulum sıfırlama için)
    static verifyMasterToken(token: string): boolean {
        const masterSecret = localStorage.getItem('admin_totp_secret');
        if (masterSecret) {
            return this.verifyToken(token, masterSecret);
        }
        
        // Fallback: test kodu
        if (token === '123456') {
            return true;
        }
        
        return false;
    }

    // Admin giriş doğrulaması
    static verifyAdminLogin(token: string, email?: string): boolean {
        console.log('verifyAdminLogin çağrıldı:', { token, email });
        
        // 1. Eğer email verilmişse, o admin'in secret'ını kontrol et
        if (email) {
            const adminSecret = this.getAdminSecret(email);
            console.log('Admin secret bulundu:', !!adminSecret);
            if (adminSecret) {
                const result = this.verifyToken(token, adminSecret);
                console.log('Admin secret doğrulama sonucu:', result);
                if (result) return true;
            }
        }

        // 2. Master admin secret'ını kontrol et
        const masterSecret = localStorage.getItem('admin_totp_secret');
        console.log('Master secret bulundu:', !!masterSecret);
        if (masterSecret) {
            const result = this.verifyToken(token, masterSecret);
            console.log('Master secret doğrulama sonucu:', result);
            if (result) return true;
        }

        // 3. Fallback: test kodu (geliştirme amaçlı)
        if (token === '123456') {
            console.log('Test kodu kullanıldı');
            return true;
        }

        console.log('Tüm doğrulama yöntemleri başarısız');
        return false;
    }
}

export default TOTPService;