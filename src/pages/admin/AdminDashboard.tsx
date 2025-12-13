import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, Zap, Clock, Activity, Trash2, ChevronDown, ChevronRight, CreditCard, RefreshCw } from 'lucide-react';
import { campaignService } from '../../services/campaignService';

import { useToast } from '../../context/ToastContext';

// ... (inside component)

export default function AdminDashboard() {
    const navigate = useNavigate();
    const { success, error } = useToast();
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const [openBankId, setOpenBankId] = useState<string | null>(null);

    // Yetki kontrolü
    useEffect(() => {
        const isAdmin = localStorage.getItem('isAdmin');
        if (isAdmin !== 'true') {
            navigate('/panel');
            return;
        }
    }, [navigate]);

    // Modal State
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { }
    });

    // Listeners
    useEffect(() => {
        const handleStorageChange = () => {
            setRefreshTrigger(prev => prev + 1);
        };
        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('campaigns-updated', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('campaigns-updated', handleStorageChange);
        };
    }, []);

    const banks = useMemo(() => {
        const saved = localStorage.getItem('scraper_config');
        return saved ? JSON.parse(saved) : [];
    }, []);

    const [allCampaigns, setAllCampaigns] = useState<any[]>([]);

    // Load campaigns from Supabase (same as homepage)
    useEffect(() => {
        const loadCampaigns = async () => {
            try {
                // Use fetchCampaigns(true) to get all campaigns including unapproved
                const campaigns = await campaignService.fetchCampaigns(true);
                setAllCampaigns(campaigns);
                console.log(`📊 AdminDashboard loaded ${campaigns.length} campaigns from Supabase`);
            } catch (error) {
                console.error('Failed to load campaigns for dashboard:', error);
                // Fallback to localStorage if Supabase fails
                const localCampaigns = campaignService.getAllCampaigns();
                setAllCampaigns(localCampaigns);
                console.log(`📊 AdminDashboard fallback: ${localCampaigns.length} campaigns from localStorage`);
            }
        };
        
        loadCampaigns();
    }, [refreshTrigger]);

    const metrics = useMemo(() => {
        const total = allCampaigns.length;
        const active = total;
        const endingSoon = allCampaigns.filter((_, i) => i < 15).length;
        let totalScore = 0;
        allCampaigns.forEach((item: any) => {
            if (item.title) totalScore++;
            if (item.image) totalScore++;
            if (item.validUntil) totalScore++;
            if (item.description) totalScore++;
        });
        const quality = total > 0 ? Math.round((totalScore / (total * 4)) * 100) : 0;
        return { total, active, endingSoon, quality };
    }, [allCampaigns]);

    const categoryData = useMemo(() => {
        const counts: Record<string, number> = {};
        allCampaigns.forEach((c: any) => {
            const cat = c.category || 'Diğer';
            counts[cat] = (counts[cat] || 0) + 1;
        });
        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [allCampaigns]);

    const providerData = useMemo(() => {
        const counts: Record<string, number> = {};
        allCampaigns.forEach((c: any) => {
            const key = c.brand || c.bank || 'Bilinmiyor';
            counts[key] = (counts[key] || 0) + 1;
        });
        return Object.entries(counts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
    }, [allCampaigns]);

    const handleClearAllData = () => {
        setConfirmModal({
            isOpen: true,
            title: 'Tüm Verileri Sil',
            message: 'DİKKAT! Veritabanındaki VE yerel hafızadaki TÜM kampanyalar silinecek. Bu işlem geri alınamaz. Onaylıyor musunuz?',
            onConfirm: async () => {
                // 1. Clear Local Admin Data
                localStorage.setItem('campaign_data', '{}');
                localStorage.setItem('campaigns_data', '[]');

                // 2. Clear Remote Data
                const cloudCleared = await campaignService.clearAllRemoteData();

                if (cloudCleared) {
                    success("Tüm veriler başarıyla silindi ve veritabanı temizlendi.");
                } else {
                    error("Yerel veriler silindi ancak bulut temizlenirken hata oluştu.");
                }

                setRefreshTrigger(prev => prev + 1);
                window.dispatchEvent(new Event('campaigns-updated'));
                window.dispatchEvent(new Event('storage'));

                setConfirmModal(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            {/* Header */}
            <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
                    <p className="text-sm text-gray-500 mt-1">Sistem durumunu ve kampanya istatistiklerini buradan takip edebilirsiniz.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleClearAllData}
                        className="bg-red-50 text-red-600 px-4 py-2 rounded-lg font-bold hover:bg-red-100 transition-colors flex items-center gap-2"
                    >
                        <Trash2 size={18} />
                        Verileri Temizle
                    </button>
                    <button
                        onClick={() => {
                            setRefreshTrigger(prev => prev + 1);
                            window.dispatchEvent(new Event('campaigns-updated'));
                        }}
                        className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg font-bold hover:bg-gray-200 transition-colors flex items-center gap-2"
                    >
                        <RefreshCw size={18} />
                        Yenile
                    </button>
                </div>
            </div>

            {/* Özet Kartlar */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div
                    onClick={() => navigate('/admin/campaigns')}
                    className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between group hover:border-purple-200 transition-all cursor-pointer hover:shadow-md"
                >
                    <div>
                        <p className="text-xs font-medium text-gray-500">Toplam Kampanya</p>
                        <h3 className="text-2xl font-bold text-gray-900 mt-0.5 group-hover:text-purple-600 transition-colors">{metrics.total}</h3>
                    </div>
                    <div className="bg-purple-100 p-2.5 rounded-full text-purple-600 group-hover:bg-purple-200 transition-colors">
                        <Award size={20} />
                    </div>
                </div>

                <div
                    onClick={() => navigate('/admin/campaigns')}
                    className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between group hover:border-green-200 transition-all cursor-pointer hover:shadow-md"
                >
                    <div>
                        <p className="text-xs font-medium text-gray-500">Aktif Kampanya</p>
                        <h3 className="text-2xl font-bold text-green-600 mt-0.5">{metrics.active}</h3>
                    </div>
                    <div className="bg-green-100 p-2.5 rounded-full text-green-600 group-hover:bg-green-200 transition-colors">
                        <Zap size={20} />
                    </div>
                </div>

                <div
                    onClick={() => navigate('/admin/campaigns')} // Ideally filter by "ending soon"
                    className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between group hover:border-orange-200 transition-all cursor-pointer hover:shadow-md"
                >
                    <div>
                        <p className="text-xs font-medium text-gray-500">Yakında Bitecek</p>
                        <h3 className="text-2xl font-bold text-orange-600 mt-0.5">{metrics.endingSoon}</h3>
                    </div>
                    <div className="bg-orange-100 p-2.5 rounded-full text-orange-600 group-hover:bg-orange-200 transition-colors">
                        <Clock size={20} />
                    </div>
                </div>

                <div
                    className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-colors"
                >
                    <div>
                        <p className="text-xs font-medium text-gray-500">Veri Kalitesi</p>
                        <h3 className="text-2xl font-bold text-blue-600 mt-0.5">%{metrics.quality}</h3>
                    </div>
                    <div className="bg-blue-100 p-2.5 rounded-full text-blue-600 group-hover:bg-blue-200 transition-colors">
                        <Activity size={20} />
                    </div>
                </div>
            </div>

            {/* Banka Bazlı Aylık Detaylar (Accordion) */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-8">
                <div className="p-6 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900">Banka & Ay Bazlı Döküm</h3>
                    <p className="text-sm text-gray-500">Bankaların hangi aylarda ne kadar kampanya girdiğini detaylı inceleyin.</p>
                </div>
                <div className="divide-y divide-gray-100">
                    {banks.map((bank: any) => {
                        const bankCampaigns = allCampaigns.filter((c: any) => c.bank === bank.name || (c.bankId && c.bankId === bank.id));
                        const isOpen = openBankId === bank.id;

                        // Group by Month
                        const monthlyGroups: Record<string, any[]> = {};
                        bankCampaigns.forEach((c: any) => {
                            const date = c.createdAt ? new Date(c.createdAt) : new Date(); // Fallback to now if missing
                            const key = date.toLocaleString('tr-TR', { month: 'long', year: 'numeric' });
                            if (!monthlyGroups[key]) monthlyGroups[key] = [];
                            monthlyGroups[key].push(c);
                        });

                        return (
                            <div key={bank.id} className="group">
                                <button
                                    onClick={() => setOpenBankId(isOpen ? null : bank.id)}
                                    className={`w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${isOpen ? 'bg-blue-50/30' : ''}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-white border border-gray-200 p-1.5 flex items-center justify-center shadow-sm">
                                            <img src={bank.logo} alt={bank.name} className="w-full h-full object-contain" />
                                        </div>
                                        <div className="text-left">
                                            <h4 className="font-bold text-gray-900">{bank.name}</h4>
                                            <p className="text-xs text-gray-500">{bankCampaigns.length} Kampanya</p>
                                        </div>
                                    </div>
                                    {isOpen ? <ChevronDown className="text-gray-400" /> : <ChevronRight className="text-gray-400" />}
                                </button>

                                {isOpen && (
                                    <div className="bg-gray-50/50 p-4 space-y-4 animate-in slide-in-from-top-2">
                                        {Object.keys(monthlyGroups).length === 0 ? (
                                            <p className="text-center text-sm text-gray-400 py-4">Bu banka için kayıtlı kampanya yok.</p>
                                        ) : (
                                            Object.entries(monthlyGroups).map(([month, campaigns]) => (
                                                <div key={month} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                                    <div className="bg-gray-100/50 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
                                                        <span className="font-bold text-gray-700 text-sm">{month}</span>
                                                        <span className="text-xs bg-white border border-gray-200 px-2 py-0.5 rounded-full text-gray-600">{campaigns.length} adet</span>
                                                    </div>
                                                    <div className="divide-y divide-gray-100">
                                                        {campaigns.map((c: any) => (
                                                            <div key={c.id} className="p-3 flex items-start gap-3 hover:bg-gray-50 transition-colors">
                                                                <div className="bg-blue-50 text-blue-600 p-1.5 rounded-lg mt-0.5">
                                                                    <CreditCard size={14} />
                                                                </div>
                                                                <div>
                                                                    <h5 className="text-sm font-semibold text-gray-800 line-clamp-1">{c.title}</h5>
                                                                    <div className="flex items-center gap-2 mt-1">
                                                                        <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{c.category}</span>
                                                                        {c.validUntil && <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Bit: {c.validUntil}</span>}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Listeler Alanı (Eski Grafikler Yerine) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Kategori Dağılımı Listesi */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm min-w-0">
                    <h4 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2 border-b pb-4">
                        <span className="w-1 h-6 bg-purple-500 rounded-full"></span>
                        Kategori Dağılımı
                    </h4>
                    <div className="space-y-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                        {categoryData.length === 0 ? (
                            <p className="text-gray-400 text-center py-10">Veri yok</p>
                        ) : (
                            categoryData.map((item, index) => (
                                <div key={index} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold">
                                            {index + 1}
                                        </div>
                                        <span className="font-medium text-gray-700">{item.name}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="h-2 w-24 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-purple-500 rounded-full"
                                                style={{ width: `${(item.value / metrics.total) * 100}%` }}
                                            ></div>
                                        </div>
                                        <span className="font-bold text-gray-900 w-8 text-right">{item.value}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Top 10 Sağlayıcı Listesi */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm min-w-0">
                    <h4 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2 border-b pb-4">
                        <span className="w-1 h-6 bg-red-500 rounded-full"></span>
                        Top 10 Sağlayıcı
                    </h4>
                    <div className="space-y-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                        {providerData.length === 0 ? (
                            <p className="text-gray-400 text-center py-10">Veri yok</p>
                        ) : (
                            providerData.map((item, index) => (
                                <div key={index} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${index < 3 ? 'bg-amber-100 text-amber-700 ring-2 ring-amber-50' : 'bg-gray-100 text-gray-500'}`}>
                                            {index + 1}
                                        </div>
                                        <span className="font-medium text-gray-700">{item.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <span className="font-bold text-gray-900 text-base">{item.count}</span>
                                        kampanya
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>



            {/* Kampanya Takvimi (Calendar View) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Sol Taraf: Takvim */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <div>
                            <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Clock className="text-purple-600" size={20} />
                                Kampanya Takvimi
                            </h4>
                            <p className="text-sm text-gray-500 mt-1">Kampanyaların eklendiği tarihleri görün.</p>
                        </div>
                        <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1">
                            <button
                                onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}
                                className="p-2 hover:bg-white hover:shadow-sm rounded-md transition-all text-gray-600"
                            >
                                &lt;
                            </button>
                            <span className="px-4 font-bold text-gray-700 min-w-[140px] text-center">
                                {currentDate.toLocaleString('tr-TR', { month: 'long', year: 'numeric' })}
                            </span>
                            <button
                                onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}
                                className="p-2 hover:bg-white hover:shadow-sm rounded-md transition-all text-gray-600"
                            >
                                &gt;
                            </button>
                        </div>
                    </div>

                    <div className="p-6">
                        {/* Days Header */}
                        <div className="grid grid-cols-7 mb-2">
                            {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(day => (
                                <div key={day} className="text-center text-xs font-bold text-gray-400 py-2">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-2">
                            {(() => {
                                const year = currentDate.getFullYear();
                                const month = currentDate.getMonth();

                                const firstDay = new Date(year, month, 1).getDay(); // 0 = Sun
                                const daysInMonth = new Date(year, month + 1, 0).getDate();

                                // Adjust so Monday is 0, Sunday is 6
                                const startOffset = firstDay === 0 ? 6 : firstDay - 1;

                                const days = [];

                                // Empty slots
                                for (let i = 0; i < startOffset; i++) {
                                    days.push(<div key={`empty-${i}`} className="aspect-square bg-gray-50/50 rounded-lg"></div>);
                                }

                                // Days
                                for (let d = 1; d <= daysInMonth; d++) {
                                    // Actually better to construct date object and compare
                                    const thisDate = new Date(year, month, d);
                                    const isSelected = selectedDate &&
                                        selectedDate.getDate() === d &&
                                        selectedDate.getMonth() === month &&
                                        selectedDate.getFullYear() === year;

                                    const dayCampaigns = allCampaigns.filter((c: any) => {
                                        if (!c.createdAt) return false;
                                        const cDate = new Date(c.createdAt);
                                        return cDate.getDate() === d && cDate.getMonth() === month && cDate.getFullYear() === year;
                                    });
                                    const count = dayCampaigns.length;

                                    days.push(
                                        <button
                                            key={d}
                                            onClick={() => setSelectedDate(thisDate)}
                                            className={`aspect-square rounded-xl border relative flex flex-col items-center justify-center transition-all
                                                ${isSelected
                                                    ? 'border-purple-500 bg-purple-50 text-purple-700 ring-2 ring-purple-200 z-10'
                                                    : 'border-gray-100 hover:border-purple-200 hover:bg-gray-50 text-gray-700'
                                                }
                                            `}
                                        >
                                            <span className={`text-sm font-medium ${isSelected ? 'font-bold' : ''}`}>{d}</span>
                                            {count > 0 && (
                                                <div className="mt-1 flex gap-0.5">
                                                    {count > 3
                                                        ? <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                                                        : Array(count).fill(0).map((_, i) => (
                                                            <span key={i} className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                                                        ))
                                                    }
                                                </div>
                                            )}
                                        </button>
                                    );
                                }
                                return days;
                            })()}
                        </div>
                    </div>
                </div>

                {/* Sağ Taraf: Seçili Gün Detayı */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[500px]">
                    <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                        <h4 className="font-bold text-gray-800">
                            {selectedDate ? selectedDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Tarih Seçiniz'}
                        </h4>
                        <p className="text-xs text-gray-500">
                            {selectedDate ? 'Bu tarihte eklenen kampanyalar:' : 'Takvimden bir gün seçerek detayları görebilirsiniz.'}
                        </p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-3">
                        {selectedDate ? (() => {
                            const filtered = allCampaigns.filter((c: any) => {
                                if (!c.createdAt) return false;
                                const cDate = new Date(c.createdAt);
                                return cDate.getDate() === selectedDate.getDate() &&
                                    cDate.getMonth() === selectedDate.getMonth() &&
                                    cDate.getFullYear() === selectedDate.getFullYear();
                            });

                            if (filtered.length === 0) {
                                return (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center p-4">
                                        <Clock size={32} className="mb-2 opacity-20" />
                                        <p>Bu tarihte eklenen kampanya yok.</p>
                                    </div>
                                );
                            }

                            return filtered.map((c: any, i: number) => (
                                <div key={i} className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow group">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                {c.cardLogo && <img src={c.cardLogo} className="h-4 w-auto object-contain" />}
                                                <span className="text-xs font-bold text-gray-500 uppercase">{c.bank}</span>
                                            </div>
                                            <h5 className="text-sm font-bold text-gray-900 leading-tight mb-2 line-clamp-2">{c.title || 'Başlıksız'}</h5>
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{c.category}</span>
                                                {c.validUntil && <span>Son: {c.validUntil}</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <a
                                        href={c.url || `/campaign/${c.id}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="mt-3 w-full block text-center bg-purple-50 text-purple-700 text-xs font-bold py-2 rounded hover:bg-purple-100 transition-colors"
                                    >
                                        Kampanyaya Git
                                    </a>
                                </div>
                            ));
                        })() : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center p-4">
                                <p>Lütfen takvimden bir gün seçin.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Veri Kalitesi Analizi (Dynamic) */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <h4 className="text-lg font-bold text-gray-900">Veri Kalitesi Analizi</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {(() => {
                        const total = allCampaigns.length;
                        if (total === 0) {
                            return (
                                <div className="col-span-4 text-center py-6 text-gray-400 italic">
                                    Analiz için veri bulunamadı.
                                </div>
                            );
                        }

                        const withImage = allCampaigns.filter((c: any) => c.image || c.cardLogo).length;
                        const withDesc = allCampaigns.filter((c: any) => c.description && c.description.length > 20).length;
                        const withDate = allCampaigns.filter((c: any) => c.validUntil).length;
                        const withDetail = allCampaigns.filter((c: any) => (c.terms && c.terms.length > 0) || (c.detail && c.detail.length > 50)).length;

                        const calc = (val: number) => Math.round((val / total) * 100);

                        return [
                            { label: 'Görselli', val: `${calc(withImage)}%`, sub: withImage === total ? 'Tam' : `${withImage}/${total}`, color: 'text-blue-600', bg: 'bg-blue-50' },
                            { label: 'Açıklamalı', val: `${calc(withDesc)}%`, sub: calc(withDesc) > 80 ? 'Çoğunlukla' : 'Kısmen', color: 'text-green-600', bg: 'bg-green-50' },
                            { label: 'Tarih', val: `${calc(withDate)}%`, sub: calc(withDate) > 90 ? 'Tam' : 'Eksik', color: 'text-purple-600', bg: 'bg-purple-50' },
                            { label: 'Detaylı', val: `${calc(withDetail)}%`, sub: withDetail === total ? 'Tam' : `${withDetail}/${total}`, color: 'text-orange-600', bg: 'bg-orange-50' },
                        ].map((item, i) => (
                            <div key={i} className={`${item.bg} p-4 rounded-xl text-center`}>
                                <h3 className={`text-2xl font-bold ${item.color}`}>{item.val}</h3>
                                <p className="text-sm font-semibold text-gray-700 mt-1">{item.label}</p>
                                <p className="text-xs text-gray-500 mt-1">{item.sub}</p>
                            </div>
                        ));
                    })()}
                </div>
            </div>

            {
                confirmModal.isOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
                            <h3 className="text-xl font-bold mb-2 flex items-center gap-2 text-red-600">
                                <Trash2 size={24} />
                                {confirmModal.title}
                            </h3>
                            <p className="text-gray-600 mb-6">{confirmModal.message}</p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                                    className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 font-medium transition-colors"
                                >
                                    İptal
                                </button>
                                <button
                                    onClick={confirmModal.onConfirm}
                                    className="px-4 py-2 rounded-lg text-white font-bold transition-colors shadow-lg bg-red-600 hover:bg-red-700"
                                >
                                    Evet, Temizle
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}

