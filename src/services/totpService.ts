import jsSHA from 'jssha';
import QRCode from 'qrcode';
import SecurityService from './securityService';
import ConsoleProtection from '../utils/consoleProtection';

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

    // QR Code URL'i oluştur (Google Authenticator standardı)
    static generateQRCodeURL(secret: string, email: string, issuer: string = 'KartAvantaj'): string {
        return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
    }

    // QR Code image oluştur (base64)
    static async generateQRCodeImage(secret: string, email: string, issuer: string = 'KartAvantaj'): Promise<string> {
        try {
            const otpauth = this.generateQRCodeURL(secret, email, issuer);
            return await QRCode.toDataURL(otpauth);
        } catch (error) {
            ConsoleProtection.safeError('QR Code generation error');
            throw new Error('QR Code oluşturulamadı');
        }
    }

    // TOTP token üret (Google Authenticator tam uyumlu)
    static generateTOTP(secret: string, timeStep: number = 30): string {
        try {
            if (!secret || secret.length < 16) {
                throw new Error('Invalid secret');
            }

            // Zaman adımını hesapla - Google Authenticator standardı
            const epoch = Math.floor(Date.now() / 1000);
            const timeCounter = Math.floor(epoch / timeStep);

            // Secret'ı decode et
            const key = this.base32Decode(secret);
            
            // Time counter'ı 8 byte'a çevir (Big Endian - RFC 6238)
            const timeBytes = new ArrayBuffer(8);
            const timeView = new DataView(timeBytes);
            timeView.setUint32(0, 0, false); // Üst 32 bit
            timeView.setUint32(4, timeCounter, false); // Alt 32 bit

            // HMAC-SHA1 hesapla (RFC 4226)
            const shaObj = new jsSHA('SHA-1', 'ARRAYBUFFER');
            shaObj.setHMACKey(key, 'UINT8ARRAY');
            shaObj.update(timeBytes);
            const hmac = shaObj.getHMAC('UINT8ARRAY');

            // Dynamic truncation (RFC 4226 Section 5.4)
            const offset = hmac[hmac.length - 1] & 0x0f;
            const code = ((hmac[offset] & 0x7f) << 24) |
                        ((hmac[offset + 1] & 0xff) << 16) |
                        ((hmac[offset + 2] & 0xff) << 8) |
                        (hmac[offset + 3] & 0xff);

            // 6 haneli kod üret
            const token = (code % 1000000).toString().padStart(6, '0');
            
            // Debug bilgisi (geçici)
            if (window.location.hostname === 'localhost') {
                const remaining = this.getTimeRemaining();
                console.log(`TOTP: ${token}, Kalan: ${remaining}s, Epoch: ${epoch}, Counter: ${timeCounter}`);
            }
            
            return token;
        } catch (error) {
            ConsoleProtection.safeError('TOTP üretim hatası');
            throw error;
        }
    }

    // TOTP token doğrula (geniş zaman toleransı ile)
    static verifyToken(token: string, secret: string): boolean {
        try {
            const epoch = Math.floor(Date.now() / 1000);
            const currentWindow = Math.floor(epoch / 30);
            
            // Daha geniş zaman penceresi: -2 ile +2 arası (5 pencere = 2.5 dakika tolerans)
            for (let i = -2; i <= 2; i++) {
                const timeCounter = currentWindow + i;
                const timeBytes = new ArrayBuffer(8);
                const timeView = new DataView(timeBytes);
                timeView.setUint32(0, 0, false);
                timeView.setUint32(4, timeCounter, false);

                const key = this.base32Decode(secret);
                const shaObj = new jsSHA('SHA-1', 'ARRAYBUFFER');
                shaObj.setHMACKey(key, 'UINT8ARRAY');
                shaObj.update(timeBytes);
                const hmac = shaObj.getHMAC('UINT8ARRAY');

                const offset = hmac[hmac.length - 1] & 0x0f;
                const code = ((hmac[offset] & 0x7f) << 24) |
                            ((hmac[offset + 1] & 0xff) << 16) |
                            ((hmac[offset + 2] & 0xff) << 8) |
                            (hmac[offset + 3] & 0xff);

                const generatedToken = (code % 1000000).toString().padStart(6, '0');
                
                if (token === generatedToken) {
                    return true;
                }
            }
            
            return false;
        } catch (error) {
            ConsoleProtection.safeError('TOTP verification error');
            return false;
        }
    }

    // Mevcut TOTP token oluştur (gerçek TOTP)
    static generateToken(secret: string): string {
        return this.generateTOTP(secret);
    }

    // Token'ın geçerlilik süresini kontrol et (hassas senkronizasyon)
    static getTimeRemaining(): number {
        const now = Date.now();
        const epoch = Math.floor(now / 1000);
        const timeInWindow = epoch % 30;
        const remaining = 30 - timeInWindow;
        
        // Eğer 0 saniye kaldıysa, 30 göster (yeni döngü)
        return remaining === 0 ? 30 : remaining;
    }

    // Admin için TOTP secret'ı kaydet (şifreli)
    static saveAdminSecret(email: string, secret: string): void {
        try {
            const adminSecrets = this.getAdminSecrets();
            adminSecrets[email] = secret;
            SecurityService.setSecureItem('admin_totp_secrets', JSON.stringify(adminSecrets));
        } catch {
            // Sessizce başarısız ol
        }
    }

    // Admin'in TOTP secret'ını al (şifreli)
    static getAdminSecret(email: string): string | null {
        try {
            const adminSecrets = this.getAdminSecrets();
            return adminSecrets[email] || null;
        } catch {
            return null;
        }
    }

    // Tüm admin secret'larını al (şifreli)
    static getAdminSecrets(): Record<string, string> {
        try {
            const stored = SecurityService.getSecureItem('admin_totp_secrets');
            return stored ? JSON.parse(stored) : {};
        } catch {
            return {};
        }
    }

    // Admin secret'ını sil (şifreli)
    static removeAdminSecret(email: string): void {
        try {
            const adminSecrets = this.getAdminSecrets();
            delete adminSecrets[email];
            SecurityService.setSecureItem('admin_totp_secrets', JSON.stringify(adminSecrets));
        } catch {
            // Sessizce başarısız ol
        }
    }

    // Master admin için özel doğrulama (kurulum sıfırlama için)
    static verifyMasterToken(token: string): boolean {
        try {
            const masterSecret = SecurityService.getSecureItem('admin_totp_secret');
            if (masterSecret && this.verifyToken(token, masterSecret)) {
                return true;
            }
            

            
            return false;
        } catch {
            return false;
        }
    }

    // Admin giriş doğrulaması
    static verifyAdminLogin(token: string, email?: string): boolean {
        try {
            // Brute force koruması
            const identifier = email || 'admin_login';
            if (!SecurityService.checkBruteForce(identifier)) {
                SecurityService.logSecurityEvent('TOTP_BRUTE_FORCE_BLOCKED', { email, token: '***' });
                return false;
            }

            // 1. Eğer email verilmişse, o admin'in secret'ını kontrol et
            if (email) {
                const adminSecret = this.getAdminSecret(email);
                if (adminSecret && this.verifyToken(token, adminSecret)) {
                    SecurityService.clearFailedAttempts(identifier);
                    SecurityService.logSecurityEvent('TOTP_LOGIN_SUCCESS', { email });
                    return true;
                }
            }

            // 2. Master admin secret'ını kontrol et
            const masterSecret = SecurityService.getSecureItem('admin_totp_secret');
            if (masterSecret && this.verifyToken(token, masterSecret)) {
                SecurityService.clearFailedAttempts(identifier);
                SecurityService.logSecurityEvent('TOTP_MASTER_LOGIN_SUCCESS');
                return true;
            }



            // Başarısız deneme kaydet
            SecurityService.recordFailedAttempt(identifier);
            SecurityService.logSecurityEvent('TOTP_LOGIN_FAILED', { email, token: '***' });
            return false;
        } catch {
            return false;
        }
    }
}

export default TOTPService;