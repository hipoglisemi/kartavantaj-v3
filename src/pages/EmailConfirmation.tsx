import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { authService } from '../services/authService';
import Header from '../components/Header';

export default function EmailConfirmation() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'pending'>('loading');
    const [message, setMessage] = useState('');
    const [email, setEmail] = useState('');
    const [resendLoading, setResendLoading] = useState(false);

    useEffect(() => {
        const checkConfirmation = async () => {
            try {
                // URL'den token parametrelerini al
                const accessToken = searchParams.get('access_token');
                const refreshToken = searchParams.get('refresh_token');
                
                if (accessToken && refreshToken) {
                    // Token'lar varsa onay başarılı
                    setStatus('success');
                    setMessage('E-posta adresiniz başarıyla onaylandı! Hesabınıza giriş yapabilirsiniz.');
                    
                    // 3 saniye sonra ana sayfaya yönlendir
                    setTimeout(() => {
                        navigate('/', { replace: true });
                    }, 3000);
                } else {
                    // Token yoksa kullanıcıdan email isteyerek onay bekletme durumu
                    setStatus('pending');
                    setMessage('E-posta onayınız bekleniyor. Lütfen gelen kutunuzu kontrol edin.');
                }
            } catch (error) {
                setStatus('error');
                setMessage('E-posta onayı sırasında bir hata oluştu.');
            }
        };

        checkConfirmation();
    }, [searchParams, navigate]);

    const handleResendEmail = async () => {
        if (!email) {
            alert('Lütfen e-posta adresinizi girin.');
            return;
        }

        setResendLoading(true);
        try {
            await authService.resendConfirmation(email);
            setMessage('Onay e-postası tekrar gönderildi. Lütfen gelen kutunuzu kontrol edin.');
        } catch (error: any) {
            setMessage(error.message || 'E-posta gönderilirken bir hata oluştu.');
        } finally {
            setResendLoading(false);
        }
    };

    const getIcon = () => {
        switch (status) {
            case 'success':
                return <CheckCircle className="text-green-500" size={64} />;
            case 'error':
                return <AlertCircle className="text-red-500" size={64} />;
            case 'loading':
                return <RefreshCw className="text-blue-500 animate-spin" size={64} />;
            default:
                return <Mail className="text-blue-500" size={64} />;
        }
    };

    const getTitle = () => {
        switch (status) {
            case 'success':
                return 'E-posta Onaylandı!';
            case 'error':
                return 'Onay Hatası';
            case 'loading':
                return 'Onay Kontrol Ediliyor...';
            default:
                return 'E-posta Onayı Gerekli';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header />
            
            <div className="flex-1 flex items-center justify-center px-4 py-20">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 max-w-md w-full text-center">
                    <div className="mb-6 flex justify-center">
                        {getIcon()}
                    </div>
                    
                    <h1 className="text-2xl font-bold text-gray-800 mb-4">
                        {getTitle()}
                    </h1>
                    
                    <p className="text-gray-600 mb-6 leading-relaxed">
                        {message}
                    </p>

                    {status === 'pending' && (
                        <div className="space-y-4">
                            <div className="text-left">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    E-posta Adresiniz
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    placeholder="ornek@email.com"
                                />
                            </div>
                            
                            <button
                                onClick={handleResendEmail}
                                disabled={resendLoading}
                                className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {resendLoading ? (
                                    <>
                                        <RefreshCw size={18} className="animate-spin" />
                                        Gönderiliyor...
                                    </>
                                ) : (
                                    <>
                                        <Mail size={18} />
                                        Onay E-postasını Tekrar Gönder
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="text-sm text-gray-500">
                            3 saniye içinde ana sayfaya yönlendirileceksiniz...
                        </div>
                    )}

                    <div className="mt-6 pt-4 border-t border-gray-100">
                        <button
                            onClick={() => navigate('/')}
                            className="text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
                        >
                            Ana Sayfaya Dön
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}