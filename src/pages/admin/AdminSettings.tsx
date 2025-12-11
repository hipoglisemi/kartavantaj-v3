import { useState, useEffect } from 'react';
import { Save, Trash2, Eye, EyeOff, Key, Database, Globe, Github, CloudUpload, RefreshCw, CheckCircle } from 'lucide-react';

import { settingsService } from '../../services/settingsService';
import { campaignService } from '../../services/campaignService';

// Helper to get local data (duplicated from BulkUpload for now to keep independent)
// const getCampaignsData = ... (Removed as now using campaignService)

interface SettingItem {
    key: string;
    label: string;
    description: string;
    icon: any;
    placeholder: string;
    type: 'password' | 'text';
}

const SETTINGS_CONFIG: SettingItem[] = [
    {
        key: 'gemini_key',
        label: 'Google Gemini API Key',
        description: 'Kampanya verilerini işlemek ve AI asistanı için gerekli.',
        icon: Key,
        placeholder: 'AIzaSy...',
        type: 'password'
    },
    {
        key: 'sb_url',
        label: 'Veritabanı URL (Project URL)',
        description: 'Veritabanı bağlantı adresi.',
        icon: Database,
        placeholder: 'https://xyz.supabase.co',
        type: 'text'
    },
    {
        key: 'sb_key',
        label: 'Veritabanı Anahtarı (Service Role Key)',
        description: 'Yazma/silme yetkisi için gizli anahtar.',
        icon: Key,
        placeholder: 'eyJh... (service_role)',
        type: 'password'
    },
    {
        key: 'github_token',
        label: 'GitHub Token',
        description: 'Site güncellemelerini tetiklemek için (Opsiyonel).',
        icon: Github,
        placeholder: 'ghp_...',
        type: 'password'
    },
    {
        key: 'vercel_token',
        label: 'Sunucu Token (Opsiyonel)',
        description: 'Deployment yönetimi için.',
        icon: Globe,
        placeholder: 'Token giriniz...',
        type: 'password'
    }
];

import { useConfirmation } from '../../context/ConfirmationContext';
import { useToast } from '../../context/ToastContext';

// ...

export default function AdminSettings() {
    const { confirm } = useConfirmation();
    const { success, error, info } = useToast();
    const [values, setValues] = useState<Record<string, string>>({});

    // UI State
    const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
    const [savedStatus, setSavedStatus] = useState<string | null>(null);
    const [migrationStatus, setMigrationStatus] = useState<string>('idle');
    const [migratedCount, setMigratedCount] = useState(0);

    // Settings
    const siteSettings = settingsService.useSettings();

    useEffect(() => {
        const loaded: Record<string, string> = {};
        SETTINGS_CONFIG.forEach(item => {
            loaded[item.key] = localStorage.getItem(item.key) || '';
        });
        setValues(loaded);
    }, []);

    const handleChange = (key: string, val: string) => {
        setValues(prev => ({ ...prev, [key]: val }));
    };

    const toggleShow = (key: string) => {
        setShowKeys(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // ...

    const handleSave = () => {
        // Validate Supabase Key Role
        const sbKey = values['sb_url'] && values['sb_key'];
        if (sbKey) {
            try {
                // Initial check: if it starts with 'ey', try to decode middle part
                const parts = values['sb_key'].split('.');
                if (parts.length === 3) {
                    const payload = JSON.parse(atob(parts[1]));
                    if (payload.role !== 'service_role') {
                        info("UYARI: 'service_role' anahtarı kullanmıyorsunuz. Kısıtlı yetki.");
                    }
                }
            } catch (e) {
                console.warn("Key validation failed", e);
            }
        }

        // Save API Keys
        Object.entries(values).forEach(([key, val]) => {
            if (val.trim()) {
                localStorage.setItem(key, val.trim());
            } else {
                localStorage.removeItem(key);
            }
        });

        // Save Site Settings
        settingsService.saveDraftSettings(siteSettings);

        success('Ayarlar başarıyla kaydedildi!');
        window.dispatchEvent(new Event('storage'));
    };

    const handleClear = async (key: string) => {
        if (await confirm({
            title: 'Anahtarı Sil',
            message: 'Bu anahtarı silmek istediğinize emin misiniz?',
            type: 'warning'
        })) {
            localStorage.removeItem(key);
            setValues(prev => ({ ...prev, [key]: '' }));
            success('Anahtar silindi.');
        }
    };

    const handleSupabaseMigration = async () => {
        const url = values['sb_url'];
        const key = values['sb_key'];

        if (!url || !key) {
            error("Lütfen önce Supabase URL ve Key değerlerini girip Kaydet'e basınız.");
            return;
        }

        if (!await confirm({
            title: 'Veritabanı Eşitleme',
            message: "DİKKAT: Bu işlem yerel hafızadaki tüm kampanyaları merkezi veritabanına aktaracaktır. Devam etmek istiyor musunuz?",
            confirmText: 'Evet, Eşitle',
            type: 'info'
        })) {
            return;
        }

        setMigrationStatus('working');
        setMigratedCount(0);

        const result = await campaignService.syncToSupabase(url, key, (count) => {
            setMigratedCount(count);
        });

        if (result.success) {
            setMigrationStatus('success');
            setTimeout(() => setMigrationStatus('idle'), 5000);
            success(`Senkronizasyon Tamamlandı! ${result.count} kampanya yüklendi.`);
        } else {
            console.error(result.error);
            setMigrationStatus('error');
            error("Hata oluştu: " + result.error);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-10">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Ayarlar & Entegrasyonlar</h1>
                <p className="text-gray-500 mt-2">Dış servis bağlantılarını buradan yönetebilirsiniz. Anahtarlarınız tarayıcınızda saklanır.</p>
            </div>

            {savedStatus && (
                <div className="bg-green-50 text-green-700 p-4 rounded-xl border border-green-100 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                    <Save size={20} />
                    <span className="font-medium">{savedStatus}</span>
                </div>
            )}

            <div className="grid gap-6">
                {SETTINGS_CONFIG.map((item) => {
                    const Icon = item.icon;
                    const isVisible = showKeys[item.key] || item.type === 'text';
                    const isSupabase = item.key === 'sb_url' || item.key === 'sb_key';

                    return (
                        <div key={item.key} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-lg ${isSupabase ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-50 text-gray-600'}`}>
                                    <Icon size={24} />
                                </div>
                                <div className="flex-1 space-y-3">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-800">{item.label}</h3>
                                        <p className="text-sm text-gray-500">{item.description}</p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <div className="relative flex-1">
                                            <input
                                                type={isVisible ? 'text' : 'password'}
                                                value={values[item.key] || ''}
                                                onChange={(e) => handleChange(item.key, e.target.value)}
                                                placeholder={item.placeholder}
                                                className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm transition-all"
                                            />
                                            {item.type === 'password' && (
                                                <button
                                                    onClick={() => toggleShow(item.key)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                >
                                                    {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            )}
                                        </div>

                                        {values[item.key] && (
                                            <button
                                                onClick={() => handleClear(item.key)}
                                                title="Sil"
                                                className="p-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        )}
                                    </div>

                                    {/* Special Action for Supabase URL: Show Migration Button */}
                                    {item.key === 'sb_url' && values['sb_url'] && values['sb_key'] && (
                                        <div className="pt-2 mt-2 border-t border-gray-100">
                                            <button
                                                onClick={handleSupabaseMigration}
                                                disabled={migrationStatus === 'working'}
                                                className="text-sm flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium px-2 py-1 rounded hover:bg-indigo-50 transition-colors disabled:opacity-50"
                                            >
                                                {migrationStatus === 'working' ? (
                                                    <>
                                                        <RefreshCw className="animate-spin" size={16} />
                                                        Veriler Aktarılıyor ({migratedCount})...
                                                    </>
                                                ) : migrationStatus === 'success' ? (
                                                    <>
                                                        <CheckCircle size={16} className="text-green-600" />
                                                        <span className="text-green-600">Aktarım Tamamlandı!</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <CloudUpload size={16} />
                                                        Local Verileri Bu Veritabanına Yükle
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* --- GOOGLE ADS SETTINGS --- */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mt-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-orange-50 text-orange-600 rounded-lg">
                        <Globe size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Google Ads Ayarları</h2>
                        <p className="text-sm text-gray-500">Reklam gösterimini buradan yönetebilirsiniz.</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={JSON.parse(localStorage.getItem('ad_config') || '{}').enabled || false}
                                onChange={(e) => {
                                    const current = JSON.parse(localStorage.getItem('ad_config') || '{}');
                                    localStorage.setItem('ad_config', JSON.stringify({ ...current, enabled: e.target.checked }));
                                    window.dispatchEvent(new Event('storage'));
                                    // Force re-render (simple way for this standalone component)
                                    setSavedStatus('Durum güncellendi');
                                    setTimeout(() => setSavedStatus(null), 1000);
                                }}
                                className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="font-medium text-gray-700">Reklamları Aktifleştir</span>
                        </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Yayıncı ID (Publisher ID)</label>
                            <input
                                type="text"
                                placeholder="ca-pub-XXXXXXXXXXXXXXXX"
                                defaultValue={JSON.parse(localStorage.getItem('ad_config') || '{}').clientId || ''}
                                onChange={(e) => {
                                    const current = JSON.parse(localStorage.getItem('ad_config') || '{}');
                                    localStorage.setItem('ad_config', JSON.stringify({ ...current, clientId: e.target.value }));
                                }}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm font-mono"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Varsayılan Slot ID</label>
                            <input
                                type="text"
                                placeholder="1234567890"
                                defaultValue={JSON.parse(localStorage.getItem('ad_config') || '{}').slotId || ''}
                                onChange={(e) => {
                                    const current = JSON.parse(localStorage.getItem('ad_config') || '{}');
                                    localStorage.setItem('ad_config', JSON.stringify({ ...current, slotId: e.target.value }));
                                }}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm font-mono"
                            />
                        </div>
                    </div>
                    <p className="text-xs text-gray-400">Not: Değişiklikler anında kaydedilir.</p>
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <button
                    onClick={handleSave}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all flex items-center gap-2"
                >
                    <Save size={20} />
                    Ayarları Kaydet
                </button>
            </div>
        </div>
    );
}
