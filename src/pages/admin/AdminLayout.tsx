
import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Settings, Database, LogOut, UploadCloud, ShieldAlert, Home, Search, Bot, Users, Image, Activity, Mail, CloudUpload, Loader2 } from 'lucide-react';
import { campaignService } from '../../services/campaignService';
import { settingsService } from '../../services/settingsService';

function PublishButton() {
    const [isDirty, setIsDirty] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);

    useEffect(() => {
        const checkStatus = () => {
            setIsDirty(settingsService.hasUnsavedChanges());
        };

        // Check initial
        checkStatus();

        // Listen for changes
        window.addEventListener('site-settings-changed', checkStatus);
        return () => window.removeEventListener('site-settings-changed', checkStatus);
    }, []);

    const handlePublish = async () => {
        if (!isDirty) return;
        setIsPublishing(true);
        const success = await settingsService.publishSettings();
        if (success) {
            alert("Tüm değişiklikler başarıyla canlıya alındı! 🚀");
        } else {
            alert("Yayınlama başarısız oldu. Lütfen Supabase bağlantısını kontrol edin.");
        }
        setIsPublishing(false);
    };

    if (!isDirty) return null;

    return (
        <div className="relative group">
            <button
                onClick={handlePublish}
                disabled={isPublishing}
                className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg shadow-md hover:bg-green-700 transition-all animate-pulse hover:animate-none"
            >
                {isPublishing ? <Loader2 size={14} className="animate-spin" /> : <CloudUpload size={14} />}
                <span>Ayarları Yayınla</span>
            </button>
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 p-2 bg-gray-800 text-white text-[10px] rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 text-center">
                Kaydedilmemiş değişiklikler var! Siteye yansıtmak için tıklayın.
            </div>
        </div>
    );
}

export default function AdminLayout() {
    const navigate = useNavigate();
    const location = useLocation();

    // Yetki kontrolü kaldırıldı - sadece UI render edilir

    // Data Source Check
    const campaigns = campaignService.getCampaigns();
    const isLocal = campaigns.length > 0 && campaigns.some((c: any) => c.id < 1000);

    const handleLogout = () => {
        localStorage.removeItem('isAdmin');
        localStorage.removeItem('admin_last_login');
        navigate('/panel/login');
    };

    const navItems = [
        { name: 'Dashboard', path: '/panel/dashboard', icon: LayoutDashboard },
        { name: 'Trafik Analizi', path: '/panel/analytics', icon: Activity },
        { name: 'Kampanyalar', path: '/panel/campaigns', icon: UploadCloud },
        { name: 'Toplu Yükleme', path: '/panel/bulk-upload', icon: Database },
        { name: 'Üye Yönetimi', path: '/panel/members', icon: Users },
        { name: 'Bülten Yönetimi', path: '/panel/newsletter', icon: Mail },
        { name: 'Scraper Araçları', path: '/panel/scrapers', icon: Bot },
        { name: 'AI Asistan', path: '/panel/ai', icon: Bot },
        { name: 'SEO Paneli', path: '/panel/seo', icon: Search },
        { name: 'Ayarlar & Entegrasyon', path: '/panel/settings', icon: Settings },
        { name: 'Logolar', path: '/panel/logos', icon: Image },
        { name: 'Yedekleme & Kurtarma', path: '/panel/backup', icon: Database },
        { name: 'Site Tasarımı', path: '/panel/design', icon: LayoutDashboard },
    ];

    return (
        <div className="flex min-h-screen bg-gray-50 font-sans">
            {/* Sidebar (Left Navigation) */}
            <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col min-h-screen z-20">
                {/* Logo Area */}
                <div className="h-16 flex items-center px-6 border-b border-gray-100 shrink-0">
                    <div className="flex items-center gap-2 text-purple-900">
                        <ShieldAlert size={24} />
                        <span className="text-xl font-bold tracking-tight">AdminPanel</span>
                    </div>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1 min-h-0">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${isActive
                                    ? 'bg-purple-50 text-purple-700'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                <item.icon size={16} />
                                {item.name}
                            </button>
                        );
                    })}
                </nav>

                {/* Sidebar Footer (Logout) */}
                <div className="p-4 border-t border-gray-100 mt-auto shrink-0 bg-white">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-red-600 hover:bg-red-50 transition-colors"
                    >
                        <LogOut size={16} />
                        Çıkış Yap
                    </button>
                </div>
            </aside>

            {/* Main Content Wrapper (Right Side) */}
            <div className="flex-1 flex flex-col min-w-0 min-h-screen bg-gray-50">
                {/* Top Header */}
                <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
                    {/* Left: Breadcrumb/Welcome */}
                    <div className="flex items-center gap-4">
                        <h2 className="text-[15px] font-semibold text-gray-800">
                            {navItems.find(n => n.path === location.pathname)?.name || 'Panel'}
                        </h2>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-6">

                        {/* Publish Changes Button */}
                        <PublishButton />

                        {/* Data Source Indicator */}
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-[10px] text-gray-500">
                            <div className={`w-1.5 h-1.5 rounded-full ${isLocal ? 'bg-orange-500' : 'bg-green-500'}`}></div>
                            <span className="font-semibold">{isLocal ? 'YEREL' : 'SUPABASE'}</span>
                        </div>

                        <a href="/" className="flex items-center gap-2 text-xs text-gray-500 hover:text-purple-600 transition-colors">
                            <Home size={16} />
                            <span className="hidden sm:inline">Siteye Git</span>
                        </a>

                        <div className="h-6 w-px bg-gray-200 mx-2"></div>

                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-[10px]">
                                AD
                            </div>
                            <span className="text-[10px] bg-red-800 text-red-200 px-2 py-0.5 rounded-full border border-red-700">v2.1.2</span>
                        </div>
                    </div>
                </header>

                {/* Scrollable Page Content */}
                <main className="flex-1 p-6 flex flex-col relative bg-gray-50 min-h-0">
                    <div className="flex-1 w-full max-w-5xl mx-auto">
                        <Outlet />
                    </div>

                    {/* Footer */}
                    <footer className="mt-8 pt-6 border-t border-gray-200 text-center text-[10px] text-gray-400 flex-shrink-0 pb-6">
                        <p>KartAvantaj Admin Paneli v2.1 • 2025</p>
                    </footer>
                </main>
            </div>
        </div>
    );
}
