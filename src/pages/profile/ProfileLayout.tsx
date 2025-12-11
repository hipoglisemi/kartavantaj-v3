import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { User, Heart, Settings, LogOut, Wallet } from 'lucide-react';
import Header from '../../components/Header';
import { authService } from '../../services/authService';

export default function ProfileLayout() {
    const navigate = useNavigate();

    const handleLogout = async () => {
        await authService.signOut();
        navigate('/');
    };

    const navItems = [
        { name: 'Kişisel Bilgiler', path: '/profile/info', icon: User },
        { name: 'Cüzdanım', path: '/profile/wallet', icon: Wallet },
        { name: 'Favorilerim', path: '/profile/favorites', icon: Heart },
        { name: 'Ayarlar', path: '/profile/settings', icon: Settings },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <Header />
            <div className="container mx-auto px-4 py-8 mt-20 flex-1">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Sidebar */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 h-fit">
                        <nav className="space-y-1">
                            {navItems.map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${isActive
                                        ? 'bg-purple-50 text-purple-700'
                                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                >
                                    <item.icon size={18} />
                                    {item.name}
                                </NavLink>
                            ))}

                            <div className="pt-4 mt-4 border-t border-gray-100">
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-all"
                                >
                                    <LogOut size={18} />
                                    Çıkış Yap
                                </button>
                            </div>
                        </nav>
                    </div>

                    {/* Content */}
                    <div className="md:col-span-3">
                        <Outlet />
                    </div>
                </div>
            </div>
        </div>
    );
}
