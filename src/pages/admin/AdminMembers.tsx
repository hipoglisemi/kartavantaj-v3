import { useState, useEffect } from 'react';
import { Search, User, Shield, Mail, Calendar, Trash2, CheckCircle, Smartphone, Copy, Clock } from 'lucide-react';
import TOTPService from '../../services/totpService';
import AdminRegisterModal from '../../components/AdminRegisterModal';
import SecurityService from '../../services/securityService';
// import AdminService from '../../services/adminService'; // Gelecekte kullanılacak
import { useConfirmation } from '../../context/ConfirmationContext';
import { useToast } from '../../context/ToastContext';
import { settingsService } from '../../services/settingsService';

export default function AdminMembers() {
    const { confirm } = useConfirmation();
    const { success, error } = useToast();
    const settings = settingsService.useSettings();

    // Master admin'i otomatik ekle (eğer yoksa)
    useEffect(() => {
        const masterAdminEmail = 'admin@kartavantaj.com';
        const masterAdminExists = settings.admins.some(admin => 
            typeof admin === 'string' ? admin === masterAdminEmail : admin.email === masterAdminEmail
        );
        
        if (!masterAdminExists) {
            const masterAdmin = {
                email: masterAdminEmail,
                name: 'Master Admin',
                status: 'active' as const,
                createdAt: new Date().toISOString(),
                approvedBy: 'system',
                approvedAt: new Date().toISOString()
            };
            
            const updatedSettings = {
                ...settings,
                admins: [masterAdmin, ...settings.admins]
            };
            settingsService.saveDraftSettings(updatedSettings);
            settingsService.publishSettings();
        }
    }, [settings]);

    const [activeTab, setActiveTab] = useState<'members' | 'team'>('members');
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddAdminModal, setShowAddAdminModal] = useState(false);

    // --- 2FA Setup Logic ---
    const [show2FASetup, setShow2FASetup] = useState(false);
    const [selectedAdminEmail, setSelectedAdminEmail] = useState('');
    const [generatedSecret, setGeneratedSecret] = useState('');
    const [qrCodeImage, setQrCodeImage] = useState('');
    const [currentToken, setCurrentToken] = useState('');
    const [timeRemaining, setTimeRemaining] = useState(30);

    // Member Management State
    const [isAddingMember, setIsAddingMember] = useState(false);
    const [newMember, setNewMember] = useState({ name: '', email: '', role: 'User', status: 'Active' });



    // 2FA Görüntüleme/Kurulum Functions
    const handle2FASetup = async (email: string, forceNew: boolean = false) => {
        try {
            setSelectedAdminEmail(email);
            
            // Mevcut secret'ı kontrol et
            const existingSecret = TOTPService.getAdminSecret(email);
            
            if (existingSecret && !forceNew) {
                // Mevcut secret varsa sadece göster (yeni secret oluşturma)
                setGeneratedSecret(existingSecret);
                const token = TOTPService.generateToken(existingSecret);
                setCurrentToken(token);
                setShow2FASetup(true);
                setQrCodeImage(''); // QR kod gösterme, sadece mevcut durumu göster
            } else {
                // Yeni secret oluştur (sadece forceNew=true olduğunda veya hiç secret yoksa)
                const secret = TOTPService.generateSecret();
                
                // Admin için secret'ı kaydet
                TOTPService.saveAdminSecret(email, secret);
                
                // Mevcut token'ı oluştur
                const token = TOTPService.generateToken(secret);
                
                setGeneratedSecret(secret);
                setCurrentToken(token);
                setShow2FASetup(true);
                
                // QR Code oluştur (yeni kurulum için)
                try {
                    const qrImage = await TOTPService.generateQRCodeImage(secret, email, 'KartAvantaj Admin');
                    setQrCodeImage(qrImage);
                } catch (qrError) {
                    error('QR Code oluşturulamadı, manuel secret kullanın');
                    setQrCodeImage('');
                }
            }
        } catch (err) {
            console.error('2FA setup error:', err);
            error('2FA işlemi başlatılamadı: ' + (err instanceof Error ? err.message : 'Bilinmeyen hata'));
        }
    };



    // Timer effect - Senkronize güncelleme
    useEffect(() => {
        let interval: NodeJS.Timeout;
        let syncTimeout: NodeJS.Timeout;
        
        if (show2FASetup && generatedSecret) {
            const updateToken = () => {
                const remaining = TOTPService.getTimeRemaining();
                setTimeRemaining(remaining);
                
                const newToken = TOTPService.generateToken(generatedSecret);
                setCurrentToken(newToken);
            };
            
            // İlk güncelleme hemen yap
            updateToken();
            
            // Bir sonraki tam saniyeye kadar bekle, sonra senkronize başla
            const now = Date.now();
            const msToNextSecond = 1000 - (now % 1000);
            
            syncTimeout = setTimeout(() => {
                updateToken(); // Tam saniyede güncelle
                interval = setInterval(updateToken, 1000); // Her saniye güncelle
            }, msToNextSecond);
        }
        
        return () => {
            if (interval) clearInterval(interval);
            if (syncTimeout) clearTimeout(syncTimeout);
        };
    }, [show2FASetup, generatedSecret]);

    const copyToClipboard = (text: string) => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text);
            success('Panoya kopyalandı!');
        } else {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            success('Panoya kopyalandı!');
        }
    };

    const close2FASetup = () => {
        setShow2FASetup(false);
        setSelectedAdminEmail('');
        setGeneratedSecret('');
        setQrCodeImage('');
        setCurrentToken('');
        setTimeRemaining(30);
    };

    const saveSettings = (newSettings: any) => {
        settingsService.saveDraftSettings(newSettings);
        // Otomatik senkronizasyon artık saveDraftSettings içinde yapılıyor
        success("Değişiklikler kaydedildi ve senkronize ediliyor...");
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

    const handleRemoveAdmin = async (email: string) => {
        const currentAdminEmail = localStorage.getItem('admin_email');
        const masterAdminEmail = 'admin@kartavantaj.com';
        
        // Sadece master admin diğer adminleri silebilir
        if (currentAdminEmail !== masterAdminEmail) {
            error('Sadece master admin diğer yöneticileri kaldırabilir.');
            return;
        }
        
        // Master admin kendini silemez
        if (email === masterAdminEmail) {
            error('Master admin kendini kaldıramaz.');
            return;
        }
        
        if (await confirm({
            title: 'Yöneticiyi Kaldır',
            message: `${email} yetkilerini almak istediğinize emin misiniz?`,
            type: 'warning'
        })) {
            const updatedAdmins = settings.admins.filter(admin => {
                const adminEmail = typeof admin === 'string' ? admin : admin.email;
                return adminEmail !== email;
            });
            const updated = { ...settings, admins: updatedAdmins };
            saveSettings(updated);
            
            // Eski sistem verilerini de temizle
            try {
                const adminList = JSON.parse(SecurityService.getSecureItem('admin_list') || '[]');
                const cleanedList = adminList.filter((adminEmail: string) => adminEmail !== email);
                SecurityService.setSecureItem('admin_list', JSON.stringify(cleanedList));
                
                // Admin credentials'ını da sil
                SecurityService.removeSecureItem(`admin_cred_${email}`);
                
                // TOTP secret'ını da sil
                TOTPService.removeAdminSecret(email);
            } catch (e) {
                console.warn('Eski sistem verileri temizlenirken hata:', e);
            }
            
            success(`${email} yönetici listesinden kaldırıldı.`);
        }
    };

    // --- Member CRUD ---
    const handleAddMember = (e: React.FormEvent) => {
        e.preventDefault();
        const newUserObj = {
            id: Date.now(),
            ...newMember,
            joined: new Date().toISOString().split('T')[0]
        };
        // @ts-ignore
        const updated = { ...settings, demoUsers: [newUserObj, ...settings.demoUsers] };
        saveSettings(updated);
        setIsAddingMember(false);
        setNewMember({ name: '', email: '', role: 'User', status: 'Active' });
    };

    const handleDeleteMember = async (id: number) => {
        if (await confirm({ title: 'Kullanıcıyı Sil', message: 'Bu kullanıcıyı silmek istediğinize emin misiniz?', type: 'danger' })) {
            const updated = { ...settings, demoUsers: settings.demoUsers.filter(u => u.id !== id) };
            saveSettings(updated);
        }
    };

    const users = settings.demoUsers || [];

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-10">
            {/* Header */}
            <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                        <User className="text-blue-600" size={28} />
                        Üye Yönetimi (Cloud)
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Kayıtlı kullanıcıları ve yönetici ekibini buradan yönetebilirsiniz.
                    </p>
                </div>
                {/* Tabs */}
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button onClick={() => setActiveTab('members')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'members' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Kullanıcılar</button>
                    <button onClick={() => setActiveTab('team')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'team' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Yönetici Ekibi</button>
                </div>
            </div>

            {activeTab === 'members' ? (
                <>
                    {/* Add Member Form (Toggle) */}
                    {isAddingMember && (
                        <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 animate-in fade-in slide-in-from-top-4">
                            <h3 className="font-bold text-blue-800 mb-4">Yeni Üye Ekle</h3>
                            <form onSubmit={handleAddMember} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <input required placeholder="Ad Soyad" value={newMember.name} onChange={e => setNewMember({ ...newMember, name: e.target.value })} className="px-3 py-2 rounded-lg border border-blue-200" />
                                <input required placeholder="E-posta" type="email" value={newMember.email} onChange={e => setNewMember({ ...newMember, email: e.target.value })} className="px-3 py-2 rounded-lg border border-blue-200" />
                                <select value={newMember.role} onChange={e => setNewMember({ ...newMember, role: e.target.value })} className="px-3 py-2 rounded-lg border border-blue-200">
                                    <option>User</option><option>Editor</option><option>Admin</option>
                                </select>
                                <div className="flex gap-2">
                                    <button type="submit" className="flex-1 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700">Kaydet</button>
                                    <button type="button" onClick={() => setIsAddingMember(false)} className="px-4 bg-white text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">İptal</button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Search and Filters */}
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="İsim veya e-posta ile ara..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            />
                        </div>
                        <button onClick={() => setIsAddingMember(!isAddingMember)} className="bg-blue-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                            + Yeni Üye
                        </button>
                    </div>

                    {/* Users Table */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider">
                                    <th className="px-6 py-4 font-semibold">Kullanıcı</th>
                                    <th className="px-6 py-4 font-semibold">Rol</th>
                                    <th className="px-6 py-4 font-semibold">Durum</th>
                                    <th className="px-6 py-4 font-semibold">Katılım</th>
                                    <th className="px-6 py-4 font-semibold text-right">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredUsers.length === 0 ? (
                                    <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-400">Kullanıcı bulunamadı.</td></tr>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <tr key={user.id} className="group hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600 flex items-center justify-center font-bold text-lg">
                                                        {user.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-bold text-gray-900">{user.name}</h4>
                                                        <p className="text-xs text-gray-500 flex items-center gap-1"><Mail size={10} /> {user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5">
                                                    <Shield size={14} className={user.role === 'Admin' ? 'text-purple-600' : 'text-gray-400'} />
                                                    <span className={`text-sm font-medium ${user.role === 'Admin' ? 'text-purple-700' : 'text-gray-600'}`}>
                                                        {user.role}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-block
                                                    ${user.status === 'Active' ? 'bg-green-100 text-green-700' :
                                                        user.status === 'Inactive' ? 'bg-gray-100 text-gray-600' : 'bg-red-100 text-red-700'}
                                                `}>
                                                    {user.status === 'Active' ? 'Aktif' : user.status === 'Inactive' ? 'Pasif' : 'Engelli'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-gray-500 flex items-center gap-1"><Calendar size={14} /> {user.joined}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleDeleteMember(user.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Sil">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            ) : (
                <div className="max-w-4xl mx-auto">
                    {/* --- ADMIN LIST --- */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="font-bold text-gray-800 flex items-center gap-2">
                                <Shield size={18} className="text-gray-500" />
                                Yetkili Listesi
                            </h2>
                            <div className="flex items-center gap-3">
                                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-bold">{settings.admins.length} Kişi</span>
                                {localStorage.getItem('admin_email') === 'admin@kartavantaj.com' && (
                                    <button
                                        onClick={() => setShowAddAdminModal(true)}
                                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                                    >
                                        <User size={16} />
                                        Yeni Admin Ekle
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="divide-y divide-gray-50">
                            {settings.admins.map((adminData) => {
                                const admin = typeof adminData === 'string' 
                                    ? { email: adminData, name: 'Admin', status: 'active' as const, createdAt: new Date().toISOString() }
                                    : adminData;
                                
                                const currentAdminEmail = localStorage.getItem('admin_email');
                                const masterAdminEmail = 'admin@kartavantaj.com';
                                const isCurrentAdmin = admin.email === currentAdminEmail;
                                const isMasterAdmin = admin.email === masterAdminEmail;
                                const canRemoveAdmin = currentAdminEmail === masterAdminEmail && admin.email !== masterAdminEmail;
                                
                                return (
                                    <div key={admin.email} className={`p-4 flex items-center justify-between transition-colors ${
                                        admin.status === 'pending' ? 'bg-yellow-50 hover:bg-yellow-100' :
                                        isCurrentAdmin ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-50'
                                    }`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                                                admin.status === 'pending' ? 'bg-yellow-100 text-yellow-600 ring-2 ring-yellow-200' :
                                                isMasterAdmin ? 'bg-gradient-to-br from-yellow-100 to-orange-100 text-orange-600 ring-2 ring-orange-200' :
                                                isCurrentAdmin ? 'bg-blue-100 text-blue-600 ring-2 ring-blue-200' : 'bg-purple-100 text-purple-600'
                                            }`}>
                                                {admin.email.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-bold text-gray-800">{admin.email}</p>
                                                    {admin.status === 'pending' && (
                                                        <span className="bg-yellow-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">ONAY BEKLİYOR</span>
                                                    )}
                                                    {isMasterAdmin && admin.status === 'active' && (
                                                        <span className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">MASTER</span>
                                                    )}
                                                    {isCurrentAdmin && !isMasterAdmin && admin.status === 'active' && (
                                                        <span className="bg-blue-600 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">SİZ</span>
                                                    )}
                                                    {isCurrentAdmin && isMasterAdmin && (
                                                        <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">SİZ (MASTER)</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1 text-xs font-medium">
                                                    <CheckCircle size={12} />
                                                    <span className={
                                                        admin.status === 'pending' ? 'text-yellow-600' :
                                                        isMasterAdmin ? 'text-orange-600' : 'text-green-600'
                                                    }>
                                                        {admin.status === 'pending' ? 'Onay Bekliyor' :
                                                         isMasterAdmin ? 'Master Admin' : 'Aktif Yönetici'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {admin.status === 'pending' && currentAdminEmail === masterAdminEmail && (
                                                <>
                                                    <button 
                                                        onClick={() => handleApproveAdmin(admin.email)} 
                                                        className="text-green-600 hover:text-green-700 p-2 transition-colors" 
                                                        title="Onayla"
                                                    >
                                                        <CheckCircle size={18} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleRejectAdmin(admin.email)} 
                                                        className="text-red-600 hover:text-red-700 p-2 transition-colors" 
                                                        title="Reddet"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </>
                                            )}
                                            {admin.status === 'active' && (
                                                <>
                                                    <button 
                                                        onClick={() => handle2FASetup(admin.email)} 
                                                        className="text-gray-400 hover:text-blue-600 p-2 transition-colors" 
                                                        title="2FA Kodu Ver"
                                                    >
                                                        <Smartphone size={18} />
                                                    </button>
                                                    {canRemoveAdmin && (
                                                        <button 
                                                            onClick={() => handleRemoveAdmin(admin.email)} 
                                                            className="text-gray-400 hover:text-red-600 p-2 transition-colors" 
                                                            title="Yetkiyi Kaldır"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    )}
                                                    {!canRemoveAdmin && admin.email !== masterAdminEmail && (
                                                        <div className="p-2 text-gray-300" title="Sadece Master Admin kaldırabilir">
                                                            <Trash2 size={18} />
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* 2FA Setup Modal */}
            {show2FASetup && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Smartphone className="text-blue-600" size={32} />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                                    {qrCodeImage ? '2FA Kurulumu' : '2FA Durumu'}
                                </h2>
                                <p className="text-gray-600">
                                    <strong>{selectedAdminEmail}</strong> için Google Authenticator 
                                    {qrCodeImage ? ' kurulumu' : ' mevcut durumu'}
                                </p>
                            </div>

                            <div className="space-y-6">
                                {/* QR Code Alanı - Sadece yeni kurulum için */}
                                {qrCodeImage && (
                                    <div className="bg-gray-50 rounded-xl p-6 text-center">
                                        <div className="w-48 h-48 bg-white border-2 border-gray-200 rounded-xl mx-auto mb-4 flex items-center justify-center overflow-hidden">
                                            <img 
                                                src={qrCodeImage} 
                                                alt="QR Code" 
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                        <p className="text-sm text-gray-600 mb-4">
                                            Google Authenticator uygulamasıyla QR kodu tarayın
                                        </p>
                                        
                                        {/* Manuel Secret */}
                                        <div className="bg-white border border-gray-200 rounded-lg p-3">
                                            <p className="text-xs text-gray-500 mb-1">Manuel giriş için secret:</p>
                                            <div className="flex items-center gap-2">
                                                <code className="flex-1 text-xs font-mono bg-gray-100 px-2 py-1 rounded break-all">
                                                    {generatedSecret}
                                                </code>
                                                <button
                                                    onClick={() => copyToClipboard(generatedSecret)}
                                                    className="p-1 text-gray-500 hover:text-gray-700"
                                                    title="Kopyala"
                                                >
                                                    <Copy size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Mevcut Token */}
                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                    <div className="flex items-start gap-3">
                                        <Smartphone className="text-blue-600 mt-0.5" size={18} />
                                        <div className="text-sm flex-1">
                                            <p className="font-medium text-blue-800 mb-1">Mevcut TOTP Kodu</p>
                                            <p className="text-blue-700 mb-2">
                                                Google Authenticator'da şu anda görünen kod:
                                            </p>
                                            <div className="bg-white rounded p-3 font-mono text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <span className="font-bold text-blue-800 text-xl">{currentToken}</span>
                                                    <button
                                                        onClick={() => copyToClipboard(currentToken)}
                                                        className="p-1 text-blue-600 hover:text-blue-800"
                                                        title="Kopyala"
                                                    >
                                                        <Copy size={16} />
                                                    </button>
                                                </div>
                                                <div className="flex items-center justify-center gap-1 mt-2 text-xs text-blue-600">
                                                    <Clock size={12} />
                                                    <span>{timeRemaining} saniye kaldı</span>
                                                </div>
                                            </div>
                                            <p className="text-xs text-blue-600 mt-2">
                                                Bu kod 30 saniyede bir değişir. Test amaçlı kullanabilirsiniz.
                                            </p>
                                        </div>
                                    </div>
                                </div>



                                {/* Güvenlik Uyarısı */}
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                                    <div className="flex items-start gap-3">
                                        <Shield className="text-amber-600 mt-0.5" size={18} />
                                        <div className="text-sm">
                                            <p className="font-medium text-amber-800 mb-1">Güvenlik Notu</p>
                                            <p className="text-amber-700">
                                                Bu bilgileri güvenli bir şekilde ilgili kişiye iletin. 
                                                2FA kodları 30 saniyede bir değişir ve sadece o anda geçerlidir.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Butonlar */}
                                <div className="space-y-3">
                                    {/* Yeni 2FA Kodu Al butonu - sadece mevcut kurulum varsa göster */}
                                    {!qrCodeImage && (
                                        <button
                                            onClick={() => handle2FASetup(selectedAdminEmail, true)}
                                            className="w-full bg-orange-600 text-white py-3 rounded-xl font-semibold hover:bg-orange-700 transition-colors"
                                        >
                                            🔄 Yeni 2FA Kodu Al
                                        </button>
                                    )}
                                    
                                    <div className="flex gap-3">
                                        <button
                                            onClick={close2FASetup}
                                            className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                                        >
                                            Kapat
                                        </button>
                                        {qrCodeImage && (
                                            <button
                                                onClick={() => {
                                                    const message = `🔐 Google Authenticator Kurulum - ${selectedAdminEmail}\n\n` +
                                                                   `Secret Key: ${generatedSecret}\n\n` +
                                                                   `Kurulum Adımları:\n` +
                                                                   `1. Google Authenticator uygulamasını indirin\n` +
                                                                   `2. QR kodu tarayın veya secret key'i manuel girin\n` +
                                                                   `3. Uygulamada görünen 6 haneli kodu admin paneline girin\n\n` +
                                                                   `Mevcut Kod: ${currentToken}\n` +
                                                                   `(Bu kod 30 saniyede bir değişir)`;
                                                    
                                                    copyToClipboard(message);
                                                }}
                                                className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                                            >
                                                Kurulum Bilgilerini Kopyala
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Admin Register Modal */}
            <AdminRegisterModal 
                isOpen={showAddAdminModal} 
                onClose={() => setShowAddAdminModal(false)} 
            />
        </div>
    );
}
