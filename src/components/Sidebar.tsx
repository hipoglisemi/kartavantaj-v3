import { Search, ChevronDown, X } from 'lucide-react';
import { useState } from 'react';
import { settingsService } from '../services/settingsService';
import { sortTurkish } from '../utils/turkishStringHelper';

// Brand Colors - Emerald Theme (No Purple)
const BRAND_COLOR = '#059669'; // Emerald-600
const BRAND_COLOR_LIGHT = 'rgba(5, 150, 105, 0.08)'; // Emerald-50 equivalent
const BRAND_COLOR_BORDER = 'rgba(5, 150, 105, 0.15)';

interface FilterSectionProps {
  title: string;
  counts: Record<string, number>;
  selectedItems: string[];
  placeholder: string;
  onToggle: (value: string) => void;
}

function FilterSection({ title, counts, selectedItems, placeholder, onToggle }: FilterSectionProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const items = sortTurkish(Object.keys(counts));
  const filteredItems = items.filter(item =>
    item.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="mb-6 last:mb-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full mb-3 group"
      >
        <h3 className="font-bold text-gray-900 text-sm flex items-center justify-start gap-2 flex-1">
          <span className="w-1.5 h-1.5 rounded-full group-hover:scale-125 transition-transform" style={{ backgroundColor: BRAND_COLOR }}></span>
          {title}
        </h3>
        <ChevronDown
          size={16}
          className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="animate-in slide-in-from-top-2 duration-200">
          {/* Mini Search */}
          <div className="relative mb-3">
            <Search className="absolute left-2.5 top-2 text-gray-400" size={12} />
            <input
              type="text"
              placeholder={placeholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 py-1.5 pl-8 pr-2 rounded-md text-xs focus:outline-none focus:ring-1 transition-all placeholder:text-gray-400"
              style={{
                borderColor: 'rgba(0,0,0,0.1)',
                '--tw-ring-color': BRAND_COLOR
              } as any}
            />
          </div>

          {/* List */}
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
            {filteredItems.map((item) => (
              <label key={item} className="flex items-center gap-2.5 text-sm text-gray-600 cursor-pointer hover:text-gray-900 group/item">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    className="peer w-4 h-4 rounded border-gray-300 focus:ring-2 transition-all"
                    style={{ color: BRAND_COLOR, '--tw-ring-color': BRAND_COLOR } as any}
                    checked={selectedItems.includes(item)}
                    onChange={() => onToggle(item)}
                  />
                </div>
                <span className="group-hover/item:translate-x-0.5 transition-transform text-xs font-medium flex-1">
                  {item}
                  <span className="font-normal ml-1 px-1.5 py-0.5 rounded-full text-[10px]" style={{ backgroundColor: BRAND_COLOR_LIGHT, color: BRAND_COLOR }}>
                    {counts[item]}
                  </span>
                </span>
              </label>
            ))}
            {filteredItems.length === 0 && (
              <div className="text-xs text-center text-gray-400 py-2">Sonuç bulunamadı</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// --- Nested Filter (Accordion for Banks > Cards) ---
interface NestedFilterSectionProps {
  title: string;
  data: Record<string, { total: number; cards: Record<string, number> }>;
  selectedBanks: string[];
  selectedCards: string[];
  placeholder: string;
  onBankToggle: (bank: string) => void;
  onCardToggle: (card: string) => void;
}

function NestedFilterSection({
  title,
  data,
  selectedBanks,
  selectedCards,
  placeholder,
  onBankToggle,
  onCardToggle,
}: NestedFilterSectionProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [expandedBanks, setExpandedBanks] = useState<string[]>([]);

  const toggleBankAccordion = (bank: string) => {
    if (expandedBanks.includes(bank)) {
      setExpandedBanks(expandedBanks.filter(b => b !== bank));
    } else {
      setExpandedBanks([...expandedBanks, bank]);
    }
  };

  const banks = sortTurkish(Object.keys(data));
  const filteredBanks = banks.filter(bank =>
    bank.toLowerCase().includes(searchTerm.toLowerCase()) ||
    Object.keys(data[bank].cards).some(card => card.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="mb-6 last:mb-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full mb-3 group"
      >
        <h3 className="font-bold text-gray-900 text-sm flex items-center justify-start gap-2 flex-1">
          <span className="w-1.5 h-1.5 rounded-full group-hover:scale-125 transition-transform" style={{ backgroundColor: BRAND_COLOR }}></span>
          {title}
        </h3>
        <ChevronDown
          size={16}
          className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="animate-in slide-in-from-top-2 duration-200">
          <div className="relative mb-3">
            <Search className="absolute left-2.5 top-2 text-gray-400" size={12} />
            <input
              type="text"
              placeholder={placeholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 py-1.5 pl-8 pr-2 rounded-md text-xs focus:outline-none focus:ring-1 transition-all placeholder:text-gray-400"
              style={{
                borderColor: 'rgba(0,0,0,0.1)',
                '--tw-ring-color': BRAND_COLOR
              } as any}
            />
          </div>

          <div className="space-y-1 max-h-64 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
            {filteredBanks.map((bank) => {
              const bankInfo = data[bank];
              const isBankExpanded = expandedBanks.includes(bank) || searchTerm.length > 0;
              const hasCards = Object.keys(bankInfo.cards).length > 0;

              return (
                <div key={bank} className="border-b last:border-0 pb-1 mb-1" style={{ borderColor: BRAND_COLOR_BORDER }}>
                  {/* Bank Header (Accordion Trigger + Selection) */}
                  <div className="flex items-center justify-between py-1 group/bank hover:bg-gray-50 rounded px-1 transition-colors">
                    <label className="flex items-center gap-2 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        className="peer w-4 h-4 rounded border-gray-300 focus:ring-2 transition-all"
                        style={{ color: BRAND_COLOR, '--tw-ring-color': BRAND_COLOR } as any}
                        checked={selectedBanks.includes(bank)}
                        onChange={() => onBankToggle(bank)}
                      />
                      <span className="text-xs font-bold text-gray-700">{bank}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: BRAND_COLOR_LIGHT, color: BRAND_COLOR }}>
                        {bankInfo.total}
                      </span>
                    </label>
                    {hasCards && (
                      <button
                        onClick={(e) => { e.preventDefault(); toggleBankAccordion(bank); }}
                        className="p-1 hover:bg-gray-200 rounded text-gray-400"
                      >
                        <ChevronDown size={14} className={`transition-transform duration-200 ${isBankExpanded ? 'rotate-180' : ''}`} />
                      </button>
                    )}
                  </div>

                  {/* Cards List (Accordion Body) */}
                  {hasCards && isBankExpanded && (
                    <div className="pl-6 space-y-1 mt-1 border-l-2 ml-2" style={{ borderColor: BRAND_COLOR_BORDER }}>
                      {Object.entries(bankInfo.cards).map(([card, count]) => (
                        <label key={card} className="flex items-center gap-2 cursor-pointer group/card py-0.5">
                          <input
                            type="checkbox"
                            className="peer w-3.5 h-3.5 rounded border-gray-300 bg-gray-50 focus:ring-2"
                            style={{ color: BRAND_COLOR, '--tw-ring-color': BRAND_COLOR } as any}
                            checked={selectedCards.includes(card)}
                            onChange={() => onCardToggle(card)}
                          />
                          <span className="text-xs text-gray-600 group-hover/card:text-gray-900 transition-colors">
                            {card} <span className="opacity-60 text-[10px]">({count})</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            {filteredBanks.length === 0 && (
              <div className="text-xs text-center text-gray-400 py-2">Sonuç bulunamadı</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface SidebarProps {
  counts: {
    banks: Record<string, { total: number; cards: Record<string, number> }>;
    categories: Record<string, number>;
    brands: Record<string, number>;
  };
  selectedFilters: {
    banks: string[];
    cards?: string[];
    categories: string[];
    brands: string[];
  };
  onFilterChange: (type: 'banks' | 'cards' | 'categories' | 'brands', value: string) => void;
  onClearAll?: () => void;
}

export default function Sidebar({ counts, selectedFilters, onFilterChange, onClearAll }: SidebarProps) {
  const hasActiveFilters =
    selectedFilters.banks.length > 0 ||
    selectedFilters.categories.length > 0 ||
    selectedFilters.brands.length > 0 ||
    (selectedFilters.cards && selectedFilters.cards.length > 0);

  return (
    <aside className="w-full md:w-72 flex-shrink-0 hidden md:block">
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] sticky top-28">

        {/* Clear All Button */}
        {hasActiveFilters && (
          <button
            onClick={onClearAll}
            className="w-full mb-4 flex items-center justify-center gap-2 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors"
          >
            <X size={14} />
            Filtreleri Temizle
          </button>
        )}

        {/* New Nested Filter for Banks */}
        <NestedFilterSection
          title="BANKA & KARTLAR"
          data={counts.banks}
          selectedBanks={selectedFilters.banks}
          selectedCards={selectedFilters.cards || []}
          onBankToggle={(val) => onFilterChange('banks', val)}
          onCardToggle={(val) => onFilterChange('cards', val)}
          placeholder="Banka veya kart ara..."
        />

        <div className="h-px bg-gray-100 my-4" />
        <FilterSection
          title="SEKTÖRLER"
          counts={counts.categories}
          selectedItems={selectedFilters.categories}
          onToggle={(val) => onFilterChange('categories', val)}
          placeholder="Sektör ara..."
        />
        <div className="h-px bg-gray-100 my-4" />
        <FilterSection
          title="MAĞAZALAR"
          counts={counts.brands}
          selectedItems={selectedFilters.brands}
          onToggle={(val) => onFilterChange('brands', val)}
          placeholder="Mağaza ara..."
        />
      </div>

      {/* Sidebar Reklam Alanı */}
      <SidebarAd />
    </aside>
  );
}

function SidebarAd() {
  const settings = settingsService.useSettings();

  if (!settings.ads.showSidebarAd || !settings.ads.sidebarAdImage) return null;

  return (
    <div className="mt-6 sticky top-[30rem]">
      <a
        href={settings.ads.sidebarAdLink}
        target="_blank"
        rel="noopener noreferrer"
        className="block rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group"
      >
        <div className="relative">
          <img
            src={settings.ads.sidebarAdImage}
            alt="Reklam"
            className="w-full h-auto object-cover"
          />
          <div className="absolute top-2 right-2 bg-black/30 text-white text-[10px] px-1.5 py-0.5 rounded backdrop-blur-sm">
            Reklam
          </div>
        </div>
      </a>
    </div>
  );
}