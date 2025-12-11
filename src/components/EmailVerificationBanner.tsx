import { useState, useEffect } from 'react';
import { Mail, X, RefreshCw } from 'lucide-react';
import { authService } from '../services/authService';

export default function EmailVerificationBanner() {
    const [isVisible, setIsVisible] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [resendLoading, setResendLoading] = useState(false);

    useEffect(() => {
        const checkEmailStatus = async () => {
            try {
                const currentUser = await authService.getUser();
                if (currentUser && !currentUser.email_confirmed_at) {
                    setUser(currentUser);
                    setIsVisible(true);
                }
            } catch (error) {
                console.error('Email status check error:', error);
            }
        };

        checkEmailStatus();
    }, []);

    const handleResendEmail = async () => {
        if (!user?.email) return;

        setResendLoading(true);
        try {
            await authService.resendConfirmation(user.email);
            alert('Onay e-postası tekrar gönderildi. Lütfen gelen kutunuzu kontrol edin.');
        } catch (error: any) {
            alert(error.message || 'E-posta gönderilirken bir hata oluştu.');
        } finally {
            setResendLoading(false);
        }
    };

    const handleDismiss = () => {
        setIsVisible(false);
    };

    if (!isVisible || !user) return null;

    return (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
                <Mail className="text-amber-600 mt-0.5" size={20} />
                <div className="flex-1">
                    <h3 className="font-semibold text-amber-800 mb-1">
                        E-posta Onayı Gerekli
                    </h3>
                    <p className="text-amber-700 text-sm mb-3">
                        Hesabınızı tam olarak kullanabilmek için <strong>{user.email}</strong> adresine 
                        gönderilen onay linkine tıklamanız gerekiyor.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={handleResendEmail}
                            disabled={resendLoading}
                            className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {resendLoading ? (
                                <>
                                    <RefreshCw size={16} className="animate-spin" />
                                    Gönderiliyor...
                                </>
                            ) : (
                                <>
                                    <Mail size={16} />
                                    Tekrar Gönder
                                </>
                            )}
                        </button>
                        <button
                            onClick={handleDismiss}
                            className="text-amber-700 hover:text-amber-800 text-sm font-medium px-2"
                        >
                            Daha Sonra
                        </button>
                    </div>
                </div>
                <button
                    onClick={handleDismiss}
                    className="text-amber-500 hover:text-amber-700 transition-colors"
                >
                    <X size={18} />
                </button>
            </div>
        </div>
    );
}