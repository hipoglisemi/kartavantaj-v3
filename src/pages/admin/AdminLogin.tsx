import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Smartphone, UserPlus } from 'lucide-react';
import TOTPService from '../../services/totpService';
import SecurityService from '../../services/securityService';
import AdminRegisterModal from '../../components/AdminRegisterModal';
import OwlMascot from '../../components/OwlMascot';
import { settingsService } from '../../services/settingsService';

export default function AdminLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [twoFactorCode, setTwoFactorCode] = useState('');
    const [showTwoFactor, setShowTwoFactor] = useState(false);
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [isSetupComplete, setIsSetupComplete] = useState(false);
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const navigate = useNavigate();

    useEffect(() => {
        // Güvenli session kontrolü
        if (SecurityService.isValidAdminSession()) {
            navigate('/panel/dashboard');
            return;
        }

        // Direkt giriş ekranını göster
        setIsSetupComplete(true);
        setLoading(false);
    }, [navigate]);

    // Admin credentials al
    const getAdminCredentials = (email: string): { email: string; password: string } | null => {
        try {
            const credentials = SecurityService.getSecureItem(`admin_cred_${email}`);
            return credentials ? JSON.parse(credentials) : null;
        } catch {
            return null;
        }
    };

    // Admin status kontrolü
    const checkAdminStatus = (email: string): 'active' | 'pending' | 'not_found' => {
        const settings = settingsService.getLocalSettings();
        const admin = settings.admins.find(admin => 
            typeof admin === 'string' ? admin === email : admin.email === email
        );
        
        if (!admin) return 'not_found';
        if (typeof admin === 'string') return 'active'; // Eski format, aktif kabul et
        
        // Rejected adminleri not_found olarak döndür
        if (admin.status === 'rejected') return 'not_found';
        return admin.status;
    };

    // 2FA kodu doğrulama (Güvenli TOTP)
    const verifyTwoFactorCode = (token: string) => {
        try {
            return TOTPService.verifyAdminLogin(token, email || undefined);
        } catch {
            SecurityService.logSecurityEvent('TOTP_VERIFICATION_ERROR');
            return false;
        }
    };

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        try {
            // Brute force koruması
            if (!SecurityService.checkBruteForce('admin_login')) {
                setErrors({ login: 'Çok fazla başarısız deneme. 15 dakika sonra tekrar deneyin.' });
                SecurityService.logSecurityEvent('LOGIN_BRUTE_FORCE_BLOCKED');
                return;
            }

            // Admin status kontrolü
            const adminStatus = checkAdminStatus(email);
            
            if (adminStatus === 'not_found') {
                SecurityService.recordFailedAttempt('admin_login');
                SecurityService.logSecurityEvent('LOGIN_EMAIL_NOT_FOUND', { email });
                setErrors({ login: 'Bu email adresi admin listesinde bulunamadı!' });
                return;
            }
            
            if (adminStatus === 'pending') {
                SecurityService.logSecurityEvent('LOGIN_PENDING_ADMIN', { email });
                setErrors({ login: 'Hesabınız henüz onaylanmamış. Master admin onayını bekleyin.' });
                return;
            }

            // Admin credentials kontrol et
            const adminCredentials = getAdminCredentials(email);

            if (!adminCredentials) {
                SecurityService.recordFailedAttempt('admin_login');
                SecurityService.logSecurityEvent('LOGIN_CREDENTIALS_NOT_FOUND', { email });
                setErrors({ login: 'Giriş bilgileri bulunamadı. Lütfen yeniden kayıt olun.' });
                return;
            }

            // Şifre kontrolü
            if (password === adminCredentials.password) {
                SecurityService.clearFailedAttempts('admin_login');
                SecurityService.logSecurityEvent('LOGIN_CREDENTIALS_SUCCESS', { email });
                setShowTwoFactor(true);
            } else {
                SecurityService.recordFailedAttempt('admin_login');
                SecurityService.logSecurityEvent('LOGIN_CREDENTIALS_FAILED', { email });
                setErrors({ login: 'Hatalı email veya şifre!' });
            }
        } catch {
            setErrors({ login: 'Giriş işlemi başarısız oldu.' });
        }
    };

    const handleTwoFactorLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        if (!twoFactorCode || twoFactorCode.length !== 6) {
            setErrors({ twoFactor: '6 haneli doğrulama kodu gerekli' });
            return;
        }

        try {
            // 2. Adım: 2FA kodu kontrolü
            if (verifyTwoFactorCode(twoFactorCode)) {
                // Güvenli session oluştur
                SecurityService.createAdminSession();
                localStorage.setItem('isAdmin', 'true');
                SecurityService.setSecureItem('admin_email', email);
                SecurityService.setSecureItem('admin_last_login', new Date().toISOString());
                SecurityService.logSecurityEvent('ADMIN_LOGIN_SUCCESS', { email });
                navigate('/panel/dashboard');
            } else {
                setErrors({ twoFactor: 'Geçersiz doğrulama kodu' });
            }
        } catch {
            setErrors({ twoFactor: 'Doğrulama işlemi başarısız oldu.' });
        }
    };

    const handleBackToLogin = () => {
        setShowTwoFactor(false);
        setTwoFactorCode('');
        setErrors({});
    };



    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Yükleniyor...</p>
                </div>
            </div>
        );
    }

    if (!isSetupComplete) {
        return null; // Navigate will handle redirect
    }

    // 2FA Ekranı
    if (showTwoFactor) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center relative overflow-hidden">
                {/* Arka Plan Maskotları */}
                <div className="absolute inset-0 pointer-events-none">
                    <OwlMascot size={280} opacity={0.04} className="absolute top-16 right-16" />
                    <OwlMascot size={220} opacity={0.03} className="absolute bottom-24 left-24" />
                </div>
                
                <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md relative z-10">
                    <div className="flex flex-col items-center mb-8">
                        <div className="bg-blue-100 p-3 rounded-full mb-3">
                            <Smartphone className="text-blue-600" size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">2FA Doğrulama</h2>
                        <p className="text-gray-600 text-center mt-2">Google Authenticator'dan 6 haneli kodu girin</p>
                    </div>

                    <form onSubmit={handleTwoFactorLogin} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Doğrulama Kodu</label>
                            <input
                                type="text"
                                value={twoFactorCode}
                                onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono text-center text-2xl tracking-widest ${
                                    errors.twoFactor ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                }`}
                                placeholder="000000"
                                maxLength={6}
                                autoFocus
                            />
                            {errors.twoFactor && <p className="text-red-500 text-sm mt-1">{errors.twoFactor}</p>}
                        </div>

                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <p className="text-xs text-green-700 text-center mb-1">
                                <strong>Google Authenticator:</strong> Uygulamadan 6 haneli kodu girin
                            </p>
                            <p className="text-xs text-green-600 text-center">
                                Kod 30 saniyede bir değişir
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={handleBackToLogin}
                                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                            >
                                Geri
                            </button>
                            <button
                                type="submit"
                                disabled={twoFactorCode.length !== 6}
                                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Giriş Yap
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    // Ana Giriş Ekranı
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center relative overflow-hidden">
            {/* Arka Plan Maskotları */}
            <div className="absolute inset-0 pointer-events-none">
                <OwlMascot size={300} opacity={0.05} className="absolute top-10 left-10" />
                <OwlMascot size={250} opacity={0.03} className="absolute bottom-20 right-20" />
                <OwlMascot size={200} opacity={0.04} className="absolute top-1/2 left-1/4 transform -translate-y-1/2" />
                <OwlMascot size={180} opacity={0.03} className="absolute bottom-10 left-1/3" />
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md relative z-10">
                <div className="flex flex-col items-center mb-8">
                    <div className="bg-blue-100 p-3 rounded-full mb-3">
                        <Lock className="text-blue-600" size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Admin Panel</h2>
                    <p className="text-gray-600 text-sm mt-1">Yönetici girişi yapın</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Adresi</label>
                        <input
                            type="email"
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all ${
                                errors.login ? 'border-red-300 bg-red-50' : 'border-gray-300'
                            }`}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@kartavantaj.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Şifre</label>
                        <input
                            type="password"
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all ${
                                errors.login ? 'border-red-300 bg-red-50' : 'border-gray-300'
                            }`}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {errors.login && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-red-700 text-sm">{errors.login}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg"
                    >
                        Giriş Yap
                    </button>
                </form>

                <div className="mt-6 text-center space-y-3">
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">veya</span>
                        </div>
                    </div>
                    
                    <button
                        onClick={() => setShowRegisterModal(true)}
                        className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                    >
                        <UserPlus size={18} />
                        Yeni Kayıt
                    </button>
                    
                    <a href="/" className="block text-sm text-gray-500 hover:text-gray-800 mt-4">Ana Sayfaya Dön</a>
                </div>
            </div>

            {/* Admin Register Modal */}
            <AdminRegisterModal 
                isOpen={showRegisterModal}
                onClose={() => setShowRegisterModal(false)}
            />
        </div>
    );
}
