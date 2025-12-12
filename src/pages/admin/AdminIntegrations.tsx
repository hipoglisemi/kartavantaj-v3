import { useState, useEffect } from 'react';
import { Database, Github, Server, CheckCircle, XCircle, Save, RefreshCw, UploadCloud, Bot } from 'lucide-react';

type ServiceType = 'supabase' | 'github' | 'vercel' | 'gemini';

interface ServiceConfig {
    connected: boolean;
    [key: string]: any;
}

export default function AdminIntegrations() {
    const [configs, setConfigs] = useState<Record<ServiceType, ServiceConfig>>({
        supabase: { connected: false, url: '', key: '' },
        github: { connected: false, repo: '', token: '' },
        vercel: { connected: false, token: '', project: '' },
        gemini: { connected: false, apiKey: '' }
    });

    // Load from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem('adminIntegrations');
        if (stored) {
            setConfigs(JSON.parse(stored));
        } else {
            // Mevcut anahtarları yükle
            setConfigs(prev => ({
                ...prev,
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
                }
            }));
        }
    }, []);

    const handleConnect = (service: ServiceType) => {
        // Simulate connection check
        const newConfigs = { ...configs };
        newConfigs[service].connected = true;
        setConfigs(newConfigs);
        localStorage.setItem('adminIntegrations', JSON.stringify(newConfigs));

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
        }

        alert(`${service.charAt(0).toUpperCase() + service.slice(1)} bağlantısı başarıyla kuruldu!`);
    };

    const handleChange = (service: ServiceType, field: string, value: string) => {
        setConfigs(prev => ({
            ...prev,
            [service]: { ...prev[service], [field]: value, connected: false } // Reset connection on change
        }));
    };

    const StatusBadge = ({ connected }: { connected: boolean }) => (
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${connected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            {connected ? <CheckCircle size={12} /> : <XCircle size={12} />}
            {connected ? 'Bağlandı' : 'Bağlı Değil'}
        </div>
    );

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
                    <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-start">
                        <div className="flex items-center gap-3">
                            <div className="bg-purple-100 p-2.5 rounded-lg">
                                <Bot className="text-purple-600" size={24} />
                            </div>
                            <h3 className="font-bold text-gray-900">Google Gemini AI</h3>
                        </div>
                        <StatusBadge connected={configs.gemini.connected} />
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">API Key</label>
                            <input
                                type="password"
                                className="w-full text-sm border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                                placeholder="AIzaSy..."
                                value={configs.gemini.apiKey}
                                onChange={(e) => handleChange('gemini', 'apiKey', e.target.value)}
                            />
                        </div>
                        <button
                            onClick={() => handleConnect('gemini')}
                            disabled={!configs.gemini.apiKey}
                            className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                        >
                            Bağlan
                        </button>
                        <p className="text-xs text-gray-500">
                            AI asistan ve kampanya analizi için gerekli
                        </p>
                    </div>
                </div>

                {/* Database Card */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-start">
                        <div className="flex items-center gap-3">
                            <div className="bg-green-100 p-2.5 rounded-lg">
                                <Database className="text-green-600" size={24} />
                            </div>
                            <h3 className="font-bold text-gray-900">Veritabanı Bağlantısı</h3>
                        </div>
                        <StatusBadge connected={configs.supabase.connected} />
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Project URL</label>
                            <input
                                type="text"
                                className="w-full text-sm border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                                placeholder="https://xyz.supabase.co"
                                value={configs.supabase.url}
                                onChange={(e) => handleChange('supabase', 'url', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Anon / Service Key</label>
                            <input
                                type="password"
                                className="w-full text-sm border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                                placeholder="eyJh..."
                                value={configs.supabase.key}
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
                                disabled={!configs.supabase.connected}
                                className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-700 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                onClick={() => window.location.reload()}
                            >
                                <RefreshCw size={16} /> Eşitle
                            </button>
                        </div>
                    </div>
                </div>

                {/* Git Card */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-start">
                        <div className="flex items-center gap-3">
                            <div className="bg-gray-800 p-2.5 rounded-lg">
                                <Github className="text-white" size={24} />
                            </div>
                            <h3 className="font-bold text-gray-900">Kod Deposu</h3>
                        </div>
                        <StatusBadge connected={configs.github.connected} />
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Repository (user/repo)</label>
                            <input
                                type="text"
                                className="w-full text-sm border-gray-300 rounded-lg focus:ring-gray-800 focus:border-gray-800"
                                placeholder="user/project"
                                value={configs.github.repo}
                                onChange={(e) => handleChange('github', 'repo', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Personal Access Token</label>
                            <input
                                type="password"
                                className="w-full text-sm border-gray-300 rounded-lg focus:ring-gray-800 focus:border-gray-800"
                                placeholder="ghp_..."
                                value={configs.github.token}
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

                {/* Server Card */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-start">
                        <div className="flex items-center gap-3">
                            <div className="bg-black p-2.5 rounded-lg">
                                <Server className="text-white" size={24} />
                            </div>
                            <h3 className="font-bold text-gray-900">Hosting / Sunucu</h3>
                        </div>
                        <StatusBadge connected={configs.vercel.connected} />
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Project ID</label>
                            <input
                                type="text"
                                className="w-full text-sm border-gray-300 rounded-lg focus:ring-black focus:border-black"
                                placeholder="prj_..."
                                value={configs.vercel.project}
                                onChange={(e) => handleChange('vercel', 'project', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Access Token</label>
                            <input
                                type="password"
                                className="w-full text-sm border-gray-300 rounded-lg focus:ring-black focus:border-black"
                                placeholder="Ele..."
                                value={configs.vercel.token}
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
                                disabled={!configs.vercel.connected}
                                className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-700 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                onClick={() => alert('Sunucu Deploy tetiklendi! 🚀')}
                            >
                                <UploadCloud size={16} /> Deploy
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
