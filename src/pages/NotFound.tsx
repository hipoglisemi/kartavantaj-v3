import { useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';
import OwlMascot from '../components/OwlMascot';

export default function NotFound() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 flex items-center justify-center relative" style={{minHeight: '100vh'}}>
            {/* Arka Plan Maskotları */}
            <div className="absolute inset-0 pointer-events-none">
                <OwlMascot size={400} opacity={0.06} className="absolute top-20 left-20 animate-pulse" />
                <OwlMascot size={200} opacity={0.03} className="absolute bottom-20 left-1/4" />
                <OwlMascot size={180} opacity={0.04} className="absolute top-10 right-10" />
            </div>

            <div className="text-center relative z-10 max-w-2xl mx-auto px-6">
                {/* Ana Maskot */}
                <div className="mb-8 flex justify-center">
                    <div className="relative">
                        <OwlMascot size={200} opacity={1} />
                        <div className="absolute -top-4 -right-4 bg-red-500 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-xl animate-pulse">
                            !
                        </div>
                    </div>
                </div>

                {/* 404 Başlığı */}
                <div className="mb-6">
                    <h1 className="text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-700 to-gray-900 mb-4">
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

                {/* Aksiyon Butonu */}
                <div className="flex justify-center">
                    <button
                        onClick={() => navigate('/')}
                        className="bg-gray-700 text-white px-8 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                    >
                        <Home size={20} />
                        Ana Sayfaya Dön
                    </button>
                </div>

                {/* Alt Bilgi */}
                <div className="mt-12 text-center">
                    <p className="text-gray-500 text-sm">
                                      KartAvantaj © 2025
                        <br />
                        Sorun devam ederse destek ekibimizle iletişime geçin.
                    </p>
                </div>
            </div>
        </div>
    );
}