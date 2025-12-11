import { useState, useEffect } from 'react';
import { Search, User, Shield, Mail, Calendar, Trash2, UserPlus, CheckCircle, Lock } from 'lucide-react';

import { useConfirmation } from '../../context/ConfirmationContext';
import { useToast } from '../../context/ToastContext';
import { settingsService } from '../../services/settingsService';

export default function AdminMembers() {
    const { confirm } = useConfirmation();
    const { success, error, info } = useToast();
    const settings = settingsService.useSettings();

    const [activeTab, setActiveTab] = useState<'members' | 'team'>('members');
    const [searchTerm, setSearchTerm] = useState('');

    // --- Team/Admin Logic ---
    const [newAdminEmail, setNewAdminEmail] = useState('');

    // --- Credential Update Logic ---
    const [credentialUser, setCredentialUser] = useState('');
    const [credentialCurrentPass, setCredentialCurrentPass] = useState('');
    const [credentialNewPass, setCredentialNewPass] = useState('');

    // Member Management State
    const [isAddingMember, setIsAddingMember] = useState(false);
    const [newMember, setNewMember] = useState({ name: '', email: '', role: 'User', status: 'Active' });

    useEffect(() => {
        // Load current admin username for display
        setCredentialUser(localStorage.getItem('admin_username') || 'admin');
    }, []);

    const handleUpdateCredentials = async (e: React.FormEvent) => {
        e.preventDefault();
        const storedPass = localStorage.getItem('admin_password') || '1234';

        if (credentialCurrentPass !== storedPass) {
            error("Hata: Mevcut şifre yanlış girildi.");
            return;
        }

        if (credentialNewPass.length < 4) {
            error("Hata: Yeni şifre en az 4 karakter olmalıdır.");
            return;
        }

        localStorage.setItem('admin_username', credentialUser);
        localStorage.setItem('admin_password', credentialNewPass);

        success("Giriş bilgileri güncellendi! Bir sonraki girişte yeni şifrenizi kullanın.");
        setCredentialCurrentPass('');
        setCredentialNewPass('');
    };

    const saveSettings = (newSettings: any) => {
        settingsService.saveDraftSettings(newSettings);
        // Auto publish for seamless cloud experience
        settingsService.publishSettings().then(ok => {
            if (ok) success("Değişiklikler buluta kaydedildi.");
            else error("Kaydedilirken hata oluştu.");
        });
    };

    const handleAddAdmin = (e: React.FormEvent) => {
        e.preventDefault();
        if (newAdminEmail && !settings.admins.includes(newAdminEmail)) {
            const updated = { ...settings, admins: [...settings.admins, newAdminEmail] };
            saveSettings(updated);
            setNewAdminEmail('');
        } else if (settings.admins.includes(newAdminEmail)) {
            info("Bu e-posta zaten yönetici listesinde.");
        }
    };

    const handleRemoveAdmin = async (email: string) => {
        if (await confirm({
            title: 'Yöneticiyi Kaldır',
            message: `${email} yetkilerini almak istediğinize emin misiniz?`,
            type: 'warning'
        })) {
            const updated = { ...settings, admins: settings.admins.filter(a => a !== email) };
            saveSettings(updated);
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left Column: Actions */}
                    <div className="md:col-span-1 space-y-6">
                        {/* --- UPDATE CREDENTIALS --- */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <Lock size={18} className="text-gray-500" />
                                Giriş Bilgilerini Güncelle
                            </h2>
                            <form onSubmit={handleUpdateCredentials}>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Kullanıcı Adı</label>
                                        <input type="text" required value={credentialUser} onChange={e => setCredentialUser(e.target.value)} className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Mevcut Şifre</label>
                                        <input type="password" required value={credentialCurrentPass} onChange={e => setCredentialCurrentPass(e.target.value)} className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none" placeholder="Güvenlik için gerekli" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Yeni Şifre</label>
                                        <input type="password" required value={credentialNewPass} onChange={e => setCredentialNewPass(e.target.value)} className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none" placeholder="Yeni şifreniz" />
                                    </div>
                                    <button type="submit" className="w-full bg-gray-800 text-white py-2.5 rounded-lg text-sm font-bold hover:bg-gray-900 transition-colors">Bilgileri Güncelle</button>
                                </div>
                            </form>
                        </div>

                        {/* --- ADD ADMIN --- */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <UserPlus size={18} className="text-gray-500" />
                                Yeni Yönetici Ekle
                            </h2>
                            <form onSubmit={handleAddAdmin}>
                                <div className="mb-4">
                                    <label className="block text-xs font-bold text-gray-500 mb-1">E-posta Adresi</label>
                                    <input type="email" required value={newAdminEmail} onChange={e => setNewAdminEmail(e.target.value)} className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none" placeholder="ornek@admin.com" />
                                </div>
                                <button type="submit" className="w-full bg-purple-600 text-white py-2.5 rounded-lg text-sm font-bold hover:bg-purple-700 transition-colors">Davet Et</button>
                            </form>
                            <div className="mt-4 bg-blue-50 text-blue-700 p-3 rounded-lg text-xs leading-relaxed">
                                <span className="font-bold block mb-1">Bilgi:</span>
                                Eklenen kişiler, admin paneline erişim yetkisine sahip olur. (Şu an için sadece listede görünürler).
                            </div>
                        </div>
                    </div>

                    {/* --- ADMIN LIST --- */}
                    <div className="md:col-span-2">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                                <h2 className="font-bold text-gray-800 flex items-center gap-2">
                                    <Shield size={18} className="text-gray-500" />
                                    Yetkili Listesi
                                </h2>
                                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-bold">{settings.admins.length} Kişi</span>
                            </div>

                            <div className="divide-y divide-gray-50">
                                {settings.admins.map((email) => (
                                    <div key={email} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold text-lg">
                                                {email.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-800">{email}</p>
                                                <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
                                                    <CheckCircle size={12} />
                                                    Aktif Yönetici
                                                </div>
                                            </div>
                                        </div>
                                        <button onClick={() => handleRemoveAdmin(email)} className="text-gray-400 hover:text-red-600 p-2 transition-colors" title="Yetkiyi Kaldır">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
