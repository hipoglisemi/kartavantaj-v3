import { useState, useEffect } from 'react';
import { Image, Plus, Trash2, Upload, Search } from 'lucide-react';

interface CardConfig {
    id: string;
    name: string;
    logo?: string;
}

interface BankConfig {
    id: string;
    name: string;
    logo: string;
    cards: CardConfig[];
}

// Reuse helper for consistency
const getBanksConfig = (): BankConfig[] => {
    const saved = localStorage.getItem('scraper_config');
    return saved ? JSON.parse(saved) : [];
};

const saveBanksConfig = (banks: BankConfig[]) => {
    localStorage.setItem('scraper_config', JSON.stringify(banks));
    // Dispatch event for other components to update
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('campaigns-updated'));
};

export default function AdminLogos() {
    const [banks, setBanks] = useState<BankConfig[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddingBank, setIsAddingBank] = useState(false);
    const [newBankName, setNewBankName] = useState('');

    useEffect(() => {
        setBanks(getBanksConfig());
    }, []);

    const handleUpdateLogo = (bankId: string, cardId: string | null, newLogo: string) => {
        const updatedBanks = banks.map(bank => {
            if (bank.id === bankId) {
                if (cardId) {
                    // Update Card Logo
                    return {
                        ...bank,
                        cards: bank.cards.map(card =>
                            card.id === cardId ? { ...card, logo: newLogo } : card
                        )
                    };
                } else {
                    // Update Bank Logo
                    return { ...bank, logo: newLogo };
                }
            }
            return bank;
        });
        setBanks(updatedBanks);
        saveBanksConfig(updatedBanks);
    };

    const handleAddBank = () => {
        if (!newBankName.trim()) return;
        const id = newBankName.toLowerCase().replace(/[^a-z0-9]/g, '');
        const newBank: BankConfig = {
            id,
            name: newBankName,
            logo: `https://placehold.co/100x100?text=${newBankName.substring(0, 2).toUpperCase()}`,
            cards: []
        };
        const updated = [...banks, newBank];
        setBanks(updated);
        saveBanksConfig(updated);
        setNewBankName('');
        setIsAddingBank(false);
    };

    const [deleteId, setDeleteId] = useState<string | null>(null);

    const handleDeleteClick = (id: string) => {
        setDeleteId(id);
    };

    const confirmDelete = () => {
        if (!deleteId) return;
        const updated = banks.filter(b => b.id !== deleteId);
        setBanks(updated);
        saveBanksConfig(updated);
        setDeleteId(null);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, bankId: string, cardId: string | null) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            handleUpdateLogo(bankId, cardId, base64String);
        };
        reader.readAsDataURL(file);
    };

    const filteredBanks = banks.filter(b =>
        b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.cards.some(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Image className="text-purple-600" />
                        Logolar ve Banka Yönetimi
                    </h1>
                    <p className="text-gray-500">
                        Bilgisayarınızdan yüklediğiniz logolar otomatik olarak kaydedilir.
                    </p>
                </div>
                <button
                    onClick={() => setIsAddingBank(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"
                >
                    <Plus size={18} /> Yeni Banka Ekle
                </button>
            </div>

            {isAddingBank && (
                <div className="bg-white p-4 rounded-xl shadow-lg border border-purple-100 animate-in fade-in slide-in-from-top-2 flex gap-2 items-center">
                    <input
                        autoFocus
                        type="text"
                        placeholder="Banka Adı Giriniz..."
                        className="flex-1 border border-gray-300 rounded-lg px-4 py-2 outline-none focus:border-purple-500"
                        value={newBankName}
                        onChange={e => setNewBankName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddBank()}
                    />
                    <button onClick={handleAddBank} className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold">Kaydet</button>
                    <button onClick={() => setIsAddingBank(false)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg">İptal</button>
                </div>
            )}

            <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                    type="text"
                    placeholder="Banka veya kart ara..."
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-100"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 gap-6">
                {filteredBanks.map(bank => (
                    <div key={bank.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        {/* Bank Header */}
                        <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
                            <div className="flex items-center gap-4 flex-1">
                                <div className="relative group shrink-0 w-24 h-24 bg-white rounded-lg border border-gray-200 flex items-center justify-center p-2">
                                    <img src={bank.logo} alt={bank.name} className="max-w-full max-h-full object-contain" />

                                    {/* Upload Overlay */}
                                    <label className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white">
                                        <Upload size={24} className="mb-1" />
                                        <span className="text-[10px] font-bold">Logo Yükle</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => handleFileUpload(e, bank.id, null)}
                                        />
                                    </label>
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-lg text-gray-800">{bank.name}</h3>
                                    <div className="text-xs text-gray-500 flex gap-2 mt-1 mb-2">
                                        <span className="bg-white px-2 py-0.5 rounded border border-gray-200 font-mono">ID: {bank.id}</span>
                                        <span>• {bank.cards.length} Kart</span>
                                    </div>

                                    {/* Inline URL Input */}
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={bank.logo}
                                            onChange={(e) => handleUpdateLogo(bank.id, null, e.target.value)}
                                            className="text-xs border border-gray-300 rounded px-2 py-1.5 w-full max-w-[300px] outline-none focus:border-purple-500 text-gray-600 truncate"
                                            placeholder="veya görsel URL'si yapıştırın..."
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-end self-start sm:self-center">
                                <button
                                    onClick={() => handleDeleteClick(bank.id)}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Bankayı Sil"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Cards List */}
                        {bank.cards.length > 0 && (
                            <div className="bg-white divide-y divide-gray-100">
                                {bank.cards.map(card => (
                                    <div key={card.id} className="p-3 pl-8 flex items-center gap-4 hover:bg-gray-50 transition-colors group">
                                        <div className="w-10 h-8 flex items-center justify-center bg-gray-50 rounded border border-gray-200 relative overflow-hidden">
                                            {card.logo ? (
                                                <img src={card.logo} className="w-full h-full object-contain" />
                                            ) : (
                                                <CreditCardIcon />
                                            )}

                                            {/* Mini Upload for Card */}
                                            <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer text-white">
                                                <Upload size={12} />
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={(e) => handleFileUpload(e, bank.id, card.id)}
                                                />
                                            </label>
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-sm font-medium text-gray-700">{card.name}</div>
                                            <div className="text-[10px] text-gray-400">ID: {card.id}</div>
                                        </div>

                                        <div className="flex items-center gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                            <input
                                                type="text"
                                                placeholder="Kart görsel URL..."
                                                value={card.logo || ''}
                                                onChange={(e) => handleUpdateLogo(bank.id, card.id, e.target.value)}
                                                className="text-xs border border-gray-200 rounded px-2 py-1 w-48 outline-none focus:border-purple-500"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {bank.cards.length === 0 && (
                            <div className="p-4 text-center text-xs text-gray-400 italic">
                                Bu bankaya ait tanımlı kart bulunmuyor.
                            </div>

                        )}
                    </div>
                ))}
            </div>

            {/* Custom Delete Confirmation Modal - Placed correctly outside loop */}
            {
                deleteId && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="p-6 text-center">
                                <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Trash2 size={24} />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">Bankayı Sil?</h3>
                                <p className="text-gray-500 text-sm mb-6">
                                    Bu bankayı ve ilişkili tüm logolarını silmek üzeresiniz. Bu işlem geri alınamaz.
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setDeleteId(null)}
                                        className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg transition-colors"
                                    >
                                        Vazgeç
                                    </button>
                                    <button
                                        onClick={confirmDelete}
                                        className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors"
                                    >
                                        Evet, Sil
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    );
}

function CreditCardIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" /></svg>
    )
}
