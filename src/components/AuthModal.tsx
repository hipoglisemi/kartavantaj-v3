import { useState } from 'react';
import { X, Mail, Lock, ArrowLeft } from 'lucide-react';
import { authService } from '../services/authService';
import { useConfirmation } from '../context/ConfirmationContext';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialTab?: 'login' | 'register';
    initialResetMode?: boolean;
}

export default function AuthModal({ isOpen, onClose, initialTab = 'login', initialResetMode = false }: AuthModalProps) {
    const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialTab);
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const { alert } = useConfirmation();

    // Form States
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    // OTP states removed

    // If initialResetMode is true, we start in reset mode (Step 3: New Password)
    const [resetPasswordMode, setResetPasswordMode] = useState(initialResetMode);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [showResendEmail, setShowResendEmail] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);

    const resetState = () => {
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setError(null);
        setSuccessMessage(null);
        setIsForgotPassword(false);
        setResetPasswordMode(false);
        setLoading(false);
        setShowResendEmail(false);
        setResendLoading(false);
    };

    const handleClose = () => {
        resetState();
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            // --- NEW PASSWORD SETTING (Final Step of Reset) ---
            if (resetPasswordMode) {
                if (password !== confirmPassword) throw new Error("Şifreler eşleşmiyor.");
                await authService.updatePassword(password);
                await alert("Şifreniz başarıyla güncellendi! Artık yeni şifrenizle giriş yapabilirsiniz.", "Başarılı");
                handleClose();
                return;
            }

            // --- FORGOT PASSWORD FLOW (Link Sending) ---
            if (isForgotPassword) {
                await authService.resetPasswordForEmail(email);
                setSuccessMessage(`Şifre sıfırlama bağlantısı ${email} adresine gönderildi. Lütfen e-postanızı kontrol edin.`);
                // We keep the modal open so they see the message.
                // Optionally we can close it after a delay.
                setLoading(false);
                return;
            }

            // --- EMAIL REGISTER/LOGIN FLOW ---
            if (activeTab === 'register') {
                if (password !== confirmPassword) {
                    throw new Error("Şifreler eşleşmiyor.");
                }
                const result = await authService.signUp(email, password);
                
                if (result.user && !result.user.email_confirmed_at) {
                    setSuccessMessage(`Üyelik başarılı! ${email} adresine onay e-postası gönderildi. Lütfen e-postanızı kontrol edin ve onay linkine tıklayın.`);
                    setShowResendEmail(true);
                } else {
                    setSuccessMessage("Üyelik başarılı! Giriş yapabilirsiniz.");
                    handleClose();
                }
            } else {
                await authService.signIn(email, password);
                
                // Email onayı kontrolü
                const isConfirmed = await authService.isEmailConfirmed();
                if (!isConfirmed) {
                    setError("E-posta adresiniz henüz onaylanmamış. Lütfen gelen kutunuzu kontrol edin.");
                    setShowResendEmail(true);
                    return;
                }
                
                handleClose();
            }

        } catch (err: any) {
            setError(err.message || "Bir hata oluştu.");
        } finally {
            if (!resetPasswordMode && !isForgotPassword) setLoading(false);
            // If forgot password successful, loading stays false via return above or set here? 
            // setSuccessMessage handles UI, loading should actally be false.
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            await authService.signInWithGoogle();
        } catch (err: any) {
            setError(err.message || "Google girişi başlatılamadı.");
        }
    };

    const handleResendEmail = async () => {
        if (!email) {
            setError("E-posta adresi gerekli.");
            return;
        }

        setResendLoading(true);
        try {
            await authService.resendConfirmation(email);
            setSuccessMessage("Onay e-postası tekrar gönderildi. Lütfen gelen kutunuzu kontrol edin.");
            setError(null);
        } catch (err: any) {
            setError(err.message || "E-posta gönderilirken bir hata oluştu.");
        } finally {
            setResendLoading(false);
        }
    };

    if (!isOpen) return null;

    // Title & Info Logic
    let title = activeTab === 'login' ? 'Tekrar Hoşgeldiniz' : 'Hesap Oluşturun';
    let subtitle = activeTab === 'login' ? 'Kampanyaları takip etmek için giriş yapın.' : 'Fırsatları kaçırmamak için hemen üye olun.';

    if (resetPasswordMode) {
        title = 'Yeni Şifre Belirle';
        subtitle = 'Lütfen yeni şifrenizi girin.';
    } else if (isForgotPassword) {
        title = 'Şifremi Unuttum';
        subtitle = 'Şifrenizi sıfırlamak için e-posta adresinizi girin. Size bir bağlantı göndereceğiz.';
    }

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose}></div>

            {/* Modal Content */}
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative overflow-hidden transition-all transform scale-100 opacity-100 z-10 flex flex-col max-h-[90vh]">

                {/* Close Button */}
                <button onClick={handleClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors bg-gray-100 rounded-full p-2 z-20">
                    <X size={20} />
                </button>

                {/* Back Button */}
                {(isForgotPassword) && !resetPasswordMode && (
                    <button onClick={resetState} className="absolute top-4 left-4 text-gray-400 hover:text-gray-600 transition-colors bg-gray-100 rounded-full p-2 z-20">
                        <ArrowLeft size={20} />
                    </button>
                )}

                {/* Tabs */}
                {!isForgotPassword && !resetPasswordMode && (
                    <div className="flex border-b border-gray-100">
                        <button
                            className={`flex-1 py-4 text-sm font-bold transition-all ${activeTab === 'login' ? 'text-pink-600 border-b-2 border-pink-600 bg-pink-50' : 'text-gray-500 hover:bg-gray-50'}`}
                            onClick={() => setActiveTab('login')}
                        >
                            Giriş Yap
                        </button>
                        <button
                            className={`flex-1 py-4 text-sm font-bold transition-all ${activeTab === 'register' ? 'text-pink-600 border-b-2 border-pink-600 bg-pink-50' : 'text-gray-500 hover:bg-gray-50'}`}
                            onClick={() => setActiveTab('register')}
                        >
                            Üye Ol
                        </button>
                    </div>
                )}

                <div className="p-8 overflow-y-auto no-scrollbar">
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">{title}</h2>
                        <p className="text-gray-500 text-sm">{subtitle}</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 border border-red-100 text-center">
                            {error}
                        </div>
                    )}
                    {successMessage && (
                        <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm mb-4 border border-green-100 text-center">
                            {successMessage}
                        </div>
                    )}

                    {showResendEmail && (
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-4">
                            <p className="text-blue-700 text-sm mb-3 text-center">
                                E-posta gelmedi mi?
                            </p>
                            <button
                                onClick={handleResendEmail}
                                disabled={resendLoading}
                                className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {resendLoading ? 'Gönderiliyor...' : 'Onay E-postasını Tekrar Gönder'}
                            </button>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* EMAIL INPUT */}
                        {!resetPasswordMode && (
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-700">E-posta Adresi</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all"
                                        placeholder="ornek@mail.com"
                                    />
                                </div>
                            </div>
                        )}

                        {/* PASSWORD INPUT (Login/Register Only) */}
                        {!isForgotPassword && !resetPasswordMode && (
                            <>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-700">Şifre</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="password"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                                {/* CONFIRM PASSWORD */}
                                {activeTab === 'register' && (
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-700">Şifre Tekrarı</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                            <input
                                                type="password"
                                                required
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 outline-none transition-all ${confirmPassword && password !== confirmPassword
                                                    ? 'border-red-300 focus:ring-red-500'
                                                    : 'border-gray-200 focus:ring-pink-500'
                                                    }`}
                                                placeholder="••••••••"
                                            />
                                        </div>
                                        {confirmPassword && password !== confirmPassword && (
                                            <p className="text-[10px] text-red-500 font-bold">Şifreler eşleşmiyor</p>
                                        )}
                                    </div>
                                )}
                            </>
                        )}

                        {/* NEW PASSWORD INPUTS (Reset Mode) */}
                        {resetPasswordMode && (
                            <>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-700">Yeni Şifre</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="password"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all"
                                            placeholder="Yeni şifreniz"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-700">Yeni Şifre (Tekrar)</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="password"
                                            required
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 outline-none transition-all ${confirmPassword && password !== confirmPassword
                                                ? 'border-red-300 focus:ring-red-500'
                                                : 'border-gray-200 focus:ring-pink-500'
                                                }`}
                                            placeholder="Yeni şifreniz tekrar"
                                        />
                                    </div>
                                    {confirmPassword && password !== confirmPassword && (
                                        <p className="text-[10px] text-red-500 font-bold">Şifreler eşleşmiyor</p>
                                    )}
                                </div>
                            </>
                        )}


                        {/* Forgot Password Link */}
                        {activeTab === 'login' && !isForgotPassword && !resetPasswordMode && (
                            <div className="flex justify-end">
                                <button type="button" onClick={() => setIsForgotPassword(true)} className="text-xs text-gray-500 hover:text-pink-600 transition-colors">
                                    Şifremi unuttum?
                                </button>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || (activeTab === 'register' && password !== confirmPassword)}
                            className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition-all ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-pink-500 to-rose-500 hover:shadow-pink-200 hover:-translate-y-0.5'}`}
                        >
                            {loading ? 'İşleniyor...' : (
                                resetPasswordMode ? 'Şifreyi Güncelle' :
                                    isForgotPassword ? 'Bağlantı Gönder' :
                                        activeTab === 'login' ? 'Giriş Yap' : 'Kayıt Ol'
                            )}
                        </button>
                    </form>

                    {!isForgotPassword && !resetPasswordMode && (
                        <>
                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-100"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-white text-gray-400 text-xs">veya</span>
                                </div>
                            </div>

                            <button
                                onClick={handleGoogleLogin}
                                className="w-full bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-2 group"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                <span className="group-hover:text-gray-900 transition-colors">Google ile Devam Et</span>
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
