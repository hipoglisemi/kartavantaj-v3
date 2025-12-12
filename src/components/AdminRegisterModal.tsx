import { useState } from 'react';
import { X, User, Smartphone, QrCode, Copy, CheckCircle } from 'lucide-react';
import SecurityService from '../services/securityService';
import TOTPService from '../services/totpService';

interface AdminRegisterModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AdminRegisterModal({ isOpen, onClose }: AdminRegisterModalProps) {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [totpSecret, setTotpSecret] = useState('');
    const [qrCodeImage, setQrCodeImage] = useState('');
    const [currentToken, setCurrentToken] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const validateStep1 = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.name || formData.name.length < 2) {
            newErrors.name = 'Ad en az 2 karakter olmalıdır';
        }

        if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Geçerli bir email adresi girin';
        }

        if (!formData.password || formData.password.length < 6) {
            newErrors.password = 'Şifre en az 6 karakter olmalıdır';
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Şifreler eşleşmiyor';
        }

        // Email zaten kayıtlı mı kontrol et
        const adminList = getAdminList();
        if (adminList.includes(formData.email)) {
            newErrors.email = 'Bu email adresi zaten kayıtlı';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const getAdminList = (): string[] => {
        try {
            const admins = SecurityService.getSecureItem('admin_list');
            return admins ? JSON.parse(admins) : [];
        } catch {
            return [];
        }
    };

    const saveAdminList = (emails: string[]) => {
        SecurityService.setSecureItem('admin_list', JSON.stringify(emails));
    };

    const saveAdminCredentials = (email: string, password: string, name: string) => {
        const credentials = { email, password, name, createdAt: new Date().toISOString() };
        SecurityService.setSecureItem(`admin_cred_${email}`, JSON.stringify(credentials));
    };

    const handleNext = async () => {
        if (step === 1 && validateStep1()) {
            setLoading(true);
            try {
                // TOTP secret oluştur
                const secret = TOTPService.generateSecret();
                setTotpSecret(secret);

                // QR Code oluştur
                const qrImage = await TOTPService.generateQRCodeImage(secret, formData.email, 'KartAvantaj Admin');
                setQrCodeImage(qrImage);

                // Mevcut token
                const token = TOTPService.generateToken(secret);
                setCurrentToken(token);

                setStep(2);
            } catch (error) {
                setErrors({ general: 'TOTP kurulumu başarısız oldu' });
            } finally {
                setLoading(false);
            }
        }
    };

    const handleComplete = () => {
        try {
            // Admin listesine ekle
            const adminList = getAdminList();
            adminList.push(formData.email);
            saveAdminList(adminList);

            // Credentials kaydet
            saveAdminCredentials(formData.email, formData.password, formData.name);

            // TOTP secret kaydet
            TOTPService.saveAdminSecret(formData.email, totpSecret);

            // Güvenlik logu
            SecurityService.logSecurityEvent('NEW_ADMIN_CREATED', {
                email: formData.email,
                name: formData.name,
                createdBy: SecurityService.getSecureItem('admin_email') || 'system'
            });

            setStep(3);
        } catch (error) {
            setErrors({ general: 'Admin kaydı başarısız oldu' });
        }
    };

    const copyToClipboard = (text: string) => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text);
        }
    };

    const handleClose = () => {
        setStep(1);
        setFormData({ name: '', email: '', password: '', confirmPassword: '' });
        setErrors({});
        setTotpSecret('');
        setQrCodeImage('');
        setCurrentToken('');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">Yeni Admin Ekle</h2>
                        <button
                            onClick={handleClose}
                            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Step 1: Bilgi Girişi */}
                    {step === 1 && (
                        <div className="space-y-6">
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <User className="text-blue-600" size={32} />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-800">Admin Bilgileri</h3>
                                <p className="text-sm text-gray-600">Yeni admin hesabı oluşturun</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Ad Soyad</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all ${
                                        errors.name ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                    }`}
                                    placeholder="Ad Soyad"
                                />
                                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Email Adresi</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all ${
                                        errors.email ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                    }`}
                                    placeholder="admin@kartavantaj.com"
                                />
                                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Şifre</label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all ${
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
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all ${
                                        errors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                    }`}
                                    placeholder="Şifreyi tekrar girin"
                                />
                                {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
                            </div>

                            {errors.general && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                    <p className="text-red-700 text-sm">{errors.general}</p>
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button
                                    onClick={handleClose}
                                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                                >
                                    İptal
                                </button>
                                <button
                                    onClick={handleNext}
                                    disabled={loading}
                                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                                >
                                    {loading ? 'Hazırlanıyor...' : 'Devam Et'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: 2FA Kurulumu */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Smartphone className="text-green-600" size={32} />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-800">2FA Kurulumu</h3>
                                <p className="text-sm text-gray-600">Google Authenticator ile güvenlik</p>
                            </div>

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

                            {/* Mevcut Token */}
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                <div className="text-center">
                                    <p className="font-medium text-blue-800 mb-2">Test Kodu</p>
                                    <div className="bg-white rounded p-3 font-mono text-center">
                                        <span className="font-bold text-blue-800 text-xl">{currentToken}</span>
                                    </div>
                                    <p className="text-xs text-blue-600 mt-2">
                                        Bu kod Google Authenticator'da görünmelidir
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setStep(1)}
                                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                                >
                                    Geri
                                </button>
                                <button
                                    onClick={handleComplete}
                                    className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                                >
                                    Admin Oluştur
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Başarılı */}
                    {step === 3 && (
                        <div className="space-y-6 text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="text-green-600" size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800">Admin Başarıyla Oluşturuldu!</h3>
                            
                            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                                <p className="text-green-800 font-medium">{formData.name}</p>
                                <p className="text-green-700 text-sm">{formData.email}</p>
                                <p className="text-green-600 text-xs mt-2">
                                    Artık bu bilgilerle admin paneline giriş yapabilir
                                </p>
                            </div>

                            <button
                                onClick={handleClose}
                                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                            >
                                Tamam
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}