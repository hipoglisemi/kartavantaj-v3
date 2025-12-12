import { authenticator } from 'otplib';
import QRCode from 'qrcode';

export class TOTPService {
    // TOTP secret oluştur
    static generateSecret(): string {
        return authenticator.generateSecret();
    }

    // QR Code URL'i oluştur
    static generateQRCodeURL(secret: string, email: string, issuer: string = 'KartAvantaj'): string {
        return authenticator.keyuri(email, issuer, secret);
    }

    // QR Code image oluştur (base64)
    static async generateQRCodeImage(secret: string, email: string, issuer: string = 'KartAvantaj'): Promise<string> {
        const otpauth = this.generateQRCodeURL(secret, email, issuer);
        return await QRCode.toDataURL(otpauth);
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

    // Mevcut TOTP token oluştur (test amaçlı)
    static generateToken(secret: string): string {
        return authenticator.generate(secret);
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