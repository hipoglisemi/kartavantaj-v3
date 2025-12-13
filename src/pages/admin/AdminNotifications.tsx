
import { Bell, CheckCircle, X, User, Clock, Shield } from 'lucide-react';
import { useConfirmation } from '../../context/ConfirmationContext';
import { useToast } from '../../context/ToastContext';
import { settingsService } from '../../services/settingsService';

export default function AdminNotifications() {
    const { confirm } = useConfirmation();
    const { success, error } = useToast();
    const settings = settingsService.useSettings();

    const saveSettings = (newSettings: any) => {
        settingsService.saveDraftSettings(newSettings);
        settingsService.publishSettings().then(ok => {
            if (ok) success("Değişiklikler buluta kaydedildi.");
            else error("Kaydedilirken hata oluştu.");
        });
    };

    const handleApproveAdmin = async (email: string) => {
        const currentAdminEmail = localStorage.getItem('admin_email');
        const masterAdminEmail = 'admin@kartavantaj.com';
        
        if (currentAdminEmail !== masterAdminEmail) {
            error('Sadece master admin yönetici onayı verebilir.');
            return;
        }
        
        const updatedAdmins = settings.admins.map(admin => {
            const adminEmail = typeof admin === 'string' ? admin : admin.email;
            if (adminEmail === email) {
                return typeof admin === 'string' 
                    ? { email: admin, name: 'Admin', status: 'active' as const, createdAt: new Date().toISOString(), approvedBy: masterAdminEmail, approvedAt: new Date().toISOString() }
                    : { ...admin, status: 'active' as const, approvedBy: masterAdminEmail, approvedAt: new Date().toISOString() };
            }
            return admin;
        });
        
        const updated = { ...settings, admins: updatedAdmins };
        saveSettings(updated);
        success(`${email} admin olarak onaylandı.`);
    };

    const handleRejectAdmin = async (email: string) => {
        const currentAdminEmail = localStorage.getItem('admin_email');
        const masterAdminEmail = 'admin@kartavantaj.com';
        
        if (currentAdminEmail !== masterAdminEmail) {
            error('Sadece master admin yönetici reddedebilir.');
            return;
        }
        
        if (await confirm({
            title: 'Admin Başvurusunu Reddet',
            message: `${email} admin başvurusunu reddetmek istediğinize emin misiniz?`,
            type: 'warning'
        })) {
            const updatedAdmins = settings.admins.filter(admin => {
                const adminEmail = typeof admin === 'string' ? admin : admin.email;
                return adminEmail !== email;
            });
            
            const updated = { ...settings, admins: updatedAdmins };
            saveSettings(updated);
            success(`${email} admin başvurusu reddedildi.`);
        }
    };

    const pendingAdmins = settings.admins.filter(admin => 
        typeof admin === 'object' && admin.status === 'pending'
    );

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                        <Bell className="text-blue-600" size={28} />
                        Bildirimler
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Admin onay bekleyen başvurular ve sistem bildirimleri
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm font-medium">
                        {pendingAdmins.length} Bekleyen
                    </span>
                </div>
            </div>

            {/* Pending Admin Approvals */}
            {pendingAdmins.length > 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="font-bold text-gray-800 flex items-center gap-2">
                            <Shield size={18} className="text-orange-500" />
                            Admin Onay Bekleyen Başvurular
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Aşağıdaki kullanıcılar admin olmak için başvuruda bulunmuş ve onayınızı bekliyor.
                        </p>
                    </div>

                    <div className="divide-y divide-gray-50">
                        {pendingAdmins.map((admin) => (
                            <div key={admin.email} className="p-6 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                                            <User className="text-yellow-600" size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-800">{admin.name}</h3>
                                            <p className="text-sm text-gray-600">{admin.email}</p>
                                            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                                <Clock size={12} />
                                                <span>Başvuru: {formatDate(admin.createdAt)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-3">
                                        <div className="group relative">
                                            <button
                                                onClick={() => handleApproveAdmin(admin.email)}
                                                className="group relative bg-gradient-to-br from-green-500 via-green-600 to-green-700 hover:from-green-600 hover:via-green-700 hover:to-green-800 text-white px-5 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 transition-all duration-500 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 hover:scale-[1.02] border border-green-400/20"
                                            >
                                                <div className="bg-white/20 p-1 rounded-lg backdrop-blur-sm">
                                                    <CheckCircle size={14} />
                                                </div>
                                                <span>Onayla</span>
                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
                                            </button>
                                            <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-0 group-hover:scale-100 bg-green-500 text-white text-xs px-2 py-1 rounded-lg shadow-lg z-10 whitespace-nowrap">
                                                Admin olarak onayla
                                            </div>
                                        </div>
                                        <div className="group relative">
                                            <button
                                                onClick={() => handleRejectAdmin(admin.email)}
                                                className="group relative bg-gradient-to-br from-red-500 via-red-600 to-red-700 hover:from-red-600 hover:via-red-700 hover:to-red-800 text-white px-5 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 transition-all duration-500 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 hover:scale-[1.02] border border-red-400/20"
                                            >
                                                <div className="bg-white/20 p-1 rounded-lg backdrop-blur-sm">
                                                    <X size={14} />
                                                </div>
                                                <span>Reddet</span>
                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
                                            </button>
                                            <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-0 group-hover:scale-100 bg-red-500 text-white text-xs px-2 py-1 rounded-lg shadow-lg z-10 whitespace-nowrap">
                                                Başvuruyu reddet
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Bell className="text-gray-400" size={32} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Bildirim Yok</h3>
                    <p className="text-gray-500">
                        Şu anda bekleyen admin başvurusu bulunmuyor.
                    </p>
                </div>
            )}

            {/* System Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                    <Shield className="text-blue-600 mt-0.5" size={18} />
                    <div className="text-sm">
                        <p className="font-medium text-blue-800 mb-1">Bilgi</p>
                        <p className="text-blue-700">
                            Yeni admin başvuruları otomatik olarak "pending" durumunda eklenir. 
                            Sadece master admin onay verebilir. Onaylanan adminler giriş yapabilir.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}