
import { useState } from 'react';
import { Database, Download, AlertTriangle, CheckCircle, Upload } from 'lucide-react';

export default function AdminBackup() {
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleDownloadBackup = () => {
        try {
            const backup = {
                campaign_data: localStorage.getItem('campaign_data'),
                scraper_config: localStorage.getItem('scraper_config'),
                gemini_key: localStorage.getItem('gemini_key'),
                sb_url: localStorage.getItem('sb_url'),
                timestamp: new Date().toISOString()
            };
            const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `kartavantaj_backup_${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            setSuccessMsg("Yedek dosyası başarıyla indirildi.");
        } catch (e: any) {
            setError("Yedekleme sırasında hata oluştu: " + e.message);
        }
    };

    const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const content = event.target?.result as string;
                const backup = JSON.parse(content);

                if (backup.campaign_data) localStorage.setItem('campaign_data', backup.campaign_data);
                if (backup.scraper_config) localStorage.setItem('scraper_config', backup.scraper_config);
                if (backup.gemini_key) localStorage.setItem('gemini_key', backup.gemini_key);
                if (backup.sb_url) localStorage.setItem('sb_url', backup.sb_url);

                alert('Veriler başarıyla geri yüklendi! Sayfa yenilenecek...');
                window.location.reload();
            } catch (error) {
                setError('Yedek dosyası bozuk veya hatalı!');
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Database className="text-purple-600" />
                    Yedekleme ve Kurtarma
                </h1>
                <p className="text-gray-500">
                    Sistemdeki tüm verileri (kampanyalar, ayarlar, API anahtarları) yedekleyin veya geri yükleyin.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Backup Card */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 flex flex-col items-center text-center hover:shadow-md transition-shadow">
                    <div className="bg-purple-100 p-4 rounded-full text-purple-600 mb-4">
                        <Download size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">Veri Yedeği İndir</h3>
                    <p className="text-sm text-gray-500 mb-6">
                        Mevcut durumu JSON dosyası olarak bilgisayarınıza indirir. Bu dosyayı saklayarak veri kaybını önleyebilirsiniz.
                    </p>
                    <button
                        onClick={handleDownloadBackup}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                    >
                        <Download size={20} /> Yedekle (Backup)
                    </button>
                </div>

                {/* Restore Card */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 flex flex-col items-center text-center hover:shadow-md transition-shadow">
                    <div className="bg-amber-100 p-4 rounded-full text-amber-600 mb-4">
                        <Upload size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">Yedekten Geri Yükle</h3>
                    <p className="text-sm text-gray-500 mb-6">
                        Daha önce indirdiğiniz JSON dosyasını yükleyerek sistemi o tarihe geri döndürürsünüz.
                    </p>
                    <label className="w-full cursor-pointer bg-white border-2 border-dashed border-gray-300 hover:border-amber-500 hover:bg-amber-50 text-gray-600 hover:text-amber-700 px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2">
                        <input
                            type="file"
                            accept=".json"
                            className="hidden"
                            onChange={handleRestoreBackup}
                        />
                        <Upload size={20} /> Dosya Seç ve Yükle
                    </label>
                </div>
            </div>

            {successMsg && (
                <div className="p-4 bg-green-50 text-green-700 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
                    <CheckCircle size={24} />
                    {successMsg}
                </div>
            )}

            {error && (
                <div className="p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
                    <AlertTriangle size={24} />
                    {error}
                </div>
            )}

            <div className="bg-blue-50 border border-blue-100 p-6 rounded-xl flex gap-4">
                <AlertTriangle className="text-blue-600 shrink-0" size={24} />
                <div className="text-blue-800 text-sm">
                    <strong className="block mb-1 text-base">Dikkat Edilmesi Gerekenler</strong>
                    <ul className="list-disc pl-4 space-y-1">
                        <li>Geri yükleme işlemi mevcut verilerin üzerine yazar.</li>
                        <li>Yedek dosyası kişisel API anahtarlarınızı da (varsa) içerebilir, güvenli bir yerde saklayın.</li>
                        <li>Veriler tarayıcınızın <code>Local Storage</code> alanında tutulur, tarayıcı geçmişini temizlerseniz silinebilir.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
