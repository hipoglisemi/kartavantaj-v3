import { Calendar, CreditCard, ArrowRight, Heart, Share2, TrendingUp, Smartphone, Sparkles, Loader2, ThumbsUp, ThumbsDown, ChevronRight, Home } from 'lucide-react';
import CampaignCard, { type CampaignProps } from './CampaignCard';
import { campaignParser } from '../services/campaignParser';
import { useState, useEffect } from 'react';
import { authService, supabase } from '../services/authService';
import { useConfirmation } from '../context/ConfirmationContext';
import Accordion from './Accordion';
import CampaignCountdown from './CampaignCountdown';
import CampaignFeedback from './CampaignFeedback';
import { campaignService } from '../services/campaignService';

interface CampaignDetailProps {
    data: CampaignProps;
    isAdmin?: boolean;
    onSave?: (updated: CampaignProps) => void;
    onDelete?: (id: number) => void;
    onHomeClick?: () => void;
    onBankClick?: (bankName: string) => void;
}

export default function CampaignDetail({ data, isAdmin, onSave, onDelete, onHomeClick, onBankClick }: CampaignDetailProps) {
    const { confirm, alert } = useConfirmation();
    const [user, setUser] = useState<any>(null);
    const [favorited, setFavorited] = useState(false);

    // Initial auth check and load favorites
    useEffect(() => {
        authService.getUser().then((u) => {
            if (u) {
                setUser(u);
                const favorites = (u.user_metadata?.favorites || []) as number[];
                if (favorites.includes(data.id)) {
                    setFavorited(true);
                }
            }
        });
    }, [data.id]);

    const handleFavorite = async () => {
        if (!user) {
            await alert('Favorilere eklemek için giriş yapmalısınız.', 'Giriş Gerekli');
            return;
        }

        const newStatus = !favorited;
        setFavorited(newStatus); // Optimistic UI update

        try {
            const currentUser = await authService.getUser();
            if (!currentUser) return;

            let favorites = (currentUser.user_metadata?.favorites || []) as number[];

            if (newStatus) {
                if (!favorites.includes(data.id)) favorites.push(data.id);
            } else {
                favorites = favorites.filter(id => id !== data.id);
            }

            const { error } = await supabase!.auth.updateUser({
                data: { favorites }
            });

            if (error) throw error;
        } catch (error) {
            console.error('Favori güncellenemedi:', error);
            setFavorited(!newStatus); // Revert on error
            await alert('Bir hata oluştu.', 'Hata');
        }
    };

    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState(data);
    const [isFixing, setIsFixing] = useState(false);
    const [aiMessage, setAiMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleAIFix = async () => {
        setIsFixing(true);
        setAiMessage(null);
        try {
            const apiKey = localStorage.getItem('gemini_key') || import.meta.env.VITE_GEMINI_API_KEY;

            // Combine fields to get maximum context
            const rawText = `
                Title: ${editForm.title}
                Description: ${editForm.description}
                Conditions: ${editForm.conditions?.join('\n')}
            `.trim();

            if (!rawText) {
                setAiMessage({ type: 'error', text: 'Analiz edilecek yeterli veri yok.' });
                return;
            }

            const result = await campaignParser.parseWithGemini(rawText, apiKey);

            // Merge with existing form (prioritize new AI data if valid)
            setEditForm(prev => ({
                ...prev,
                ...result,
                min_spend: result.min_spend || prev.min_spend,
                earning: result.earning || prev.earning,
                valid_from: result.valid_from || prev.valid_from,
                validUntil: result.validUntil || prev.validUntil,
                description: result.description || prev.description,
            }));

            setAiMessage({ type: 'success', text: 'AI iyileştirmesi tamamlandı! Verileri kontrol edip kaydedin.' });
            setTimeout(() => setAiMessage(null), 5000);

        } catch (error: any) {
            console.error('AI Fix Error:', error);
            if (error.message === 'API Key required') {
                setAiMessage({ type: 'error', text: 'API Anahtarı eksik! Ayarlar sayfasından ekleyin.' });
            } else {
                setAiMessage({ type: 'error', text: `Hata: ${error.message || 'Bilinmeyen sorun'}` });
            }
        } finally {
            setIsFixing(false);
        }
    };

    if (data.id !== editForm.id) {
        setEditForm(data);
    }

    const handleSave = () => {
        if (onSave) {
            onSave(editForm);
            setIsEditing(false);
        }
    };

    if (!data) return null;

    const allCampaigns = campaignService.getCampaigns();
    const relatedCampaigns = allCampaigns
        .filter(c => c.category === data.category && c.bank === data.bank && c.id !== data.id)
        .slice(0, 4);

    const getProviderLogo = (provider?: string): string | null => {
        if (!provider) return null;
        try {
            const savedConfig = localStorage.getItem('scraper_config');
            if (savedConfig) {
                const banks = JSON.parse(savedConfig) as Array<{ id: string, name: string, logo: string, cards: any[] }>;
                const bank = banks.find(b => b.name.toLowerCase().includes(provider.toLowerCase()) || provider.toLowerCase().includes(b.name.toLowerCase()));
                if (bank && bank.logo) return bank.logo;
                const bankById = banks.find(b => b.id === provider.toLowerCase());
                if (bankById && bankById.logo) return bankById.logo;
            }
        } catch (e) { }

        const providerLower = provider.toLowerCase();
        const logoMap: Record<string, string> = {
            'axess': '/assets/logos/axess.png',
            'bonus': '/assets/logos/bonus.png',
            'maximum': '/assets/logos/maximum.png',
            'world': '/assets/logos/world.png',
            'paraf': '/assets/logos/paraf.png',
            'cardfinans': '/assets/logos/cardfinans.png',
            'card finans': '/assets/logos/cardfinans.png',
            'bankkart': '/assets/logos/bankkart.png',
            'ziraat': '/assets/logos/bankkart.png',
            'advantage': '/assets/logos/advantage.png',
            'adios': '/assets/logos/adios.png',
            'wings': '/assets/logos/wings.png',
            'shop&fly': '/assets/logos/shopandfly.png',
            'shop and fly': '/assets/logos/shopandfly.png',
            'maximiles': '/assets/logos/maximiles.png',
            'amex': '/assets/logos/amex.png',
            'crystal': '/assets/logos/crystal.png',
            'miles': '/assets/logos/milesandsmiles.png',
            'play': '/assets/logos/play.png'
        };
        for (const [key, logo] of Object.entries(logoMap)) {
            if (providerLower.includes(key)) return logo;
        }
        return null;
    };

    const providerLogo = data.cardLogo || getProviderLogo(data.bank);

    const handleShare = async () => {
        const shareData = {
            title: data.title,
            text: `${data.bank} - ${data.title}\n${data.description?.substring(0, 100)}...`,
            url: window.location.href
        };

        if (navigator.share) {
            try { await navigator.share(shareData); } catch (err) { }
        } else {
            try {
                await navigator.clipboard.writeText(window.location.href);
                await alert('Kampanya linki kopyalandı!', 'Başarılı');
            } catch (err) { }
        }
    };

    const availableCategories = Array.from(new Set([
        'Giyim', 'Market', 'Elektronik', 'Seyahat', 'Restoran',
        'Akaryakıt', 'E-Ticaret', 'Kozmetik', 'Eğitim', 'Sağlık', 'Mobilya', 'Diğer',
        ...allCampaigns.map(c => c.category || 'Diğer')
    ])).sort();

    return (
        <div className="container mx-auto max-w-5xl">

            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium mb-3 ml-1 select-none">
                <div
                    className={`flex items-center gap-1 transition-colors ${onHomeClick ? 'cursor-pointer hover:text-gray-600' : ''}`}
                    onClick={onHomeClick}
                >
                    <Home size={12} />
                    <span>Anasayfa</span>
                </div>
                <ChevronRight size={10} className="text-gray-300" />
                <span
                    className={`transition-colors ${onBankClick ? 'cursor-pointer hover:text-gray-600' : ''}`}
                    onClick={() => onBankClick && onBankClick(data.bank)}
                >
                    {data.bank}
                </span>
                <ChevronRight size={10} className="text-gray-300" />
                <span className="text-purple-600 truncate max-w-[200px] md:max-w-xs">{data.title}</span>
            </div>

            {/* Hero Alanı (Split Layout) */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col md:flex-row mb-6 relative">

                {/* Admin Edit Button */}
                {isAdmin && (
                    <div className="absolute top-4 right-4 z-50">
                        {isEditing ? (
                            <div className="flex">
                                <button
                                    type="button"
                                    onClick={handleAIFix}
                                    disabled={isFixing}
                                    className="mr-2 bg-violet-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-violet-700 font-bold transition-all flex items-center gap-2"
                                >
                                    {isFixing ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                                    AI ile Düzelt
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-green-700 font-bold transition-all"
                                >
                                    Kaydet
                                </button>
                                {onDelete && (
                                    <button
                                        onClick={async () => {
                                            if (await confirm({
                                                title: 'Kampanyayı Sil',
                                                message: 'Bu kampanyayı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.',
                                                type: 'danger'
                                            })) {
                                                if (onDelete) onDelete(data.id);
                                            }
                                        }}
                                        className="ml-2 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-red-700 font-bold transition-all"
                                    >
                                        Sil
                                    </button>
                                )}
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-purple-700 font-bold transition-all"
                            >
                                Düzenle
                            </button>
                        )}
                    </div>
                )}

                {/* Sol: Görsel */}
                <div className="md:w-1/2 h-56 md:h-auto relative group">
                    <img
                        src={data.image}
                        alt={data.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-lg z-10 border border-gray-100 min-w-[80px] flex items-center justify-center">
                        {providerLogo ? (
                            <img
                                src={providerLogo}
                                alt={data.bank}
                                className="object-contain max-h-8 w-auto"
                            />
                        ) : (
                            <span className="text-gray-800 text-sm font-bold">{data.bank}</span>
                        )}
                    </div>
                    <div className="absolute bottom-4 left-4 z-10">
                        <CampaignCountdown validUntil={data.validUntil || null} />
                    </div>
                </div>

                {/* Sağ: Başlık ve Açıklama */}
                <div className="md:w-1/2 p-5 md:p-6 flex flex-col justify-center">

                    {/* AI Message Feedback */}
                    {aiMessage && (
                        <div className={`mb-4 p-3 rounded-lg flex items-start gap-2 text-sm ${aiMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                            {aiMessage.type === 'success' ? <ThumbsUp size={16} className="mt-0.5" /> : <ThumbsDown size={16} className="mt-0.5" />}
                            <span>{aiMessage.text}</span>
                        </div>
                    )}

                    <div className="flex items-center justify-between mb-3">
                        {isEditing ? (
                            <div className="relative group">
                                <select
                                    value={editForm.category}
                                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                                    className="appearance-none bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold rounded-full px-3 py-1 pr-7 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                                >
                                    {availableCategories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                                <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 text-purple-400 rotate-90 pointer-events-none" size={12} />
                            </div>
                        ) : (
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${data.badgeColor === 'green' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>
                                {data.category}
                            </span>
                        )}
                        {!isEditing && (
                            <div className="flex items-center gap-2">
                                <CampaignFeedback campaignId={data.id} />
                                <button
                                    onClick={handleFavorite}
                                    className={`p-1.5 rounded-full transition-all active:scale-95 ${favorited ? 'bg-pink-100 text-pink-600' : 'hover:bg-gray-100 text-gray-500'}`}
                                    title="Favorilere Ekle"
                                >
                                    <Heart size={18} fill={favorited ? "currentColor" : "none"} />
                                </button>
                                <button
                                    onClick={handleShare}
                                    className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 transition-all active:scale-95"
                                    title="Paylaş"
                                >
                                    <Share2 size={18} />
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="mt-2">
                        {isEditing ? (
                            <div className="space-y-4">
                                <input
                                    type="text"
                                    value={editForm.title}
                                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                    className="w-full text-lg font-bold border border-purple-200 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 outline-none"
                                    placeholder="Kampanya Başlığı"
                                />
                                <textarea
                                    value={editForm.badgeText}
                                    onChange={(e) => setEditForm({ ...editForm, badgeText: e.target.value })}
                                    className="w-full h-24 border border-purple-200 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 outline-none resize-none text-sm"
                                    placeholder="Açıklama / Rozet Metni"
                                />
                            </div>
                        ) : (
                            <>
                                <h2 className="text-lg font-bold text-gray-900 mb-2 leading-tight">
                                    {data.title}
                                </h2>
                                <p className="text-gray-600 text-xs md:text-sm leading-relaxed">
                                    {data.description || `${data.bank} kartlarınızla yapacağınız alışverişlerde kaçırılmayacak fırsatlar sizi bekliyor. Kampanya detaylarını inceleyerek hemen katılın!`}
                                </p>
                            </>
                        )}
                    </div>

                </div>
            </div>

            {/* Kampanya Detayları - Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mt-6">

                {/* Kutu 1: Katılım Tarihi */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col gap-2 h-full">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-emerald-500" />
                        <h3 className="font-bold text-xs text-gray-900">Katılım Tarihi</h3>
                    </div>
                    <div className="text-xs text-gray-600">
                        {isEditing ? (
                            <div className="space-y-2">
                                <input
                                    type="text"
                                    placeholder="Başlangıç (Örn: 2024-01-15)"
                                    className="w-full border rounded p-1 text-xs"
                                    value={editForm.valid_from || ''}
                                    onChange={e => setEditForm({ ...editForm, valid_from: e.target.value })}
                                />
                                <input
                                    type="text"
                                    placeholder="Bitiş (Örn: 2024-03-31)"
                                    className="w-full border rounded p-1 text-xs"
                                    value={editForm.validUntil || ''}
                                    onChange={e => setEditForm({ ...editForm, validUntil: e.target.value })}
                                />
                            </div>
                        ) : (
                            (() => {
                                const start = data.valid_from ? new Date(data.valid_from as string).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : null;
                                const end = data.validUntil ? new Date(data.validUntil as string).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : null;
                                if (start && end) return `${start} - ${end}`;
                                if (end) return `${end} tarihine kadar`;
                                if (start) return `${start} tarihinden itibaren`;
                                return 'Belirtilmemiş';
                            })()
                        )}
                    </div>
                </div>

                {/* Kutu 2: Avantaj */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col gap-2 h-full">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-purple-500" />
                        <h3 className="font-bold text-xs text-gray-900">Fırsat Detayları</h3>
                    </div>
                    <div className="space-y-1.5 mt-0.5">
                        <div className="bg-red-50 border border-red-100 rounded-lg p-2">
                            <span className="text-[9px] uppercase font-bold text-red-800 block mb-0.5">Harcama</span>
                            {isEditing ? (
                                <input
                                    type="number"
                                    className="w-full text-xs border rounded"
                                    value={editForm.min_spend || ''}
                                    onChange={e => setEditForm({ ...editForm, min_spend: parseInt(e.target.value) || 0 })}
                                />
                            ) : (
                                <p className="text-xs font-semibold text-red-950">
                                    {data.min_spend ? `₺${data.min_spend.toLocaleString('tr-TR')}` : (data.spendAmount || '-')}
                                </p>
                            )}
                        </div>
                        <div className="bg-green-50 border border-green-100 rounded-lg p-2">
                            <span className="text-[9px] uppercase font-bold text-green-800 block mb-0.5">Kazanç</span>
                            {isEditing ? (
                                <input
                                    type="text"
                                    className="w-full text-xs border rounded"
                                    value={editForm.earning || ''}
                                    onChange={e => setEditForm({ ...editForm, earning: e.target.value })}
                                />
                            ) : (
                                <p className="text-xs font-semibold text-green-950">
                                    {data.earning || data.earnAmount || '-'}
                                </p>
                            )}
                        </div>
                        <div className="bg-purple-50 border border-purple-100 rounded-lg p-2">
                            <span className="text-[9px] uppercase font-bold text-purple-800 block mb-0.5">Ek Avantaj</span>
                            {isEditing ? (
                                <input
                                    type="text"
                                    className="w-full text-xs border rounded"
                                    value={editForm.discount || ''}
                                    onChange={e => setEditForm({ ...editForm, discount: e.target.value })}
                                />
                            ) : (
                                <p className="text-xs font-semibold text-purple-950">
                                    {data.discount || '-'}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Kutu 3: Geçerli Kartlar */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col gap-2 h-full">
                    <div className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-indigo-500" />
                        <h3 className="font-bold text-xs text-gray-900">Geçerli Kartlar</h3>
                    </div>
                    <div>
                        {isEditing ? (
                            <textarea
                                className="w-full h-24 text-xs border rounded p-1"
                                value={editForm.eligible_customers ? editForm.eligible_customers.join(', ') : (editForm.validCards || '')}
                                onChange={e => setEditForm({ ...editForm, eligible_customers: e.target.value.split(',').map(s => s.trim()) })}
                                placeholder="Kartları virgülle ayırın"
                            />
                        ) : (
                            <p className="text-xs text-gray-600 leading-relaxed">
                                {data.eligible_customers && data.eligible_customers.length > 0
                                    ? data.eligible_customers.join(', ')
                                    : (data.validCards || data.bank)}
                            </p>
                        )}
                    </div>
                </div>

                {/* Kutu 4: Katılım Şekli */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col gap-2 h-full">
                    <div className="flex items-center gap-2">
                        <Smartphone className="h-5 w-5 text-amber-500" />
                        <h3 className="font-bold text-xs text-gray-900">Katılım Şekli</h3>
                    </div>
                    <div>
                        {isEditing ? (
                            <textarea
                                className="w-full h-24 text-xs border rounded p-1"
                                value={editForm.participation_method || editForm.joinMethod || ''}
                                onChange={e => setEditForm({ ...editForm, participation_method: e.target.value })}
                            />
                        ) : (
                            <p className="text-xs text-gray-600 leading-relaxed">
                                {data.participation_method || data.joinMethod || 'Kampanya detaylarını kontrol ediniz.'}
                            </p>
                        )}
                    </div>
                </div>

            </div>

            {/* Kampanya Detayları (Akordiyon) */}
            <div className="mt-8">
                {isEditing ? (
                    <div className="space-y-4">
                        <h3 className="font-bold text-gray-900">Kampanya Koşulları (Her satır bir madde)</h3>
                        <textarea
                            value={editForm.terms ? editForm.terms.join('\n') : ''}
                            onChange={(e) => setEditForm({ ...editForm, terms: e.target.value.split('\n') })}
                            className="w-full h-40 border border-purple-200 rounded-lg p-4 focus:ring-2 focus:ring-purple-500 outline-none"
                            placeholder="Madde 1&#10;Madde 2&#10;Madde 3"
                        />
                        <h3 className="font-bold text-gray-900">Kampanya Linki</h3>
                        <input
                            type="text"
                            value={editForm.url || ''}
                            onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
                            className="w-full border border-purple-200 rounded-lg p-2 focus:ring-2 focus:ring-purple-500 outline-none"
                            placeholder="https://..."
                        />
                    </div>
                ) : (
                    <Accordion title="Kampanya Detayları ve Koşullar">
                        <div className="text-gray-600 space-y-6 text-sm leading-relaxed">
                            {data.participation_points && data.participation_points.length > 0 && (
                                <div>
                                    <h4 className="font-bold text-gray-900 mb-2">Nasıl Katılırım?</h4>
                                    <ul className="list-decimal pl-5 space-y-1">
                                        {data.participation_points.map((step, idx) => (
                                            <li key={idx}>{step}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {data.conditions && data.conditions.length > 0 && (
                                <div>
                                    <h4 className="font-bold text-gray-900 mb-2">Kampanya Koşulları</h4>
                                    <ul className="list-disc pl-5 space-y-1">
                                        {data.conditions.map((cond, idx) => (
                                            <li key={idx}>{cond}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {(!data.conditions || data.conditions.length === 0) && (!data.participation_points || data.participation_points.length === 0) && (
                                <div>
                                    {data.terms && data.terms.length > 0 ? (
                                        <ul className="list-decimal pl-5 space-y-1">
                                            {data.terms.map((term, idx) => (
                                                <li key={idx}>{term}</li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div className="space-y-2">
                                            <p>1. Bu kampanya yalnızca belirtilen tarihler arasında geçerlidir ve stoklarla sınırlıdır.</p>
                                            <p>2. Kampanyaya katılım için banka mobil uygulamasından veya SMS ile kayıt olunması gerekmektedir.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </Accordion>
                )}

                {!isEditing && (
                    <button
                        onClick={async () => data.url ? window.open(data.url, '_blank') : await alert('Kampanya linki bulunamadı.', 'Hata')}
                        className="w-full bg-[#57AC79] hover:bg-[#469666] text-white text-sm py-4 rounded-xl font-bold mt-4 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 transform active:scale-95"
                    >
                        Kampanyaya Katıl <ArrowRight size={18} />
                    </button>
                )}
            </div>

            {/* Footer / Other Campaigns */}
            <div className="mt-6 mb-8 text-center border-t border-gray-100 pt-8">
                <div className="flex items-center justify-center gap-2 text-xs text-gray-400 font-medium">
                    <span>Bu sayfada yer alan kampanya bilgileri</span>
                    {providerLogo ? (
                        <img src={providerLogo || ''} alt={data.bank} className={`object-contain mx-1 grayscale opacity-70 ${data.bank.toLowerCase().includes('adios') || (providerLogo && providerLogo.includes('adios')) ? 'h-6' : 'h-4'}`} />
                    ) : (
                        <span className="uppercase">{data.bank}</span>
                    )}
                    <span>verilerinden derlenmiştir.</span>
                </div>
            </div>

            {relatedCampaigns.length > 0 && (
                <div className="mt-8 mb-12">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-xl font-bold text-gray-800">Diğer {data.bank} {data.category} Kampanyaları</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {relatedCampaigns.map((kampanya) => (
                            <div key={kampanya.id} className="relative group">
                                <CampaignCard data={kampanya} />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}