import { useState, useEffect } from 'react';
import { Save, Layout, LayoutTemplate, Upload, CheckCircle, Plus, Trash2, Database } from 'lucide-react';
import { settingsService, type SiteSettings } from '../../services/settingsService';

export default function AdminDesign() {
    const [settings, setSettings] = useState<SiteSettings | null>(null);
    const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    const [activeLegalDoc, setActiveLegalDoc] = useState<string>('about');

    useEffect(() => {
        // 1. Initial Local Load
        setSettings(settingsService.getLocalSettings());

        // 2. Fetch Remote execution to ensure we edit the latest server version
        settingsService.fetchRemoteSettings().then(remote => {
            if (remote) setSettings(remote);
        });
    }, []);

    const handleChange = (section: keyof SiteSettings, key: string, value: any) => {
        if (!settings) return;
        setSettings({
            ...settings,
            [section]: {
                ...settings[section],
                [key]: value
            }
        });
        setStatus('idle');
    };

    const handleSave = () => {
        if (!settings) return;
        setStatus('saving');

        setTimeout(() => {
            try {
                settingsService.saveDraftSettings(settings);
                setStatus('saved');
                setTimeout(() => setStatus('idle'), 2000);
            } catch (error) {
                console.error("Save failed:", error);
                alert("Ayarlar kaydedilemedi! Muhtemelen logo dosyası çok büyük. Lütfen daha küçük bir görsel yükleyin.");
                setStatus('idle');
            }
        }, 500);
    };

    if (!settings) return <div>Yükleniyor...</div>;

    const handleSiteSettingChange = (section: keyof SiteSettings, key: string, val: any) => {
        if (!settings) return;
        setSettings({
            ...settings,
            [section]: {
                ...settings[section],
                [key]: val
            }
        });
        setStatus('idle');
    };

    return (
        <div className="space-y-8 max-w-4xl pb-10">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Site Tasarımı & İçerik</h1>
                <p className="text-gray-500">Logo, duyurular, footer ve diğer içerik alanlarını buradan yönetebilirsiniz.</p>
            </div>

            {/* --- HEADER ANNOUNCEMENTS SETTINGS --- */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-pink-50 text-pink-600 rounded-lg">
                        <Database size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Duyuru & Kampanya Yönetimi</h2>
                        <p className="text-sm text-gray-500">Header alanında gösterilecek duyuruları yönetin. Aktif olanlardan biri gösterilecektir.</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {/* List */}
                    <div className="space-y-3">
                        {settings.header.announcements?.map((ann, index) => (
                            <div key={ann.id || index} className="flex flex-col md:flex-row gap-3 items-start md:items-center p-4 bg-gray-50 border border-gray-200 rounded-lg group hover:border-pink-200 transition-colors">

                                {/* Status Toggle */}
                                <button
                                    onClick={() => {
                                        const newAnnouncements = [...(settings.header.announcements || [])];
                                        newAnnouncements[index] = { ...ann, isActive: !ann.isActive };
                                        handleSiteSettingChange('header', 'announcements', newAnnouncements);
                                    }}
                                    className={`p-2 rounded-full ${ann.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-400'} hover:opacity-80 transition-colors`}
                                    title={ann.isActive ? "Aktif (Gizlemek için tıkla)" : "Pasif (Göstermek için tıkla)"}
                                >
                                    <CheckCircle size={18} />
                                </button>

                                {/* Content Inputs */}
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-2 w-full">
                                    <div className="md:col-span-1">
                                        <input
                                            type="text"
                                            value={ann.label}
                                            onChange={(e) => {
                                                const newAnnouncements = [...(settings.header.announcements || [])];
                                                newAnnouncements[index] = { ...ann, label: e.target.value };
                                                handleSiteSettingChange('header', 'announcements', newAnnouncements);
                                            }}
                                            placeholder="Etiket (Örn: Duyuru)"
                                            className="w-full px-3 py-2 text-xs font-bold bg-white border border-gray-300 rounded focus:border-pink-500 outline-none"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <input
                                            type="text"
                                            value={ann.text}
                                            onChange={(e) => {
                                                const newAnnouncements = [...(settings.header.announcements || [])];
                                                newAnnouncements[index] = { ...ann, text: e.target.value };
                                                handleSiteSettingChange('header', 'announcements', newAnnouncements);
                                            }}
                                            placeholder="Duyuru Metni..."
                                            className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded focus:border-pink-500 outline-none"
                                        />
                                    </div>
                                    <div className="md:col-span-1">
                                        <input
                                            type="text"
                                            value={ann.link}
                                            onChange={(e) => {
                                                const newAnnouncements = [...(settings.header.announcements || [])];
                                                newAnnouncements[index] = { ...ann, link: e.target.value };
                                                handleSiteSettingChange('header', 'announcements', newAnnouncements);
                                            }}
                                            placeholder="Link (Opsiyonel)"
                                            className="w-full px-3 py-2 text-xs text-blue-600 bg-white border border-gray-300 rounded focus:border-pink-500 outline-none"
                                        />
                                    </div>
                                </div>

                                {/* Delete */}
                                <button
                                    onClick={() => {
                                        if (confirm("Bu duyuruyu silmek istediğinize emin misiniz?")) {
                                            const newAnnouncements = settings.header.announcements.filter((_, i) => i !== index);
                                            handleSiteSettingChange('header', 'announcements', newAnnouncements);
                                        }
                                    }}
                                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Add Button */}
                    <button
                        onClick={() => {
                            const newAnn = {
                                id: Date.now().toString(),
                                text: "",
                                link: "",
                                label: "Duyuru",
                                type: 'default',
                                isActive: true
                            };
                            const current = settings.header.announcements || [];
                            handleSiteSettingChange('header', 'announcements', [...current, newAnn]);
                        }}
                        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 font-medium hover:border-pink-500 hover:text-pink-600 hover:bg-pink-50 transition-all flex items-center justify-center gap-2"
                    >
                        <Plus size={20} /> Yeni Duyuru Ekle
                    </button>
                </div>
            </div>

            {/* Logo Ayarları */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 mb-4 text-pink-600">
                    <LayoutTemplate size={20} />
                    <h2 className="font-semibold text-lg">Site Logosu & Görünüm</h2>
                </div>

                <div className="space-y-4">
                    <p className="text-sm text-gray-500">Logonuzu buradan özelleştirebilirsiniz. Değişiklikler anlık olarak Header'da görünür (Kaydettiğinizde canlıya geçer).</p>

                    {/* Logo URL */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Logo Görsel URL</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={settings.logo?.url || ''}
                                onChange={(e) => handleChange('logo', 'url', e.target.value)}
                                placeholder="https://... (Boş bırakılırsa varsayılan logo kullanılır)"
                                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-pink-500 focus:border-pink-500"
                            />
                            <div className="relative">
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    id="logo-upload"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const reader = new FileReader();
                                            reader.onloadend = () => {
                                                handleChange('logo', 'url', reader.result as string);
                                            };
                                            reader.readAsDataURL(file);
                                        }
                                    }}
                                />
                                <label
                                    htmlFor="logo-upload"
                                    className="bg-gray-100 hover:bg-gray-200 p-2 rounded-lg cursor-pointer flex items-center justify-center h-full transition-colors"
                                    title="Bilgisayardan Yükle"
                                >
                                    <Upload size={18} className="text-gray-600" />
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Sliders Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-pink-50/50 p-4 rounded-xl border border-pink-100">
                        <div>
                            <div className="flex justify-between mb-1">
                                <label className="text-xs font-bold text-gray-700">Yükseklik (Boyut)</label>
                                <span className="text-xs text-pink-600 font-mono">{settings.logo?.height}px</span>
                            </div>
                            <input
                                type="range" min="20" max="200"
                                value={settings.logo?.height || 75}
                                onChange={(e) => handleChange('logo', 'height', Number(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-pink-600"
                            />
                        </div>

                        <div>
                            <div className="flex justify-between mb-1">
                                <label className="text-xs font-bold text-gray-700">Opaklık</label>
                                <span className="text-xs text-pink-600 font-mono">%{Math.round((settings.logo?.opacity || 1) * 100)}</span>
                            </div>
                            <input
                                type="range" min="0" max="1" step="0.1"
                                value={settings.logo?.opacity ?? 1}
                                onChange={(e) => handleChange('logo', 'opacity', Number(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-pink-600"
                            />
                        </div>

                        <div>
                            <div className="flex justify-between mb-1">
                                <label className="text-xs font-bold text-gray-700">Yatay Pozisyon (X)</label>
                                <span className="text-xs text-pink-600 font-mono">{settings.logo?.offsetX}px</span>
                            </div>
                            <input
                                type="range" min="-50" max="50"
                                value={settings.logo?.offsetX || 0}
                                onChange={(e) => handleChange('logo', 'offsetX', Number(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-pink-600"
                            />
                        </div>

                        <div>
                            <div className="flex justify-between mb-1">
                                <label className="text-xs font-bold text-gray-700">Dikey Pozisyon (Y)</label>
                                <span className="text-xs text-pink-600 font-mono">{settings.logo?.offsetY}px</span>
                            </div>
                            <input
                                type="range" min="-20" max="20"
                                value={settings.logo?.offsetY || 0}
                                onChange={(e) => handleChange('logo', 'offsetY', Number(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-pink-600"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Logo Ayarları */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 mb-4 text-purple-600">
                    <LayoutTemplate size={20} />
                    <h2 className="font-semibold text-lg">Footer Logosu & Görünüm</h2>
                </div>

                <div className="space-y-4">
                    <p className="text-sm text-gray-500">Footer (Alt Kısım) logosunu buradan özelleştirebilirsiniz.</p>

                    {/* Footer Logo URL */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Footer Logo URL</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={settings.footerLogo?.url || ''}
                                onChange={(e) => handleChange('footerLogo', 'url', e.target.value)}
                                placeholder="https://... (Boş bırakılırsa varsayılan/Header logosu kullanılabilir)"
                                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-purple-500 focus:border-purple-500"
                            />
                            <div className="relative">
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    id="footer-logo-upload"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            if (file.size > 500 * 1024) { // 500KB limit
                                                alert("Dosya çok büyük! Lütfen 500KB'dan küçük bir görsel seçin.");
                                                return;
                                            }
                                            const reader = new FileReader();
                                            reader.onloadend = () => {
                                                handleChange('footerLogo', 'url', reader.result as string);
                                            };
                                            reader.readAsDataURL(file);
                                        }
                                    }}
                                />
                                <label
                                    htmlFor="footer-logo-upload"
                                    className="bg-gray-100 hover:bg-gray-200 p-2 rounded-lg cursor-pointer flex items-center justify-center h-full transition-colors"
                                    title="Bilgisayardan Yükle"
                                >
                                    <Upload size={18} className="text-gray-600" />
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Sliders Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-purple-50/50 p-4 rounded-xl border border-purple-100">
                        <div>
                            <div className="flex justify-between mb-1">
                                <label className="text-xs font-bold text-gray-700">Yükseklik (Boyut)</label>
                                <span className="text-xs text-purple-600 font-mono">{settings.footerLogo?.height || 32}px</span>
                            </div>
                            <input
                                type="range" min="20" max="200"
                                value={settings.footerLogo?.height || 32}
                                onChange={(e) => handleChange('footerLogo', 'height', Number(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                            />
                        </div>

                        <div>
                            <div className="flex justify-between mb-1">
                                <label className="text-xs font-bold text-gray-700">Opaklık</label>
                                <span className="text-xs text-purple-600 font-mono">%{Math.round((settings.footerLogo?.opacity ?? 0.9) * 100)}</span>
                            </div>
                            <input
                                type="range" min="0" max="1" step="0.1"
                                value={settings.footerLogo?.opacity ?? 0.9}
                                onChange={(e) => handleChange('footerLogo', 'opacity', Number(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                            />
                        </div>

                        <div>
                            <div className="flex justify-between mb-1">
                                <label className="text-xs font-bold text-gray-700">Yatay Pozisyon (X)</label>
                                <span className="text-xs text-purple-600 font-mono">{settings.footerLogo?.offsetX || 0}px</span>
                            </div>
                            <input
                                type="range" min="-50" max="50"
                                value={settings.footerLogo?.offsetX || 0}
                                onChange={(e) => handleChange('footerLogo', 'offsetX', Number(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                            />
                        </div>

                        <div>
                            <div className="flex justify-between mb-1">
                                <label className="text-xs font-bold text-gray-700">Dikey Pozisyon (Y)</label>
                                <span className="text-xs text-purple-600 font-mono">{settings.footerLogo?.offsetY || 0}px</span>
                            </div>
                            <input
                                type="range" min="-20" max="20"
                                value={settings.footerLogo?.offsetY || 0}
                                onChange={(e) => handleChange('footerLogo', 'offsetY', Number(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                            />
                        </div>
                    </div>
                </div>

                {/* Sidebar Reklam Alanları */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-4 text-green-700">
                        <Layout size={20} />
                        <h2 className="font-semibold text-lg">Sidebar & Reklamlar</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={settings.ads.showSidebarAd}
                                    onChange={(e) => handleChange('ads', 'showSidebarAd', e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                            </label>
                            <span className="text-sm font-medium text-gray-700">Sidebar Reklamını Göster</span>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Görsel URL</label>
                            <input
                                type="text"
                                placeholder="https://cdn.kartavantaj.com/ads/reklam.jpg"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-green-500 focus:border-green-500"
                                value={settings.ads.sidebarAdImage}
                                onChange={(e) => handleChange('ads', 'sidebarAdImage', e.target.value)}
                            />
                            {settings.ads.sidebarAdImage && (
                                <div className="mt-2 text-xs text-gray-500">
                                    Önizleme:
                                    <img src={settings.ads.sidebarAdImage} alt="Preview" className="h-20 w-auto object-cover rounded mt-1 border" />
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Hedef Link</label>
                            <input
                                type="text"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-green-500 focus:border-green-500"
                                value={settings.ads.sidebarAdLink}
                                onChange={(e) => handleChange('ads', 'sidebarAdLink', e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* --- WEBSITE CUSTOMIZATION (Moved from Settings) --- */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                            <CheckCircle size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Site Tasarım & İçerik</h2>
                            <p className="text-sm text-gray-500">Footer, Sosyal Medya ve Yasal Metinleri düzenleyin.</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Footer Infos */}
                        <div>
                            <h3 className="text-sm font-bold text-gray-800 mb-4 border-b pb-2">Footer Bilgileri</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Adres</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm"
                                        value={settings.footer.address || ''}
                                        onChange={(e) => handleSiteSettingChange('footer', 'address', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">E-posta</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm"
                                        value={settings.footer.email || ''}
                                        onChange={(e) => handleSiteSettingChange('footer', 'email', e.target.value)}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Footer Açıklama</label>
                                    <textarea
                                        className="w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm"
                                        rows={2}
                                        value={settings.footer.description || ''}
                                        onChange={(e) => handleSiteSettingChange('footer', 'description', e.target.value)}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Telif Hakkı Metni</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm"
                                        value={settings.footer.copyright || ''}
                                        onChange={(e) => handleSiteSettingChange('footer', 'copyright', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Social Media */}
                        <div>
                            <h3 className="text-sm font-bold text-gray-800 mb-4 border-b pb-2">Sosyal Medya Linkleri</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {['facebook', 'twitter', 'instagram', 'linkedin', 'youtube'].map((social) => (
                                    <div key={social}>
                                        <label className="block text-xs font-medium text-gray-600 mb-1 capitalize">{social}</label>
                                        <input
                                            type="text"
                                            placeholder={`https://${social}.com/...`}
                                            className="w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm"
                                            value={settings.social?.[social as keyof typeof settings.social] || ''}
                                            onChange={(e) => handleSiteSettingChange('social', social, e.target.value)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Legal Content Editor */}
                        <div>
                            <h3 className="text-sm font-bold text-gray-800 mb-4 border-b pb-2">Yasal Metinler & Sayfalar</h3>
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                                    {Object.keys(settings.legal || {}).map((key) => (
                                        <button
                                            key={key}
                                            onClick={() => setActiveLegalDoc(key)}
                                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${activeLegalDoc === key ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'}`}
                                        >
                                            {{
                                                terms: 'Kullanım Koşulları',
                                                privacy: 'Gizlilik',
                                                cookies: 'Çerezler',
                                                kvkk: 'KVKK',
                                                help: 'Yardım',
                                                about: 'Hakkımızda'
                                            }[key] || key}
                                        </button>
                                    ))}
                                </div>

                                {activeLegalDoc && (
                                    <div className="animate-in fade-in">
                                        <label className="block text-xs font-medium text-gray-600 mb-2">
                                            İçerik (HTML Destekler) - {activeLegalDoc.toUpperCase()}
                                        </label>
                                        <textarea
                                            className="w-full h-64 px-4 py-3 bg-white border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                                            style={{ fontFamily: 'monospace' }}
                                            value={settings.legal?.[activeLegalDoc as keyof typeof settings.legal] || ''}
                                            onChange={(e) => handleSiteSettingChange('legal', activeLegalDoc, e.target.value)}
                                        />
                                        <p className="text-xs text-gray-400 mt-2">
                                            İpucu: &lt;h2&gt;Başlık&lt;/h2&gt;, &lt;p&gt;Paragraf&lt;/p&gt;, &lt;ul&gt;&lt;li&gt;Liste&lt;/li&gt;&lt;/ul&gt; gibi HTML etiketlerini kullanabilirsiniz.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Kaydet Butonu */}
                <div className="sticky bottom-6 flex flex-col items-end gap-2">
                    <button
                        onClick={handleSave}
                        disabled={status === 'saving'}
                        className={`
                        flex items-center gap-2 px-8 py-3 rounded-full font-bold shadow-lg transition-all transform hover:-translate-y-1
                        ${status === 'saved' ? 'bg-green-600 text-white' : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:shadow-purple-200'}
                        ${status === 'saving' ? 'opacity-70 cursor-wait' : ''}
                    `}
                    >
                        <Save size={20} />
                        {status === 'saving' ? 'Kaydediliyor...' : status === 'saved' ? 'Kaydedildi!' : 'Değişiklikleri Kaydet'}
                    </button>
                    {status !== 'idle' && (
                        <div className={`text-xs font-medium px-3 py-1 rounded bg-white shadow-sm border ${status === 'saved' ? 'text-green-600 border-green-100' : 'text-gray-500 border-gray-100'}`}>
                            {status === 'saved' ? '✓ Başarıyla kaydedildi' : '... İşlem sürdürülüyor'}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
