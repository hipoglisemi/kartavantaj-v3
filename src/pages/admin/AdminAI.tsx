import { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, Loader2, Zap, BarChart, Search, BrainCircuit } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { campaignService } from '../../services/campaignService'; // Use service
import { campaignParser } from '../../services/campaignParser'; // Use parser

interface Message {
    id: number;
    role: 'user' | 'ai';
    content: string;
    type?: 'text' | 'analysis' | 'action';
}

const initialMessages: Message[] = [
    {
        id: 1,
        role: 'ai',
        content: "Merhaba! Ben KartAvantaj AI Asistanı. Google Gemini altyapısı ile güçlendirilmiş veritabanına erişimim var. Kampanyalarınızı analiz edebilir, içerik önerilerinde bulunabilirim."
    }
];

// System Context with Campaign Data
const generateSystemPrompt = async () => {
    // Dynamically fetch campaigns
    const campaigns = await campaignService.fetchCampaigns(true);

    return `
Sen "KartAvantaj" uygulamasının gelişmiş Yapay Zeka botusun.
Aşağıda veritabanındaki tüm kredi kartı kampanyalarının listesi JSON formatında verilmiştir.
Kullanıcının sorularını bu verilere dayanarak cevapla. Kampanya sayılarını, trendleri, bankaları analiz et.
Eğer kullanıcı "SEO" ile ilgili bir şey sorarsa, genel SEO tavsiyeleri ver (başlık uzunluğu, açıklama vb.).
Her zaman profesyonel, yardımsever ve Türkçe cevap ver.

KAMPANYA VERİTABANI:
${JSON.stringify(campaigns.slice(0, 50))} (Performans için ilk 50 kampanya örneklendi)
... (ve devamı)
`;
};

export default function AdminAI() {
    const [activeTab, setActiveTab] = useState<'general' | 'training'>('general');
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [apiKeyError, setApiKeyError] = useState(false);

    // Training State
    const [trainingInput, setTrainingInput] = useState('');
    const [isTraining, setIsTraining] = useState(false);
    const [rules, setRules] = useState<{ rule_text: string, user_feedback: string }[]>([]);

    useEffect(() => {
        // Fetch rules on mount
        campaignParser.fetchRules().then(setRules);
    }, []);

    const handleTrain = async () => {
        if (!trainingInput.trim()) return;
        setIsTraining(true);
        try {
            const key = localStorage.getItem('gemini_key') || import.meta.env.VITE_GEMINI_API_KEY;
            const rule = await campaignParser.learnRule(trainingInput, key);

            // Refresh rules
            const updatedRules = await campaignParser.fetchRules();
            setRules(updatedRules);
            setTrainingInput('');
            alert(`Kural Öğrenildi: "${rule}"`);
        } catch (e: any) {
            alert("Eğitim hatası: " + e.message);
        } finally {
            setIsTraining(false);
        }
    };


    // Cache the prompt construction
    const [systemPrompt, setSystemPrompt] = useState('');

    useEffect(() => {
        generateSystemPrompt().then(setSystemPrompt);
    }, []);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg: Message = { id: Date.now(), role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        try {
            const apiKey = localStorage.getItem('gemini_key') || import.meta.env.VITE_GEMINI_API_KEY;
            if (!apiKey) {
                throw new Error("API Anahtarı eksik");
            }

            const cleanKey = apiKey.trim().replace(/[^a-zA-Z0-9_\-]/g, '');
            const genAI = new GoogleGenerativeAI(cleanKey);
            // Use the model we know works for this key
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

            // Construct Chat History for context
            const chatHistory = messages.map(m => ({
                role: m.role === 'user' ? 'user' : 'model',
                parts: [{ text: m.content }]
            }));

            // Add System Prompt to the beginning? 
            // Gemini API supports system_instruction slightly differently, but prepending to the first message or using specific config is common. 
            // For simplicity, we'll append the user's latest query along with the system context definition "As a system..." if it's not a chat session object.
            // Actually, let's just make a single prompt for now to ensure context is fresh.

            const finalPrompt = `${systemPrompt}\n\nGEÇMİŞ KONUŞMA:\n${JSON.stringify(chatHistory.slice(-5))}\n\nKULLANICI MESAJI: ${userMsg.content}`;

            const result = await model.generateContent(finalPrompt);
            const responseText = result.response.text();

            const aiMsg: Message = { id: Date.now() + 1, role: 'ai', content: responseText };
            setMessages(prev => [...prev, aiMsg]);

        } catch (error: any) {
            console.error(error);
            if (error.message === "API Anahtarı eksik") {
                setMessages(prev => [...prev, {
                    id: Date.now(),
                    role: 'ai',
                    content: "⚠️ **Google Gemini API Anahtarı Bulunamadı!**\n\nAI asistanının çalışması için **Ayarlar** sayfasından API anahtarınızı giriniz."
                }]);
                setApiKeyError(true);
            } else {
                setMessages(prev => [...prev, {
                    id: Date.now(),
                    role: 'ai',
                    content: "Üzgünüm, bir bağlantı hatası oluştu. Lütfen tekrar deneyin."
                }]);
            }
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

            {/* --- HEADER --- */}
            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-4 flex items-center justify-between text-white shadow-md z-10">
                <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                        <Bot size={24} />
                    </div>
                    <div>
                        <h2 className="font-bold text-lg leading-tight">Yapay Zeka Asistanı</h2>
                        <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${apiKeyError ? 'bg-red-400' : 'bg-green-400 animate-pulse'}`}></span>
                            <p className="text-white/70 text-xs">Gemini 2.5 Flash • {apiKeyError ? 'Bağlantı Yok' : 'Online'}</p>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setMessages(initialMessages)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-xs font-bold"
                    >Temizle</button>
                </div>
            </div>

            {/* --- TABS --- */}
            <div className="flex border-b border-gray-100 bg-white">
                <button
                    onClick={() => setActiveTab('general')}
                    className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'general' ? 'border-violet-600 text-violet-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    <Bot size={16} /> Genel Asistan
                </button>
                <button
                    onClick={() => setActiveTab('training')}
                    className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'training' ? 'border-violet-600 text-violet-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    <BrainCircuit size={16} /> Eğit & Kural Ekle
                </button>
            </div>

            {/* --- GENERAL ASSISTANT TAB --- */}
            {activeTab === 'general' && (
                <>
                    {/* --- MESSAGES AREA --- */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${msg.role === 'user'
                                    ? 'bg-violet-600 text-white rounded-tr-none'
                                    : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                                    }`}>
                                    {msg.role === 'ai' && (
                                        <div className="flex items-center gap-2 mb-2 border-b border-gray-100 pb-2">
                                            <Sparkles size={14} className="text-violet-500" />
                                            <span className="text-xs font-bold text-violet-600">Gemini AI</span>
                                        </div>
                                    )}
                                    <div className="text-sm leading-relaxed whitespace-pre-line markdown-body">
                                        {msg.content}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-gray-100 rounded-2xl p-4 rounded-tl-none shadow-sm flex items-center gap-2">
                                    <Loader2 size={16} className="animate-spin text-violet-500" />
                                    <span className="text-xs text-gray-400 font-medium">Gemini düşünüyor...</span>
                                </div>
                            </div>
                        )}
                        <div ref={scrollRef} />
                    </div>

                    {/* --- INPUT AREA --- */}
                    <div className="p-4 bg-white border-t border-gray-100">

                        {/* Quick Actions */}
                        <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar pb-1">
                            <button
                                onClick={() => setInput("Sitedeki kampanyaların genel bir özetini çıkar.")}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 text-xs font-bold rounded-full hover:bg-blue-100 transition-colors whitespace-nowrap"
                            >
                                <Search size={12} /> Genel Özet
                            </button>
                            <button
                                onClick={() => setInput("Hangi bankanın daha çok kampanyası var?")}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-600 text-xs font-bold rounded-full hover:bg-orange-100 transition-colors whitespace-nowrap"
                            >
                                <BarChart size={12} /> Banka Analizi
                            </button>
                            <button
                                onClick={() => setInput("Kampanya başlıklarını SEO açısından değerlendir.")}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-600 text-xs font-bold rounded-full hover:bg-green-100 transition-colors whitespace-nowrap"
                            >
                                <Zap size={12} /> SEO Tavsiyesi
                            </button>
                        </div>

                        <div className="relative">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Gemini'ye kampanya veritabanı hakkında bir soru sorun..."
                                className="w-full pl-4 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition-all font-medium"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || isTyping}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                        <p className="text-center text-[10px] text-gray-400 mt-2 flex items-center justify-center gap-1">
                            <Zap size={10} />
                            Powered by Google Gemini 1.5 Flash
                        </p>
                    </div>
                </>
            )}

            {/* --- TRAINING TAB --- */}
            {activeTab === 'training' && (
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-100">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-orange-100 text-orange-600 rounded-xl">
                                <BrainCircuit size={24} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-gray-800 mb-1">AI Eğitimi ve Kural Tanımlama</h3>
                                <p className="text-sm text-gray-600 mb-4">
                                    AI asistanını daha akıllı hale getirmek için ona kurallar öğretebilirsiniz.
                                    Örneğin: <span className="italic text-gray-500">"Trendyol geçen her kampanyayı E-Ticaret kategorisine al."</span> veya <span className="italic text-gray-500">"Başlıkta 'Bilet' varsa Seyahat sektörüdür."</span>
                                </p>

                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={trainingInput}
                                        onChange={(e) => setTrainingInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleTrain()}
                                        placeholder="AI'ya bir kural öğretin..."
                                        className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                                    />
                                    <button
                                        onClick={handleTrain}
                                        disabled={isTraining || !trainingInput.trim()}
                                        className="px-6 py-3 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
                                    >
                                        {isTraining ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                                        Öğret
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <div className="w-2 h-6 bg-violet-600 rounded-full"></div>
                            Aktif Kurallar ({rules.length})
                        </h3>

                        {rules.map((rule) => (
                            <div key={rule.rule_text} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-start justify-between group hover:border-violet-100 transition-colors">
                                <div>
                                    <p className="font-bold text-gray-800 text-sm mb-1">{rule.rule_text}</p>
                                    <p className="text-xs text-gray-500 italic">"{rule.user_feedback}"</p>
                                </div>
                                {/* Delete button would go here but simpler to just show for now */}
                            </div>
                        ))}

                        {rules.length === 0 && (
                            <p className="text-center text-gray-400 py-10 italic">Henüz tanımlanmış bir kural yok.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
