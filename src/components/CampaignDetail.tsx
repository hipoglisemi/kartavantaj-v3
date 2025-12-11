import { Calendar, CreditCard, ArrowRight, Heart, Share2, TrendingUp, Smartphone, Sparkles, Loader2, ThumbsUp, ThumbsDown } from 'lucide-react';
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
}

export default function CampaignDetail({ data, isAdmin, onSave, onDelete }: CampaignDetailProps) {
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
            // Get latest user data to avoid race conditions
            // (Ideally we would have a better state management, but this works for now)
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
                // Ensure specific fields are correctly handled if result is partial
                min_spend: result.min_spend || prev.min_spend,
                earning: result.earning || prev.earning,
                valid_from: result.valid_from || prev.valid_from,
                validUntil: result.validUntil || prev.validUntil,
                description: result.description || prev.description,
            }));

            setAiMessage({ type: 'success', text: 'AI iyileştirmesi tamamlandı! Verileri kontrol edip kaydedin.' });
            // Auto-clear success message after 5s
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

    // Update local form when data changes
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

    // Benzer kampanyaları filtrele (Tüm havuzdan: Static + Dynamic)
    const allCampaigns = campaignService.getCampaigns();
    const relatedCampaigns = allCampaigns
        .filter(c => c.category === data.category && c.bank === data.bank && c.id !== data.id)
        .slice(0, 4);

    // Banka logosunu bulma fonksiyonu (CampaignCard'dan alındı)
    const getProviderLogo = (provider?: string): string | null => {
        if (!provider) return null;

        // 1. Try to find in localStorage config (Dynamic)
        try {
            const savedConfig = localStorage.getItem('scraper_config');
            if (savedConfig) {
                const banks = JSON.parse(savedConfig) as Array<{ id: string, name: string, logo: string, cards: any[] }>;

                // Search by Name
                const bank = banks.find(b => b.name.toLowerCase().includes(provider.toLowerCase()) || provider.toLowerCase().includes(b.name.toLowerCase()));
                if (bank && bank.logo) return bank.logo;

                // Search by ID (if provider is actually an ID)
                const bankById = banks.find(b => b.id === provider.toLowerCase());
                if (bankById && bankById.logo) return bankById.logo;
            }
        } catch (e) {
            // Fallback silently
        }

        // 2. Fallback to Hardcoded Map
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

    return (
        <div className="container mx-auto">

            {/* Hero Alanı (Split Layout) */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col md:flex-row mb-8 relative">

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
                <div className="md:w-1/2 h-64 md:h-auto relative group">
                    <img
                        src={data.image}
                        alt={data.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    {/* Banka Logosu (Sol Üst) */}
                    <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md px-4 py-2 rounded-xl shadow-lg z-10 border border-gray-100 min-w-[100px] flex items-center justify-center">
                        {providerLogo ? (
                            <img
                                src={providerLogo}
                                alt={data.bank}
                                className="object-contain max-h-10 w-auto"
                            />
                        ) : (
                            <span className="text-gray-800 text-sm font-bold">{data.bank}</span>
                        )}
                    </div>

                    {/* Countdown (Sol Alt) */}
                    <div className="absolute bottom-4 left-4 z-10">
                        <CampaignCountdown validUntil={data.validUntil || null} />
                    </div>
                </div>

                {/* Sağ: Başlık ve Açıklama */}
                <div className="md:w-1/2 p-6 md:p-8 flex flex-col justify-center">
                    <div className="flex items-center justify-between mb-4">
                        const CATEGORIES = [
                        'Market', 'Akaryakıt', 'Giyim', 'Elektronik', 'Restoran',
                        'Seyahat', 'E-Ticaret', 'Sağlık', 'Eğitim', 'Kozmetik',
                        'Mobilya', 'Genel', 'Diğer', 'Eğlence'
                        ].sort();

                        export default function CampaignDetail({data, isAdmin, onSave, onDelete}: CampaignDetailProps) {
                            // ... (rest of the component logic remains initially same until we hit the render part)
                            // Actually, I can't put the constant inside the replacement if I want to keep the existing code clean.
                            // The user wants me to edit specific lines. I should probably add the constant at the top of the file in a separate step or just inside the component for simplicity if I can't reach top.
                            // BUT the replace_file_content tool requires me to be precise. 
                            // Let's add the constant at the top first, or simply inline the options if it's cleaner. 
                            // I will use a separate replacement for the rendering logic.
                            // Wait, I can do it in one go if I include the lines around where I insert.
                            // But lines 20-280 are huge. 
                            // I'll stick to replacing the render block at 284. I'll define the constant locally inside the render or just textually.

                            // ...
                            // Let's just hardcode the options in the select for now or define the array inside the component scope if I don't want to touch imports.
                            // Better: Helper function or array inside component.

                            // Changing the logic at 284:
                            /*
                                                {isEditing ? (
                                                    <select
                                                        value={editForm.category}
                                                        onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                                                        className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-gray-100 border border-gray-300 text-gray-700 outline-none focus:ring-2 focus:ring-purple-500"
                                                    >
                                                        {['Market', 'Akaryakıt', 'Giyim', 'Elektronik', 'Restoran', 'Seyahat', 'E-Ticaret', 'Sağlık', 'Eğitim', 'Kozmetik', 'Mobilya', 'Genel', 'Diğer', 'Eğlence'].map(cat => (
                                                            <option key={cat} value={cat}>{cat}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${data.badgeColor === 'green' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>
                                                        {data.category}
                                                    </span>
                                                )}
                            */

                            // The previous tool call I am making right now is asking for replacement content.
                            // I'll execute the change on the render block.

                            {
                                isEditing?(
                            <div className = "flex items-center gap-2" >
                                        <select
                                            value={editForm.category}
                                            onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                                            className="px-3 py-1 rounded-full text-xs font-bold bg-white border border-gray-300 text-gray-700 shadow-sm outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                                        >
                                            {['Market', 'Akaryakıt', 'Giyim', 'Elektronik', 'Restoran', 'Seyahat', 'E-Ticaret', 'Sağlık', 'Eğitim', 'Kozmetik', 'Mobilya', 'Genel', 'Diğer', 'Eğlence'].sort().map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                            </div>
                    ) : (
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${data.badgeColor === 'green' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>
                        {data.category}
                    </span>
                        )}
                    {/* Kutu (Legacy - Removed Calculator) */}
                    {!isEditing && (
                        <div className="flex items-center gap-2">
                            <CampaignFeedback campaignId={data.id} />

                            <button
                                onClick={handleFavorite}
                                className={`p-2 rounded-full transition-all active:scale-95 ${favorited ? 'bg-pink-100 text-pink-600' : 'hover:bg-gray-100 text-gray-500'}`}
                                title="Favorilere Ekle"
                            >
                                <Heart size={20} fill={favorited ? "currentColor" : "none"} />
                            </button>
                            <button className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-all active:scale-95" title="Paylaş">
                                <Share2 size={20} />
                            </button>
                        </div>
                    )}
                </div>

                {aiMessage && (
                    <div className={`mt-4 p-3 rounded-lg flex items-start gap-2 text-sm ${aiMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                        {aiMessage.type === 'success' ? <ThumbsUp size={16} className="mt-0.5" /> : <ThumbsDown size={16} className="mt-0.5" />}
                        <span>{aiMessage.text}</span>
                    </div>
                )}

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
                        <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-2 leading-tight">
                            {data.title}
                        </h2>
                        <p className="text-gray-600 text-[13px] md:text-sm leading-relaxed">
                            {data.description || `${data.bank} kartlarınızla yapacağınız alışverişlerde kaçırılmayacak fırsatlar sizi bekliyor. Kampanya detaylarını inceleyerek hemen katılın!`}
                        </p>
                    </>
                )}
            </div>
        </div>

            {/* Kampanya Detayları - Grid */ }
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">

        {/* Kutu 1: Katılım Tarihi */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col gap-2 h-full">
            <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-emerald-500" />
                <h3 className="font-bold text-xs text-gray-900">Katılım Tarihi</h3>
            </div>
            <div className="text-[13px] text-gray-600">
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
                    // Format Logic: Both, Only End, Only Start
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

        {/* Kutu 2: Avantaj (3 Alt Kutu) */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex flex-col gap-3 h-full">
            <div className="flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-purple-500" />
                <h3 className="font-bold text-gray-900">Fırsat Detayları</h3>
            </div>
            <div className="space-y-2 mt-1">
                {/* Harcama */}
                <div className="bg-red-50 border border-red-100 rounded-lg p-2.5">
                    <span className="text-[10px] uppercase font-bold text-red-800 block mb-0.5">Harcama</span>
                    {isEditing ? (
                        <input
                            type="number"
                            className="w-full text-xs border rounded"
                            value={editForm.min_spend || ''}
                            onChange={e => setEditForm({ ...editForm, min_spend: parseInt(e.target.value) || 0 })}
                        />
                    ) : (
                        <p className="text-sm font-semibold text-red-950">
                            {data.min_spend ? `₺${data.min_spend.toLocaleString('tr-TR')}` : (data.spendAmount || '-')}
                        </p>
                    )}
                </div>

                {/* Kazanç */}
                <div className="bg-green-50 border border-green-100 rounded-lg p-2.5">
                    <span className="text-[10px] uppercase font-bold text-green-800 block mb-0.5">Kazanç</span>
                    {isEditing ? (
                        <input
                            type="text"
                            className="w-full text-xs border rounded"
                            value={editForm.earning || ''}
                            onChange={e => setEditForm({ ...editForm, earning: e.target.value })}
                        />
                    ) : (
                        <p className="text-sm font-semibold text-green-950">
                            {data.earning || data.earnAmount || '-'}
                        </p>
                    )}
                </div>

                {/* Ek Avantaj */}
                <div className="bg-purple-50 border border-purple-100 rounded-lg p-2.5">
                    <span className="text-[10px] uppercase font-bold text-purple-800 block mb-0.5">Ek Avantaj</span>
                    {isEditing ? (
                        <input
                            type="text"
                            className="w-full text-xs border rounded"
                            value={editForm.discount || ''}
                            onChange={e => setEditForm({ ...editForm, discount: e.target.value })}
                        />
                    ) : (
                        <p className="text-sm font-semibold text-purple-950">
                            {data.discount || '-'}
                        </p>
                    )}
                </div>
            </div>
        </div>

        {/* Kutu 3: Geçerli Kartlar */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex flex-col gap-3 h-full">
            <div className="flex items-center gap-2">
                <CreditCard className="h-6 w-6 text-indigo-500" />
                <h3 className="font-bold text-gray-900">Geçerli Kartlar</h3>
            </div>
            <div>
                {isEditing ? (
                    <textarea
                        className="w-full h-32 text-xs border rounded p-1"
                        value={editForm.eligible_customers ? editForm.eligible_customers.join(', ') : (editForm.validCards || '')}
                        onChange={e => setEditForm({ ...editForm, eligible_customers: e.target.value.split(',').map(s => s.trim()) })}
                        placeholder="Kartları virgülle ayırın"
                    />
                ) : (
                    <p className="text-sm text-gray-600 leading-relaxed">
                        {data.eligible_customers && data.eligible_customers.length > 0
                            ? data.eligible_customers.join(', ')
                            : (data.validCards || data.bank)}
                    </p>
                )}
            </div>
        </div>

        {/* Kutu 4: Katılım Şekli */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex flex-col gap-3 h-full">
            <div className="flex items-center gap-2">
                <Smartphone className="h-6 w-6 text-amber-500" />
                <h3 className="font-bold text-gray-900">Katılım Şekli</h3>
            </div>
            <div>
                {isEditing ? (
                    <textarea
                        className="w-full h-32 text-xs border rounded p-1"
                        value={editForm.participation_method || editForm.joinMethod || ''}
                        onChange={e => setEditForm({ ...editForm, participation_method: e.target.value })}
                    />
                ) : (
                    <p className="text-sm text-gray-600 leading-relaxed">
                        {data.participation_method || data.joinMethod || 'Kampanya detaylarını kontrol ediniz.'}
                    </p>
                )}
            </div>
        </div>

    </div>

    {/* Kampanya Detayları (Akordiyon) */ }
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

                    {/* 1. Katılım Adımları (Varsa) */}
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

                    {/* 2. Koşullar (Varsa) */}
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

                    {/* 3. Legacy Fallback */}
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

    {/* Footer / Other Campaigns */ }
    <div className="mt-16 mb-8 text-center border-t border-gray-100 pt-8">
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

    {
        relatedCampaigns.length > 0 && (
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
        )
    }
        </div >
    );
}