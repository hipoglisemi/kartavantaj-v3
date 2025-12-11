import { useState, useEffect } from 'react';
import { authService, supabase } from '../../services/authService';
import CampaignCard, { type CampaignProps } from '../../components/CampaignCard';
import { campaignService } from '../../services/campaignService'; // Use service

import { useConfirmation } from '../../context/ConfirmationContext';

export function ProfileInfo() {
    const { alert } = useConfirmation();
    const [user, setUser] = useState<any>(null);
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        authService.getUser().then((u) => {
            if (u) {
                setUser(u);
                setName(u.user_metadata?.full_name || '');
            }
        });
    }, []);

    const handleUpdate = async () => {
        if (!supabase) return;
        setLoading(true);
        const { error } = await supabase.auth.updateUser({
            data: { full_name: name }
        });
        setLoading(false);
        if (error) await alert("Güncelleme hatası: " + error.message, "Hata");
        else await alert("Profil güncellendi!", "Başarılı");
    };

    if (!user) return <div>Yükleniyor...</div>;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Kişisel Bilgiler</h2>
            <div className="max-w-md space-y-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">E-posta Adresi</label>
                    <input type="text" value={user.email} disabled className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-500 font-medium" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Ad Soyad</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 font-medium focus:ring-2 focus:ring-purple-500 outline-none"
                        placeholder="Adınız Soyadınız"
                    />
                </div>
                <button
                    onClick={handleUpdate}
                    disabled={loading}
                    className="bg-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-700 transition-all disabled:opacity-50"
                >
                    {loading ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
            </div>
        </div>
    );
}



export function ProfileFavorites() {
    const [favorites, setFavorites] = useState<CampaignProps[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        authService.getUser().then((u) => {
            if (u && u.user_metadata?.favorites) {
                const favIds = u.user_metadata.favorites as number[];
                // Fetch all campaigns (or just needed ones if API supported array fetch)
                const allCampaigns = campaignService.getCampaigns();
                // Note: getCampaigns might still look at local if not refactored or sync is needed.
                // ideally fetch from Supabase if getCampaigns includes synced data. 
                // Let's assume getCampaigns is sufficient for now or use async fetch.
                const favCampaigns = allCampaigns.filter(c => favIds.includes(c.id));
                setFavorites(favCampaigns);
            }
            setLoading(false);
        });
    }, []);

    if (loading) return <div>Yükleniyor...</div>;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Favori Kampanyalarım</h2>
            {favorites.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {favorites.map(c => (
                        <div key={c.id} className="relative h-[300px]">
                            <CampaignCard data={c} />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-10">
                    <p className="text-gray-400">Henüz favori kampanya eklemediniz.</p>
                </div>
            )}
        </div>
    );
}

export function ProfileSettings() {
    const { confirm, alert } = useConfirmation();
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Uygulama Ayarları</h2>
            <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                        <p className="font-bold text-gray-800">E-posta Bildirimleri</p>
                        <p className="text-xs text-gray-500">Yeni kampanyalardan haberdar ol</p>
                    </div>
                    <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out bg-green-500 rounded-full cursor-pointer">
                        <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full translate-x-6 transition-transform"></span>
                    </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                        <p className="font-bold text-gray-800">SMS Bildirimleri</p>
                        <p className="text-xs text-gray-500">Acil fırsatları kaçırma</p>
                    </div>
                    <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out bg-gray-200 rounded-full cursor-pointer">
                        <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform"></span>
                    </div>
                </div>
            </div>

            <div className="mt-12 pt-8 border-t border-gray-100">
                <h3 className="text-red-600 font-bold mb-4">Tehlikeli Bölge</h3>
                <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-center justify-between">
                    <div>
                        <p className="font-bold text-red-800">Hesabı Sil</p>
                        <p className="text-xs text-red-600/70">Bu işlem geri alınamaz. Tüm verileriniz silinir.</p>
                    </div>
                    <button
                        onClick={async () => {
                            if (await confirm({
                                title: 'Hesabı Sil',
                                message: 'Hesabınızı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.',
                                type: 'danger'
                            })) {
                                authService.signOut();
                                window.location.href = '/';
                                await alert('Hesap silme talebiniz alındı. İşlem tamamlandığında bilgilendirileceksiniz.', 'Talep Alındı');
                            }
                        }}
                        className="bg-white border border-red-200 text-red-600 px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-red-600 hover:text-white transition-all shadow-sm"
                    >
                        Hesabı Sil
                    </button>
                </div>
            </div>
        </div>
    );
}

import { logoMap } from '../../utils/bankLogos';
import { Check } from 'lucide-react';

export function ProfileWallet() {
    const { alert } = useConfirmation();
    const [myCards, setMyCards] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Filter out duplicate logos/providers for clean UI (e.g. dont show both 'cardfinans' and 'card finans')
    // We will use a curated list for the UI
    const availableCards = [
        { id: 'axess', name: 'Axess', logo: logoMap['axess'] },
        { id: 'bonus', name: 'Bonus', logo: logoMap['bonus'] },
        { id: 'maximum', name: 'Maximum', logo: logoMap['maximum'] },
        { id: 'world', name: 'World', logo: logoMap['world'] },
        { id: 'paraf', name: 'Paraf', logo: logoMap['paraf'] },
        { id: 'cardfinans', name: 'CardFinans', logo: logoMap['cardfinans'] },
        { id: 'bankkart', name: 'Bankkart', logo: logoMap['bankkart'] },
        { id: 'advantage', name: 'Advantage', logo: logoMap['advantage'] },
        { id: 'adios', name: 'Adios', logo: logoMap['adios'] },
        { id: 'wings', name: 'Wings', logo: logoMap['wings'] },
        { id: 'shop&fly', name: 'Shop&Fly', logo: logoMap['shop&fly'] }
    ];

    useEffect(() => {
        authService.getUser().then((u) => {
            if (u && u.user_metadata?.my_cards) {
                setMyCards(u.user_metadata.my_cards as string[]);
            }
            setLoading(false);
        });
    }, []);

    const toggleCard = async (cardId: string) => {
        const newCards = myCards.includes(cardId)
            ? myCards.filter(id => id !== cardId)
            : [...myCards, cardId];

        setMyCards(newCards);
        setSaving(true);

        const { error } = await supabase!.auth.updateUser({
            data: { my_cards: newCards }
        });

        setSaving(false);
        if (error) {
            console.error(error);
            await alert('Kart güncellenirken hata oluştu.', 'Hata');
        }
    };

    if (loading) return <div>Yükleniyor...</div>;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Cüzdanım</h2>
                    <p className="text-sm text-gray-500">Sahip olduğunuz kartları seçerek size özel kampanyaları görün.</p>
                </div>
                {saving && <span className="text-xs text-purple-600 font-bold animate-pulse">Kaydediliyor...</span>}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {availableCards.map((card) => {
                    const isSelected = myCards.includes(card.id);
                    return (
                        <button
                            key={card.id}
                            onClick={() => toggleCard(card.id)}
                            className={`relative p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-3 ${isSelected
                                ? 'border-purple-600 bg-purple-50 shadow-md'
                                : 'border-gray-100 hover:border-purple-200 hover:bg-gray-50'
                                }`}
                        >
                            {isSelected && (
                                <div className="absolute top-2 right-2 bg-purple-600 text-white p-0.5 rounded-full">
                                    <Check size={12} />
                                </div>
                            )}
                            <div className="h-8 w-full flex items-center justify-center">
                                <img src={card.logo} alt={card.name} className="h-full object-contain" />
                            </div>
                            <span className={`text-xs font-bold ${isSelected ? 'text-purple-900' : 'text-gray-500'}`}>
                                {card.name}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
