import { useState, useEffect } from 'react';
import { Activity, Database, Wifi, WifiOff, CheckCircle, XCircle, RefreshCw, Settings } from 'lucide-react';
import { universalSync } from '../../services/universalSyncService';

export default function AdminSystemStatus() {
    const [systemStatus, setSystemStatus] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSystemStatus();
        
        // Her 5 saniyede bir güncelle
        const interval = setInterval(loadSystemStatus, 5000);
        return () => clearInterval(interval);
    }, []);

    const loadSystemStatus = () => {
        try {
            const status = universalSync.getSystemStatus();
            setSystemStatus(status);
        } catch (error) {
            console.error('Failed to load system status:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <RefreshCw className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Sistem durumu yükleniyor...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Sistem Durumu</h2>
                <p className="text-gray-500 mt-1">Universal Sync Service ve sistem bileşenlerinin durumu</p>
            </div>

            {/* Connection Status */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                    {systemStatus?.supabaseConnected ? (
                        <Wifi className="w-5 h-5 text-green-500" />
                    ) : (
                        <WifiOff className="w-5 h-5 text-red-500" />
                    )}
                    <h3 className="text-lg font-semibold text-gray-900">Bağlantı Durumu</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">Supabase</span>
                        <div className="flex items-center gap-2">
                            {systemStatus?.supabaseConnected ? (
                                <>
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    <span className="text-sm text-green-600">Bağlı</span>
                                </>
                            ) : (
                                <>
                                    <XCircle className="w-4 h-4 text-red-500" />
                                    <span className="text-sm text-red-600">Bağlı Değil</span>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">Universal Sync</span>
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-sm text-green-600">Aktif</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">Real-time</span>
                        <div className="flex items-center gap-2">
                            {systemStatus?.activeRealtimeListeners?.length > 0 ? (
                                <>
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    <span className="text-sm text-green-600">
                                        {systemStatus.activeRealtimeListeners.length} Dinleyici
                                    </span>
                                </>
                            ) : (
                                <>
                                    <XCircle className="w-4 h-4 text-yellow-500" />
                                    <span className="text-sm text-yellow-600">Pasif</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Registered Systems */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                    <Database className="w-5 h-5 text-blue-500" />
                    <h3 className="text-lg font-semibold text-gray-900">Kayıtlı Sistemler</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {systemStatus?.registeredSystems?.map((system: string) => (
                        <div key={system} className="p-4 border border-gray-200 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-gray-900">{system}</span>
                                <div className="flex items-center gap-1">
                                    {systemStatus.activeSyncs?.includes(system) && (
                                        <div className="w-2 h-2 bg-green-500 rounded-full" title="Periyodik Sync Aktif" />
                                    )}
                                    {systemStatus.activeRealtimeListeners?.includes(system) && (
                                        <div className="w-2 h-2 bg-blue-500 rounded-full" title="Real-time Dinleyici Aktif" />
                                    )}
                                </div>
                            </div>
                            <div className="text-xs text-gray-500 space-y-1">
                                <div className="flex justify-between">
                                    <span>Periyodik Sync:</span>
                                    <span className={systemStatus.activeSyncs?.includes(system) ? 'text-green-600' : 'text-gray-400'}>
                                        {systemStatus.activeSyncs?.includes(system) ? 'Aktif' : 'Pasif'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Real-time:</span>
                                    <span className={systemStatus.activeRealtimeListeners?.includes(system) ? 'text-blue-600' : 'text-gray-400'}>
                                        {systemStatus.activeRealtimeListeners?.includes(system) ? 'Aktif' : 'Pasif'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {(!systemStatus?.registeredSystems || systemStatus.registeredSystems.length === 0) && (
                    <div className="text-center py-8 text-gray-500">
                        <Database className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p>Henüz kayıtlı sistem bulunamadı</p>
                    </div>
                )}
            </div>

            {/* System Statistics */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                    <Activity className="w-5 h-5 text-purple-500" />
                    <h3 className="text-lg font-semibold text-gray-900">Sistem İstatistikleri</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                            {systemStatus?.registeredSystems?.length || 0}
                        </div>
                        <div className="text-sm text-blue-600">Kayıtlı Sistem</div>
                    </div>

                    <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                            {systemStatus?.activeSyncs?.length || 0}
                        </div>
                        <div className="text-sm text-green-600">Aktif Sync</div>
                    </div>

                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                            {systemStatus?.activeRealtimeListeners?.length || 0}
                        </div>
                        <div className="text-sm text-purple-600">Real-time Dinleyici</div>
                    </div>

                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-gray-600">
                            {systemStatus?.supabaseConnected ? '100%' : '0%'}
                        </div>
                        <div className="text-sm text-gray-600">Bağlantı Durumu</div>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                    <Settings className="w-5 h-5 text-gray-500" />
                    <h3 className="text-lg font-semibold text-gray-900">Sistem İşlemleri</h3>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={loadSystemStatus}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <RefreshCw size={16} />
                        Durumu Yenile
                    </button>

                    <button
                        onClick={() => {
                            universalSync.stopAllSync();
                            setTimeout(() => {
                                window.location.reload();
                            }, 1000);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                    >
                        <RefreshCw size={16} />
                        Sync'i Yeniden Başlat
                    </button>
                </div>
            </div>

            {/* Debug Info */}
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                <h4 className="font-medium text-gray-900 mb-2">Debug Bilgileri</h4>
                <pre className="text-xs text-gray-600 overflow-auto">
                    {JSON.stringify(systemStatus, null, 2)}
                </pre>
            </div>
        </div>
    );
}