import { useState, useEffect } from 'react';
import mascot from '../assets/logo-icon.png';
import { Search, Sparkles, TrendingUp, CreditCard, ShieldCheck } from 'lucide-react';

interface HeroSectionProps {
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
  onSearchSubmit?: () => void;
}

export default function HeroSection({ searchTerm, onSearchChange, onSearchSubmit }: HeroSectionProps) {
  const [hasLanded, setHasLanded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setHasLanded(true);
    }, 2500); // 2.5s fly time
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="relative w-full overflow-hidden bg-brand-dark text-white pt-32 pb-16">

      {/* Aurora Efekti (Brand Colors) */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-brand-red/20 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-brand-blue/10 rounded-full blur-[120px]"></div>
      <div className="absolute top-[20%] right-[20%] w-[300px] h-[300px] bg-brand-orange/10 rounded-full blur-[80px]"></div>

      {/* Izgara Deseni */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>

      <div className="w-full max-w-6xl mx-auto px-4 relative z-10 text-center">

        {/* Rozet */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8 ring-1 ring-white/20 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
          <Sparkles className="text-brand-orange w-3.5 h-3.5" />
          <span className="text-sm font-semibold text-gray-100 tracking-wide uppercase">Akıllı Fırsatlar</span>
        </div>

        {/* Ana Başlık */}
        <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight mb-6 leading-[1.1]">
          Yeni Kampanyaları <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-red to-brand-orange animate-gradient-x">
            Keşfetmeye Başla.
          </span>
        </h1>

        <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto font-medium leading-relaxed">
          Tüm banka kampanyaları, kredi kartı fırsatları ve indirimler.
          Tek bir platformda, <span className="text-white font-semibold">tamamen ücretsiz.</span>
        </p>

        {/* Arama Kutusu Container */}
        <div className="max-w-2xl mx-auto p-1.5 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_0_40px_-10px_rgba(168,85,247,0.3)] relative">

          {/* Mascot Element */}
          <div className={`absolute -top-12 z-50 pointer-events-none transition-all ${hasLanded ? 'animate-blink right-4' : 'animate-fly-in-land right-4'}`}>
            <img src={mascot} alt="Mascot" className="w-12 h-auto drop-shadow-lg" />
          </div>

          <div className="relative flex items-center bg-slate-900/80 rounded-xl overflow-hidden">
            <Search className="absolute left-5 text-slate-400" size={22} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange?.(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSearchSubmit?.()}
              placeholder="Hangi markada indirim arıyorsun?"
              className="w-full h-16 pl-14 pr-4 bg-transparent text-white placeholder:text-slate-500 font-medium focus:outline-none text-lg"
            />
            <button
              onClick={() => onSearchSubmit?.()}
              className="hidden md:block mr-2 px-8 py-3 bg-white text-slate-900 rounded-lg font-bold hover:bg-slate-200 transition-colors relative"
            >
              Bul
            </button>
          </div>
        </div>

        {/* Alt Güven Rozetleri */}
        <div className="flex flex-wrap justify-center gap-8 mt-16 text-slate-400 text-sm font-medium">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-emerald-400" size={18} />
            <span>Doğrulanmış Fırsatlar</span>
          </div>
          <div className="flex items-center gap-2">
            <CreditCard className="text-blue-400" size={18} />
            <span>Tüm Kartlar Geçerli</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="text-pink-400" size={18} />
            <span>Güncel Veriler</span>
          </div>
        </div>

      </div>
    </section >
  );
}