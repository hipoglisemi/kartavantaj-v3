import { logActivity } from './activityService';

interface SyncConfig {
    tableName: string;
    primaryKey: string;
    autoCreateTable?: boolean;
    realTimeSync?: boolean;
    syncInterval?: number; // milliseconds
}



class UniversalSyncService {
    private supabase: any = null;
    private syncConfigs: Map<string, SyncConfig> = new Map();
    private syncIntervals: Map<string, NodeJS.Timeout> = new Map();
    private realtimeSubscriptions: Map<string, any> = new Map();

    constructor() {
        this.initializeSupabase();
        this.setupDefaultConfigs();
    }

    private async initializeSupabase() {
        try {
            const supabaseUrl = localStorage.getItem('sb_url');
            const supabaseKey = localStorage.getItem('sb_key');
            
            if (supabaseUrl && supabaseKey) {
                const { createClient } = await import('@supabase/supabase-js');
                this.supabase = createClient(supabaseUrl, supabaseKey);
                console.log('✅ Universal Sync Service initialized');
            }
        } catch (error) {
            console.error('Failed to initialize Universal Sync Service:', error);
        }
    }

    private setupDefaultConfigs() {
        // Mevcut sistemler için default konfigürasyonlar
        this.registerSyncConfig('admin_settings', {
            tableName: 'admin_universal_data',
            primaryKey: 'admin_settings',
            autoCreateTable: true,
            realTimeSync: true,
            syncInterval: 5000 // 5 saniye
        });

        this.registerSyncConfig('admin_integrations', {
            tableName: 'admin_universal_data',
            primaryKey: 'admin_integrations',
            autoCreateTable: true,
            realTimeSync: true,
            syncInterval: 3000
        });

        this.registerSyncConfig('admin_security', {
            tableName: 'admin_universal_data',
            primaryKey: 'admin_security',
            autoCreateTable: true,
            realTimeSync: true,
            syncInterval: 10000
        });

        this.registerSyncConfig('admin_logos', {
            tableName: 'admin_universal_data',
            primaryKey: 'admin_logos',
            autoCreateTable: true,
            realTimeSync: true,
            syncInterval: 5000
        });

        this.registerSyncConfig('admin_campaigns', {
            tableName: 'admin_universal_data',
            primaryKey: 'admin_campaigns',
            autoCreateTable: true,
            realTimeSync: true,
            syncInterval: 3000
        });

        this.registerSyncConfig('admin_members', {
            tableName: 'admin_universal_data',
            primaryKey: 'admin_members',
            autoCreateTable: true,
            realTimeSync: true,
            syncInterval: 5000
        });

        this.registerSyncConfig('admin_analytics', {
            tableName: 'admin_universal_data',
            primaryKey: 'admin_analytics',
            autoCreateTable: true,
            realTimeSync: true,
            syncInterval: 30000 // 30 saniye
        });

        this.registerSyncConfig('admin_seo', {
            tableName: 'admin_universal_data',
            primaryKey: 'admin_seo',
            autoCreateTable: true,
            realTimeSync: true,
            syncInterval: 10000
        });

        this.registerSyncConfig('admin_design', {
            tableName: 'admin_universal_data',
            primaryKey: 'admin_design',
            autoCreateTable: true,
            realTimeSync: true,
            syncInterval: 5000
        });

        this.registerSyncConfig('admin_newsletter', {
            tableName: 'admin_universal_data',
            primaryKey: 'admin_newsletter',
            autoCreateTable: true,
            realTimeSync: true,
            syncInterval: 10000
        });
    }

    // Yeni sistem kaydetme
    registerSyncConfig(dataKey: string, config: SyncConfig) {
        this.syncConfigs.set(dataKey, config);
        
        if (config.realTimeSync) {
            this.setupRealtimeListener(dataKey, config);
        }
        
        if (config.syncInterval) {
            this.setupPeriodicSync(dataKey, config);
        }
    }

    // Universal tablo oluşturma
    private async ensureTableExists(tableName: string) {
        if (!this.supabase) return false;

        try {
            // Önce tablo var mı kontrol et
            const { data: tables } = await this.supabase
                .from('information_schema.tables')
                .select('table_name')
                .eq('table_schema', 'public')
                .eq('table_name', tableName);

            if (!tables || tables.length === 0) {
                console.log(`🔧 Creating table: ${tableName}`);
                
                // Universal tablo yapısı
                const createTableSQL = `
                    CREATE TABLE public.${tableName} (
                        id text PRIMARY KEY,
                        data_type text NOT NULL,
                        data_content jsonb NOT NULL DEFAULT '{}'::jsonb,
                        metadata jsonb DEFAULT '{}'::jsonb,
                        created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
                        updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
                        updated_by text,
                        version integer DEFAULT 1,
                        is_active boolean DEFAULT true
                    );
                    
                    -- Indexes for better performance
                    CREATE INDEX ${tableName}_data_type_idx ON public.${tableName} (data_type);
                    CREATE INDEX ${tableName}_updated_at_idx ON public.${tableName} (updated_at);
                    CREATE INDEX ${tableName}_active_idx ON public.${tableName} (is_active);
                    
                    -- Enable RLS
                    ALTER TABLE public.${tableName} ENABLE ROW LEVEL SECURITY;
                    
                    -- Policies
                    CREATE POLICY "Enable read access for all users" ON public.${tableName} FOR SELECT USING (true);
                    CREATE POLICY "Enable insert for all users" ON public.${tableName} FOR INSERT WITH CHECK (true);
                    CREATE POLICY "Enable update for all users" ON public.${tableName} FOR UPDATE USING (true);
                    CREATE POLICY "Enable delete for all users" ON public.${tableName} FOR DELETE USING (true);
                `;

                const { error } = await this.supabase.rpc('exec_sql', { sql: createTableSQL });
                
                if (error) {
                    console.error(`Failed to create table ${tableName}:`, error);
                    return false;
                }
                
                logActivity.system('Table Created', `Universal table ${tableName} created automatically`, 'success');
            }
            
            return true;
        } catch (error) {
            console.error(`Error ensuring table ${tableName}:`, error);
            return false;
        }
    }

    // Universal veri kaydetme
    async syncData(dataKey: string, data: any, metadata: any = {}) {
        if (!this.supabase) {
            console.log('Supabase not available, skipping sync for:', dataKey);
            return false;
        }

        const config = this.syncConfigs.get(dataKey);
        if (!config) {
            console.warn(`No sync config found for: ${dataKey}`);
            return false;
        }

        try {
            // Tablo var mı kontrol et, yoksa oluştur
            if (config.autoCreateTable) {
                await this.ensureTableExists(config.tableName);
            }

            const syncData = {
                id: config.primaryKey,
                data_type: dataKey,
                data_content: data,
                metadata: {
                    ...metadata,
                    sync_source: 'admin_panel',
                    admin_email: localStorage.getItem('admin_email') || 'unknown',
                    user_agent: navigator.userAgent,
                    timestamp: new Date().toISOString()
                },
                updated_at: new Date().toISOString(),
                updated_by: localStorage.getItem('admin_email') || 'unknown'
            };

            const { error } = await this.supabase
                .from(config.tableName)
                .upsert(syncData);

            if (error) {
                console.error(`Sync error for ${dataKey}:`, error);
                logActivity.system('Sync Failed', `Failed to sync ${dataKey}: ${error.message}`, 'error');
                return false;
            }

            console.log(`✅ Synced ${dataKey} to ${config.tableName}`);
            logActivity.system('Data Synced', `${dataKey} synced to Supabase`, 'success');
            return true;

        } catch (error) {
            console.error(`Sync failed for ${dataKey}:`, error);
            logActivity.system('Sync Error', `Sync error for ${dataKey}: ${error}`, 'error');
            return false;
        }
    }

    // Universal veri yükleme
    async loadData(dataKey: string): Promise<any | null> {
        if (!this.supabase) return null;

        const config = this.syncConfigs.get(dataKey);
        if (!config) return null;

        try {
            const { data, error } = await this.supabase
                .from(config.tableName)
                .select('data_content, metadata, updated_at')
                .eq('id', config.primaryKey)
                .eq('data_type', dataKey)
                .eq('is_active', true)
                .single();

            if (error) {
                console.log(`No remote data found for ${dataKey}:`, error.message);
                return null;
            }

            console.log(`🔄 Loaded ${dataKey} from Supabase`);
            return data.data_content;

        } catch (error) {
            console.error(`Load failed for ${dataKey}:`, error);
            return null;
        }
    }

    // Real-time dinleme kurulumu
    private setupRealtimeListener(dataKey: string, config: SyncConfig) {
        if (!this.supabase) return;

        try {
            const subscription = this.supabase
                .channel(`${config.tableName}_${dataKey}_changes`)
                .on('postgres_changes', 
                    { 
                        event: '*', 
                        schema: 'public', 
                        table: config.tableName,
                        filter: `data_type=eq.${dataKey}`
                    },
                    async (payload: any) => {
                        console.log(`🔔 Real-time change detected for ${dataKey}:`, payload);
                        
                        // Değişikliği localStorage'a uygula
                        if (payload.new && payload.new.data_content) {
                            const storageKey = this.getStorageKey(dataKey);
                            localStorage.setItem(storageKey, JSON.stringify(payload.new.data_content));
                            
                            // Event dispatch et
                            window.dispatchEvent(new CustomEvent(`${dataKey}-updated`, {
                                detail: payload.new.data_content
                            }));
                            
                            logActivity.system('Real-time Update', `${dataKey} updated via real-time sync`, 'info');
                        }
                    }
                )
                .subscribe();
                
            this.realtimeSubscriptions.set(dataKey, subscription);
            console.log(`🔴 Real-time listener setup for ${dataKey}`);

        } catch (error) {
            console.error(`Failed to setup real-time listener for ${dataKey}:`, error);
        }
    }

    // Periyodik senkronizasyon
    private setupPeriodicSync(dataKey: string, config: SyncConfig) {
        if (config.syncInterval) {
            const interval = setInterval(async () => {
                const storageKey = this.getStorageKey(dataKey);
                const localData = localStorage.getItem(storageKey);
                
                if (localData) {
                    try {
                        const parsedData = JSON.parse(localData);
                        await this.syncData(dataKey, parsedData, { 
                            sync_type: 'periodic',
                            interval: config.syncInterval 
                        });
                    } catch (error) {
                        console.error(`Periodic sync failed for ${dataKey}:`, error);
                    }
                }
            }, config.syncInterval);
            
            this.syncIntervals.set(dataKey, interval);
            console.log(`⏰ Periodic sync setup for ${dataKey} (${config.syncInterval}ms)`);
        }
    }

    // Storage key mapping
    private getStorageKey(dataKey: string): string {
        const keyMap: { [key: string]: string } = {
            'admin_settings': 'site_settings',
            'admin_integrations': 'adminIntegrations',
            'admin_security': 'admin_security_settings',
            'admin_logos': 'scraper_config',
            'admin_campaigns': 'campaigns',
            'admin_members': 'admin_members',
            'admin_analytics': 'admin_analytics',
            'admin_seo': 'seo_settings',
            'admin_design': 'design_settings',
            'admin_newsletter': 'newsletter_settings'
        };
        
        return keyMap[dataKey] || dataKey;
    }

    // Yeni sistem otomatik kaydetme
    autoRegisterNewSystem(dataKey: string, customConfig?: Partial<SyncConfig>) {
        const defaultConfig: SyncConfig = {
            tableName: 'admin_universal_data',
            primaryKey: dataKey,
            autoCreateTable: true,
            realTimeSync: true,
            syncInterval: 5000
        };

        const finalConfig = { ...defaultConfig, ...customConfig };
        this.registerSyncConfig(dataKey, finalConfig);
        
        logActivity.system('New System Registered', `Auto-registered new system: ${dataKey}`, 'info');
        console.log(`🆕 Auto-registered new system: ${dataKey}`);
    }

    // Tüm senkronizasyonları durdur
    stopAllSync() {
        // Intervals'ı temizle
        this.syncIntervals.forEach((interval, key) => {
            clearInterval(interval);
            console.log(`⏹️ Stopped periodic sync for ${key}`);
        });
        this.syncIntervals.clear();

        // Real-time subscriptions'ı kapat
        this.realtimeSubscriptions.forEach((subscription, key) => {
            subscription.unsubscribe();
            console.log(`🔴 Stopped real-time sync for ${key}`);
        });
        this.realtimeSubscriptions.clear();
    }

    // Sistem durumu
    getSystemStatus() {
        return {
            supabaseConnected: !!this.supabase,
            registeredSystems: Array.from(this.syncConfigs.keys()),
            activeSyncs: Array.from(this.syncIntervals.keys()),
            activeRealtimeListeners: Array.from(this.realtimeSubscriptions.keys())
        };
    }
}

// Global instance
export const universalSync = new UniversalSyncService();

// Helper fonksiyonlar
export const syncToSupabase = (dataKey: string, data: any, metadata?: any) => {
    return universalSync.syncData(dataKey, data, metadata);
};

export const loadFromSupabase = (dataKey: string) => {
    return universalSync.loadData(dataKey);
};

export const registerNewSystem = (dataKey: string, config?: Partial<SyncConfig>) => {
    return universalSync.autoRegisterNewSystem(dataKey, config);
};

// Auto-sync wrapper for localStorage
export const autoSyncLocalStorage = (key: string, value: any, dataKey?: string) => {
    localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
    
    // Otomatik senkronizasyon
    const syncKey = dataKey || key;
    syncToSupabase(syncKey, value, { 
        storage_key: key,
        auto_sync: true 
    });
};