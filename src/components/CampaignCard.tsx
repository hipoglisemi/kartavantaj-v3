// Yardımcı fonksiyonlar
// NOT: Bu state mantığı (selectedCampaignId vb.) bir üst bileşende (App.tsx) veya bileşen içinde olmalıdır.
// Global scope'da hook kullanılamaz. Bu kod şimdilik yorum satırına alındı.
/*
const [selectedCampaignId, setSelectedCampaignId] = React.useState<number | null>(null);
const [isModalOpen, setIsModalOpen] = React.useState(false);

const openModal = (id: number) => {
  setSelectedCampaignId(id);
  setIsModalOpen(true);
};

const closeModal = () => {
  setIsModalOpen(false);
  setSelectedCampaignId(null);
};
*/
import { normalizeTurkish } from '../utils/turkishStringHelper';

const getBadgeStyle = (data: CampaignProps) => {
  // Combine all relevant text fields to check for keywords
  // Priority: Title > BadgeText > Earning
  const rawText = data.title + ' ' + data.badgeText + ' ' + (data.earning || '');
  const combinedText = normalizeTurkish(rawText);

  // 1. TAKSİT (Öncelikli)
  // Pastel Mint - Taksit imkanı yeşil güven verir
  if (combinedText.includes('taksit') || combinedText.includes('vade')) {
    return 'bg-[#DCFCE7] text-[#166534]'; // emerald-100 bg, emerald-800 text
  }

  // 2. MİL (YENİ - Uçuş/Seyahat)
  // Pastel Cyan - Gökyüzü/Tatil hissiyatı
  if (combinedText.includes('mil ') || combinedText.includes(' mil') || combinedText.includes('miles')) {
    return 'bg-[#CFFAFE] text-[#155E75]'; // cyan-100 bg, cyan-800 text
  }

  // 3. PUAN / CHIP-PARA
  // Pastel Emerald - Değerli/Puan hissiyatı (Yeşil)
  if (combinedText.includes('puan') || combinedText.includes('chip') || combinedText.includes('bonus') || combinedText.includes('para')) {
    return 'bg-[#D1FAE5] text-[#065F46]'; // emerald-100 bg, emerald-800 text
  }

  // 4. İNDİRİM / % / KUPON / KOD / İADE
  // Pastel Sky Blue - İndirim ferahlığı
  if (
    combinedText.includes('indirim') ||
    combinedText.includes('iade') ||
    combinedText.includes('nakit') ||
    combinedText.includes('%') ||
    combinedText.includes('kupon') ||
    combinedText.includes('kod')
  ) {
    return 'bg-[#DBEAFE] text-[#1E40AF]'; // blue-100 bg, blue-800 text
  }

  // 5. DİĞER (Varsayılan - GRİ YOK)
  // Pastel Peach - Enerjik ve sıcak, dikkat çekici ama mat
  return 'bg-[#FFEDD5] text-[#9A3412]'; // orange-100 bg, orange-800 text
};

const getRemainingDays = (validUntil: string | null | undefined): number | null => {
  if (!validUntil) return null;

  const end = new Date(validUntil);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 3600 * 24));

  return days > 0 ? days : null;
};

import { Pencil } from 'lucide-react';

export interface CampaignProps {
  id: number;
  title: string;
  image: string;
  badgeText: string;
  badgeColor: string;
  bank: string;
  brand?: string; // Optional for filtering
  cardName?: string; // Specific card name (e.g. "Adios", "World")
  category: string;
  validUntil?: string;
  // New Dynamic Fields
  spendAmount?: string; // Legacy
  earnAmount?: string; // Legacy
  validCards?: string; // Legacy
  joinMethod?: string; // Legacy

  // New Guide Fields
  min_spend?: number;
  earning?: string;
  discount?: string;
  eligible_customers?: string[];
  participation_method?: string;
  valid_from?: string;

  // Detailed Lists
  conditions?: string[];
  participation_points?: string[];

  // validUntil already exists, but mapping might use valid_until

  terms?: string[]; // Keeping for legacy compatibility
  url?: string;
  cardLogo?: string; // New field for injected logo
  description?: string;
  isVerified?: boolean; // Legacy
  isApproved?: boolean;
  isArchived?: boolean;
  createdAt?: string;
  views?: number;
  discountPercentage?: number;
}

export default function CampaignCard({ data, isAdmin }: { data: CampaignProps, isAdmin?: boolean }) {
  // Provider Logoları (Axess, Bonus vb.)
  // Smart Logo Detection - Admin panelden hangi karta yüklendiyse o kartın logosu
  const getProviderLogo = (bankName: string): string | null => {
    // 1. Önce cardLogo field'ı varsa onu kullan
    if (data.cardLogo) return data.cardLogo;
    if (!bankName) return null;

    // 2. Admin paneldeki banka/kart konfigürasyonundan logo bul
    try {
      const savedConfig = localStorage.getItem('scraper_config');
      if (savedConfig) {
        const banks = JSON.parse(savedConfig) as Array<{ 
          id: string, 
          name: string, 
          logo: string, 
          cards: Array<{ id: string, name: string, logo?: string }> 
        }>;

        // Önce tam banka adı eşleşmesi ara
        let targetBank = banks.find(bank => 
          bank.name.toLowerCase() === bankName.toLowerCase() ||
          bank.id.toLowerCase() === bankName.toLowerCase()
        );

        // Bulamazsa kısmi eşleşme dene
        if (!targetBank) {
          targetBank = banks.find(bank => 
            bank.name.toLowerCase().includes(bankName.toLowerCase()) ||
            bankName.toLowerCase().includes(bank.name.toLowerCase())
          );
        }

        if (targetBank) {
          // Eğer cardName varsa, o kartın logosunu bul
          if (data.cardName && targetBank.cards && targetBank.cards.length > 0) {
            const targetCard = targetBank.cards.find(card => 
              card.name.toLowerCase() === data.cardName!.toLowerCase() ||
              card.id.toLowerCase() === data.cardName!.toLowerCase() ||
              card.name.toLowerCase().includes(data.cardName!.toLowerCase()) ||
              data.cardName!.toLowerCase().includes(card.name.toLowerCase())
            );
            
            // Kart logosu varsa onu kullan, yoksa banka logosunu kullan
            if (targetCard && targetCard.logo) {
              return targetCard.logo;
            }
          }
          
          // Kart logosu bulunamazsa banka logosunu kullan
          if (targetBank.logo) {
            return targetBank.logo;
          }
        }
      }
    } catch (e) {
      console.warn('Logo config parse error:', e);
    }

    // 3. Fallback: Hardcoded logo map (eski sistem)
    const searchText = (bankName + ' ' + (data.cardName || '') + ' ' + (data.title || '')).toLowerCase();

    const logoMap: Record<string, string> = {
      'axess': '/assets/logos/axess.png',
      'bonus': '/assets/logos/bonus.png',
      'maximum': '/assets/logos/maximum.png',
      'world': '/assets/logos/world.png',
      'paraf': '/assets/logos/paraf.png',
      'cardfinans': '/assets/logos/cardfinans.png',
      'card finans': '/assets/logos/cardfinans.png',
      'bankkart': '/assets/logos/bankkart.png',
      'ziraat': '/assets/logos/bankkart.png',
      'advantage': '/assets/logos/advantage.png',
      'adios': '/assets/logos/adios.png',
      'wings': '/assets/logos/wings.png',
      'shop&fly': '/assets/logos/shopandfly.png',
      'shop and fly': '/assets/logos/shopandfly.png',
      'maximiles': '/assets/logos/maximiles.png',
      'amex': '/assets/logos/amex.png',
      'crystal': '/assets/logos/crystal.png',
      'miles': '/assets/logos/milesandsmiles.png',
      'play': '/assets/logos/play.png'
    };

    for (const [key, logo] of Object.entries(logoMap)) {
      if (searchText.includes(key)) {
        return logo;
      }
    }
    
    return null;
  };

  const providerLogo = getProviderLogo(data.bank); // Veritabanından banka ismini al
  const remainingDays = getRemainingDays(data.validUntil);

  return (
    <div className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col h-full relative">

      {/* ID Badge (Admin Only) */}
      {isAdmin && (
        <div className="absolute top-2 left-2 z-20">
          <span className="inline-flex items-center gap-1 text-[9px] uppercase font-bold text-slate-600 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded border border-slate-200 shadow-sm">
            ID:{data.id}
          </span>
        </div>
      )}

      {/* Admin Edit Overlay Icon */}
      {isAdmin && (
        <div className="absolute top-2 right-2 z-20 bg-white p-2 rounded-full shadow-lg text-brand-red opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer transform hover:scale-110">
          <Pencil size={16} />
        </div>
      )}

      {/* Resim Alanı */}
      <div className="relative h-40 overflow-hidden bg-white border-b border-gray-100">
        <div className="absolute inset-0 bg-black/5 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <img
          src={data.image}
          alt={data.title}
          className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-700"
        />
      </div>

      {/* Content Section */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Title */}
        <h3 className="text-[13px] font-medium text-gray-800 mb-3 line-clamp-3 leading-tight group-hover:text-gray-900 transition-colors min-h-[3rem]">
          {data.title}
        </h3>

        {/* Kazanç / İndirim Şeridi (Pastel & Matte) */}
        <div className={`h-6 flex items-center justify-center text-[10px] font-bold rounded-md shadow-sm ${getBadgeStyle(data)}`}>
          {data.earning || data.discount || data.badgeText}
        </div>
        {/* Bitiş Etiketi (Sağ Üst) */}
        {remainingDays !== null && (
          <div className="absolute top-2 right-2 z-20 bg-black/60 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
            Son {remainingDays} Gün
          </div>
        )}

        {/* Brand & Category Footer */}
        <div className="mt-auto pt-2 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Logo */}
            <div className="h-8 w-auto min-w-[80px] flex items-center justify-start">
              {providerLogo ? (
                <img
                  src={providerLogo}
                  alt={data.bank}
                  className="object-contain max-h-8 w-auto max-w-[100px]"
                />
              ) : (
                <span className="text-xs font-bold text-gray-500">{data.bank}</span>
              )}
            </div>
          </div>
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
            {data.category || 'GENEL'}
          </span>
        </div>
      </div>

      {/* Sol Üst: Yeni/Bitmek Üzere Etiketleri (Şimdilik Kaldırdım) */}
      {/*
      <div className="absolute top-2 left-2 z-20">
        <span className="bg-gradient-to-r from-blue-500 to-emerald-600 text-white border-0 shadow-md backdrop-blur-sm text-xs px-2 py-0.5 rounded-full">
          Yeni
        </span>
      </div>
      */}
    </div>
  );
}