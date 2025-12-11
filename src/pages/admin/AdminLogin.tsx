import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Settings } from 'lucide-react';

export default function AdminLogin() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isSetupComplete, setIsSetupComplete] = useState(false);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        // Kurulum kontrolü
        const setupComplete = localStorage.getItem('admin_setup_complete');
        if (setupComplete !== 'true') {
            navigate('/panel/setup');
        } else {
            setIsSetupComplete(true);
        }
        setLoading(false);
    }, [navigate]);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();

        const storedUser = localStorage.getItem('admin_username');
        const storedPass = localStorage.getItem('admin_password');

        if (!storedUser || !storedPass) {
            alert('Admin kurulumu tamamlanmamış. Kurulum sayfasına yönlendiriliyorsunuz.');
            navigate('/panel/setup');
            return;
        }

        if (username === storedUser && password === storedPass) {
            localStorage.setItem('isAdmin', 'true');
            localStorage.setItem('admin_last_login', new Date().toISOString());
            navigate('/panel/dashboard');
        } else {
            alert('Hatalı kullanıcı adı veya şifre!');
        }
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
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="admin"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Şifre</label>
                        <input
                            type="password"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="1234"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
                    >
                        Giriş Yap
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
