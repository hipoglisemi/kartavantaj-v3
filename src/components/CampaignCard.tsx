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
const getBadgeStyle = (data: CampaignProps) => {
  // Combine text fields to check for keywords
  const combinedText = (data.title + data.badgeText + (data.earning || '')).toLowerCase();

  // PASTEL RENK PALETİ (Owl Eyes Inspired & Matte)
  // Taksit: Pastel Mint (Soft Green)
  if (combinedText.includes('taksit') || combinedText.includes('vade')) {
    return 'bg-[#d1fae5] text-[#065f46]'; // emerald-100 bg, emerald-800 text
  }
  // Puan: Pastel Periwinkle (Soft Indigo)
  if (combinedText.includes('puan') || combinedText.includes('chip') || combinedText.includes('bonus')) {
    return 'bg-[#e0e7ff] text-[#3730a3]'; // indigo-100 bg, indigo-800 text
  }
  // İndirim: Pastel Sky (Soft Blue)
  if (combinedText.includes('indirim') || combinedText.includes('iade') || combinedText.includes('nakit')) {
    return 'bg-[#dbeafe] text-[#1e40af]'; // blue-100 bg, blue-800 text
  }

  // Default based on category
  switch (data.category) {
    case 'Market': return 'bg-[#ffedd5] text-[#9a3412]'; // orange-100, orange-800
    case 'Giyim': return 'bg-[#fce7f3] text-[#9d174d]'; // pink-100, pink-800
    case 'Elektronik': return 'bg-[#f3f4f6] text-[#1f2937]'; // gray-100, gray-800
    default: return 'bg-[#f1f5f9] text-[#334155]'; // slate-100, slate-700 (General Owl Gray)
  }
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
  // Provider Logoları (Dynamic Lookup)
  const getProviderLogo = (provider: string): string | null => {
    if (data.cardLogo) return data.cardLogo;
    if (!provider) return null;

    // 1. Try to find in localStorage config (Dynamic)
    try {
      const savedConfig = localStorage.getItem('scraper_config');
      if (savedConfig) {
        const banks = JSON.parse(savedConfig) as Array<{ id: string, name: string, logo: string, cards: any[] }>;

        // Search by Name
        const bank = banks.find(b => b.name.toLowerCase().includes(provider.toLowerCase()) || provider.toLowerCase().includes(b.name.toLowerCase()));
        if (bank && bank.logo) return bank.logo;

        // Search by ID (if provider is actually an ID)
        const bankById = banks.find(b => b.id === provider.toLowerCase());
        if (bankById && bankById.logo) return bankById.logo;
      }
    } catch (e) {
      // Fallback silently
    }

    // 2. Fallback to Hardcoded Map (Enhanced for Card Names)
    // Check both bank name and card name/title for better matching (e.g. Axess)
    const searchText = (provider + ' ' + (data.cardName || '') + ' ' + (data.title || '')).toLowerCase();

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
        <span className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 shadow-md backdrop-blur-sm text-xs px-2 py-0.5 rounded-full">
          Yeni
        </span>
      </div>
      */}
    </div>
  );
}