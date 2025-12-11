import { useState, useEffect } from 'react';
import { Search, Globe, Share2, Save, FileText, LayoutTemplate } from 'lucide-react';

interface SeoSettings {
    siteTitle: string;
    siteDescription: string;
    keywords: string;
    ogTitle: string;
    ogDescription: string;
    ogImage: string;
    robotsTxt: string;
}

const defaultSettings: SeoSettings = {
    siteTitle: 'KartAvantaj - Kredi Kartı Kampanyaları',
    siteDescription: 'Tüm bankaların kredi kartı kampanyalarını tek bir yerden takip edin. Fırsatları kaçırmayın!',
    keywords: 'kredi kartı, kampanya, banka, puan, denizbank, garanti, yapıkredi, akbank',
    ogTitle: 'KartAvantaj: Tüm Kart Fırsatları',
    ogDescription: 'En güncel kredi kartı kampanyaları ve fırsatlar burada.',
    ogImage: 'https://kartavantaj.com/og-image.jpg',
    robotsTxt: 'User-agent: *\nAllow: /'
};

export default function AdminSeo() {
    const [settings, setSettings] = useState<SeoSettings>(defaultSettings);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('kartavantaj_seo');
        if (stored) {
            setSettings(JSON.parse(stored));
        }
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        setLoading(true);
        // Simulate API call
        setTimeout(() => {
            localStorage.setItem('kartavantaj_seo', JSON.stringify(settings));
            setLoading(false);

            // Real-time update of document title/meta (for demonstration)
            document.title = settings.siteTitle;
            document.querySelector('meta[name="description"]')?.setAttribute('content', settings.siteDescription);

            alert("SEO ayarları başarıyla kaydedildi ve yayınlandı!");
        }, 800);
    };

    return (
        <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Search className="text-purple-600" />
                        SEO Yönetim Merkezi
                    </h1>
                    <p className="text-gray-500">Arama motoru optimizasyonu ve görünürlük ayarları.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="bg-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-700 transition-all shadow-lg shadow-purple-200 flex items-center gap-2"
                >
                    <Save size={18} />
                    {loading ? 'Kaydediliyor...' : 'Tüm Ayarları Kaydet'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* --- TEMEL SEO --- */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h2 className="font-bold text-gray-800 mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
                            <Globe size={20} className="text-blue-500" />
                            Genel Site Ayarları
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Site Başlığı (Title)</label>
                                <div className="relative">
                                    <input
                                        name="siteTitle"
                                        value={settings.siteTitle}
                                        onChange={handleChange}
                                        className="w-full pl-4 pr-16 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none font-medium text-gray-800"
                                    />
                                    <span className={`absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold ${settings.siteTitle.length > 60 ? 'text-red-500' : 'text-green-500'}`}>
                                        {settings.siteTitle.length}/60
                                    </span>
                                </div>
                                <p className="text-xs text-gray-400 mt-1">Tarayıcı sekmesinde ve Google arama sonuçlarında görünen ana başlık.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Meta Açıklama (Description)</label>
                                <div className="relative">
                                    <textarea
                                        name="siteDescription"
                                        value={settings.siteDescription}
                                        onChange={handleChange}
                                        rows={3}
                                        className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                                    />
                                    <span className={`absolute right-4 bottom-4 text-xs font-bold ${settings.siteDescription.length > 160 ? 'text-red-500' : 'text-green-500'}`}>
                                        {settings.siteDescription.length}/160
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Anahtar Kelimeler (Keywords)</label>
                                <input
                                    name="keywords"
                                    value={settings.keywords}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                                    placeholder="virgülle ayırın..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h2 className="font-bold text-gray-800 mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
                            <Share2 size={20} className="text-pink-500" />
                            Sosyal Medya & Paylaşım (Open Graph)
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Paylaşım Başlığı</label>
                                    <input
                                        name="ogTitle"
                                        value={settings.ogTitle}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Paylaşım Açıklaması</label>
                                    <textarea
                                        name="ogDescription"
                                        value={settings.ogDescription}
                                        onChange={handleChange}
                                        rows={3}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-2">Önizleme Görseli (URL)</label>
                                <div className="border-2 border-dashed border-gray-200 rounded-xl h-40 flex flex-col items-center justify-center p-4 bg-gray-50 relative overflow-hidden group">
                                    {settings.ogImage ? (
                                        <img src={settings.ogImage} alt="OG Preview" className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-40 transition-opacity" />
                                    ) : (
                                        <div className="text-gray-400 text-center text-xs">Görsel URL'i girin</div>
                                    )}
                                    <input
                                        name="ogImage"
                                        value={settings.ogImage}
                                        onChange={handleChange}
                                        className="w-full mt-2 bg-white/80 backdrop-blur border border-gray-200 rounded px-2 py-1 text-xs z-10"
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- TEKNİK SEO --- */}
                <div className="space-y-8">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h2 className="font-bold text-gray-800 mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
                            <LayoutTemplate size={20} className="text-yellow-500" />
                            Önizleme
                        </h2>
                        {/* Google Preview */}
                        <div className="mb-6">
                            <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Google Sonucu</p>
                            <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-default">
                                <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                                    <div className="w-4 h-4 rounded-full bg-gray-200"></div>
                                    <span>kartavantaj.com</span>
                                </div>
                                <h3 className="text-blue-800 text-lg font-medium leading-tight hover:underline mb-1 truncate">{settings.siteTitle}</h3>
                                <p className="text-sm text-gray-600 line-clamp-2">{settings.siteDescription}</p>
                            </div>
                        </div>

                        {/* Facebook Preview */}
                        <div>
                            <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Facebook / WhatsApp</p>
                            <div className="bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                <div className="h-32 bg-gray-300 relative">
                                    {settings.ogImage && <img src={settings.ogImage} className="w-full h-full object-cover" />}
                                </div>
                                <div className="p-3 bg-gray-50">
                                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">KARTAVANTAJ.COM</p>
                                    <p className="font-bold text-gray-900 leading-tight mb-1 truncate">{settings.ogTitle}</p>
                                    <p className="text-xs text-gray-600 line-clamp-1">{settings.ogDescription}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <FileText size={18} className="text-gray-500" />
                            Robots.txt
                        </h2>
                        <textarea
                            name="robotsTxt"
                            value={settings.robotsTxt}
                            onChange={handleChange}
                            rows={4}
                            className="w-full bg-gray-900 text-green-400 font-mono text-xs p-4 rounded-lg outline-none"
                        />
                        <div className="mt-4 flex gap-2">
                            <button className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-xs font-bold hover:bg-gray-200">Sitemap Oluştur</button>
                            <button className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-xs font-bold hover:bg-gray-200">İndeksle</button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
