import { useState, useEffect } from 'react';
import { Package, Plus, History, GitBranch, Calendar, Tag, Trash2, RefreshCw } from 'lucide-react';
import { versionService, type VersionHistory } from '../services/versionService';

export default function VersionManager() {
    const [versionHistory, setVersionHistory] = useState<VersionHistory | null>(null);
    const [isAddingVersion, setIsAddingVersion] = useState(false);
    const [newVersionData, setNewVersionData] = useState({
        changes: [''],
        type: 'patch' as 'major' | 'minor' | 'patch'
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadVersionHistory();
    }, []);

    const loadVersionHistory = async () => {
        setLoading(true);
        try {
            // Önce Supabase'den yüklemeyi dene
            const remoteHistory = await versionService.loadFromSupabase();
            if (remoteHistory) {
                setVersionHistory(remoteHistory);
            } else {
                // Yoksa local'den yükle
                setVersionHistory(versionService.getVersionHistory());
            }
        } catch (error) {
            console.error('Failed to load version history:', error);
            setVersionHistory(versionService.getVersionHistory());
        } finally {
            setLoading(false);
        }
    };

    const handleAddVersion = () => {
        const changes = newVersionData.changes.filter(c => c.trim().length > 0);
        if (changes.length === 0) {
            alert('En az bir değişiklik açıklaması girmelisiniz!');
            return;
        }

        const newVersion = versionService.addVersion(changes, newVersionData.type);
        setVersionHistory(versionService.getVersionHistory());
        
        // Reset form
        setNewVersionData({
            changes: [''],
            type: 'patch'
        });
        setIsAddingVersion(false);
        
        alert(`✅ Yeni versiyon ${newVersion} başarıyla oluşturuldu!`);
    };

    const handleAddChange = () => {
        setNewVersionData(prev => ({
            ...prev,
            changes: [...prev.changes, '']
        }));
    };

    const handleChangeText = (index: number, value: string) => {
        setNewVersionData(prev => ({
            ...prev,
            changes: prev.changes.map((c, i) => i === index ? value : c)
        }));
    };

    const handleRemoveChange = (index: number) => {
        if (newVersionData.changes.length > 1) {
            setNewVersionData(prev => ({
                ...prev,
                changes: prev.changes.filter((_, i) => i !== index)
            }));
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin text-gray-400 mr-2" />
                    <span className="text-gray-500">Versiyon geçmişi yükleniyor...</span>
                </div>
            </div>
        );
    }

    if (!versionHistory) {
        return (
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="text-center py-8 text-gray-500">
                    Versiyon geçmişi yüklenemedi.
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                        <Package size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Versiyon Yönetimi</h2>
                        <p className="text-sm text-gray-500">
                            Mevcut versiyon: <span className="font-mono font-bold text-indigo-600">v{versionHistory.current}</span>
                        </p>
                    </div>
                </div>
                
                <div className="flex gap-3">
                    <div className="group relative">
                        <button
                            onClick={loadVersionHistory}
                            className="group relative bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 hover:from-gray-200 hover:via-gray-300 hover:to-gray-400 text-gray-700 px-4 py-2 rounded-2xl text-sm font-bold flex items-center gap-2 transition-all duration-500 shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-[1.02] border border-gray-300/50"
                        >
                            <div className="bg-white/50 p-1 rounded-lg backdrop-blur-sm">
                                <RefreshCw size={14} />
                            </div>
                            <span>Yenile</span>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
                        </button>
                        <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-0 group-hover:scale-100 bg-gray-500 text-white text-xs px-2 py-1 rounded-lg shadow-lg z-10 whitespace-nowrap">
                            Versiyon geçmişini yenile
                        </div>
                    </div>
                    
                    <div className="group relative">
                        <button
                            onClick={() => {
                                // Test versiyonu oluştur
                                const testChanges = [
                                    'Test versiyon güncelleme sistemi',
                                    'Footer dinamik versiyon gösterimi test',
                                    'Versiyon yönetimi demo'
                                ];
                                const newVersion = versionService.addVersion(testChanges, 'patch');
                                alert(`🎉 Test versiyonu oluşturuldu: v${newVersion}\n\nFooter'da versiyon numarasının değiştiğini kontrol edin!`);
                                setVersionHistory(versionService.getVersionHistory());
                                window.dispatchEvent(new Event('version-updated'));
                            }}
                            className="group relative bg-gradient-to-br from-green-500 via-green-600 to-green-700 hover:from-green-600 hover:via-green-700 hover:to-green-800 text-white px-4 py-2 rounded-2xl text-sm font-bold flex items-center gap-2 transition-all duration-500 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 hover:scale-[1.02] border border-green-400/20"
                        >
                            <div className="bg-white/20 p-1 rounded-lg backdrop-blur-sm">
                                <Tag size={14} />
                            </div>
                            <span>Test Versiyon</span>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
                        </button>
                        <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-0 group-hover:scale-100 bg-green-500 text-white text-xs px-2 py-1 rounded-lg shadow-lg z-10 whitespace-nowrap">
                            Hızlı test versiyonu oluştur
                        </div>
                    </div>
                    
                    <div className="group relative">
                        <button
                            onClick={() => setIsAddingVersion(!isAddingVersion)}
                            className="group relative bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-700 hover:from-indigo-600 hover:via-indigo-700 hover:to-indigo-800 text-white px-4 py-2 rounded-2xl text-sm font-bold flex items-center gap-2 transition-all duration-500 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 hover:scale-[1.02] border border-indigo-400/20"
                        >
                            <div className="bg-white/20 p-1 rounded-lg backdrop-blur-sm">
                                <Plus size={14} />
                            </div>
                            <span>Yeni Versiyon</span>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
                        </button>
                        <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-0 group-hover:scale-100 bg-indigo-500 text-white text-xs px-2 py-1 rounded-lg shadow-lg z-10 whitespace-nowrap">
                            Manuel versiyon ekle
                        </div>
                    </div>
                </div>
            </div>

            {/* Yeni Versiyon Ekleme Formu */}
            {isAddingVersion && (
                <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-xl animate-in slide-in-from-top-2">
                    <h3 className="font-bold text-indigo-800 mb-4 flex items-center gap-2">
                        <GitBranch size={16} />
                        Yeni Versiyon Oluştur
                    </h3>
                    
                    <div className="space-y-4">
                        {/* Versiyon Tipi */}
                        <div>
                            <label className="block text-sm font-medium text-indigo-700 mb-2">Versiyon Tipi</label>
                            <div className="flex gap-3">
                                {[
                                    { value: 'patch', label: 'Patch (Hata düzeltme)', icon: '🔧', desc: 'x.x.+1' },
                                    { value: 'minor', label: 'Minor (Yeni özellik)', icon: '✨', desc: 'x.+1.0' },
                                    { value: 'major', label: 'Major (Büyük değişiklik)', icon: '🚀', desc: '+1.0.0' }
                                ].map((type) => (
                                    <button
                                        key={type.value}
                                        onClick={() => setNewVersionData(prev => ({ ...prev, type: type.value as any }))}
                                        className={`flex-1 p-3 rounded-lg border-2 transition-all text-left ${
                                            newVersionData.type === type.value
                                                ? 'border-indigo-500 bg-indigo-100 text-indigo-800'
                                                : 'border-gray-200 bg-white text-gray-600 hover:border-indigo-300'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-lg">{type.icon}</span>
                                            <span className="font-bold text-sm">{type.label}</span>
                                        </div>
                                        <div className="text-xs opacity-75">{type.desc}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Değişiklikler */}
                        <div>
                            <label className="block text-sm font-medium text-indigo-700 mb-2">Değişiklikler</label>
                            <div className="space-y-2">
                                {newVersionData.changes.map((change, index) => (
                                    <div key={index} className="flex gap-2">
                                        <input
                                            type="text"
                                            value={change}
                                            onChange={(e) => handleChangeText(index, e.target.value)}
                                            placeholder="Değişiklik açıklaması..."
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                        {newVersionData.changes.length > 1 && (
                                            <button
                                                onClick={() => handleRemoveChange(index)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={handleAddChange}
                                className="mt-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                            >
                                <Plus size={14} />
                                Değişiklik Ekle
                            </button>
                        </div>

                        {/* Butonlar */}
                        <div className="flex gap-3 pt-2">
                            <div className="group relative flex-1">
                                <button
                                    onClick={handleAddVersion}
                                    className="w-full group relative bg-gradient-to-br from-green-500 via-green-600 to-green-700 hover:from-green-600 hover:via-green-700 hover:to-green-800 text-white py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-500 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 hover:scale-[1.02] border border-green-400/20"
                                >
                                    <div className="bg-white/20 p-1 rounded-lg backdrop-blur-sm">
                                        <Tag size={14} />
                                    </div>
                                    <span>Versiyon Oluştur</span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
                                </button>
                            </div>
                            <div className="group relative">
                                <button
                                    onClick={() => setIsAddingVersion(false)}
                                    className="group relative bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 hover:from-gray-200 hover:via-gray-300 hover:to-gray-400 text-gray-700 px-6 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 transition-all duration-500 shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-[1.02] border border-gray-300/50"
                                >
                                    <span>İptal</span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Versiyon Geçmişi */}
            <div className="space-y-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2 border-b pb-2">
                    <History size={16} />
                    Versiyon Geçmişi
                </h3>
                
                <div className="space-y-3 max-h-96 overflow-y-auto">
                    {versionHistory.history.map((version) => (
                        <div key={version.version} className="flex gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-indigo-200 transition-colors">
                            {/* Versiyon Bilgisi */}
                            <div className="flex-shrink-0">
                                <div className={`px-3 py-1 rounded-full text-xs font-bold border ${versionService.getVersionTypeColor(version.type)}`}>
                                    <span className="mr-1">{versionService.getVersionTypeIcon(version.type)}</span>
                                    v{version.version}
                                </div>
                                <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                    <Calendar size={10} />
                                    {formatDate(version.date)}
                                </div>
                            </div>
                            
                            {/* Değişiklikler */}
                            <div className="flex-1">
                                <ul className="space-y-1">
                                    {version.changes.map((change, changeIndex) => (
                                        <li key={changeIndex} className="text-sm text-gray-700 flex items-start gap-2">
                                            <span className="text-indigo-500 mt-1">•</span>
                                            <span>{change}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>
                
                {versionHistory.history.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        <Package size={32} className="mx-auto mb-2 opacity-20" />
                        <p>Henüz versiyon geçmişi yok.</p>
                        <p className="text-sm">İlk versiyonunuzu oluşturmak için yukarıdaki butonu kullanın.</p>
                    </div>
                )}
            </div>
        </div>
    );
}