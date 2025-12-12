import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Shield, Lock, User, CheckCircle, AlertTriangle, Smartphone, QrCode, Copy } from 'lucide-react';
import TOTPService from '../../services/totpService';

export default function AdminSetup() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: '',
        email: '',
        siteName: 'KartAvantaj',
        googleEmails: [] as string[]
    });
    const [newGoogleEmail, setNewGoogleEmail] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSetupComplete, setIsSetupComplete] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');
    const [showTotpSetup, setShowTotpSetup] = useState(false);
    const [showCodeInput, setShowCodeInput] = useState(false);
    const [totpSecret, setTotpSecret] = useState('');

    useEffect(() => {
        // Güvenlik logu - setup sayfasına erişim
        const accessLog = {
            timestamp: new Date().toISOString(),
            ip: 'client-side', // Gerçek projede IP alınabilir
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        const logs = JSON.parse(localStorage.getItem('setup_access_logs') || '[]');
        logs.push(accessLog);
        // Son 50 log'u tut
        if (logs.length > 50) logs.splice(0, logs.length - 50);
        localStorage.setItem('setup_access_logs', JSON.stringify(logs));

        // URL'den reset parametresini kontrol et
        const resetParam = searchParams.get('reset');
        if (resetParam === 'true') {
            setShowTotpSetup(true);
            generateTotpSecret();
            return;
        }

        // Eğer zaten giriş yapmışsa dashboard'a yönlendir
        const isAdmin = localStorage.getItem('isAdmin');
        if (isAdmin === 'true') {
            navigate('/panel/dashboard');
            return;
        }

        // Eğer admin zaten kurulmuşsa, yetkisiz erişimi engelle
        const hasAdmin = localStorage.getItem('admin_setup_complete');
        if (hasAdmin === 'true') {
            setIsSetupComplete(true);
        }
    }, [navigate, searchParams]);

    const validateStep1 = () => {
        const newErrors: Record<string, string> = {};
        
        if (!formData.username || formData.username.length < 3) {
            newErrors.username = 'Kullanıcı adı en az 3 karakter olmalıdır';
        }
        
        if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Geçerli bir e-posta adresi girin';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateStep2 = () => {
        const newErrors: Record<string, string> = {};
        
        if (!formData.password || formData.password.length < 6) {
            newErrors.password = 'Şifre en az 6 karakter olmalıdır';
        }
        
        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Şifreler eşleşmiyor';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (step === 1 && validateStep1()) {
            setStep(2);
        } else if (step === 2 && validateStep2()) {
            setStep(3);
        }
    };

    const handleComplete = () => {
        // Admin bilgilerini kaydet
        localStorage.setItem('admin_username', formData.username);
        localStorage.setItem('admin_password', formData.password);
        localStorage.setItem('admin_email', formData.email);
        localStorage.setItem('admin_setup_complete', 'true');
        localStorage.setItem('admin_setup_date', new Date().toISOString());
        
        // Site ayarlarını kaydet
        const siteSettings = {
            siteName: formData.siteName,
            adminEmail: formData.email,
            setupDate: new Date().toISOString()
        };
        localStorage.setItem('site_settings', JSON.stringify(siteSettings));

        // Google email'leri kaydet
        if (formData.googleEmails.length > 0) {
            localStorage.setItem('admin_google_emails', JSON.stringify(formData.googleEmails));
        }

        // TOTP secret oluştur ve kaydet
        generateTotpSecret();

        setStep(4);
    };

    const handleGoToLogin = () => {
        navigate('/panel/login');
    };

    // Basit test kodu sistemi (geliştirme amaçlı)
    const generateSecret = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        let secret = '';
        for (let i = 0; i < 32; i++) {
            secret += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return secret;
    };

    const generateTotpSecret = () => {
        // Gerçek TOTP secret oluştur
        const secret = TOTPService.generateSecret();
        
        setTotpSecret(secret);
        
        // Master admin TOTP secret'ı kaydet
        localStorage.setItem('admin_totp_secret', secret);
        
        console.log(`Master TOTP secret oluşturuldu: ${secret}`);
    };

    // Test amaçlı sabit kod oluşturma
    const generateTestCode = () => {
        const adminEmail = localStorage.getItem('admin_email') || '';
        const setupDate = localStorage.getItem('admin_setup_date') || '';
        
        // Email ve tarihten 6 haneli kod oluştur
        const combined = adminEmail + setupDate;
        let hash = 0;
        for (let i = 0; i < combined.length; i++) {
            const char = combined.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 32bit integer'a çevir
        }
        
        // 6 haneli pozitif sayı yap
        const code = Math.abs(hash).toString().padStart(6, '0').slice(0, 6);
        return code;
    };

    // Test kodu doğrulama
    const verifyTotpCode = (token: string) => {
        // Test kodu kontrolü
        const testCode = localStorage.getItem('admin_test_code');
        if (testCode && token === testCode) {
            return true;
        }
        
        // Geliştirme amaçlı master kod
        if (token === '123456') {
            return true;
        }
        
        return false;
    };

    const handleTotpVerification = () => {
        if (!verificationCode || verificationCode.length !== 6) {
            setErrors({ verificationCode: '6 haneli doğrulama kodu gerekli' });
            return;
        }

        // Gerçek TOTP doğrulaması
        if (!TOTPService.verifyMasterToken(verificationCode)) {
            setErrors({ verificationCode: 'Geçersiz doğrulama kodu' });
            return;
        }

        // Kod doğru, kurulumu sıfırla
        handleResetSetup();
    };

    const copyToClipboard = (text: string) => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text);
            alert('Panoya kopyalandı!');
        } else {
            // Fallback
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            alert('Panoya kopyalandı!');
        }
    };

    const handleResetSetup = () => {
        localStorage.removeItem('admin_setup_complete');
        localStorage.removeItem('admin_username');
        localStorage.removeItem('admin_password');
        localStorage.removeItem('admin_email');
        localStorage.removeItem('admin_setup_date');
        localStorage.removeItem('site_settings');
        localStorage.removeItem('isAdmin');
        
        setIsSetupComplete(false);
        setShowTotpSetup(false);
        setShowCodeInput(false);
        setStep(1);
        setFormData({
            username: '',
            password: '',
            confirmPassword: '',
            email: '',
            siteName: 'KartAvantaj',
            googleEmails: []
        });
        setNewGoogleEmail('');
        setErrors({});
        setVerificationCode('');
        setTotpSecret('');
    };

    const handleShowResetInfo = () => {
        const resetUrl = `${window.location.origin}/panel/setup?reset=true`;
        
        alert(`Reset Bilgileri:\n\nReset URL: ${resetUrl}\n\nKurulumu sıfırlamak için bu URL'yi kullanın ve Google Authenticator kodunuzu girin.\n\nBu bilgiyi güvenli bir yerde saklayın!`);
    };

    const addGoogleEmail = () => {
        if (newGoogleEmail && /\S+@\S+\.\S+/.test(newGoogleEmail)) {
            if (!formData.googleEmails.includes(newGoogleEmail)) {
                setFormData({
                    ...formData,
                    googleEmails: [...formData.googleEmails, newGoogleEmail]
                });
                setNewGoogleEmail('');
            } else {
                alert('Bu email zaten ekli.');
            }
        } else {
            alert('Geçerli bir email adresi girin.');
        }
    };

    const removeGoogleEmail = (email: string) => {
        setFormData({
            ...formData,
            googleEmails: formData.googleEmails.filter(e => e !== email)
        });
    };

    // TOTP Setup ekranı
    if (showTotpSetup) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-lg">
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Smartphone className="text-blue-600" size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">2FA Doğrulama</h2>
                        <p className="text-gray-600">Google Authenticator ile kurulumu sıfırlayın</p>
                    </div>

                    <div className="space-y-6">
                        {/* QR Code Alanı */}
                        <div className="bg-gray-50 rounded-xl p-6 text-center">
                            <div className="w-48 h-48 bg-white border-2 border-gray-200 rounded-xl mx-auto mb-4 flex items-center justify-center">
                                <QrCode size={64} className="text-gray-400" />
                                <div className="absolute text-xs text-gray-500 mt-20">QR Code</div>
                            </div>
                            <p className="text-sm text-gray-600 mb-4">
                                Google Authenticator uygulamasıyla QR kodu tarayın
                            </p>
                            
                            {/* Manuel Secret */}
                            <div className="bg-white border border-gray-200 rounded-lg p-3">
                                <p className="text-xs text-gray-500 mb-1">Manuel giriş için secret:</p>
                                <div className="flex items-center gap-2">
                                    <code className="flex-1 text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                                        {totpSecret}
                                    </code>
                                    <button
                                        onClick={() => copyToClipboard(totpSecret)}
                                        className="p-1 text-gray-500 hover:text-gray-700"
                                        title="Kopyala"
                                    >
                                        <Copy size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="text-blue-600 mt-0.5" size={18} />
                                <div className="text-sm">
                                    <p className="font-medium text-blue-800 mb-1">Test Modu</p>
                                    <p className="text-blue-700 mb-2">
                                        Geliştirme aşamasında test kodları kullanılıyor.
                                    </p>
                                    <div className="bg-white rounded p-2 font-mono text-center">
                                        <p className="text-xs text-gray-600">Test Kodu:</p>
                                        <p className="font-bold text-blue-800">123456</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="text-amber-600 mt-0.5" size={18} />
                                <div className="text-sm">
                                    <p className="font-medium text-amber-800 mb-1">Uyarı</p>
                                    <p className="text-amber-700">
                                        Bu işlem tüm admin ayarlarını siler ve geri alınamaz.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowTotpSetup(false);
                                    navigate('/panel');
                                }}
                                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                            >
                                İptal
                            </button>
                            <button
                                onClick={() => {
                                    setShowTotpSetup(false);
                                    setShowCodeInput(true);
                                }}
                                className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                            >
                                Devam Et
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // TOTP Code Input ekranı
    if (showCodeInput) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Smartphone className="text-green-600" size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Doğrulama Kodu</h2>
                        <p className="text-gray-600">Google Authenticator'dan 6 haneli kodu girin</p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Doğrulama Kodu</label>
                            <input
                                type="text"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all font-mono text-center text-2xl tracking-widest ${
                                    errors.verificationCode ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                }`}
                                placeholder="000000"
                                maxLength={6}
                            />
                            {errors.verificationCode && <p className="text-red-500 text-sm mt-1">{errors.verificationCode}</p>}
                        </div>

                        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="text-red-600 mt-0.5" size={18} />
                                <div className="text-sm">
                                    <p className="font-medium text-red-800 mb-1">Son Uyarı</p>
                                    <p className="text-red-700">Bu işlem tüm admin ayarlarını kalıcı olarak siler.</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowCodeInput(false);
                                    setShowTotpSetup(true);
                                }}
                                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                            >
                                Geri
                            </button>
                            <button
                                onClick={handleTotpVerification}
                                disabled={verificationCode.length !== 6}
                                className="flex-1 bg-red-600 text-white py-3 rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Kurulumu Sıfırla
                            </button>
                        </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-100">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                            <p className="text-xs text-blue-700 text-center mb-1">
                                <strong>Test Modu:</strong> Aşağıdaki kodu kullanabilirsiniz
                            </p>
                            <p className="text-center font-mono font-bold text-blue-800">123456</p>
                        </div>
                        <p className="text-xs text-gray-500 text-center">Gerçek projede Google Authenticator kodu kullanılır</p>
                    </div>
                </div>
            </div>
        );
    }

    if (isSetupComplete) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
                    <div className="mb-6">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="text-green-600" size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Kurulum Tamamlandı</h2>
                        <p className="text-gray-600">Admin paneli zaten kurulmuş durumda.</p>
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={handleGoToLogin}
                            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                        >
                            Admin Paneline Git
                        </button>
                        
                        <button
                            onClick={handleShowResetInfo}
                            className="w-full bg-amber-50 text-amber-700 py-3 rounded-xl font-semibold hover:bg-amber-100 transition-colors border border-amber-200"
                        >
                            Reset Bilgilerini Göster
                        </button>
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-100">
                        <a href="/" className="text-sm text-gray-500 hover:text-gray-700">Ana Sayfaya Dön</a>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-lg">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Shield className="text-blue-600" size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Admin Paneli Kurulumu</h1>
                    <p className="text-gray-600">Yönetici hesabınızı oluşturun</p>
                </div>

                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600">Adım {step}/3</span>
                        <span className="text-sm text-gray-500">{Math.round((step / 3) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(step / 3) * 100}%` }}
                        ></div>
                    </div>
                </div>

                {/* Step 1: Kullanıcı Bilgileri */}
                {step === 1 && (
                    <div className="space-y-6">
                        <div className="text-center mb-6">
                            <User className="text-blue-600 mx-auto mb-2" size={24} />
                            <h3 className="text-lg font-semibold text-gray-800">Kullanıcı Bilgileri</h3>
                            <p className="text-sm text-gray-600">Admin hesabınızın temel bilgilerini girin</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Kullanıcı Adı</label>
                            <input
                                type="text"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all ${
                                    errors.username ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                }`}
                                placeholder="admin"
                            />
                            {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">E-posta Adresi</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all ${
                                    errors.email ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                }`}
                                placeholder="admin@kartavantaj.com"
                            />
                            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Site Adı</label>
                            <input
                                type="text"
                                value={formData.siteName}
                                onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                placeholder="KartAvantaj"
                            />
                        </div>

                        {/* Google Auth Email'leri */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Google Auth Email'leri (Opsiyonel)
                            </label>
                            <div className="space-y-2">
                                <div className="flex gap-2">
                                    <input
                                        type="email"
                                        value={newGoogleEmail}
                                        onChange={(e) => setNewGoogleEmail(e.target.value)}
                                        className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="admin@gmail.com"
                                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addGoogleEmail())}
                                    />
                                    <button
                                        type="button"
                                        onClick={addGoogleEmail}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        Ekle
                                    </button>
                                </div>
                                
                                {formData.googleEmails.length > 0 && (
                                    <div className="space-y-1">
                                        {formData.googleEmails.map((email, index) => (
                                            <div key={index} className="flex items-center justify-between bg-blue-50 px-3 py-2 rounded-lg">
                                                <span className="text-sm text-blue-800">{email}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => removeGoogleEmail(email)}
                                                    className="text-red-500 hover:text-red-700 text-sm"
                                                >
                                                    Kaldır
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
                                    <p className="text-xs text-blue-700 mb-1">
                                        <strong>Google Auth Bilgileri:</strong>
                                    </p>
                                    <ul className="text-xs text-blue-600 space-y-1">
                                        <li>• Bu email'ler Google ile admin paneline giriş yapabilir</li>
                                        <li>• Supabase'de Google OAuth yapılandırması gereklidir</li>
                                        <li>• Yetkisiz email'ler otomatik olarak reddedilir</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleNext}
                            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                        >
                            Devam Et
                        </button>
                    </div>
                )}

                {/* Step 2: Şifre Belirleme */}
                {step === 2 && (
                    <div className="space-y-6">
                        <div className="text-center mb-6">
                            <Lock className="text-blue-600 mx-auto mb-2" size={24} />
                            <h3 className="text-lg font-semibold text-gray-800">Güvenlik Ayarları</h3>
                            <p className="text-sm text-gray-600">Güçlü bir şifre belirleyin</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Şifre</label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all ${
                                    errors.password ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                }`}
                                placeholder="En az 6 karakter"
                            />
                            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Şifre Tekrarı</label>
                            <input
                                type="password"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all ${
                                    errors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                }`}
                                placeholder="Şifrenizi tekrar girin"
                            />
                            {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
                        </div>

                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="text-amber-600 mt-0.5" size={18} />
                                <div className="text-sm">
                                    <p className="font-medium text-amber-800 mb-1">Güvenlik Önerisi</p>
                                    <p className="text-amber-700">Şifrenizi güvenli bir yerde saklayın. Bu bilgileri kaybetmeniz durumunda admin paneline erişiminizi kaybedebilirsiniz.</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setStep(1)}
                                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                            >
                                Geri
                            </button>
                            <button
                                onClick={handleNext}
                                className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                            >
                                Devam Et
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Onay */}
                {step === 3 && (
                    <div className="space-y-6">
                        <div className="text-center mb-6">
                            <CheckCircle className="text-green-600 mx-auto mb-2" size={24} />
                            <h3 className="text-lg font-semibold text-gray-800">Kurulumu Tamamla</h3>
                            <p className="text-sm text-gray-600">Bilgilerinizi kontrol edin</p>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                            <div className="flex justify-between">
                                <span className="text-sm font-medium text-gray-600">Kullanıcı Adı:</span>
                                <span className="text-sm text-gray-800">{formData.username}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm font-medium text-gray-600">E-posta:</span>
                                <span className="text-sm text-gray-800">{formData.email}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm font-medium text-gray-600">Site Adı:</span>
                                <span className="text-sm text-gray-800">{formData.siteName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm font-medium text-gray-600">Şifre:</span>
                                <span className="text-sm text-gray-800">{'•'.repeat(formData.password.length)}</span>
                            </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                            <div className="flex items-start gap-3">
                                <CheckCircle className="text-blue-600 mt-0.5" size={18} />
                                <div className="text-sm">
                                    <p className="font-medium text-blue-800 mb-1">Kurulum Hazır</p>
                                    <p className="text-blue-700">Admin hesabınız oluşturulacak ve panele erişim sağlanacak.</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setStep(2)}
                                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                            >
                                Geri
                            </button>
                            <button
                                onClick={handleComplete}
                                className="flex-1 bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors"
                            >
                                Kurulumu Tamamla
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 4: Başarılı + TOTP Setup */}
                {step === 4 && (
                    <div className="space-y-6">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="text-green-600" size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">Kurulum Tamamlandı!</h3>
                            <p className="text-gray-600">Admin hesabınız oluşturuldu. Şimdi 2FA'yı kurun.</p>
                        </div>

                        {/* TOTP Setup */}
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                            <div className="text-center mb-4">
                                <Smartphone className="text-blue-600 mx-auto mb-2" size={24} />
                                <h4 className="font-semibold text-blue-800">Google Authenticator Kurulumu</h4>
                                <p className="text-sm text-blue-700">Güvenlik için 2FA'yı kurun (opsiyonel)</p>
                            </div>

                            <div className="bg-white rounded-lg p-4 mb-4">
                                <div className="w-32 h-32 bg-gray-100 border-2 border-gray-200 rounded-lg mx-auto mb-3 flex items-center justify-center">
                                    <QrCode size={48} className="text-gray-400" />
                                </div>
                                
                                <div className="text-center">
                                    <p className="text-xs text-gray-600 mb-2">Manuel giriş için secret:</p>
                                    <div className="flex items-center gap-2">
                                        <code className="flex-1 text-xs font-mono bg-gray-100 px-2 py-1 rounded text-center">
                                            {totpSecret}
                                        </code>
                                        <button
                                            onClick={() => copyToClipboard(totpSecret)}
                                            className="p-1 text-gray-500 hover:text-gray-700"
                                            title="Kopyala"
                                        >
                                            <Copy size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                                <p className="text-xs text-blue-700 mb-2">
                                    <strong>Test Modu:</strong> Kurulum sıfırlama için test kodu
                                </p>
                                <div className="bg-white rounded p-2 text-center">
                                    <p className="font-mono font-bold text-blue-800">123456</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                            <p className="text-sm text-green-700 text-center">
                                Artık <strong>{formData.username}</strong> kullanıcı adı ile admin paneline giriş yapabilirsiniz.
                            </p>
                        </div>

                        <button
                            onClick={handleGoToLogin}
                            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                        >
                            Admin Paneline Git
                        </button>
                    </div>
                )}

                {/* Footer */}
                <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                    <a href="/" className="text-sm text-gray-500 hover:text-gray-700">Ana Sayfaya Dön</a>
                </div>
            </div>
        </div>
    );
}