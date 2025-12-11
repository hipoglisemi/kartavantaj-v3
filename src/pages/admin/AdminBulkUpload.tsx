import { useState, useEffect } from 'react';
import { FileJson, FileType, AlertTriangle, Download, RefreshCw, CheckCircle, Database, ChevronDown, ChevronRight, Plus, Sparkles } from 'lucide-react';
import { type CampaignProps } from '../../components/CampaignCard';


interface CardConfig {
    id: string;
    name: string;
}

interface BankConfig {
    id: string;
    name: string;
    logo: string;
    cards: CardConfig[];
}

import { FALLBACK_LOGOS } from '../../services/campaignService';

// Simplified Bank/Card Persistence Helpers
const getBanksConfig = (): BankConfig[] => {
    const saved = localStorage.getItem('scraper_config');
    let banks = saved ? JSON.parse(saved) : [];

    // Auto-fix logos using our reliable FALLBACK_LOGOS map
    if (Array.isArray(banks)) {
        banks = banks.map((b: any) => ({
            ...b,
            // If we have a fallback for this bank/card ID, use it? Key is usually card ID. 
            // Banks don't always have IDs matching our keys perfectly (e.g. 'yapi-kredi' vs 'world').
            // But Cards do.
            cards: Array.isArray(b.cards) ? b.cards.map((c: any) => ({
                ...c,
                logo: FALLBACK_LOGOS[c.id] || c.logo
            })) : []
        }));
    }
    return banks;
};

const saveBanksConfig = (banks: BankConfig[]) => {
    localStorage.setItem('scraper_config', JSON.stringify(banks));
};

const getCampaignsData = (): Record<string, CampaignProps[]> => {
    const saved = localStorage.getItem('campaign_data');
    return saved ? JSON.parse(saved) : {};
};

const saveCampaignsData = (data: Record<string, CampaignProps[]>) => {
    localStorage.setItem('campaign_data', JSON.stringify(data));
};


export default function AdminBulkUpload() {
    const [activeTab, setActiveTab] = useState<'json' | 'csv'>('json');
    const [jsonContent, setJsonContent] = useState('');
    const [csvContent, setCsvContent] = useState('');

    const [previewData, setPreviewData] = useState<CampaignProps[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // Target Selection State
    const [banks, setBanks] = useState<BankConfig[]>([]);
    const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
    const [expandedBankId, setExpandedBankId] = useState<string | null>(null);


    // UX Improvements: Inline Add
    const [isAddingBank, setIsAddingBank] = useState(false);
    const [newBankName, setNewBankName] = useState('');
    const [addingCardToBankId, setAddingCardToBankId] = useState<string | null>(null);
    const [newCardName, setNewCardName] = useState('');

    useEffect(() => {
        setBanks(getBanksConfig());
    }, []);

    // Try to auto-detection
    useEffect(() => {
        if (previewData && previewData.length > 0 && banks.length > 0) {
            const firstItem = previewData[0];
            const targetName = (firstItem.bank || firstItem.brand || '').toLowerCase();

            if (targetName) {
                const foundBank = banks.find(b => b.name.toLowerCase().includes(targetName));
                if (foundBank) {
                    setExpandedBankId(foundBank.id);
                    if (foundBank.cards.length > 0) {
                        setSelectedCardId(foundBank.cards[0].id);
                    }
                }
            }
        }
    }, [previewData, banks]);


    const handlePreview = () => {
        setError(null);
        setSuccessMsg(null);
        setPreviewData(null);

        if (!jsonContent.trim()) {
            setError('Lütfen önce JSON verisi yapıştırın.');
            return;
        }

        try {
            const parsed = JSON.parse(jsonContent);
            if (!Array.isArray(parsed)) {
                setError('JSON verisi bir dizi (array) olmalıdır.');
                return;
            }

            // Smart Mapping Logic
            const mappedData = parsed.map((item: any) => {
                // Helper to find value from multiple possible keys
                const getVal = (keys: string[]) => {
                    for (const key of keys) {
                        if (item[key] !== undefined && item[key] !== null) return item[key];
                    }
                    return undefined;
                };

                return {
                    // GENERATE NEW ID to avoid collisions between different JSON files (e.g. if both files have IDs 1, 2, 3...)
                    id: Date.now() + Math.floor(Math.random() * 1000) + parsed.indexOf(item),
                    title: getVal(['title', 'baslik', 'header']),
                    description: getVal(['description', 'aciklama', 'detay']),

                    // Category Mapping
                    category: getVal(['category', 'kategori', 'sector', 'sektor']) || 'Genel',

                    // Bank/Brand Mapping
                    bank: getVal(['bank', 'banka', 'brand', 'provider']) || 'Diğer',

                    // Image
                    image: getVal(['image', 'gorsel', 'img', 'imageUrl']) || 'https://placehold.co/600x400',

                    // Badge info
                    badgeText: getVal(['badgeText', 'rozet', 'campaign_type']) || 'Fırsat',
                    badgeColor: getVal(['badgeColor', 'renk']) || 'purple',

                    // Dates
                    validUntil: getVal(['validUntil', 'son_tarih', 'bitis_tarihi', 'valid_until']),
                    valid_from: getVal(['valid_from', 'baslangic_tarihi', 'validFrom']),

                    // Dynamic Fields (Legacy)
                    spendAmount: getVal(['spendAmount', 'spend_amount', 'harcama_hedefi']),
                    earnAmount: getVal(['earnAmount', 'earn_amount', 'kazanc']),
                    validCards: getVal(['validCards', 'valid_cards', 'gecerli_kartlar']),
                    joinMethod: getVal(['joinMethod', 'join_method', 'katilim_sekli']),

                    // Guide Fields
                    min_spend: item.min_spend || undefined,
                    earning: getVal(['earning', 'kazanc_detay']),
                    discount: getVal(['discount', 'ek_avantaj']),
                    eligible_customers: item.eligible_customers || [],
                    participation_method: getVal(['participation_method', 'katilim_sekli']),

                    url: getVal(['url', 'link', 'detail_url']),

                    // Detailed Lists
                    conditions: (() => {
                        const c = getVal(['conditions', 'kosullar', 'terms']);
                        if (Array.isArray(c)) return c;
                        if (typeof c === 'string') return c.split('\n').filter(Boolean);
                        return [];
                    })(),

                    participation_points: (() => {
                        const p = getVal(['participation_points', 'katilim_adimlari']);
                        if (Array.isArray(p)) return p;
                        if (typeof p === 'string') return p.split('\n').filter(Boolean);
                        return [];
                    })(),

                    // Legacy Terms (Fallback to conditions if terms is empty to keep logic safe)
                    terms: (() => {
                        const t = getVal(['terms', 'kosullar', 'details', 'conditions']);
                        if (Array.isArray(t)) return t;
                        if (typeof t === 'string') return t.split('\n').filter(Boolean);
                        return [];
                    })(),

                    // Default Status
                    isApproved: false,
                    createdAt: new Date().toISOString()
                } as CampaignProps;
            });

            if (mappedData.length > 0 && !mappedData[0].title) {
                // Warn but allow, maybe title is missing in just one?
                // Actually relying on mapped keys now, so check mapped title
            }
            if (mappedData.some(d => !d.title)) {
                setError('Bazı kampanyalar için "title" (Başlık) bulunamadı. Lütfen JSON anahtarlarını kontrol edin (title, baslik, header).');
                return;
            }

            setPreviewData(mappedData);
            setSuccessMsg(`Başarılı! ${mappedData.length} kampanya işlendi. Aşağıdan hedef kartı seçin.`);
        } catch (e: any) {
            setError('JSON formatı geçersiz: ' + e.message);
        }
    };

    const handleCsvPreview = () => {
        setError(null);
        setSuccessMsg(null);
        setPreviewData(null);

        if (!csvContent.trim()) {
            setError('Lütfen önce CSV verisi yapıştırın.');
            return;
        }

        try {
            const lines = csvContent.trim().split('\n');
            if (lines.length < 2) {
                setError('CSV en az 2 satır olmalıdır.');
                return;
            }
            const headers = lines[0].split(',').map(h => h.trim());
            const result: any[] = [];
            for (let i = 1; i < lines.length; i++) {
                const currentLine = lines[i].split(',');
                if (currentLine.length === 1 && !currentLine[0].trim()) continue;
                const obj: any = {};
                headers.forEach((header, index) => obj[header] = currentLine[index]?.trim());
                if (obj.provider) obj.bank = obj.provider;
                // @ts-ignore
                result.push({ id: Math.floor(Math.random() * 1000000), isApproved: false, createdAt: new Date().toISOString(), ...obj });
            }
            setPreviewData(result);
            setSuccessMsg(`Başarılı! ${result.length} kampanya bulundu. Aşağıdan hedef kartı seçin.`);
        } catch (e: any) {
            setError('CSV Hatası: ' + e.message);
        }
    };

    const handleUpload = () => {
        if (!previewData) return;
        if (!selectedCardId) {
            setError("Lütfen yükleme yapılacak KARTI seçiniz.");
            return;
        }

        const currentData = getCampaignsData();
        const existingCampaigns = currentData[selectedCardId] || [];

        // SMART MERGE: Update existing campaigns (by Title) or Add New
        const updatedCampaigns = [...existingCampaigns];
        let addedCount = 0;
        let updatedCount = 0;

        previewData.forEach(newCamp => {
            const existingIndex = updatedCampaigns.findIndex(ex =>
                ex.title.toLowerCase().trim() === newCamp.title.toLowerCase().trim()
            );

            // Inject Metadata
            const bankName = banks.find(b => b.cards.some(c => c.id === selectedCardId))?.name || 'Diğer';
            const cardName = banks.flatMap(b => b.cards).find(c => c.id === selectedCardId)?.name || 'Campaign Card';

            const enrichedCamp = {
                ...newCamp,
                bank: bankName,
                cardName: cardName
            };

            if (existingIndex !== -1) {
                // UPDATE: Merge new data into existing (Keep ID and Approved Status)
                updatedCampaigns[existingIndex] = {
                    ...updatedCampaigns[existingIndex],
                    ...enrichedCamp,
                    id: updatedCampaigns[existingIndex].id, // PRESERVE ID
                    isApproved: updatedCampaigns[existingIndex].isApproved, // PRESERVE STATUS
                    createdAt: updatedCampaigns[existingIndex].createdAt // PRESERVE DATE
                };
                updatedCount++;
            } else {
                // INSERT: Add new campaign
                updatedCampaigns.push({
                    ...enrichedCamp,
                    isApproved: false // Default to unapproved for new ones
                });
                addedCount++;
            }
        });

        const newData = {
            ...currentData,
            [selectedCardId]: updatedCampaigns
        };

        saveCampaignsData(newData);

        // Trigger generic refresh for UI
        window.dispatchEvent(new Event('campaigns-updated'));
        window.dispatchEvent(new Event('storage'));

        alert(`${previewData.length} kampanya başarıyla eklendi!`);

        setJsonContent('');
        setCsvContent('');
        setPreviewData(null);
        setSuccessMsg(null);
    };

    const handleAddBank = () => {
        if (!newBankName.trim()) return;
        const id = newBankName.toLowerCase().replace(/[^a-z0-9]/g, '');
        const newBank: BankConfig = {
            id,
            name: newBankName,
            logo: 'https://placehold.co/100x100?text=' + newBankName.substring(0, 2).toUpperCase(),
            cards: []
        };
        const newBanks = [...banks, newBank];
        setBanks(newBanks);
        saveBanksConfig(newBanks);
        setNewBankName('');
        setIsAddingBank(false);
    };

    const handleAddCard = () => {
        if (!newCardName.trim() || !addingCardToBankId) return;
        const id = newCardName.toLowerCase().replace(/[^a-z0-9]/g, '');

        const newBanks = banks.map(bank => {
            if (bank.id === addingCardToBankId) {
                return { ...bank, cards: [...bank.cards, { id, name: newCardName }] };
            }
            return bank;
        });
        setBanks(newBanks);
        saveBanksConfig(newBanks);
        setNewCardName('');
        setAddingCardToBankId(null);
    };


    const downloadSampleJson = () => {
        const sample = [
            { "id": 101, "title": "Ornek Kampanya", "description": "Aciklama", "validUntil": "2025-12-31" }
        ];
        const blob = new Blob([JSON.stringify(sample, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'sample.json';
        a.click();
    };





    const [processingBatch, setProcessingBatch] = useState(false);
    const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });

    const handleBatchSmartProcess = async () => {
        if (!previewData || previewData.length === 0) return;

        const apiKey = localStorage.getItem('gemini_key') || '';

        if (!apiKey) {
            alert("Lütfen önce Ayarlar sayfasından Gemini API Anahtarınızı giriniz.");
            return;
        }

        setProcessingBatch(true);
        setBatchProgress({ current: 0, total: previewData.length });

        // Process sequentially or in small parallel batches to avoid rate limits
        // Gemini Free tier has limits, so sequential is safer for now.
        const updatedData = [...previewData];

        try {
            for (let i = 0; i < updatedData.length; i++) {
                setBatchProgress({ current: i + 1, total: updatedData.length });

                const camp = updatedData[i];
                // Combine text for context
                const rawText = `
                    BAŞLIK: ${camp.title}
                    AÇIKLAMA: ${camp.description}
                    BANKA: ${camp.bank}
                `;

                // Skip if very little content
                if (rawText.length < 20) continue;

                const prompt = `
                    Sen uzman bir Veri Temizleyici AI asistanısın.
                    Aşağıdaki ham kampanya verisini analiz et ve temiz, yapılandırılmış bir JSON objesi döndür.

                    GİRDİ:
                    ${rawText}

                    KURALLAR:
                    1. **Tarih**: "YYYY-MM-DD" formatı ZORUNLU. (Yıl yoksa ${new Date().getFullYear()} kullan).
                    2. **Matematik**: "Her X TL'ye Y TL, toplam Z TL" => min_spend = (Z/Y)*X.
                    3. **Kartlar**: "Wings, Axess, Free" gibi virgülle ayrılmış string yap.
                    4. **Açıklama**: Gereksiz boşlukları temizle, imla kurallarına dikkat et.

                    JSON ÇIKTISI:
                    {
                        "min_spend": number | null,
                        "earning": string | null,
                        "validUntil": "YYYY-MM-DD" | null,
                        "validCards": string | null,
                        "joinMethod": string | null,
                        "description": string,
                        "tags": string[]
                    }
                `;

                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
                });

                if (response.ok) {
                    const data = await response.json();
                    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (text) {
                        try {
                            const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
                            const result = JSON.parse(jsonStr);

                            // Merge results
                            updatedData[i] = {
                                ...camp,
                                ...result,
                                // Keep original if AI returns null/undefined, but if AI returns valid value override
                                min_spend: result.min_spend || camp.min_spend,
                                earning: result.earning || camp.earning,
                                validUntil: result.validUntil || camp.validUntil,
                                validCards: result.validCards || camp.validCards,
                                joinMethod: result.joinMethod || camp.joinMethod,
                                brand: result.brand || camp.brand
                            };
                        } catch (e) {
                            console.warn("AI Parse Error for item " + i, e);
                        }
                    }
                }

                // Small delay to be nice to API
                await new Promise(r => setTimeout(r, 1000));
            }

            setPreviewData(updatedData);
            setSuccessMsg("Tüm veriler Yapay Zeka ile başarıyla zenginleştirildi!");

        } catch (e: any) {
            console.error(e);
            setError("Toplu işlem sırasında hata: " + e.message);
        } finally {
            setProcessingBatch(false);
        }
    };



    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-10">
            <div>
                <h1 className="text-2xl font-bold text-purple-900">Toplu Yükleme</h1>
                <p className="text-gray-500">JSON veya CSV formatında kampanya yükleyin.</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="flex border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('json')}
                        className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'json' ? 'border-purple-600 text-purple-600 bg-purple-50/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                    >
                        <FileJson size={18} /> JSON Yükle
                    </button>
                    <button
                        onClick={() => setActiveTab('csv')}
                        className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'csv' ? 'border-purple-600 text-purple-600 bg-purple-50/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                    >
                        <FileType size={18} /> CSV Yükle
                    </button>
                </div>

                <div className="p-6 space-y-6">


                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3 text-sm text-blue-800">
                        <AlertTriangle size={20} className="shrink-0" />
                        <div>
                            <strong>Format Hakkında:</strong> Yükleyeceğiniz dosyanın formatına dikkat ediniz.
                            <br />
                            <button onClick={downloadSampleJson} className="text-blue-600 underline mt-1 hover:text-blue-800 flex items-center gap-1">
                                <Download size={14} /> Örnek Şablon İndir
                            </button>
                        </div>
                    </div>

                    {activeTab === 'json' ? (
                        <textarea
                            value={jsonContent}
                            onChange={(e) => setJsonContent(e.target.value)}
                            placeholder='[ { "title": "Kampanya...", ... } ]'
                            className="w-full h-64 p-4 font-mono text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
                        />
                    ) : (
                        <textarea
                            value={csvContent}
                            onChange={(e) => setCsvContent(e.target.value)}
                            placeholder='title,description,validUntil...'
                            className="w-full h-64 p-4 font-mono text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
                        />
                    )}

                    <div className="flex items-center gap-3 border-b border-gray-100 pb-6">
                        <button
                            onClick={activeTab === 'json' ? handlePreview : handleCsvPreview}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                        >
                            <RefreshCw size={18} />
                            Önizle & Doğrula
                        </button>
                        <button
                            onClick={() => { setJsonContent(''); setCsvContent(''); setPreviewData(null); setError(null); setSuccessMsg(null); }}
                            className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
                        >
                            Temizle
                        </button>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-700 p-4 rounded-lg text-sm border border-red-100 flex items-center gap-2">
                            <AlertTriangle size={18} /> {error}
                        </div>
                    )}
                    {successMsg && (
                        <div className="bg-green-50 text-green-700 p-4 rounded-lg text-sm border border-green-100 flex items-center gap-2">
                            <CheckCircle size={18} /> {successMsg}
                        </div>
                    )}

                    {previewData && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                            {/* Top 10 Preview */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-sm font-semibold text-gray-700">Önizleme (İlk 10 Kayıt)</h3>
                                    <button
                                        onClick={handleBatchSmartProcess}
                                        disabled={processingBatch}
                                        className="bg-violet-100 text-violet-700 hover:bg-violet-200 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                                    >
                                        {processingBatch ? (
                                            <>
                                                <RefreshCw size={14} className="animate-spin" />
                                                İşleniyor ({batchProgress.current}/{batchProgress.total})
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles size={14} />
                                                ✨ AI ile Tüm Verileri Zenginleştir (Deneysel)
                                            </>
                                        )}
                                    </button>
                                </div>
                                <div className="border border-gray-200 rounded-lg overflow-hidden overflow-x-auto">
                                    <table className="w-full text-xs text-left">
                                        <thead className="bg-gray-50 text-gray-500 font-medium">
                                            <tr>
                                                <th className="px-3 py-2">#</th>
                                                <th className="px-3 py-2">Başlık</th>
                                                <th className="px-3 py-2">Kategori</th>
                                                <th className="px-3 py-2">İndirim</th>
                                                <th className="px-3 py-2">Geçerlilik</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {previewData.slice(0, 10).map((item: any, i) => (
                                                <tr key={i} className="hover:bg-gray-50">
                                                    <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                                                    <td className="px-3 py-2 font-medium text-gray-800">{item.title || '-'}</td>
                                                    <td className="px-3 py-2">{item.category || 'Diğer'}</td>
                                                    <td className="px-3 py-2 text-green-600">{item.discount || item.offer || '-'}</td>
                                                    <td className="px-3 py-2 text-gray-500">{item.validUntil || '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {previewData.length > 10 && (
                                        <div className="bg-gray-50 px-3 py-2 text-xs text-gray-500 text-center border-t border-gray-200">
                                            ... ve {previewData.length - 10} kampanya daha
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Target Selection */}
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                                <h3 className="text-md font-bold text-gray-800 mb-3 flex items-center gap-2">
                                    <Database size={18} className="text-amber-600" />
                                    Hedef Kart Seçimi & Kayıt
                                </h3>
                                <p className="text-sm text-gray-600 mb-4">
                                    Bu kampanyaların hangi banka ve karta ekleneceğini seçiniz.
                                    Eğer listede yoksa "+" butonları ile ekleyebilirsiniz.
                                </p>

                                <div className="bg-white rounded-lg border border-gray-200 shadow-sm max-h-60 overflow-y-auto">
                                    <div className="p-2 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Bankalar</span>
                                        {isAddingBank ? (
                                            <div className="flex items-center gap-2">
                                                <input
                                                    autoFocus
                                                    type="text"
                                                    value={newBankName}
                                                    onChange={(e) => setNewBankName(e.target.value)}
                                                    placeholder="Banka Adı..."
                                                    className="text-xs border border-gray-300 rounded px-2 py-1 outline-none focus:border-amber-500 w-32"
                                                    onKeyDown={(e) => e.key === 'Enter' && handleAddBank()}
                                                />
                                                <button onClick={handleAddBank} className="text-green-600 hover:bg-green-100 p-1 rounded"><CheckCircle size={14} /></button>
                                                <button onClick={() => setIsAddingBank(false)} className="text-red-600 hover:bg-red-100 p-1 rounded"><Plus size={14} className="rotate-45" /></button>
                                            </div>
                                        ) : (
                                            <button onClick={() => setIsAddingBank(true)} className="p-1 text-emerald-600 hover:bg-emerald-100 rounded" title="Banka Ekle">
                                                <Plus size={16} />
                                            </button>
                                        )}
                                    </div>

                                    {banks.length === 0 && <div className="p-4 text-center text-sm text-gray-500 italic">Hiç banka bulunamadı. Lütfen ekleyin.</div>}

                                    {banks.map(bank => (
                                        <div key={bank.id} className="border-b border-gray-100 last:border-0">
                                            <button
                                                onClick={() => setExpandedBankId(expandedBankId === bank.id ? null : bank.id)}
                                                className={`w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-gray-50 transition-colors ${expandedBankId === bank.id ? 'bg-amber-50/50' : ''}`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <img src={bank.logo} alt="" className="w-5 h-5 object-contain" />
                                                    <span className="font-medium">{bank.name}</span>
                                                </div>
                                                {expandedBankId === bank.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                            </button>

                                            {/* Expanded Cards */}
                                            {expandedBankId === bank.id && (
                                                <div className="bg-gray-50 px-4 py-2 space-y-1">
                                                    {bank.cards.map(card => (
                                                        <button
                                                            key={card.id}
                                                            onClick={() => { setSelectedCardId(card.id); }}
                                                            className={`w-full flex items-center justify-between px-3 py-2 rounded text-sm transition-all ${selectedCardId === card.id ? 'bg-amber-100 text-amber-900 font-bold ring-1 ring-amber-300' : 'text-gray-600 hover:bg-white hover:shadow-sm'}`}
                                                        >
                                                            <span>{card.name}</span>
                                                            {selectedCardId === card.id && <CheckCircle size={14} className="text-amber-600" />}
                                                        </button>
                                                    ))}
                                                    {addingCardToBankId === bank.id ? (
                                                        <div className="mt-2 flex items-center gap-2 px-1">
                                                            <input
                                                                autoFocus
                                                                type="text"
                                                                value={newCardName}
                                                                onChange={(e) => setNewCardName(e.target.value)}
                                                                placeholder="Kart Adı..."
                                                                className="flex-1 text-xs border border-gray-300 rounded px-2 py-1 outline-none focus:border-amber-500"
                                                                onKeyDown={(e) => e.key === 'Enter' && handleAddCard()}
                                                            />
                                                            <button onClick={handleAddCard} className="text-green-600 hover:bg-green-100 p-1 rounded"><CheckCircle size={14} /></button>
                                                            <button onClick={() => setAddingCardToBankId(null)} className="text-red-600 hover:bg-red-100 p-1 rounded"><Plus size={14} className="rotate-45" /></button>
                                                        </div>
                                                    ) : (
                                                        <button onClick={() => { setAddingCardToBankId(bank.id); setNewCardName(''); }} className="w-full py-1.5 mt-1 text-xs text-amber-700 font-medium border border-dashed border-amber-200 rounded hover:bg-amber-100 flex items-center justify-center gap-1">
                                                            <Plus size={12} /> Kart Ekle
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Final Action */}
                            <button
                                onClick={handleUpload}
                                disabled={!selectedCardId}
                                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <span>{previewData.length} Kampanyayı Onayla ve Ekle</span>
                                <CheckCircle size={20} />
                            </button>

                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
