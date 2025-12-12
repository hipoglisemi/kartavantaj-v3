import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';
import OwlMascot from '../components/OwlMascot';

export default function NotFound() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center relative overflow-hidden">
            {/* Arka Plan Maskotları */}
            <div className="absolute inset-0 pointer-events-none">
                <OwlMascot size={400} opacity={0.06} className="absolute top-20 left-20 animate-pulse" />
                <OwlMascot size={300} opacity={0.04} className="absolute bottom-32 right-32 animate-bounce" />
                <OwlMascot size={250} opacity={0.05} className="absolute top-1/3 right-1/4" />
                <OwlMascot size={200} opacity={0.03} className="absolute bottom-20 left-1/4" />
                <OwlMascot size={180} opacity={0.04} className="absolute top-10 right-10" />
            </div>

            <div className="text-center relative z-10 max-w-2xl mx-auto px-6">
                {/* Ana Maskot */}
                <div className="mb-8 flex justify-center">
                    <div className="relative">
                        <OwlMascot size={200} opacity={1} className="animate-bounce" />
                        <div className="absolute -top-4 -right-4 bg-red-500 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-xl animate-pulse">
                            !
                        </div>
                    </div>
                </div>

                {/* 404 Başlığı */}
                <div className="mb-6">
                    <h1 className="text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-4">
                        404
                    </h1>
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">
                        Sayfa Bulunamadı
                    </h2>
                    <p className="text-lg text-gray-600 mb-8">
                        Aradığınız sayfa mevcut değil veya taşınmış olabilir.
                        <br />
                        Baykuşumuz da şaşırmış durumda! 🦉
                    </p>
                </div>

                {/* Öneriler */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-8 shadow-xl border border-white/20">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center justify-center gap-2">
                        <Search size={24} className="text-blue-600" />
                        Ne Yapmak İstersiniz?
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                            <h4 className="font-semibold text-blue-800 mb-2">Popüler Sayfalar</h4>
                            <ul className="text-sm text-blue-700 space-y-1">
                                <li>• Ana Sayfa</li>
                                <li>• Kampanyalar</li>
                                <li>• Profil Ayarları</li>
                                <li>• Yardım Merkezi</li>
                            </ul>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                            <h4 className="font-semibold text-purple-800 mb-2">Yönetici Paneli</h4>
                            <ul className="text-sm text-purple-700 space-y-1">
                                <li>• Admin Girişi</li>
                                <li>• Dashboard</li>
                                <li>• Üye Yönetimi</li>
                                <li>• Sistem Ayarları</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Aksiyon Butonları */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={() => navigate('/')}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center gap-2"
                    >
                        <Home size={20} />
                        Ana Sayfaya Dön
                    </button>
                    
                    <button
                        onClick={() => navigate(-1)}
                        className="bg-white text-gray-700 px-8 py-4 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center gap-2 border border-gray-200"
                    >
                        <ArrowLeft size={20} />
                        Geri Git
                    </button>
                    
                    <button
                        onClick={() => navigate('/panel')}
                        className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-indigo-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center gap-2"
                    >
                        <Search size={20} />
                        Admin Panel
                    </button>
                </div>

                {/* Alt Bilgi */}
                <div className="mt-12 text-center">
                    <p className="text-gray-500 text-sm">
                        Hata kodu: 404 | KartAvantaj © 2024
                        <br />
                        Sorun devam ederse destek ekibimizle iletişime geçin.
                    </p>
                </div>
            </div>
        </div>
    );
}