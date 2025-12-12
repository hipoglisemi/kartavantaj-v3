import { useState, useEffect } from 'react';
import { X, Smartphone, QrCode, Copy, CheckCircle, Shield, Clock } from 'lucide-react';
import TOTPService from '../services/totpService';
import { useToast } from '../context/ToastContext';

interface Setup2FAModalProps {
    isOpen: boolean;
    onComplete: () => void;
    adminEmail: string;
}

export default function Setup2FAModal({ isOpen, onComplete, adminEmail }: Setup2FAModalProps) {
    const { success, error } = useToast();
    const [step, setStep] = useState(1);
    const [generatedSecret, setGeneratedSecret] = useState('');
    const [qrCodeImage, setQrCodeImage] = useState('');
    const [currentToken, setCurrentToken] = useState('');
    const [timeRemaining, setTimeRemaining] = useState(30);
    const [verificationCode, setVerificationCode] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            generateTOTP();
        }
    }, [isOpen]);

    // Timer effect
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isOpen && generatedSecret) {
            interval = setInterval(() => {
                const remaining = TOTPService.getTimeRemaining();
                setTimeRemaining(remaining);
                
                const newToken = TOTPService.generateToken(generatedSecret);
                setCurrentToken(newToken);
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isOpen, generatedSecret]);

    const generateTOTP = async () => {
        try {
            setLoading(true);
            const secret = TOTPService.generateSecret();
            setGeneratedSecret(secret);

            const qrImage = await TOTPService.generateQRCodeImage(secret, adminEmail, 'KartAvantaj Admin');
            setQrCodeImage(qrImage);

            const token = TOTPService.generateToken(secret);
            setCurrentToken(token);
        } catch (err) {
            error('2FA kurulumu başarısız oldu');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = () => {
        if (!verificationCode || verificationCode.length !== 6) {
            error('6 haneli doğrulama kodu girin');
            return;
        }

        if (TOTPService.verifyToken(verificationCode, generatedSecret)) {
            // Secret'ı kaydet
            TOTPService.saveAdminSecret(adminEmail, generatedSecret);
            localStorage.removeItem('needs_2fa_setup');
            success('2FA kurulumu tamamlandı!');
            onComplete();
        } else {
            error('Geçersiz doğrulama kodu');
        }
    };

    const copyToClipboard = (text: string) => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text);
            success('Panoya kopyalandı!');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    {/* Header */}
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Shield className="text-blue-600" size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">2FA Kurulumu Gerekli</h2>
                        <p className="text-gray-600">
                            Güvenlik için Google Authenticator kurulumu zorunludur
                        </p>
                    </div>

                    {step === 1 && (
                        <div className="space-y-6">
                            {/* QR Code */}
                            <div className="bg-gray-50 rounded-xl p-6 text-center">
                                <div className="w-48 h-48 bg-white border-2 border-gray-200 rounded-xl mx-auto mb-4 flex items-center justify-center overflow-hidden">
                                    {qrCodeImage ? (
                                        <img 
                                            src={qrCodeImage} 
                                            alt="QR Code" 
                                            className="w-full h-full object-contain"
                                        />
                                    ) : (
                                        <QrCode size={64} className="text-gray-400" />
                                    )}
                                </div>
                                <p className="text-sm text-gray-600 mb-4">
                                    Google Authenticator ile QR kodu tarayın
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

                            {/* Mevcut Token */}
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                <div className="text-center">
                                    <p className="font-medium text-blue-800 mb-2">Mevcut Kod</p>
                                    <div className="bg-white rounded p-3 font-mono text-center">
                                        <span className="font-bold text-blue-800 text-xl">{currentToken}</span>
                                    </div>
                                    <div className="flex items-center justify-center gap-1 mt-2 text-xs text-blue-600">
                                        <Clock size={12} />
                                        <span>{timeRemaining} saniye kaldı</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => setStep(2)}
                                className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                            >
                                Kurulumu Tamamladım
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <Smartphone className="text-green-600 mx-auto mb-4" size={48} />
                                <h3 className="text-lg font-semibold text-gray-800 mb-2">Doğrulama</h3>
                                <p className="text-gray-600">
                                    Google Authenticator'da görünen 6 haneli kodu girin
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Doğrulama Kodu
                                </label>
                                <input
                                    type="text"
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg text-center font-mono text-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="000000"
                                    maxLength={6}
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setStep(1)}
                                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                                >
                                    Geri
                                </button>
                                <button
                                    onClick={handleVerify}
                                    disabled={verificationCode.length !== 6}
                                    className="flex-1 bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                                >
                                    Doğrula ve Tamamla
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}