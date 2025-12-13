interface VersionInfo {
    version: string;
    date: string;
    changes: string[];
    type: 'major' | 'minor' | 'patch';
}

interface VersionHistory {
    current: string;
    history: VersionInfo[];
}

class VersionService {
    private storageKey = 'app_version_history';
    
    // Mevcut versiyon
    private currentVersion = '3.0.0';
    
    // Varsayılan versiyon geçmişi
    private defaultHistory: VersionHistory = {
        current: this.currentVersion,
        history: [
            {
                version: '3.0.0',
                date: '2025-01-01',
                changes: [
                    'Gerçek Zamanlı Senkronizasyon sistemi',
                    'Akıllı Kampanya Doğrulama sistemi',
                    'Dropdown menü yapısı',
                    'Modern admin paneli tasarımı',
                    'Email tabanlı admin sistemi',
                    '2FA güvenlik sistemi'
                ],
                type: 'major'
            }
        ]
    };

    // Versiyon geçmişini yükle
    getVersionHistory(): VersionHistory {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch {
                return this.defaultHistory;
            }
        }
        return this.defaultHistory;
    }

    // Versiyon geçmişini kaydet
    saveVersionHistory(history: VersionHistory): void {
        localStorage.setItem(this.storageKey, JSON.stringify(history));
        
        // Supabase'e de kaydet (eğer bağlantı varsa)
        this.syncToSupabase(history);
    }

    // Yeni versiyon ekle
    addVersion(changes: string[], type: 'major' | 'minor' | 'patch' = 'patch'): string {
        const history = this.getVersionHistory();
        const currentParts = history.current.split('.').map(Number);
        
        // Versiyon numarasını artır
        switch (type) {
            case 'major':
                currentParts[0]++;
                currentParts[1] = 0;
                currentParts[2] = 0;
                break;
            case 'minor':
                currentParts[1]++;
                currentParts[2] = 0;
                break;
            case 'patch':
                currentParts[2]++;
                break;
        }
        
        const newVersion = currentParts.join('.');
        const newVersionInfo: VersionInfo = {
            version: newVersion,
            date: new Date().toISOString().split('T')[0],
            changes,
            type
        };
        
        // Geçmişe ekle (en yeni başta)
        history.history.unshift(newVersionInfo);
        history.current = newVersion;
        
        // Sadece son 50 versiyonu tut
        if (history.history.length > 50) {
            history.history = history.history.slice(0, 50);
        }
        
        this.saveVersionHistory(history);
        this.currentVersion = newVersion;
        
        return newVersion;
    }

    // Mevcut versiyonu al
    getCurrentVersion(): string {
        return this.getVersionHistory().current;
    }

    // Otomatik versiyon güncelleme (commit mesajından)
    autoUpdateVersion(commitMessage: string): string | null {
        const history = this.getVersionHistory();
        
        // Commit mesajından değişiklikleri çıkar
        const changes = this.parseCommitMessage(commitMessage);
        if (changes.length === 0) return null;
        
        // Versiyon tipini belirle
        let type: 'major' | 'minor' | 'patch' = 'patch';
        
        if (commitMessage.includes('BREAKING') || commitMessage.includes('major')) {
            type = 'major';
        } else if (commitMessage.includes('feat') || commitMessage.includes('✨') || commitMessage.includes('minor')) {
            type = 'minor';
        }
        
        return this.addVersion(changes, type);
    }

    // Commit mesajını parse et
    private parseCommitMessage(message: string): string[] {
        const changes: string[] = [];
        
        // Emoji ve anahtar kelimelere göre değişiklikleri çıkar
        if (message.includes('✨')) {
            changes.push('Yeni özellik eklendi');
        }
        if (message.includes('🐛')) {
            changes.push('Hata düzeltmeleri');
        }
        if (message.includes('🎨')) {
            changes.push('Tasarım iyileştirmeleri');
        }
        if (message.includes('⚡')) {
            changes.push('Performans iyileştirmeleri');
        }
        if (message.includes('🔒')) {
            changes.push('Güvenlik güncellemeleri');
        }
        if (message.includes('📱')) {
            changes.push('Mobil uyumluluk iyileştirmeleri');
        }
        
        // Genel açıklama ekle
        const cleanMessage = message.replace(/[✨🐛🎨⚡🔒📱]/g, '').trim();
        if (cleanMessage && !changes.some(c => cleanMessage.includes(c))) {
            changes.push(cleanMessage);
        }
        
        return changes.filter(c => c.length > 0);
    }

    // Supabase'e senkronize et
    private async syncToSupabase(history: VersionHistory): Promise<void> {
        const supabaseUrl = localStorage.getItem('sb_url');
        const supabaseKey = localStorage.getItem('sb_key');
        
        if (!supabaseUrl || !supabaseKey) return;
        
        try {
            const { createClient } = await import('@supabase/supabase-js');
            const supabase = createClient(supabaseUrl, supabaseKey);
            
            // Version history tablosuna kaydet
            await supabase
                .from('app_versions')
                .upsert({
                    id: 1,
                    current_version: history.current,
                    version_history: history.history,
                    updated_at: new Date().toISOString()
                });
                
            console.log('📦 Version history synced to Supabase');
        } catch (error) {
            console.warn('Failed to sync version history to Supabase:', error);
        }
    }

    // Supabase'den yükle
    async loadFromSupabase(): Promise<VersionHistory | null> {
        const supabaseUrl = localStorage.getItem('sb_url');
        const supabaseKey = localStorage.getItem('sb_key');
        
        if (!supabaseUrl || !supabaseKey) return null;
        
        try {
            const { createClient } = await import('@supabase/supabase-js');
            const supabase = createClient(supabaseUrl, supabaseKey);
            
            const { data, error } = await supabase
                .from('app_versions')
                .select('*')
                .eq('id', 1)
                .single();
                
            if (error || !data) return null;
            
            const history: VersionHistory = {
                current: data.current_version,
                history: data.version_history || []
            };
            
            // Local'e de kaydet
            this.saveVersionHistory(history);
            
            return history;
        } catch (error) {
            console.warn('Failed to load version history from Supabase:', error);
            return null;
        }
    }

    // Versiyon karşılaştırma
    compareVersions(v1: string, v2: string): number {
        const parts1 = v1.split('.').map(Number);
        const parts2 = v2.split('.').map(Number);
        
        for (let i = 0; i < 3; i++) {
            if (parts1[i] > parts2[i]) return 1;
            if (parts1[i] < parts2[i]) return -1;
        }
        
        return 0;
    }

    // Versiyon tipine göre renk al
    getVersionTypeColor(type: 'major' | 'minor' | 'patch'): string {
        switch (type) {
            case 'major': return 'bg-red-100 text-red-700 border-red-200';
            case 'minor': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'patch': return 'bg-green-100 text-green-700 border-green-200';
        }
    }

    // Versiyon tipine göre ikon al
    getVersionTypeIcon(type: 'major' | 'minor' | 'patch'): string {
        switch (type) {
            case 'major': return '🚀';
            case 'minor': return '✨';
            case 'patch': return '🔧';
        }
    }
}

export const versionService = new VersionService();
export type { VersionInfo, VersionHistory };