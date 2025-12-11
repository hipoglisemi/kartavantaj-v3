
import { useState, useEffect } from 'react';
import logo from '../assets/logo-full.png';
import { Menu, User, Flame, ChevronRight } from 'lucide-react';
import AuthModal from './AuthModal';
import UserMenu from './UserMenu';
import { settingsService } from '../services/settingsService';
import { authService } from '../services/authService';
import { useNavigate } from 'react-router-dom';

export default function Header() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const settings = settingsService.useSettings();

  // Announcement Cycling Logic
  const activeAnns = settings.header.announcements?.filter(a => a.isActive) || [];
  const [currentAnnIndex, setCurrentAnnIndex] = useState(0);

  useEffect(() => {
    if (activeAnns.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentAnnIndex(prev => (prev + 1) % activeAnns.length);
    }, 20000); // Cycle every 20 seconds

    return () => clearInterval(timer);
  }, [activeAnns.length]);

  useEffect(() => {
    // Initial check
    authService.getUser().then(setUser);

    // Subscription
    const { data: { subscription } } = authService.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const openAuth = (tab: 'login' | 'register') => {
    setAuthTab(tab);
    setIsAuthModalOpen(true);
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur-md transition-all">
        <div className="container mx-auto px-4 h-[90px] flex items-center justify-between">

          {/* --- SOL: LOGO --- */}
          <div onClick={() => navigate('/')} className="flex items-center gap-2 cursor-pointer group relative overflow-visible">
            <img
              src={settings.logo?.url || logo}
              alt="KartAvantaj"
              className="w-auto object-contain drop-shadow-sm transition-all duration-300"
              style={{
                height: `${settings.logo?.height || 48}px`,
                // Force remove any browser/tailwind limits
                maxHeight: 'none',
                maxWidth: 'none',
                opacity: settings.logo?.opacity ?? 1,
                transform: `translate(${settings.logo?.offsetX || 0}px, ${settings.logo?.offsetY || 0}px)`
              }}
            />
          </div>



          {/* --- ORTA: GÜNÜN FIRSATI / REKLAM ALANI (Native Ad) --- */}
          {activeAnns.length > 0 && (
            <div
              key={activeAnns[currentAnnIndex]?.id} // Key change triggers animation
              onClick={() => activeAnns[currentAnnIndex]?.link && window.open(activeAnns[currentAnnIndex].link, '_self')}
              className="hidden md:flex items-center gap-4 bg-gradient-to-r from-pastel-gray to-white border border-gray-200 pl-2 pr-4 py-2 rounded-full cursor-pointer group hover:border-brand-red/30 hover:shadow-md transition-all w-[480px] mx-auto animate-in fade-in slide-in-from-top-1 duration-500 overflow-hidden relative"
            >
              <div className="flex items-center gap-2 bg-pastel-red text-brand-red px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide shrink-0">
                <Flame size={12} className="fill-brand-red animate-pulse" />
                {activeAnns[currentAnnIndex]?.label}
              </div>

              <span className="text-[13px] font-semibold text-gray-700 group-hover:text-brand-red transition-colors truncate flex-1 text-left">
                {activeAnns[currentAnnIndex]?.text}
              </span>

              <div className="flex items-center gap-3 shrink-0 ml-auto">
                {/* Indicators if multiple */}
                {activeAnns.length > 1 && (
                  <div className="flex gap-1">
                    {activeAnns.map((_, idx) => (
                      <div key={idx} className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === currentAnnIndex ? 'bg-brand-red' : 'bg-gray-200'}`} />
                    ))}
                  </div>
                )}
                <ChevronRight size={14} className="text-gray-400 group-hover:text-brand-red group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          )}

          {/* --- SAĞ: BUTONLAR --- */}
          <div className="flex items-center gap-3">
            {user ? (
              <UserMenu user={user} />
            ) : (
              <>
                <button
                  onClick={() => openAuth('login')}
                  className="hidden lg:flex items-center gap-2 text-xs font-medium text-gray-600 hover:text-brand-red transition-colors"
                >
                  <User size={16} />
                  <span>Giriş Yap</span>
                </button>

                <button
                  onClick={() => openAuth('register')}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-brand-red hover:bg-red-700 rounded-full shadow-md shadow-red-200 transition-all"
                >
                  Üye Ol
                </button>
              </>
            )}

            <button className="md:hidden p-2 text-gray-600">
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialTab={authTab}
      />
    </>
  );
}