// Güvenlik servisi - Hassas verileri şifreler ve korur
export class SecurityService {
    private static readonly ENCRYPTION_KEY = 'KA_SECURE_2024';
    
    // Basit XOR şifreleme (production'da daha güçlü algoritma kullanılmalı)
    static encrypt(text: string): string {
        try {
            let result = '';
            for (let i = 0; i < text.length; i++) {
                result += String.fromCharCode(
                    text.charCodeAt(i) ^ this.ENCRYPTION_KEY.charCodeAt(i % this.ENCRYPTION_KEY.length)
                );
            }
            return btoa(result); // Base64 encode
        } catch {
            return text; // Fallback
        }
    }
    
    // Şifre çözme
    static decrypt(encryptedText: string): string {
        try {
            const decoded = atob(encryptedText); // Base64 decode
            let result = '';
            for (let i = 0; i < decoded.length; i++) {
                result += String.fromCharCode(
                    decoded.charCodeAt(i) ^ this.ENCRYPTION_KEY.charCodeAt(i % this.ENCRYPTION_KEY.length)
                );
            }
            return result;
        } catch {
            return encryptedText; // Fallback
        }
    }
    
    // Güvenli localStorage işlemleri
    static setSecureItem(key: string, value: string): void {
        try {
            const encrypted = this.encrypt(value);
            localStorage.setItem(`secure_${key}`, encrypted);
        } catch {
            // Sessizce başarısız ol
        }
    }
    
    static getSecureItem(key: string): string | null {
        try {
            const encrypted = localStorage.getItem(`secure_${key}`);
            if (!encrypted) return null;
            return this.decrypt(encrypted);
        } catch {
            return null;
        }
    }
    
    static removeSecureItem(key: string): void {
        try {
            localStorage.removeItem(`secure_${key}`);
        } catch {
            // Sessizce başarısız ol
        }
    }
    
    // Admin session kontrolü
    static isValidAdminSession(): boolean {
        try {
            const sessionToken = this.getSecureItem('admin_session');
            const sessionTime = this.getSecureItem('admin_session_time');
            
            if (!sessionToken || !sessionTime) return false;
            
            const currentTime = Date.now();
            const sessionStartTime = parseInt(sessionTime);
            const sessionDuration = 8 * 60 * 60 * 1000; // 8 saat
            
            return (currentTime - sessionStartTime) < sessionDuration;
        } catch {
            return false;
        }
    }
    
    // Admin session oluştur
    static createAdminSession(): void {
        try {
            const sessionToken = this.generateSessionToken();
            const currentTime = Date.now().toString();
            
            this.setSecureItem('admin_session', sessionToken);
            this.setSecureItem('admin_session_time', currentTime);
        } catch {
            // Sessizce başarısız ol
        }
    }
    
    // Admin session sonlandır
    static destroyAdminSession(): void {
        try {
            this.removeSecureItem('admin_session');
            this.removeSecureItem('admin_session_time');
            localStorage.removeItem('isAdmin');
        } catch {
            // Sessizce başarısız ol
        }
    }
    
    // Session token oluştur
    private static generateSessionToken(): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let token = '';
        for (let i = 0; i < 32; i++) {
            token += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return token;
    }
    
    // Güvenlik logları (production'da server'a gönderilmeli)
    static logSecurityEvent(event: string, details?: any): void {
        try {
            const logEntry = {
                timestamp: new Date().toISOString(),
                event,
                details: details ? JSON.stringify(details) : undefined,
                userAgent: navigator.userAgent,
                url: window.location.href
            };
            
            // Sadece kritik güvenlik olaylarını logla
            if (event.includes('UNAUTHORIZED') || event.includes('FAILED')) {
                const logs = JSON.parse(localStorage.getItem('security_logs') || '[]');
                logs.push(logEntry);
                
                // Son 100 log'u tut
                if (logs.length > 100) logs.splice(0, logs.length - 100);
                localStorage.setItem('security_logs', JSON.stringify(logs));
            }
        } catch {
            // Sessizce başarısız ol
        }
    }
    
    // Brute force koruması
    static checkBruteForce(identifier: string): boolean {
        try {
            const attempts = JSON.parse(localStorage.getItem('login_attempts') || '{}');
            const currentTime = Date.now();
            const maxAttempts = 5;
            const lockoutTime = 15 * 60 * 1000; // 15 dakika
            
            if (attempts[identifier]) {
                const { count, lastAttempt } = attempts[identifier];
                
                // Lockout süresi geçtiyse sıfırla
                if (currentTime - lastAttempt > lockoutTime) {
                    delete attempts[identifier];
                    localStorage.setItem('login_attempts', JSON.stringify(attempts));
                    return true;
                }
                
                // Max deneme sayısına ulaşıldıysa engelle
                if (count >= maxAttempts) {
                    return false;
                }
            }
            
            return true;
        } catch {
            return true; // Hata durumunda izin ver
        }
    }
    
    // Başarısız giriş denemesi kaydet
    static recordFailedAttempt(identifier: string): void {
        try {
            const attempts = JSON.parse(localStorage.getItem('login_attempts') || '{}');
            const currentTime = Date.now();
            
            if (attempts[identifier]) {
                attempts[identifier].count++;
                attempts[identifier].lastAttempt = currentTime;
            } else {
                attempts[identifier] = { count: 1, lastAttempt: currentTime };
            }
            
            localStorage.setItem('login_attempts', JSON.stringify(attempts));
        } catch {
            // Sessizce başarısız ol
        }
    }
    
    // Başarılı giriş sonrası temizle
    static clearFailedAttempts(identifier: string): void {
        try {
            const attempts = JSON.parse(localStorage.getItem('login_attempts') || '{}');
            delete attempts[identifier];
            localStorage.setItem('login_attempts', JSON.stringify(attempts));
        } catch {
            // Sessizce başarısız ol
        }
    }
}

export default SecurityService;