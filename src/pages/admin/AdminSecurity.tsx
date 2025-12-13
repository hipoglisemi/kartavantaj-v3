import { useState, useEffect } from 'react';
import { Shield, Clock, Globe, AlertTriangle, Plus, Trash2, Save, Eye, EyeOff } from 'lucide-react';
import { sessionService, ipWhitelistService } from '../../services/sessionService';
import { logActivity } from '../../services/activityService';
import { useConfirmation } from '../../context/ConfirmationContext';
import { useToast } from '../../context/ToastContext';

export default function AdminSecurity() {
    const { confirm } = useConfirmation();
    const { success, error } = useToast();
    
    const [sessionInfo, setSessionInfo] = useState<any>(null);
    const [remainingTime, setRemainingTime] = useState(0);
    const [ipWhitelist, setIpWhitelist] = useState<string[]>([]);
    const [newIP, setNewIP] = useState('');
    const [showFailedLogins, setShowFailedLogins] = useState(false);
    
    const [securitySettings, setSecuritySettings] = useState({
        sessionTimeout: 30, // dakika
        maxFailedLogins: 5,
        lockoutDuration: 15, // dakika
        requireStrongPasswords: true,
        enable2FA: true,
        enableIPWhitelist: false,
        logFailedLogins: true,
        emailAlerts: true
    });

    useEffect(() => {
        loadSecurityData();
        
        // Her saniye remaining time'ı güncelle
        const interval = setInterval(() => {
            const remaining = sessionService.getRemainingTime();
            setRemainingTime(remaining);
            
            const info = sessionService.getSessionInfo();
            setSessionInfo(info);
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const loadSecurityData = () => {
        // Session bilgilerini al
        const info = sessionService.getSessionInfo();
        setSessionInfo(info);
        setRemainingTime(sessionService.getRemainingTime());
        
        // IP whitelist'i al
        setIpWhitelist(ipWhitelistService.getWhitelist());
        
        // Güvenlik ayarlarını localStorage'dan yükle
        const stored = localStorage.getItem('admin_security_settings');
        if (stored) {
            try {
                setSecuritySettings(JSON.parse(stored));
            } catch (e) {
                console.error('Error loading security settings:', e);
            }
        }
    };

    const saveSecuritySettings = () => {
        localStorage.setItem('admin_security_settings', JSON.stringify(securitySettings));
        logActivity.settings('Security Settings Updated', 'Security configuration changed', 'info');
        success('Güvenlik ayarları kaydedildi');
    };

    const handleAddIP = () => {
        if (!newIP.trim()) {
            error('Lütfen geçerli bir IP adresi girin');
            return;
        }

        const added = ipWhitelistService.addIP(newIP.trim());
        if (added) {
            setIpWhitelist(ipWhitelistService.getWhitelist());
            setNewIP('');
            success('IP adresi whitelist\'e eklendi');
        } else {
            error('Geçersiz IP adresi veya zaten mevcut');
        }
    };

    const handleRemoveIP = async (ip: string) => {
        const confirmed = await confirm(
            'IP Adresini Kaldır',
            `${ip} adresini whitelist'ten kaldırmak istediğinizden emin misiniz?`
        );

        if (confirmed) {
            ipWhitelistService.removeIP(ip);
            setIpWhitelist(ipWhitelistService.getWhitelist());
            success('IP adresi kaldırıldı');
        }
    };

    const handleClearWhitelist = async () => {
        const confirmed = await confirm(
            'Tüm IP Adreslerini Kaldır',
            'Bu işlem tüm IP kısıtlamalarını kaldıracak. Devam etmek istiyor musunuz?'
        );

        if (confirmed) {
            ipWhitelistService.clearWhitelist();
            setIpWhitelist([]);
            success('IP whitelist temizlendi');
        }
    };

    const formatTime = (ms: number) => {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const formatDuration = (ms: number) => {
        const hours = Math.floor(ms / 3600000);
        const minutes = Math.floor((ms % 3600000) / 60000);
        
        if (hours > 0) {
            return `${hours}s ${minutes}dk`;
        }
        return `${minutes}dk`;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Güvenlik Yönetimi</h2>
                <p className="text-gray-500 mt-1">Sistem güvenliği ve erişim kontrolü ayarları</p>
            </div>

            {/* Current Session Info */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                    <Clock className="w-5 h-5 text-blue-500" />
                    <h3 className="text-lg font-semibold text-gray-900">Mevcut Oturum</h3>
                </div>

                {sessionInfo ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                            <div>
                                <p className="text-sm text-gray-500">Admin</p>
                                <p className="font-medium">{sessionInfo.adminEmail}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Giriş Zamanı</p>
                                <p className="font-medium">
                                    {new Date(sessionInfo.loginTime).toLocaleString('tr-TR')}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Oturum Süresi</p>
                                <p className="font-medium">
                                    {formatDuration(sessionService.getSessionDuration())}
                                </p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <p className="text-sm text-gray-500">Kalan Süre</p>
                                <p className={`font-bold text-lg ${remainingTime < 300000 ? 'text-red-600' : 'text-green-600'}`}>
                                    {formatTime(remainingTime)}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Son Aktivite</p>
                                <p className="font-medium">
                                    {new Date(sessionInfo.lastActivity).toLocaleString('tr-TR')}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Oturum ID</p>
                                <p className="font-mono text-sm text-gray-600">
                                    {sessionInfo.sessionId}
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <p className="text-gray-500">Oturum bilgisi bulunamadı</p>
                )}
            </div>

            {/* Security Settings */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <Shield className="w-5 h-5 text-green-500" />
                        <h3 className="text-lg font-semibold text-gray-900">Güvenlik Ayarları</h3>
                    </div>
                    <button
                        onClick={saveSecuritySettings}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Save size={16} />
                        Kaydet
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Oturum Zaman Aşımı (dakika)
                            </label>
                            <input
                                type="number"
                                min="5"
                                max="480"
                                value={securitySettings.sessionTimeout}
                                onChange={(e) => setSecuritySettings(prev => ({
                                    ...prev,
                                    sessionTimeout: parseInt(e.target.value) || 30
                                }))}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Maksimum Başarısız Giriş
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="20"
                                value={securitySettings.maxFailedLogins}
                                onChange={(e) => setSecuritySettings(prev => ({
                                    ...prev,
                                    maxFailedLogins: parseInt(e.target.value) || 5
                                }))}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Kilitleme Süresi (dakika)
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="1440"
                                value={securitySettings.lockoutDuration}
                                onChange={(e) => setSecuritySettings(prev => ({
                                    ...prev,
                                    lockoutDuration: parseInt(e.target.value) || 15
                                }))}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-gray-700">
                                Güçlü Şifre Zorunluluğu
                            </label>
                            <input
                                type="checkbox"
                                checked={securitySettings.requireStrongPasswords}
                                onChange={(e) => setSecuritySettings(prev => ({
                                    ...prev,
                                    requireStrongPasswords: e.target.checked
                                }))}
                                className="w-4 h-4 text-blue-600"
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-gray-700">
                                2FA Zorunluluğu
                            </label>
                            <input
                                type="checkbox"
                                checked={securitySettings.enable2FA}
                                onChange={(e) => setSecuritySettings(prev => ({
                                    ...prev,
                                    enable2FA: e.target.checked
                                }))}
                                className="w-4 h-4 text-blue-600"
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-gray-700">
                                IP Whitelist Aktif
                            </label>
                            <input
                                type="checkbox"
                                checked={securitySettings.enableIPWhitelist}
                                onChange={(e) => setSecuritySettings(prev => ({
                                    ...prev,
                                    enableIPWhitelist: e.target.checked
                                }))}
                                className="w-4 h-4 text-blue-600"
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-gray-700">
                                Başarısız Girişleri Logla
                            </label>
                            <input
                                type="checkbox"
                                checked={securitySettings.logFailedLogins}
                                onChange={(e) => setSecuritySettings(prev => ({
                                    ...prev,
                                    logFailedLogins: e.target.checked
                                }))}
                                className="w-4 h-4 text-blue-600"
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-gray-700">
                                Email Uyarıları
                            </label>
                            <input
                                type="checkbox"
                                checked={securitySettings.emailAlerts}
                                onChange={(e) => setSecuritySettings(prev => ({
                                    ...prev,
                                    emailAlerts: e.target.checked
                                }))}
                                className="w-4 h-4 text-blue-600"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* IP Whitelist */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <Globe className="w-5 h-5 text-purple-500" />
                        <h3 className="text-lg font-semibold text-gray-900">IP Whitelist</h3>
                    </div>
                    {ipWhitelist.length > 0 && (
                        <button
                            onClick={handleClearWhitelist}
                            className="flex items-center gap-2 px-3 py-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm"
                        >
                            <Trash2 size={14} />
                            Tümünü Kaldır
                        </button>
                    )}
                </div>

                <div className="space-y-4">
                    <div className="flex gap-3">
                        <input
                            type="text"
                            placeholder="IP adresi (örn: 192.168.1.1)"
                            value={newIP}
                            onChange={(e) => setNewIP(e.target.value)}
                            className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                            onKeyPress={(e) => e.key === 'Enter' && handleAddIP()}
                        />
                        <button
                            onClick={handleAddIP}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                            <Plus size={16} />
                            Ekle
                        </button>
                    </div>

                    {ipWhitelist.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <Globe className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p>Henüz IP adresi eklenmemiş</p>
                            <p className="text-sm">Whitelist boşken tüm IP adreslerine izin verilir</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {ipWhitelist.map((ip, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <span className="font-mono text-sm">{ip}</span>
                                    <button
                                        onClick={() => handleRemoveIP(ip)}
                                        className="text-red-600 hover:bg-red-100 p-1 rounded transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Security Warnings */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                        <h4 className="font-medium text-yellow-800">Güvenlik Uyarıları</h4>
                        <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                            <li>• IP whitelist aktifken sadece listedeki adreslerden erişim sağlanabilir</li>
                            <li>• Oturum zaman aşımı çok kısa olursa kullanıcı deneyimi olumsuz etkilenir</li>
                            <li>• 2FA devre dışı bırakılması güvenlik riskini artırır</li>
                            <li>• Güvenlik ayarları değişiklikleri sistem loglarına kaydedilir</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}