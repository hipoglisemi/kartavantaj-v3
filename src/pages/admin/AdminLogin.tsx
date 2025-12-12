import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Settings, Smartphone } from 'lucide-react';
import TOTPService from '../../services/totpService';
import SecurityService from '../../services/securityService';

export default function AdminLogin() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [twoFactorCode, setTwoFactorCode] = useState('');
    const [showTwoFactor, setShowTwoFactor] = useState(false);
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

        // Kurulum kontrolü (şifreli)
        const setupComplete = SecurityService.getSecureItem('admin_setup_complete');
        if (setupComplete !== 'true') {
            navigate('/panel/setup');
        } else {
            setIsSetupComplete(true);
        }
        setLoading(false);
    }, [navigate]);

    // 2FA kodu doğrulama (Güvenli TOTP)
    const verifyTwoFactorCode = (token: string) => {
        try {
            const adminEmail = SecurityService.getSecureItem('admin_email');
            return TOTPService.verifyAdminLogin(token, adminEmail || undefined);
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

            const storedUser = SecurityService.getSecureItem('admin_username');
            const storedPass = SecurityService.getSecureItem('admin_password');

            if (!storedUser || !storedPass) {
                SecurityService.logSecurityEvent('LOGIN_SETUP_INCOMPLETE');
                navigate('/panel/setup');
                return;
            }

            // 1. Adım: Kullanıcı adı ve şifre kontrolü
            if (username === storedUser && password === storedPass) {
                SecurityService.clearFailedAttempts('admin_login');
                SecurityService.logSecurityEvent('LOGIN_CREDENTIALS_SUCCESS', { username });
                setShowTwoFactor(true);
            } else {
                SecurityService.recordFailedAttempt('admin_login');
                SecurityService.logSecurityEvent('LOGIN_CREDENTIALS_FAILED', { username, ip: 'client' });
                setErrors({ login: 'Hatalı kullanıcı adı veya şifre!' });
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
                SecurityService.setSecureItem('admin_last_login', new Date().toISOString());
                SecurityService.logSecurityEvent('ADMIN_LOGIN_SUCCESS', { username });
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

    const handleGoToSetup = () => {
        navigate('/panel/setup');
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
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
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
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
                <div className="flex flex-col items-center mb-8">
                    <div className="bg-red-100 p-3 rounded-full mb-3">
                        <Lock className="text-red-600" size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Yönetici Girişi</h2>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Kullanıcı Adı</label>
                        <input
                            type="text"
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none ${
                                errors.login ? 'border-red-300 bg-red-50' : 'border-gray-300'
                            }`}
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="admin"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Şifre</label>
                        <input
                            type="password"
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none ${
                                errors.login ? 'border-red-300 bg-red-50' : 'border-gray-300'
                            }`}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="1234"
                        />
                    </div>

                    {errors.login && <p className="text-red-500 text-sm">{errors.login}</p>}

                    <button
                        type="submit"
                        className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
                    >
                        Devam Et
                    </button>
                </form>

                <div className="mt-6 text-center space-y-2">
                    <button
                        onClick={handleGoToSetup}
                        className="flex items-center justify-center gap-2 w-full text-sm text-gray-500 hover:text-gray-800 py-2"
                    >
                        <Settings size={16} />
                        Kurulum Ayarları
                    </button>
                    <a href="/" className="block text-sm text-gray-500 hover:text-gray-800">Ana Sayfaya Dön</a>
                </div>
            </div>
        </div>
    );
}
