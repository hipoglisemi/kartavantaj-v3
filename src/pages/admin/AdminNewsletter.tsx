import { useState } from 'react';
import { Mail, Send, Settings, UserPlus, CheckCircle, AlertCircle, Trash2, Plus } from 'lucide-react';
import { settingsService } from '../../services/settingsService';
import { useToast } from '../../context/ToastContext';

export default function AdminNewsletter() {
    const { success, error, info } = useToast();
    const settings = settingsService.useSettings();
    const [newSubscriber, setNewSubscriber] = useState('');
    const [isSending, setIsSending] = useState(false);

    const subs = settings.newsletter.subscribers || [];

    const handleSaveSettings = (updatedSettings: any) => {
        settingsService.saveDraftSettings(updatedSettings);
        settingsService.publishSettings();
        // Just toast, assuming optimistic
    };

    const handleUpdateApiKey = (key: string) => {
        handleSaveSettings({
            ...settings,
            newsletter: { ...settings.newsletter, apiKey: key }
        });
        success("API anahtarı güncellendi.");
    };

    const handleAddSubscriber = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSubscriber) return;

        if (subs.some(s => s.email === newSubscriber)) {
            info("Bu abone zaten listede.");
            return;
        }

        const newSubObj = {
            email: newSubscriber,
            date: new Date().toISOString().split('T')[0],
            status: 'Subscribed' as const
        };

        handleSaveSettings({
            ...settings,
            newsletter: {
                ...settings.newsletter,
                subscribers: [newSubObj, ...subs]
            }
        });
        success(`${newSubscriber} listeye eklendi.`);
        setNewSubscriber('');
    };

    const handleRemoveSubscriber = (email: string) => {
        const filtered = subs.filter(s => s.email !== email);
        handleSaveSettings({
            ...settings,
            newsletter: { ...settings.newsletter, subscribers: filtered }
        });
        success("Abone silindi.");
    };

    const handleSendTest = () => {
        if (!settings.newsletter.apiKey) {
            error("Lütfen önce API anahtarını giriniz.");
            return;
        }
        setIsSending(true);
        setTimeout(() => {
            setIsSending(false);
            success("Test bülteni gönderildi! (Simülasyon)");
        }, 2000);
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10">
            {/* Header */}
            <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                        <Mail className="text-orange-500" size={28} />
                        Bülten Yönetimi (Cloud)
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        E-posta abonelerini yönetin ve toplu mail gönderim ayarlarını yapın.
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleSendTest}
                        disabled={isSending}
                        className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 font-bold shadow-md transition-colors disabled:opacity-50"
                    >
                        {isSending ? <Send size={18} className="animate-spin" /> : <Send size={18} />}
                        {isSending ? 'Gönderiliyor...' : 'Yeni Bülten Gönder'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Stats & Config Column */}
                <div className="space-y-6">
                    {/* Stats Card */}
                    <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl p-6 text-white shadow-lg">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-white/20 p-2 rounded-lg">
                                <UserPlus size={24} className="text-white" />
                            </div>
                            <h3 className="text-lg font-bold">Toplam Abone</h3>
                        </div>
                        <p className="text-4xl font-extrabold">{subs.filter(s => s.status === 'Subscribed').length}</p>
                        <p className="text-white/80 text-sm mt-1">Aktif okuyucu kitlesi</p>
                    </div>

                    {/* API Config */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Settings size={18} className="text-gray-400" />
                            Entegrasyon Ayarları
                        </h3>
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-gray-500 uppercase">Mailchimp / SendGrid API Key</label>
                            <input
                                type="password"
                                value={settings.newsletter.apiKey || ''}
                                onChange={(e) => handleUpdateApiKey(e.target.value)}
                                placeholder="API Anahtarı Giriniz..."
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                            />
                            <p className="text-xs text-gray-400 leading-relaxed">
                                Otomatik kaydedilir. Toplu gönderim için gereklidir.
                            </p>
                        </div>
                    </div>

                    {/* Add Subscriber */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Plus size={18} className="text-gray-400" />
                            Manuel Abone Ekle
                        </h3>
                        <form onSubmit={handleAddSubscriber} className="space-y-3">
                            <input
                                type="email"
                                required
                                value={newSubscriber}
                                onChange={(e) => setNewSubscriber(e.target.value)}
                                placeholder="e-posta@adresi.com"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                            />
                            <button type="submit" className="w-full bg-gray-100 text-gray-800 py-2 rounded-lg text-sm font-bold hover:bg-gray-200 transition-colors">
                                Listeye Ekle
                            </button>
                        </form>
                    </div>
                </div>

                {/* Subscribers List Column */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <h3 className="font-bold text-gray-800">Abone Listesi ({subs.length})</h3>
                        <span className="text-xs text-gray-500">Cloud Data</span>
                    </div>
                    <div className="max-h-[600px] overflow-y-auto">
                        {subs.length === 0 ? (
                            <p className="text-center py-10 text-gray-400">Henüz abone yok.</p>
                        ) : (
                            subs.map((sub, i) => (
                                <div key={i} className="flex items-center justify-between p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-xs">
                                            {sub.email.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-800">{sub.email}</p>
                                            <p className="text-xs text-gray-500">{sub.date}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {sub.status === 'Subscribed' ? (
                                            <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                                <CheckCircle size={10} /> ABONE
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                                <AlertCircle size={10} /> AYRILDI
                                            </span>
                                        )}
                                        <button
                                            onClick={() => handleRemoveSubscriber(sub.email)}
                                            className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
