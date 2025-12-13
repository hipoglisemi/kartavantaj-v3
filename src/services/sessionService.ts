import { logActivity } from './activityService';

interface SessionData {
    adminEmail: string;
    loginTime: Date;
    lastActivity: Date;
    ipAddress?: string;
    userAgent?: string;
    sessionId: string;
}

class SessionService {
    private readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 dakika
    private readonly WARNING_TIME = 5 * 60 * 1000; // 5 dakika kala uyarı
    private sessionData: SessionData | null = null;
    private timeoutWarningShown = false;
    private checkInterval: NodeJS.Timeout | null = null;

    constructor() {
        this.loadSession();
        this.startSessionCheck();
        this.setupActivityListeners();
    }

    private loadSession() {
        try {
            const stored = localStorage.getItem('admin_session');
            if (stored) {
                const parsed = JSON.parse(stored);
                this.sessionData = {
                    ...parsed,
                    loginTime: new Date(parsed.loginTime),
                    lastActivity: new Date(parsed.lastActivity)
                };
            }
        } catch (error) {
            console.error('Error loading session:', error);
            this.clearSession();
        }
    }

    private saveSession() {
        if (this.sessionData) {
            localStorage.setItem('admin_session', JSON.stringify(this.sessionData));
        }
    }

    private setupActivityListeners() {
        // Kullanıcı aktivitelerini dinle
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        
        events.forEach(event => {
            document.addEventListener(event, () => {
                this.updateActivity();
            }, { passive: true });
        });

        // Sayfa değişikliklerini dinle
        window.addEventListener('beforeunload', () => {
            this.updateActivity();
        });
    }

    private startSessionCheck() {
        // Her dakika session kontrolü yap
        this.checkInterval = setInterval(() => {
            this.checkSessionTimeout();
        }, 60 * 1000);
    }

    private checkSessionTimeout() {
        if (!this.sessionData) return;

        const now = new Date();
        const timeSinceActivity = now.getTime() - this.sessionData.lastActivity.getTime();
        const timeUntilTimeout = this.SESSION_TIMEOUT - timeSinceActivity;

        // Uyarı zamanı geldi mi?
        if (timeUntilTimeout <= this.WARNING_TIME && !this.timeoutWarningShown) {
            this.showTimeoutWarning(Math.ceil(timeUntilTimeout / 60000));
            this.timeoutWarningShown = true;
        }

        // Session süresi doldu mu?
        if (timeSinceActivity >= this.SESSION_TIMEOUT) {
            this.handleSessionTimeout();
        }
    }

    private showTimeoutWarning(minutesLeft: number) {
        const extend = confirm(
            `Oturumunuz ${minutesLeft} dakika içinde sona erecek. Devam etmek istiyor musunuz?`
        );

        if (extend) {
            this.updateActivity();
            this.timeoutWarningShown = false;
            logActivity.auth('Session Extended', `Session extended by user action`, 'info');
        } else {
            this.handleSessionTimeout();
        }
    }

    private handleSessionTimeout() {
        logActivity.auth('Session Timeout', `Session expired for ${this.sessionData?.adminEmail}`, 'warning');
        
        alert('Oturumunuz güvenlik nedeniyle sonlandırıldı. Lütfen tekrar giriş yapın.');
        
        this.clearSession();
        window.location.href = '/panel/login';
    }

    createSession(adminEmail: string): string {
        const sessionId = this.generateSessionId();
        
        this.sessionData = {
            adminEmail,
            loginTime: new Date(),
            lastActivity: new Date(),
            sessionId,
            ipAddress: this.getClientIP(),
            userAgent: navigator.userAgent
        };

        this.saveSession();
        this.timeoutWarningShown = false;

        logActivity.auth('Session Created', `New session created for ${adminEmail}`, 'success');
        
        return sessionId;
    }

    updateActivity() {
        if (this.sessionData) {
            this.sessionData.lastActivity = new Date();
            this.saveSession();
            this.timeoutWarningShown = false;
        }
    }

    clearSession() {
        if (this.sessionData) {
            logActivity.auth('Session Cleared', `Session cleared for ${this.sessionData.adminEmail}`, 'info');
        }

        this.sessionData = null;
        localStorage.removeItem('admin_session');
        localStorage.removeItem('isAdmin');
        localStorage.removeItem('admin_last_login');
        localStorage.removeItem('admin_email');
    }

    isValidSession(): boolean {
        if (!this.sessionData) return false;

        const now = new Date();
        const timeSinceActivity = now.getTime() - this.sessionData.lastActivity.getTime();
        
        return timeSinceActivity < this.SESSION_TIMEOUT;
    }

    getSessionInfo(): SessionData | null {
        return this.sessionData;
    }

    getSessionDuration(): number {
        if (!this.sessionData) return 0;
        
        const now = new Date();
        return now.getTime() - this.sessionData.loginTime.getTime();
    }

    getRemainingTime(): number {
        if (!this.sessionData) return 0;
        
        const now = new Date();
        const timeSinceActivity = now.getTime() - this.sessionData.lastActivity.getTime();
        
        return Math.max(0, this.SESSION_TIMEOUT - timeSinceActivity);
    }

    private generateSessionId(): string {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }

    private getClientIP(): string {
        // Gerçek IP almak için external service kullanılabilir
        return 'Unknown IP';
    }

    // Cleanup
    destroy() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }
    }
}

export const sessionService = new SessionService();

// IP Whitelist Service
class IPWhitelistService {
    private readonly STORAGE_KEY = 'admin_ip_whitelist';
    private whitelist: string[] = [];

    constructor() {
        this.loadWhitelist();
    }

    private loadWhitelist() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                this.whitelist = JSON.parse(stored);
            }
        } catch (error) {
            console.error('Error loading IP whitelist:', error);
        }
    }

    private saveWhitelist() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.whitelist));
    }

    addIP(ip: string): boolean {
        if (!this.isValidIP(ip)) return false;
        
        if (!this.whitelist.includes(ip)) {
            this.whitelist.push(ip);
            this.saveWhitelist();
            logActivity.system('IP Added', `IP ${ip} added to whitelist`, 'info');
            return true;
        }
        return false;
    }

    removeIP(ip: string): boolean {
        const index = this.whitelist.indexOf(ip);
        if (index > -1) {
            this.whitelist.splice(index, 1);
            this.saveWhitelist();
            logActivity.system('IP Removed', `IP ${ip} removed from whitelist`, 'warning');
            return true;
        }
        return false;
    }

    isIPAllowed(ip: string): boolean {
        // Whitelist boşsa tüm IP'lere izin ver
        if (this.whitelist.length === 0) return true;
        
        return this.whitelist.includes(ip);
    }

    getWhitelist(): string[] {
        return [...this.whitelist];
    }

    clearWhitelist() {
        this.whitelist = [];
        this.saveWhitelist();
        logActivity.system('IP Whitelist Cleared', 'All IPs removed from whitelist', 'warning');
    }

    private isValidIP(ip: string): boolean {
        const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        return ipRegex.test(ip);
    }
}

export const ipWhitelistService = new IPWhitelistService();