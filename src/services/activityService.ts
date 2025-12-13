export interface ActivityLog {
    id: string;
    timestamp: Date;
    adminEmail: string;
    action: string;
    details: string;
    category: 'auth' | 'campaign' | 'user' | 'system' | 'settings';
    severity: 'info' | 'warning' | 'error' | 'success';
    ipAddress?: string;
    userAgent?: string;
}

class ActivityService {
    private logs: ActivityLog[] = [];
    private readonly MAX_LOGS = 1000;
    private readonly STORAGE_KEY = 'admin_activity_logs';

    constructor() {
        this.loadLogs();
        this.startPeriodicSync();
    }

    private loadLogs() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                this.logs = parsed.map((log: any) => ({
                    ...log,
                    timestamp: new Date(log.timestamp)
                }));
            }
        } catch (error) {
            console.error('Error loading activity logs:', error);
        }
    }

    private saveLogs() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.logs));
            this.syncToSupabase();
        } catch (error) {
            console.error('Error saving activity logs:', error);
        }
    }

    private async syncToSupabase() {
        // Supabase'e senkronize et (opsiyonel)
        try {
            const supabaseUrl = localStorage.getItem('sb_url');
            const supabaseKey = localStorage.getItem('sb_key');
            
            if (supabaseUrl && supabaseKey) {
                // Supabase sync logic burada olacak
                console.log('Activity logs synced to Supabase');
            }
        } catch (error) {
            console.error('Supabase sync error:', error);
        }
    }

    private startPeriodicSync() {
        // Her 5 dakikada bir Supabase'e sync
        setInterval(() => {
            this.syncToSupabase();
        }, 5 * 60 * 1000);
    }

    log(action: string, details: string, category: ActivityLog['category'], severity: ActivityLog['severity'] = 'info') {
        const adminEmail = localStorage.getItem('admin_email') || 'Unknown';
        
        const newLog: ActivityLog = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            timestamp: new Date(),
            adminEmail,
            action,
            details,
            category,
            severity,
            ipAddress: this.getClientIP(),
            userAgent: navigator.userAgent
        };

        this.logs.unshift(newLog);

        // Maksimum log sayısını aş
        if (this.logs.length > this.MAX_LOGS) {
            this.logs = this.logs.slice(0, this.MAX_LOGS);
        }

        this.saveLogs();

        // Kritik olayları console'a da yazdır
        if (severity === 'error' || severity === 'warning') {
            console.warn(`[ADMIN LOG] ${action}: ${details}`);
        }
    }

    private getClientIP(): string {
        // Gerçek IP almak için external service kullanılabilir
        return 'Client IP'; // Placeholder
    }

    getLogs(limit?: number, category?: ActivityLog['category']): ActivityLog[] {
        let filtered = [...this.logs];

        if (category) {
            filtered = filtered.filter(log => log.category === category);
        }

        if (limit) {
            filtered = filtered.slice(0, limit);
        }

        return filtered;
    }

    getLogsByDateRange(startDate: Date, endDate: Date): ActivityLog[] {
        return this.logs.filter(log => 
            log.timestamp >= startDate && log.timestamp <= endDate
        );
    }

    getLogsByAdmin(adminEmail: string): ActivityLog[] {
        return this.logs.filter(log => log.adminEmail === adminEmail);
    }

    clearLogs() {
        this.log('System', 'Activity logs cleared', 'system', 'warning');
        this.logs = this.logs.slice(0, 1); // Son log'u (temizleme işlemini) sakla
        this.saveLogs();
    }

    exportLogs(): string {
        return JSON.stringify(this.logs, null, 2);
    }

    getStats() {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        return {
            total: this.logs.length,
            today: this.logs.filter(log => log.timestamp >= today).length,
            thisWeek: this.logs.filter(log => log.timestamp >= thisWeek).length,
            byCategory: {
                auth: this.logs.filter(log => log.category === 'auth').length,
                campaign: this.logs.filter(log => log.category === 'campaign').length,
                user: this.logs.filter(log => log.category === 'user').length,
                system: this.logs.filter(log => log.category === 'system').length,
                settings: this.logs.filter(log => log.category === 'settings').length,
            },
            bySeverity: {
                info: this.logs.filter(log => log.severity === 'info').length,
                success: this.logs.filter(log => log.severity === 'success').length,
                warning: this.logs.filter(log => log.severity === 'warning').length,
                error: this.logs.filter(log => log.severity === 'error').length,
            }
        };
    }
}

export const activityService = new ActivityService();

// Kolay kullanım için helper fonksiyonlar
export const logActivity = {
    auth: (action: string, details: string, severity?: ActivityLog['severity']) => 
        activityService.log(action, details, 'auth', severity),
    
    campaign: (action: string, details: string, severity?: ActivityLog['severity']) => 
        activityService.log(action, details, 'campaign', severity),
    
    user: (action: string, details: string, severity?: ActivityLog['severity']) => 
        activityService.log(action, details, 'user', severity),
    
    system: (action: string, details: string, severity?: ActivityLog['severity']) => 
        activityService.log(action, details, 'system', severity),
    
    settings: (action: string, details: string, severity?: ActivityLog['severity']) => 
        activityService.log(action, details, 'settings', severity),
};