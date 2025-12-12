// Console güvenlik uyarısı - Sadece uyarı mesajı gösterir
export class ConsoleProtection {
    // Güvenlik mesajı göster
    static showSecurityMessage(): void {
        try {
            console.clear();
            console.log('%c🔒 GÜVENLİK UYARISI', 'color: red; font-size: 20px; font-weight: bold;');
            console.log('%cBu konsol geliştiriciler içindir. Bilinmeyen kodları buraya yapıştırmayın!', 'color: red; font-size: 14px;');
            console.log('%cKötü niyetli kişiler bu konsolu kullanarak hesabınızı ele geçirebilir.', 'color: red; font-size: 14px;');
            console.log('%c---', 'color: gray;');
        } catch {
            // Sessizce başarısız ol
        }
    }
    
    // Hassas veri loglamasını engelle
    static sanitizeLog(data: any): any {
        if (typeof data === 'string') {
            // Şifre, secret, token gibi hassas kelimeleri gizle
            return data
                .replace(/password[^:]*:[^,}]*/gi, 'password: "***"')
                .replace(/secret[^:]*:[^,}]*/gi, 'secret: "***"')
                .replace(/token[^:]*:[^,}]*/gi, 'token: "***"')
                .replace(/key[^:]*:[^,}]*/gi, 'key: "***"')
                .replace(/\b[A-Z2-7]{32}\b/g, '***SECRET***') // Base32 secret'ları
                .replace(/\b\d{6}\b/g, '***CODE***'); // 6 haneli kodları
        }
        
        if (typeof data === 'object' && data !== null) {
            const sanitized = { ...data };
            Object.keys(sanitized).forEach(key => {
                if (/password|secret|token|key/i.test(key)) {
                    sanitized[key] = '***';
                }
            });
            return sanitized;
        }
        
        return data;
    }
    
    // Güvenli console.log wrapper
    static safeLog(...args: any[]): void {
        try {
            const sanitizedArgs = args.map(arg => this.sanitizeLog(arg));
            console.log(...sanitizedArgs);
        } catch {
            console.log('[Log sanitization failed]');
        }
    }
    
    // Güvenli console.error wrapper
    static safeError(...args: any[]): void {
        try {
            const sanitizedArgs = args.map(arg => this.sanitizeLog(arg));
            console.error(...sanitizedArgs);
        } catch {
            console.error('[Error log sanitization failed]');
        }
    }
}

export default ConsoleProtection;