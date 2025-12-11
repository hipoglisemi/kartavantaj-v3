import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Calculator, FileCode, Check, Copy, Database, Plus, Trash2, Play, Terminal, Save, X, Edit2 } from 'lucide-react';

interface CardScraper {
    id: string;
    name: string;
    logo?: string; // Added logo support
    script: string;
    language: 'js' | 'python';
    lastRun?: string;
}

interface BankScrapers {
    id: string;
    name: string;
    logo: string;
    cards: CardScraper[];
}

const DEFAULT_DATA: BankScrapers[] = [
    {
        id: 'garanti',
        name: 'Garanti BBVA',
        logo: 'https://cdn.worldvectorlogo.com/logos/garanti-bbva.svg',
        cards: [
            {
                id: 'bonus',
                name: 'Bonus Kart',
                logo: '/assets/logos/bonus.png',
                language: 'js',
                script: `// Garanti Bonus Kampanya Scraper\n// Simülasyon...\nconsole.log("Scraper started");`
            },
            {
                id: 'shopandfly',
                name: 'Shop & Fly',
                logo: '/assets/logos/shopandfly.png',
                language: 'js',
                script: '// Shop & Fly scripti...'
            },
            {
                id: 'amex',
                name: 'American Express',
                logo: '/assets/logos/amex.png',
                language: 'js',
                script: '// Amex scripti...'
            },
            {
                id: 'milesandsmiles',
                name: 'Miles & Smiles',
                logo: '/assets/logos/milesandsmiles.png',
                language: 'js',
                script: '// Miles&Smiles scripti...'
            }
        ]
    },
    {
        id: 'yapikredi',
        name: 'Yapı Kredi',
        logo: 'https://cdn.worldvectorlogo.com/logos/yapi-kredi-logo.svg',
        cards: [
            { id: 'world', name: 'Worldcard', logo: '/assets/logos/world.png', language: 'js', script: '// Worldcard scripti...' },
            { id: 'crystal', name: 'Crystal Kart', logo: '/assets/logos/crystal.png', language: 'js', script: '// Crystal scripti...' },
            { id: 'play', name: 'Yapı Kredi Play', logo: '/assets/logos/play.png', language: 'js', script: '// Play scripti...' },
            { id: 'adios', name: 'Yapı Kredi Adios', logo: '/assets/logos/adios.png', language: 'js', script: '// Adios scripti...' }
        ]
    },
    {
        id: 'isbank',
        name: 'İş Bankası',
        logo: 'https://cdn.worldvectorlogo.com/logos/turkiye-is-bankasi.svg',
        cards: [
            { id: 'maximum', name: 'Maximum Kart', logo: '/assets/logos/maximum.png', language: 'js', script: '// Maximum scripti...' },
            { id: 'maximiles', name: 'Maximiles', logo: '/assets/logos/maximiles.png', language: 'js', script: '// Maximiles scripti...' }
        ]
    },
    {
        id: 'akbank',
        name: 'Akbank',
        logo: 'https://cdn.worldvectorlogo.com/logos/akbank.svg',
        cards: [
            { id: 'axess', name: 'Axess', logo: '/assets/logos/axess.png', language: 'js', script: '// Axess scripti...' },
            { id: 'wings', name: 'Wings', logo: '/assets/logos/wings.png', language: 'js', script: '// Wings scripti...' }
        ]
    },
    {
        id: 'vakifbank',
        name: 'Vakıfbank',
        logo: 'https://cdn.worldvectorlogo.com/logos/vakifbank-1.svg',
        cards: [
            { id: 'world_vakif', name: 'Worldcard Vakıf', logo: '/assets/logos/world_vakif.png', language: 'js', script: '// Vakıf World scripti...' }
        ]
    },
    {
        id: 'ziraat',
        name: 'Ziraat Bankası',
        logo: 'https://cdn.worldvectorlogo.com/logos/ziraat-bankasi-logo.svg',
        cards: [
            { id: 'bankkart', name: 'Bankkart', logo: '/assets/logos/bankkart.png', language: 'js', script: '// Bankkart scripti...' }
        ]
    },
    {
        id: 'qnb',
        name: 'QNB Finansbank',
        logo: 'https://cdn.worldvectorlogo.com/logos/qnb-finansbank.svg',
        cards: [
            { id: 'cardfinans', name: 'CardFinans', logo: '/assets/logos/cardfinans.png', language: 'js', script: '// CardFinans scripti...' }
        ]
    },
    {
        id: 'halkbank',
        name: 'Halkbank',
        logo: 'https://cdn.worldvectorlogo.com/logos/halkbank.svg',
        cards: [
            { id: 'paraf', name: 'Paraf', logo: '/assets/logos/paraf.png', language: 'js', script: '// Paraf scripti...' }
        ]
    }
];

import { useConfirmation } from '../../context/ConfirmationContext';

export default function AdminScrapers() {
    const { confirm } = useConfirmation();
    const [banks, setBanks] = useState<BankScrapers[]>(() => {
        const saved = localStorage.getItem('scraper_config');
        return saved ? JSON.parse(saved) : DEFAULT_DATA;
    });

    const [expandedBank, setExpandedBank] = useState<string | null>('garanti');
    const [selectedCard, setSelectedCard] = useState<string | null>('bonus');
    const [copiedScript, setCopiedScript] = useState<string | null>(null);

    // Editor & Runner State
    const [isEditing, setIsEditing] = useState(false);
    const [localScript, setLocalScript] = useState('');
    const [logs, setLogs] = useState<string[]>([]);
    const [isRunning, setIsRunning] = useState(false);

    useEffect(() => {
        localStorage.setItem('scraper_config', JSON.stringify(banks));
    }, [banks]);

    const activeBankData = banks.find(b => b.id === expandedBank);
    const activeCardData = activeBankData?.cards.find(c => c.id === selectedCard);

    // Sync state when card changes
    useEffect(() => {
        if (activeCardData) {
            setLocalScript(activeCardData.script);
            setLogs([]);
            setIsEditing(false);
        }
    }, [activeCardData]);

    const handleCopy = (script: string) => {
        navigator.clipboard.writeText(script);
        setCopiedScript(script);
        setTimeout(() => setCopiedScript(null), 2000);
    };

    const addBank = () => {
        const name = window.prompt("Banka Adı:");
        if (!name) return;
        const id = name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const newBank: BankScrapers = {
            id,
            name,
            logo: 'https://placehold.co/100x100?text=' + name.substring(0, 2).toUpperCase(),
            cards: []
        };
        setBanks([...banks, newBank]);
    };

    const deleteBank = async (e: React.MouseEvent, bankId: string) => {
        e.stopPropagation();
        if (await confirm({
            title: 'Bankayı Sil',
            message: 'Bu bankayı ve tüm kartlarını silmek istediğinize emin misiniz?',
            type: 'danger'
        })) {
            setBanks(banks.filter(b => b.id !== bankId));
            if (expandedBank === bankId) setExpandedBank(null);
        }
    };

    const addCard = (bankId: string) => {
        const name = window.prompt("Kart Adı:");
        if (!name) return;

        const script = `// ${name} Scraper\nconsole.log("Merhaba ${name}");`;
        const id = name.toLowerCase().replace(/[^a-z0-9]/g, '');

        setBanks(banks.map(bank => {
            if (bank.id === bankId) {
                return {
                    ...bank,
                    cards: [...bank.cards, { id, name, language: 'js', script }]
                };
            }
            return bank;
        }));
    };

    const deleteCard = async (e: React.MouseEvent, bankId: string, cardId: string) => {
        e.stopPropagation();
        if (await confirm({
            title: 'Kartı Sil',
            message: 'Bu kartı silmek istediğinize emin misiniz?',
            type: 'warning'
        })) {
            setBanks(banks.map(bank => {
                if (bank.id === bankId) {
                    return {
                        ...bank,
                        cards: bank.cards.filter(c => c.id !== cardId)
                    };
                }
                return bank;
            }));
            if (selectedCard === cardId) setSelectedCard(null);
        }
    };

    const saveScript = () => {
        if (!activeBankData || !activeCardData) return;

        setBanks(banks.map(bank => {
            if (bank.id === activeBankData.id) {
                return {
                    ...bank,
                    cards: bank.cards.map(card =>
                        card.id === activeCardData.id ? { ...card, script: localScript } : card
                    )
                };
            }
            return bank;
        }));
        setIsEditing(false);
    };

    const changeLanguage = (lang: 'js' | 'python') => {
        if (!activeBankData || !activeCardData) return;

        // If switching to Python for the first time, provide a template
        let newScript = localScript;
        if (lang === 'python' && activeCardData.language !== 'python' && localScript.includes('console.log')) {
            newScript = `# Python Scraper
import json

print("Python başlatılıyor...")
data = {"title": "Test Kampanyası", "discount": 100}
print(json.dumps(data))
print("Bitti")
`;
        }

        setBanks(banks.map(bank => {
            if (bank.id === activeBankData.id) {
                return {
                    ...bank,
                    cards: bank.cards.map(card =>
                        card.id === activeCardData.id ? { ...card, language: lang, script: newScript } : card
                    )
                };
            }
            return bank;
        }));
        // Also update local state to reflect change immediately if not handled by useEffect
        setLocalScript(newScript);
    };

    const loadPyodide = async () => {
        if ((window as any).pyodide) return (window as any).pyodide;

        setLogs(prev => [...prev, '--- Pyodide (Python) Yükleniyor... ---']);
        const script = document.createElement('script');
        script.src = "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js";
        document.body.appendChild(script);

        return new Promise((resolve, reject) => {
            script.onload = async () => {
                try {
                    const pyodide = await (window as any).loadPyodide();
                    // Load widely used packages
                    await pyodide.loadPackage("micropip");
                    (window as any).pyodide = pyodide;
                    resolve(pyodide);
                } catch (e) {
                    reject(e);
                }
            };
            script.onerror = reject;
        });
    };

    const runScript = async () => {
        setIsRunning(true);
        setLogs([]);

        const isPython = activeCardData?.language === 'python';

        try {
            // Add a small delay for UI effect
            await new Promise(r => setTimeout(r, 300));

            if (isPython) {
                try {
                    const pyodide = await loadPyodide();
                    // Redirect stdout
                    pyodide.setStdout({ batched: (msg: string) => setLogs(prev => [...prev, msg]) });

                    await pyodide.runPythonAsync(localScript);
                    setLogs(prev => ['--- Python Çalıştırma Başarılı ---', ...prev]);
                } catch (e: any) {
                    setLogs(prev => ['!!! PYTHON HATASI !!!', e.toString(), ...prev]);
                }

            } else {
                // JS Execution (Existing Logic)
                const originalLog = console.log;
                const logsBuffer: string[] = [];

                console.log = (...args) => {
                    const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
                    logsBuffer.push(msg);
                    // originalLog(...args); 
                };

                // Create a Blob for the module
                const blob = new Blob([localScript], { type: 'text/javascript' });
                const blobUrl = URL.createObjectURL(blob);

                try {
                    await import(blobUrl);
                    setLogs(['--- JS Çalıştırma Başarılı ---', ...logsBuffer]);
                } catch (e: any) {
                    let errorMsg = e.toString();
                    if (errorMsg.includes('import statement')) {
                        errorMsg += '\n\nİPUCU: Tarayıcıda çalışırken yerel dosya importları (ör: import... from "./file") çalışmaz. https://esm.sh/ gibi CDN URLleri kullanın.';
                    }
                    setLogs(['!!! HATA !!!', errorMsg, ...logsBuffer]);
                } finally {
                    console.log = originalLog;
                    URL.revokeObjectURL(blobUrl);
                }
            }
        } catch (e: any) {
            setLogs(prev => ['!!! HATA !!!', e.toString(), ...prev]);
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-10">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-900 to-teal-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
                <div className="relative z-10">
                    <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                        <Database className="text-emerald-400" size={32} />
                        Scraper Araçları
                    </h1>
                    <p className="text-emerald-100 opacity-90 max-w-xl">
                        Her banka ve kart için özelleştirilmiş veri çekme botlarını (JS veya Python) buradan yönetebilirsiniz.
                    </p>
                </div>
                <div className="absolute right-0 top-0 h-full w-1/3 opacity-5">
                    <Calculator size={300} strokeWidth={0.5} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Left Column: Banks List */}
                <div className="lg:col-span-4 space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h2 className="text-lg font-bold text-gray-800">Bankalar</h2>
                        <button
                            onClick={addBank}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Banka Ekle"
                        >
                            <Plus size={20} />
                        </button>
                    </div>

                    <div className="space-y-3">
                        {banks.map((bank) => (
                            <div key={bank.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                                <button
                                    onClick={() => setExpandedBank(bank.id === expandedBank ? null : bank.id)}
                                    className={`w-full flex items-center justify-between p-4 transition-colors hover:bg-gray-50
                    ${expandedBank === bank.id ? 'bg-emerald-50/50' : ''}
                  `}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-white border border-gray-100 p-1.5 flex items-center justify-center shadow-sm overflow-hidden">
                                            <img src={bank.logo} alt={bank.name} className="w-full h-full object-contain" />
                                        </div>
                                        <span className="font-semibold text-gray-700">{bank.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div
                                            onClick={(e) => deleteBank(e, bank.id)}
                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors group/del"
                                        >
                                            <Trash2 size={16} />
                                        </div>
                                        {expandedBank === bank.id ? (
                                            <ChevronDown size={18} className="text-gray-400" />
                                        ) : (
                                            <ChevronRight size={18} className="text-gray-400" />
                                        )}
                                    </div>
                                </button>

                                {/* Cards List Accordion */}
                                {expandedBank === bank.id && (
                                    <div className="border-t border-gray-100 bg-gray-50/50 p-2 space-y-1">
                                        {bank.cards.map((card) => (
                                            <button
                                                key={card.id}
                                                onClick={() => setSelectedCard(card.id)}
                                                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm transition-all group/card
                          ${selectedCard === card.id
                                                        ? 'bg-white shadow-sm text-emerald-700 font-semibold ring-1 ring-emerald-100'
                                                        : 'text-gray-600 hover:bg-white hover:text-gray-900'
                                                    }
                        `}
                                            >
                                                <span className="flex items-center gap-2">
                                                    <span className={`w-1.5 h-1.5 rounded-full ${selectedCard === card.id ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                                                    {card.name}
                                                </span>

                                                <div className="flex items-center gap-1">
                                                    {/* Short Badge for Language */}
                                                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-gray-200 rounded text-gray-500">
                                                        {card.language}
                                                    </span>
                                                    {selectedCard === card.id && <ChevronRight size={14} className="text-emerald-500 ml-1" />}
                                                    <div
                                                        onClick={(e) => deleteCard(e, bank.id, card.id)}
                                                        className="opacity-0 group-hover/card:opacity-100 p-1 text-gray-400 hover:text-red-500 rounded transition-all"
                                                    >
                                                        <Trash2 size={14} />
                                                    </div>
                                                </div>
                                            </button>
                                        ))}

                                        {/* Add Card Button */}
                                        <button
                                            onClick={() => addCard(bank.id)}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-2 mt-2 text-xs font-medium text-emerald-600 border border-dashed border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors"
                                        >
                                            <Plus size={14} />
                                            Kart Ekle
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Column: Script Viewer & Runner */}
                <div className="lg:col-span-8">
                    {activeCardData ? (
                        <div className="sticky top-24 space-y-6">

                            {/* Script Card */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                {/* Header */}
                                <div className="bg-gray-50 border-b border-gray-200 p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${activeCardData.language === 'python' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                            <FileCode size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                                {activeCardData.name} Scraper
                                                {isEditing && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Düzenleniyor</span>}
                                            </h3>
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <span>Dil:</span>
                                                <select
                                                    value={activeCardData.language}
                                                    onChange={(e) => changeLanguage(e.target.value as 'js' | 'python')}
                                                    disabled={!isEditing}
                                                    className="bg-white border border-gray-300 rounded px-1 py-0.5 text-xs focus:ring-1 focus:ring-emerald-500"
                                                >
                                                    <option value="js">JavaScript (Node/Browser)</option>
                                                    <option value="python">Python (Pyodide)</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {!isEditing ? (
                                            <>
                                                <button
                                                    onClick={() => setIsEditing(true)}
                                                    className="p-2 text-gray-500 hover:bg-white hover:text-emerald-600 rounded-lg transition-colors border border-transparent hover:border-gray-200"
                                                    title="Düzenle"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <div className="h-6 w-px bg-gray-300 mx-1"></div>
                                                <button
                                                    onClick={runScript}
                                                    disabled={isRunning}
                                                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm active:scale-95 disabled:opacity-50"
                                                >
                                                    <Play size={16} />
                                                    {isRunning ? 'Çalışıyor...' : 'Çalıştır'}
                                                </button>
                                                <button
                                                    onClick={() => handleCopy(localScript)}
                                                    className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                    title="Kopyala"
                                                >
                                                    {copiedScript ? <Check size={18} /> : <Copy size={18} />}
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => {
                                                        setLocalScript(activeCardData.script);
                                                        setIsEditing(false);
                                                    }}
                                                    className="flex items-center gap-1 px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg text-sm transition-colors"
                                                >
                                                    <X size={16} />
                                                    İptal
                                                </button>
                                                <button
                                                    onClick={saveScript}
                                                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold transition-colors shadow-sm"
                                                >
                                                    <Save size={16} />
                                                    Kaydet
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Code Editor Area */}
                                <div className="relative group">
                                    <textarea
                                        value={localScript}
                                        onChange={(e) => setLocalScript(e.target.value)}
                                        readOnly={!isEditing}
                                        className={`w-full h-80 p-6 font-mono text-xs outline-none resize-none leading-relaxed transition-colors
                                    ${isEditing ? 'bg-[#1e1e1e] text-white' : 'bg-[#0d1117] text-gray-300'}
                                `}
                                        spellCheck={false}
                                        placeholder={activeCardData.language === 'python' ? 'Python kodunu buraya yapıştırın...' : 'JavaScript kodunu buraya yapıştırın...'}
                                    />
                                </div>

                                {/* Terminal / Logs Output */}
                                <div className="bg-black border-t border-gray-800 text-green-400 font-mono text-xs p-4 h-48 overflow-y-auto">
                                    <div className="flex items-center gap-2 mb-2 opacity-50 border-b border-gray-800 pb-2">
                                        <Terminal size={14} />
                                        <span>Terminal Çıktısı ({activeCardData.language === 'python' ? 'Python' : 'JS'})</span>
                                    </div>
                                    {logs.length === 0 ? (
                                        <div className="text-gray-600 italic">... Çıktı bekleniyor (Çalıştır butonuna basın) ...</div>
                                    ) : (
                                        logs.map((log, i) => (
                                            <div key={i} className="whitespace-pre-wrap font-mono mb-1">
                                                <span className="text-gray-600 mr-2">[{i + 1}]</span>
                                                {log}
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Instructions Footer */}
                                <div className="bg-amber-50 border-t border-amber-100 p-4 text-xs text-amber-800 flex gap-3">
                                    <div className="shrink-0 pt-0.5">⚠️</div>
                                    <div>
                                        <strong>Kullanım İpuçları:</strong>
                                        <ul className="list-disc list-inside mt-1 space-y-1 opacity-90">
                                            {activeCardData.language === 'python' ? (
                                                <>
                                                    <li><strong>Python Modu:</strong> Kodunuz Pyodide (WASM) üzerinde tarayıcıda çalışır.</li>
                                                    <li>Standart kütüphaneler (json, math, re) çalışır. Harici HTTP istekleri kısıtlıdır.</li>
                                                </>
                                            ) : (
                                                <>
                                                    <li><strong>JS Modu:</strong> Kodunuz tarayıcıda modül olarak çalışır. ES Module syntax (import/await) desteklenir.</li>
                                                    <li>Harici veri çekmek için <code>fetch</code> kullanabilirsiniz (CORS izin veriyorsa).</li>
                                                </>
                                            )}
                                            <li>Kodu düzenlemek için "Düzenle" butonunu kullanın ve kaydetmeyi unutmayın.</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 p-10 bg-gray-50/50 rounded-2xl border border-dashed border-gray-300">
                            <Database size={48} className="mb-4 opacity-20" />
                            <h3 className="text-lg font-semibold text-gray-600">Bir Kart Seçin</h3>
                            <p className="max-w-sm mx-auto mt-2 text-sm">
                                Soldaki menüden bir banka ve kart seçerek ilgili scraper kodunu görüntüleyebilir ve çalıştırabilirsiniz.
                            </p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
