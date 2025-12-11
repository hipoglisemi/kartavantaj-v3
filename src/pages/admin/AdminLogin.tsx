import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';

export default function AdminLogin() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();

        // Get stored credentials or use defaults
        const storedUser = localStorage.getItem('admin_username') || 'admin';
        const storedPass = localStorage.getItem('admin_password') || '1234';

        if (username === storedUser && password === storedPass) {
            localStorage.setItem('isAdmin', 'true');

            // Ensure defaults are saved if they weren't before (so they can be changed later)
            if (!localStorage.getItem('admin_username')) localStorage.setItem('admin_username', 'admin');
            if (!localStorage.getItem('admin_password')) localStorage.setItem('admin_password', '1234');

            navigate('/admin/dashboard');
        } else {
            alert('Hatalı kullanıcı adı veya şifre!');
        }
    };

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

                <div className="mt-6 text-center">
                    <a href="/" className="text-sm text-gray-500 hover:text-gray-800">Ana Sayfaya Dön</a>
                </div>
            </div>
        </div>
    );
}
