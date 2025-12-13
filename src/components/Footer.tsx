import { Facebook, Twitter, Instagram, Linkedin, Youtube, Mail, MapPin, Play, Apple } from 'lucide-react';
import { useState, useEffect } from 'react';
import Modal from './Modal';
import { settingsService } from '../services/settingsService';

export default function Footer() {
  const [activeDoc, setActiveDoc] = useState<string | null>(null);
  const settings = settingsService.useSettings();
  const currentYear = new Date().getFullYear();
  
  // Versiyon sistemi
  const [currentVersion, setCurrentVersion] = useState('3.0.0');
  const [isNewVersion, setIsNewVersion] = useState(false);
  
  // Versiyon güncellemelerini dinle
  useEffect(() => {
    const updateVersion = () => {
      try {
        const versionHistory = JSON.parse(localStorage.getItem('app_version_history') || '{}');
        const newVersion = versionHistory.current || '3.0.0';
        
        // Eğer versiyon değiştiyse, "YENİ" badge'i göster
        if (newVersion !== currentVersion && currentVersion !== '3.0.0') {
          setIsNewVersion(true);
          
          // 15 saniye sonra badge'i gizle
          setTimeout(() => {
            setIsNewVersion(false);
          }, 15000);
        }
        
        setCurrentVersion(newVersion);
      } catch {
        setCurrentVersion('3.0.0');
      }
    };
    
    // İlk yükleme
    updateVersion();
    
    // Versiyon güncellemelerini dinle
    window.addEventListener('version-updated', updateVersion);
    window.addEventListener('storage', updateVersion);
    
    return () => {
      window.removeEventListener('version-updated', updateVersion);
      window.removeEventListener('storage', updateVersion);
    };
  }, [currentVersion]);

  const handleOpen = (key: string) => {
    setActiveDoc(key);
  };

  const handleClose = () => {
    setActiveDoc(null);
  };

  const socialLinks = [
    { icon: Facebook, url: settings.social?.facebook },
    { icon: Twitter, url: settings.social?.twitter },
    { icon: Instagram, url: settings.social?.instagram },
    { icon: Linkedin, url: settings.social?.linkedin },
    { icon: Youtube, url: settings.social?.youtube },
  ].filter(item => item.url && item.url.length > 0);

  // Helper to get title from key
  const getDocTitle = (key: string) => {
    switch (key) {
      case 'terms': return 'Kullanım Koşulları';
      case 'privacy': return 'Gizlilik Politikası';
      case 'cookies': return 'Çerez Politikası';
      case 'kvkk': return 'KVKK Aydınlatma Metni';
      case 'about': return 'Hakkımızda';
      case 'help': return 'Yardım & İletişim';
      default: return 'Bilgi';
    }
  };

  // @ts-ignore
  const docContent = activeDoc ? settings.legal?.[activeDoc] : '';

  return (
    <>
      <footer className="bg-gradient-to-br from-gray-900 via-zinc-900 to-black border-t border-white/10 py-8 mt-auto text-gray-400">
        <div className="w-full max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8">

            {/* Sol: Marka & Açıklama */}
            <div className="max-w-md">

              <p className="text-sm text-gray-400 leading-relaxed mb-6">
                {settings.footer.description}
              </p>

              {/* Mobile App Placeholders */}
              <div className="mb-8 w-fit relative group">
                <div className="flex gap-3 mb-2">
                  <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-lg opacity-50 cursor-not-allowed hover:bg-white/10 transition-colors">
                    <Play size={20} className="fill-current" />
                    <div className="text-left leading-none">
                      <div className="text-[9px] uppercase font-bold tracking-wider opacity-70">Google Play</div>
                      <div className="text-sm font-bold">Store</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-lg opacity-50 cursor-not-allowed hover:bg-white/10 transition-colors">
                    <Apple size={22} className="fill-current -mt-0.5" />
                    <div className="text-left leading-none">
                      <div className="text-[9px] uppercase font-bold tracking-wider opacity-70">App Store</div>
                      <div className="text-sm font-bold">Store</div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-3 opacity-60 w-[120%] -ml-[10%]">
                  <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-white/20 flex-1"></div>
                  <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-emerald-400 whitespace-nowrap">Yakında</span>
                  <div className="h-px bg-gradient-to-l from-transparent via-white/20 to-white/20 flex-1"></div>
                </div>
              </div>

              {socialLinks.length > 0 && (
                <div className="flex gap-3">
                  {socialLinks.map((item, i) => (
                    <a
                      key={i}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 rounded-full bg-white/5 text-gray-400 flex items-center justify-center hover:bg-white hover:text-black transition-all border border-white/10"
                    >
                      <item.icon size={16} />
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Sağ: Linkler */}
            <div className="flex flex-wrap gap-12">
              <div>
                <h4 className="font-semibold text-white mb-4 text-sm">Kurumsal</h4>
                <ul className="space-y-2.5 text-sm md:text-xs lg:text-sm">
                  <li><button onClick={() => handleOpen('about')} className="text-gray-400 hover:text-white transition-colors">Hakkımızda</button></li>
                  <li><button onClick={() => handleOpen('help')} className="text-gray-400 hover:text-white transition-colors">İletişim</button></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-4 text-sm">Yasal</h4>
                <ul className="space-y-2.5 text-sm md:text-xs lg:text-sm">
                  <li><button onClick={() => handleOpen('terms')} className="text-gray-400 hover:text-white transition-colors">Kullanım Koşulları</button></li>
                  <li><button onClick={() => handleOpen('privacy')} className="text-gray-400 hover:text-white transition-colors">Gizlilik Politikası</button></li>
                  <li><button onClick={() => handleOpen('cookies')} className="text-gray-400 hover:text-white transition-colors">Çerez Politikası</button></li>
                  <li><button onClick={() => handleOpen('kvkk')} className="text-gray-400 hover:text-white transition-colors">KVKK</button></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-4 text-sm">İletişim</h4>
                <ul className="space-y-3 text-sm text-gray-400">
                  <li className="flex items-start gap-2 max-w-[200px]">
                    <MapPin size={16} className="shrink-0 mt-0.5 text-gray-500" />
                    <span>{settings.footer.address}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Mail size={16} className="shrink-0 text-gray-500" />
                    <a href={`mailto:${settings.footer.email}`} className="hover:text-white transition-colors">{settings.footer.email}</a>
                  </li>

                </ul>
              </div>
            </div>
          </div>

          <div className="flex justify-center mt-8 mb-0 relative z-10">
            <img
              src="/assets/logo-clean.png"
              alt="Logo"
              className="object-contain transition-all duration-300"
              style={{
                height: '60px',
                opacity: 0.9,
                transform: `translate(${settings.footerLogo?.offsetX || 0}px, ${settings.footerLogo?.offsetY || 0}px)`
              }}
            />
          </div>

          <div className="border-t border-white/10 pt-6 text-center text-xs text-gray-500">
            <div className="flex items-center justify-center gap-4 mb-2">
              <span>{settings.footer.copyright || `© ${currentYear} KartAvantaj. Tüm hakları saklıdır.`}</span>
              <span className="text-gray-600">•</span>
              <a 
                href="/panel" 
                className="text-gray-600 hover:text-gray-400 transition-colors opacity-50 hover:opacity-100"
                title="Admin Paneli"
              >
                Panel
              </a>
            </div>
            
            {/* Versiyon Bilgisi */}
            <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-white/5">
              <span className="text-gray-600 text-[10px]">
                KartAvantaj v{currentVersion}
              </span>
              {isNewVersion && (
                <span className="bg-gradient-to-r from-emerald-400 to-emerald-500 text-emerald-900 text-[8px] px-2 py-0.5 rounded-full font-bold animate-pulse shadow-lg border border-emerald-300">
                  YENİ
                </span>
              )}
              <span className="text-gray-700 text-[10px]">•</span>
              <span className="text-gray-600 text-[10px]">
                Otomatik Güncelleme Sistemi
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* Yasal Metin Modalı */}
      <Modal isOpen={!!activeDoc} onClose={handleClose}>
        <div className="bg-white">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-800">{activeDoc && getDocTitle(activeDoc)}</h2>
          </div>
          <div
            className="prose prose-sm max-w-none text-gray-600 min-h-[200px]"
            dangerouslySetInnerHTML={{ __html: docContent || '<p className="text-gray-400 italic">İçerik henüz eklenmedi.</p>' }}
          />
        </div>
      </Modal>
    </>
  );
}