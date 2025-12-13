import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Save, RefreshCw, UploadCloud } from 'lucide-react';
import { syncToSupabase, loadFromSupabase } from '../../services/universalSyncService';

type ServiceType = 'supabase' | 'github' | 'vercel' | 'gemini' | 'googleads';

interface ServiceConfig {
    connected: boolean;
    [key: string]: any;
}

export default function AdminIntegrations() {
    const [configs, setConfigs] = useState<Record<ServiceType, ServiceConfig> | null>(null);
    const [loading, setLoading] = useState(true);

    // Initialize default configs
    const getDefaultConfigs = (): Record<ServiceType, ServiceConfig> => ({
        supabase: { connected: false, url: '', key: '' },
        github: { connected: false, repo: '', token: '' },
        vercel: { connected: false, token: '', project: '' },
        gemini: { connected: false, apiKey: '' },
        googleads: { connected: false, enabled: false, clientId: '', slotId: '' }
    });

    // Supabase senkronizasyon fonksiyonu
    const syncIntegrationsToSupabase = async (integrationConfigs: Record<ServiceType, ServiceConfig>) => {
        try {
            const supabaseUrl = localStorage.getItem('sb_url');
            const supabaseKey = localStorage.getItem('sb_key');
            
            if (!supabaseUrl || !supabaseKey) {
                console.log('Supabase credentials not found, skipping sync');
                return;
            }

            const { createClient } = await import('@supabase/supabase-js');
            const supabase = createClient(supabaseUrl, supabaseKey);
            
            // Admin integrations tablosuna kaydet
            const { error } = await supabase
                .from('admin_integrations')
                .upsert({
                    id: 'main',
                    configs: integrationConfigs,
                    updated_at: new Date().toISOString(),
                    updated_by: localStorage.getItem('admin_email') || 'unknown'
                });

            if (error) {
                console.error('Supabase sync error:', error);
            } else {
                console.log('✅ Integrations synced to Supabase');
            }
        } catch (error) {
            console.error('Supabase sync failed:', error);
        }
    };

    // Supabase'den entegrasyon ayarlarını yükle
    const loadIntegrationsFromSupabase = async () => {
        try {
            const supabaseUrl = localStorage.getItem('sb_url');
            const supabaseKey = localStorage.getItem('sb_key');
            
            if (!supabaseUrl || !supabaseKey) return null;

            const { createClient } = await import('@supabase/supabase-js');
            const supabase = createClient(supabaseUrl, supabaseKey);
            
            const { data, error } = await supabase
                .from('admin_integrations')
                .select('configs')
                .eq('id', 'main')
                .single();

            if (error) {
                console.log('No remote integrations found:', error.message);
                return null;
            }

            return data?.configs || null;
        } catch (error) {
            console.error('Failed to load integrations from Supabase:', error);
            return null;
        }
    };

    // Load from localStorage on mount
    useEffect(() => {
        const loadConfigs = async () => {
            try {
                // Önce Universal sync'den yükle
                const remoteConfigs = await loadFromSupabase('admin_integrations');
                
                if (remoteConfigs) {
                    console.log('🔄 Loading integrations from Supabase');
                    const defaultConfigs = getDefaultConfigs();
                    const mergedConfigs = { ...defaultConfigs, ...remoteConfigs };
                    setConfigs(mergedConfigs);
                    localStorage.setItem('adminIntegrations', JSON.stringify(mergedConfigs));
                    return;
                }

                // Supabase'de yoksa localStorage'dan yükle
                const stored = localStorage.getItem('adminIntegrations');
                if (stored) {
                    const parsedConfigs = JSON.parse(stored);
                    // Ensure all required services exist
                    const defaultConfigs = getDefaultConfigs();
                    const mergedConfigs = { ...defaultConfigs, ...parsedConfigs };
                    setConfigs(mergedConfigs);
                    
                    // İlk kez Universal sync'e kaydet
                    syncToSupabase('admin_integrations', mergedConfigs, { 
                        action: 'initial_sync',
                        source: 'localStorage'
                    });
                } else {
                // Load existing keys from localStorage
                const adConfigStr = localStorage.getItem('ad_config') || '{}';
                let adConfig = {};
                try {
                    adConfig = JSON.parse(adConfigStr);
                } catch {
                    adConfig = {};
                }

                const initialConfigs = {
                    supabase: {
                        connected: !!localStorage.getItem('sb_url'),
                        url: localStorage.getItem('sb_url') || '',
                        key: localStorage.getItem('sb_key') || ''
                    },
                    github: {
                        connected: !!localStorage.getItem('github_token'),
                        token: localStorage.getItem('github_token') || '',
                        repo: ''
                    },
                    vercel: {
                        connected: !!localStorage.getItem('vercel_token'),
                        token: localStorage.getItem('vercel_token') || '',
                        project: ''
                    },
                    gemini: {
                        connected: !!localStorage.getItem('gemini_key'),
                        apiKey: localStorage.getItem('gemini_key') || ''
                    },
                    googleads: {
                        connected: !!localStorage.getItem('ad_config'),
                        enabled: (adConfig as any).enabled || false,
                        clientId: (adConfig as any).clientId || '',
                        slotId: (adConfig as any).slotId || ''
                    }
                };
                    setConfigs(initialConfigs);
                    
                    // İlk kez Universal sync'e kaydet
                    syncToSupabase('admin_integrations', initialConfigs, { 
                        action: 'initial_setup',
                        source: 'default_config'
                    });
                }
            } catch (error) {
                console.error('Error loading integrations:', error);
                setConfigs(getDefaultConfigs());
            } finally {
                setLoading(false);
            }
        };

        loadConfigs();
    }, []);

    const handleConnect = (service: ServiceType) => {
        if (!configs) return;
        
        // Simulate connection check
        const newConfigs = { ...configs };
        newConfigs[service].connected = true;
        setConfigs(newConfigs);
        localStorage.setItem('adminIntegrations', JSON.stringify(newConfigs));
        
        // Universal sync
        syncToSupabase('admin_integrations', newConfigs, { 
            action: 'service_connect',
            service: service
        });

        // Save individual keys for compatibility
        if (service === 'supabase') {
            if (newConfigs.supabase.url) localStorage.setItem('sb_url', newConfigs.supabase.url);
            if (newConfigs.supabase.key) localStorage.setItem('sb_key', newConfigs.supabase.key);
            // Reload page to apply changes to authService (simplest way)
            if (confirm('Değişikliklerin etkili olması için sayfa yenilensin mi?')) {
                window.location.reload();
            }
        } else if (service === 'github') {
            if (newConfigs.github.token) localStorage.setItem('github_token', newConfigs.github.token);
        } else if (service === 'vercel') {
            if (newConfigs.vercel.token) localStorage.setItem('vercel_token', newConfigs.vercel.token);
        } else if (service === 'gemini') {
            if (newConfigs.gemini.apiKey) localStorage.setItem('gemini_key', newConfigs.gemini.apiKey);
        } else if (service === 'googleads') {
            const adConfig = {
                enabled: newConfigs.googleads.enabled,
                clientId: newConfigs.googleads.clientId,
                slotId: newConfigs.googleads.slotId
            };
            localStorage.setItem('ad_config', JSON.stringify(adConfig));
            window.dispatchEvent(new Event('storage'));
        }

        alert(`${service.charAt(0).toUpperCase() + service.slice(1)} bağlantısı başarıyla kuruldu!`);
    };

    const handleChange = (service: ServiceType, field: string, value: string) => {
        if (!configs) return;
        
        setConfigs(prev => {
            if (!prev) return prev;
            const newConfigs = {
                ...prev,
                [service]: { ...prev[service], [field]: value, connected: false } // Reset connection on change
            };
            
            // Auto-save to localStorage and Universal sync
            localStorage.setItem('adminIntegrations', JSON.stringify(newConfigs));
            syncToSupabase('admin_integrations', newConfigs, { 
                action: 'field_change',
                service: service,
                field: field
            });
            
            return newConfigs;
        });
    };

    const StatusBadge = ({ connected }: { connected: boolean }) => (
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${connected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            {connected ? <CheckCircle size={12} /> : <XCircle size={12} />}
            {connected ? 'Bağlandı' : 'Bağlı Değil'}
        </div>
    );

    // Show loading state
    if (loading || !configs) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <RefreshCw className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Entegrasyonlar yükleniyor...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Entegrasyon Yönetimi</h2>
                    <p className="text-gray-500 mt-1">Veri yönetimi ve dağıtım süreçleri için harici servislerinizi bağlayın.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Gemini AI Card */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50 flex justify-between items-start">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                                <svg viewBox="0 0 24 24" className="w-6 h-6">
                                    <path fill="#4285f4" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                </svg>
                            </div>
                            <h3 className="font-bold text-gray-900">Google Gemini AI</h3>
                        </div>
                        <StatusBadge connected={configs?.gemini?.connected || false} />
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">API Key</label>
                            <input
                                type="password"
                                className="w-full text-sm border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                                placeholder="AIzaSy..."
                                value={configs?.gemini?.apiKey || ''}
                                onChange={(e) => handleChange('gemini', 'apiKey', e.target.value)}
                            />
                        </div>
                        <button
                            onClick={() => handleConnect('gemini')}
                            disabled={!configs?.gemini?.apiKey}
                            className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                        >
                            Bağlan
                        </button>
                        <p className="text-xs text-gray-500">
                            AI asistan ve kampanya analizi için gerekli
                        </p>
                    </div>
                </div>

                {/* Supabase Card */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50 flex justify-between items-start">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                                <svg viewBox="0 0 24 24" className="w-6 h-6">
                                    <path fill="#3ecf8e" d="M21.362 9.354H12V.396a12.04 12.04 0 0 1 9.362 8.958zM11.638 14.646v8.958A12.04 12.04 0 0 1 2.276 14.646h9.362zM2.638 9.354A12.04 12.04 0 0 1 12 .396v8.958H2.638zM12.362 14.646H21.724A12.04 12.04 0 0 1 12.362 23.604v-8.958z"/>
                                </svg>
                            </div>
                            <h3 className="font-bold text-gray-900">Supabase Database</h3>
                        </div>
                        <StatusBadge connected={configs?.supabase?.connected || false} />
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Project URL</label>
                            <input
                                type="text"
                                className="w-full text-sm border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                                placeholder="https://xyz.supabase.co"
                                value={configs?.supabase?.url || ''}
                                onChange={(e) => handleChange('supabase', 'url', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Anon / Service Key</label>
                            <input
                                type="password"
                                className="w-full text-sm border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                                placeholder="eyJh..."
                                value={configs?.supabase?.key || ''}
                                onChange={(e) => handleChange('supabase', 'key', e.target.value)}
                            />
                        </div>
                        <div className="pt-2 flex gap-3">
                            <button
                                onClick={() => handleConnect('supabase')}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                <Save size={16} /> Kaydet
                            </button>
                            <button
                                disabled={!configs?.supabase?.connected}
                                className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-700 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                onClick={() => window.location.reload()}
                            >
                                <RefreshCw size={16} /> Eşitle
                            </button>
                        </div>
                    </div>
                </div>

                {/* GitHub Card */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-slate-50 flex justify-between items-start">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                                <svg viewBox="0 0 24 24" className="w-6 h-6">
                                    <path fill="#181717" d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                                </svg>
                            </div>
                            <h3 className="font-bold text-gray-900">GitHub</h3>
                        </div>
                        <StatusBadge connected={configs?.github?.connected || false} />
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Repository (user/repo)</label>
                            <input
                                type="text"
                                className="w-full text-sm border-gray-300 rounded-lg focus:ring-gray-800 focus:border-gray-800"
                                placeholder="user/project"
                                value={configs?.github?.repo || ''}
                                onChange={(e) => handleChange('github', 'repo', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Personal Access Token</label>
                            <input
                                type="password"
                                className="w-full text-sm border-gray-300 rounded-lg focus:ring-gray-800 focus:border-gray-800"
                                placeholder="ghp_..."
                                value={configs?.github?.token || ''}
                                onChange={(e) => handleChange('github', 'token', e.target.value)}
                            />
                        </div>
                        <div className="pt-2">
                            <button
                                onClick={() => handleConnect('github')}
                                className="w-full bg-gray-900 hover:bg-black text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                <Save size={16} /> Bağla
                            </button>
                        </div>
                    </div>
                </div>

                {/* Vercel Card */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-900 to-black flex justify-between items-start">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                                <svg viewBox="0 0 24 24" className="w-6 h-6">
                                    <path fill="#000000" d="M24 22.525H0l12-21.05 12 21.05z"/>
                                </svg>
                            </div>
                            <h3 className="font-bold text-white">Vercel</h3>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-full px-3 py-1">
                            <span className={`text-xs font-medium ${configs?.vercel?.connected ? 'text-green-300' : 'text-gray-300'}`}>
                                {configs?.vercel?.connected ? '✓ Bağlandı' : '○ Bağlı Değil'}
                            </span>
                        </div>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Project ID</label>
                            <input
                                type="text"
                                className="w-full text-sm border-gray-300 rounded-lg focus:ring-black focus:border-black"
                                placeholder="prj_..."
                                value={configs?.vercel?.project || ''}
                                onChange={(e) => handleChange('vercel', 'project', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Access Token</label>
                            <input
                                type="password"
                                className="w-full text-sm border-gray-300 rounded-lg focus:ring-black focus:border-black"
                                placeholder="Ele..."
                                value={configs?.vercel?.token || ''}
                                onChange={(e) => handleChange('vercel', 'token', e.target.value)}
                            />
                        </div>
                        <div className="pt-2 flex gap-3">
                            <button
                                onClick={() => handleConnect('vercel')}
                                className="flex-1 bg-black hover:bg-gray-800 text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                <Save size={16} /> Kaydet
                            </button>
                            <button
                                disabled={!configs?.vercel?.connected}
                                className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-700 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                onClick={() => alert('Sunucu Deploy tetiklendi! 🚀')}
                            >
                                <UploadCloud size={16} /> Deploy
                            </button>
                        </div>
                    </div>
                </div>

                {/* Google Ads Card */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-green-50 flex justify-between items-start">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                                <svg viewBox="0 0 24 24" className="w-6 h-6">
                                    <path fill="#4285f4" d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/>
                                    <path fill="#34a853" d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/>
                                </svg>
                            </div>
                            <h3 className="font-bold text-gray-900">Google Ads</h3>
                        </div>
                        <StatusBadge connected={configs?.googleads?.connected || false} />
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="ads-enabled"
                                checked={configs?.googleads?.enabled || false}
                                onChange={(e) => handleChange('googleads', 'enabled', e.target.checked.toString())}
                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <label htmlFor="ads-enabled" className="text-sm font-medium text-gray-700">
                                Reklam gösterimini etkinleştir
                            </label>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Publisher ID</label>
                            <input
                                type="text"
                                className="w-full text-sm border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                placeholder="ca-pub-XXXXXXXXXXXXXXXX"
                                value={configs?.googleads?.clientId || ''}
                                onChange={(e) => handleChange('googleads', 'clientId', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Ad Unit ID</label>
                            <input
                                type="text"
                                className="w-full text-sm border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                placeholder="1234567890"
                                value={configs?.googleads?.slotId || ''}
                                onChange={(e) => handleChange('googleads', 'slotId', e.target.value)}
                            />
                        </div>
                        <button
                            onClick={() => handleConnect('googleads')}
                            disabled={!configs?.googleads?.clientId || !configs?.googleads?.slotId}
                            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                        >
                            Kaydet
                        </button>
                        <p className="text-xs text-gray-500">
                            Site geliri için reklam gösterimi
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
}
