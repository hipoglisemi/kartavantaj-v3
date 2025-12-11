import { CreditCard, Facebook, Twitter, Instagram, Linkedin, Youtube, Mail, MapPin } from 'lucide-react';
import { useState } from 'react';
import Modal from './Modal';
import { settingsService } from '../services/settingsService';

export default function Footer() {
  const [activeDoc, setActiveDoc] = useState<string | null>(null);
  const settings = settingsService.useSettings();
  const currentYear = new Date().getFullYear();

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
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8">

            {/* Sol: Marka & Açıklama */}
            <div className="max-w-md">
              <div className="flex items-center gap-2 mb-2">
                {(settings.footerLogo?.url || settings.logo?.url) ? (
                  <img
                    src={settings.footerLogo?.url || settings.logo?.url}
                    alt="Logo"
                    className="object-contain transition-all duration-300"
                    style={{
                      height: `${settings.footerLogo?.height || 32}px`,
                      opacity: settings.footerLogo?.opacity ?? 0.9,
                      transform: `translate(${settings.footerLogo?.offsetX || 0}px, ${settings.footerLogo?.offsetY || 0}px)`
                    }}
                  />
                ) : (
                  <div className="flex items-center gap-2 text-white">
                    <CreditCard size={24} />
                    <span className="text-xl font-bold tracking-tight">KartAvantaj</span>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-400 leading-relaxed mb-6">
                {settings.footer.description}
              </p>

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
                  <li className="pt-2">
                    <a href="/admin" className="text-xs px-3 py-1 bg-white/5 border border-white/10 text-gray-400 rounded-lg hover:bg-white/10 hover:text-white transition-colors">Yönetici Girişi</a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 mt-12 pt-6 text-center text-xs text-gray-500">
            {settings.footer.copyright || `© ${currentYear} KartAvantaj. Tüm hakları saklıdır.`}
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