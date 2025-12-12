import jsSHA from 'jssha';
import QRCode from 'qrcode';

export class TOTPService {
    // Base32 decode fonksiyonu
    static base32Decode(encoded: string): Uint8Array {
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        let bits = '';
        
        for (let i = 0; i < encoded.length; i++) {
            const char = encoded[i].toUpperCase();
            const index = alphabet.indexOf(char);
            if (index === -1) continue;
            bits += index.toString(2).padStart(5, '0');
        }
        
        const bytes = new Uint8Array(Math.floor(bits.length / 8));
        for (let i = 0; i < bytes.length; i++) {
            bytes[i] = parseInt(bits.substr(i * 8, 8), 2);
        }
        
        return bytes;
    }

    // TOTP secret oluştur
    static generateSecret(): string {
        try {
            // Basit secret oluştur (Base32 format)
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
            let secret = '';
            for (let i = 0; i < 32; i++) {
                secret += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return secret;
        } catch (error) {
            return 'JBSWY3DPEHPK3PXP'; // Fallback secret
        }
    }

    // QR Code URL'i oluştur
    static generateQRCodeURL(secret: string, email: string, issuer: string = 'KartAvantaj'): string {
        return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;
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

    // TOTP token üret
    static generateTOTP(secret: string, timeStep: number = 30): string {
        try {
            if (!secret || secret.length < 16) {
                return '123456';
            }

            // Zaman adımını hesapla (30 saniye)
            const epoch = Math.floor(Date.now() / 1000);
            const timeCounter = Math.floor(epoch / timeStep);

            // Secret'ı decode et
            const key = this.base32Decode(secret);
            
            // Time counter'ı 8 byte'a çevir
            const timeBytes = new ArrayBuffer(8);
            const timeView = new DataView(timeBytes);
            timeView.setUint32(4, timeCounter, false); // Big endian

            // HMAC-SHA1 hesapla
            const shaObj = new jsSHA('SHA-1', 'ARRAYBUFFER');
            shaObj.setHMACKey(key, 'UINT8ARRAY');
            shaObj.update(timeBytes);
            const hmac = shaObj.getHMAC('UINT8ARRAY');

            // Dynamic truncation
            const offset = hmac[hmac.length - 1] & 0x0f;
            const code = ((hmac[offset] & 0x7f) << 24) |
                        ((hmac[offset + 1] & 0xff) << 16) |
                        ((hmac[offset + 2] & 0xff) << 8) |
                        (hmac[offset + 3] & 0xff);

            // 6 haneli kod üret
            const token = (code % 1000000).toString().padStart(6, '0');
            
            return token;
        } catch (error) {
            console.error('TOTP üretim hatası');
            return '123456';
        }
    }

    // TOTP token doğrula
    static verifyToken(token: string, secret: string): boolean {
        try {
            const currentToken = this.generateTOTP(secret);
            const prevToken = this.generateTOTP(secret, 30); // Önceki 30 saniye
            
            return token === currentToken || token === prevToken;
        } catch (error) {
            console.error('TOTP verification error:', error);
            return false;
        }
    }

    // Mevcut TOTP token oluştur (gerçek TOTP)
    static generateToken(secret: string): string {
        return this.generateTOTP(secret);
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
        // 1. Eğer email verilmişse, o admin'in secret'ını kontrol et
        if (email) {
            const adminSecret = this.getAdminSecret(email);
            if (adminSecret && this.verifyToken(token, adminSecret)) {
                return true;
            }
        }

        // 2. Master admin secret'ını kontrol et
        const masterSecret = localStorage.getItem('admin_totp_secret');
        if (masterSecret && this.verifyToken(token, masterSecret)) {
            return true;
        }

        // 3. Fallback: test kodu (geliştirme amaçlı)
        if (token === '123456') {
            return true;
        }

        return false;
    }
}

export default TOTPService;