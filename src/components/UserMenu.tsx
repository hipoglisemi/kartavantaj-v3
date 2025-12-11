import { useState, useRef, useEffect } from 'react';
import { User, LogOut, Heart, Settings, ChevronDown } from 'lucide-react';
import { authService } from '../services/authService';
import { useNavigate } from 'react-router-dom';

interface UserMenuProps {
    user: any;
}

export default function UserMenu({ user }: UserMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    const handleLogout = async () => {
        await authService.signOut();
        setIsOpen(false);
        navigate('/');
    };

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 hover:bg-gray-50 p-1.5 rounded-full pr-3 transition-colors border border-transparent hover:border-gray-200"
            >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 text-white flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-white">
                    {user.email?.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col items-start text-xs hidden sm:flex">
                    <span className="font-bold text-gray-700 max-w-[100px] truncate">{user.user_metadata?.full_name || 'Kullanıcı'}</span>
                    <span className="text-gray-400 font-medium max-w-[100px] truncate">{user.email}</span>
                </div>
                <ChevronDown size={14} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-3 bg-gray-50 border-b border-gray-100">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Hesabım</p>
                        <p className="text-sm font-semibold text-gray-800 truncate">{user.email}</p>
                    </div>

                    <div className="p-2">
                        <button onClick={() => { navigate('/profile/info'); setIsOpen(false); }} className="w-full flex items-center gap-2 text-sm text-gray-600 hover:text-purple-600 hover:bg-purple-50 px-3 py-2 rounded-lg transition-colors text-left">
                            <User size={16} />
                            <span>Profil Bilgileri</span>
                        </button>
                        <button onClick={() => { navigate('/profile/favorites'); setIsOpen(false); }} className="w-full flex items-center gap-2 text-sm text-gray-600 hover:text-pink-600 hover:bg-pink-50 px-3 py-2 rounded-lg transition-colors text-left">
                            <Heart size={16} />
                            <span>Favori Kampanyalarım</span>
                        </button>
                        <button onClick={() => { navigate('/profile/settings'); setIsOpen(false); }} className="w-full flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors text-left">
                            <Settings size={16} />
                            <span>Ayarlar</span>
                        </button>
                    </div>

                    <div className="border-t border-gray-100 p-2">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2 text-sm text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors text-left font-medium"
                        >
                            <LogOut size={16} />
                            <span>Çıkış Yap</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
