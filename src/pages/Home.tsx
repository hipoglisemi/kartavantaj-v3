import { useState, useMemo, useEffect } from "react";
import { extractMerchants } from '../utils/merchantExtractor';
import { normalizeTurkish } from '../utils/turkishStringHelper';
import Header from "../components/Header";
import HeroSection from "../components/HeroSection";
import CampaignCard, { type CampaignProps } from "../components/CampaignCard";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";
import CampaignDetail from "../components/CampaignDetail";
import Modal from "../components/Modal";
import AdUnit from "../components/AdUnit";
import { ChevronDown, X, Wallet } from "lucide-react";
import { campaignService } from "../services/campaignService";
import { authService } from "../services/authService";

export default function HomePage() {
    const [campaigns, setCampaigns] = useState<CampaignProps[]>([]);
    const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);

    // Wallet Logic
    const [user, setUser] = useState<any>(null);
    const [myCards, setMyCards] = useState<string[]>([]);
    const [isWalletFilterActive, setIsWalletFilterActive] = useState(false);

    // Initialize Data & Admin Check
    useEffect(() => {
        const loadData = async () => {
            console.log("Loading campaigns...");
            try {
                // Manual check to verify superseding fallback
                const rawCampaigns = await campaignService.fetchCampaigns();
                console.log("Raw campaigns fetched:", rawCampaigns.length);

                // Safe Filter: Ensure critical fields exist
                const validCampaigns = rawCampaigns.filter(c =>
                    c &&
                    c.id &&
                    c.title &&
                    c.bank &&
                    c.category
                );

                if (validCampaigns.length === 0) {
                    console.log("No valid campaigns found (Empty Server Data?)");
                }

                setCampaigns(validCampaigns);

            } catch (err) {
                console.error("Critical Load Error:", err);
            }

            setIsAdmin(!!localStorage.getItem('isAdmin'));

            // Load User for Wallet
            const currentUser = await authService.getUser();
            if (currentUser) {
                setUser(currentUser);
                if (currentUser.user_metadata?.my_cards) {
                    setMyCards(currentUser.user_metadata.my_cards);
                }
            }
        };
        loadData();
    }, []);

    const toggleWalletFilter = () => {
        if (!user) {
            alert("Bu özelliği kullanmak için giriş yapmalısınız.");
            return;
        }
        if (myCards.length === 0) {
            alert("Profilinizde kayıtlı kart bulunmamaktadır. Lütfen önce kartlarınızı seçin.");
            // Ideally redirect or show a hint
            return;
        }
        setIsWalletFilterActive(!isWalletFilterActive);
    };

    // Filtreleme State'i
    const [selectedFilters, setSelectedFilters] = useState<{
        banks: string[];
        cards: string[];
        categories: string[];
        brands: string[];
    }>({
        banks: [],
        cards: [],
        categories: [],
        brands: []
    });

    const [searchTerm, setSearchTerm] = useState('');

    // Sayfalama State'i
    const [visibleCount, setVisibleCount] = useState(60);

    const openModal = (id: number) => {
        setSelectedCampaignId(id);
        setIsModalOpen(true);
        // Track View
        campaignService.incrementView(id);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedCampaignId(null);
    };

    // Kampanya Güncelleme Handler'ı
    const handleUpdateCampaign = (updated: CampaignProps) => {
        const success = campaignService.updateCampaign(updated);
        if (success) {
            setCampaigns(prev => prev.map(c => c.id === updated.id ? updated : c));
        }
    };

    const handleDeleteCampaign = (id: number) => {
        const success = campaignService.deleteCampaign(id);
        if (success) {
            setCampaigns(prev => prev.filter(c => c.id !== id));
            closeModal();
            alert("Kampanya silindi.");
        } else {
            alert("Silme işlemi başarısız oldu.");
        }
    };



    // 1. Dinamik Filtre Seçeneklerini ve Sayılarını Hesapla
    const filterOptions = useMemo(() => {
        const counts = {
            banks: {} as Record<string, { total: number; cards: Record<string, number> }>,
            categories: {} as Record<string, number>,
            brands: {} as Record<string, number>
        };

        // Faceted Search: Filter ONLY by search term to show available options
        // Enhanced Search Logic: Title, Bank, Category, Discount
        const infoSource = campaigns.filter(campaign => {
            if (!searchTerm) return true;
            const term = normalizeTurkish(searchTerm);

            const title = normalizeTurkish(campaign.title || '');
            const description = normalizeTurkish(campaign.description || '');
            const bank = normalizeTurkish(campaign.bank || '');
            const category = normalizeTurkish(campaign.category || '');
            const discount = normalizeTurkish(campaign.discount || ''); // Ensure discount field exists or fallback

            return title.includes(term) || description.includes(term) || bank.includes(term) || category.includes(term) || discount.includes(term);
        });

        const brandMap = new Map<string, string>(); // normalized -> Display Name

        infoSource.forEach(campaign => {
            // Banka ve Kart Sayımı (Nested)
            if (campaign.bank) {
                if (!counts.banks[campaign.bank]) {
                    counts.banks[campaign.bank] = { total: 0, cards: {} };
                }
                counts.banks[campaign.bank].total += 1;

                if (campaign.cardName) {
                    const currentCardCount = counts.banks[campaign.bank].cards[campaign.cardName] || 0;
                    counts.banks[campaign.bank].cards[campaign.cardName] = currentCardCount + 1;
                }
            }

            // Kategori Sayımı
            if (campaign.category) counts.categories[campaign.category] = (counts.categories[campaign.category] || 0) + 1;

            // Marka Sayımı (Otomatik Çıkarım & Normalizasyon)
            let brandsToCheck: string[] = [];
            if (campaign.brand) {
                brandsToCheck = [campaign.brand];
            } else {
                brandsToCheck = extractMerchants(campaign.title, campaign.description);
            }

            brandsToCheck.forEach(brand => {
                const normalized = normalizeTurkish(brand);
                // "Hepsiburada" vs "hepsiburada" -> Prefer the one with Capital letter if exists
                if (!brandMap.has(normalized)) {
                    brandMap.set(normalized, brand); // First enty
                } else {
                    // Update display name if current brand has more capital letters (heuristic for better display)
                    const existing = brandMap.get(normalized)!;

                    // Simple heuristic: Prefer shorter version or CamelCase
                    if (brand !== existing && /^[A-Z]/.test(brand) && !/^[A-Z]/.test(existing)) {
                        brandMap.set(normalized, brand);
                    }
                }
            });
        });

        // Re-count brands based on finalized Display Names
        const brandCounts: Record<string, number> = {};
        infoSource.forEach(campaign => {
            let brandsToCheck: string[] = [];
            if (campaign.brand) {
                brandsToCheck = [campaign.brand];
            } else {
                brandsToCheck = extractMerchants(campaign.title, campaign.description);
            }

            // Deduplicate brands for this campaign to avoid double counting same brand if extractor returns duplicates (though extractor uses Set)
            const uniqueCampaignBrands = new Set(brandsToCheck.map(b => normalizeTurkish(b)));

            uniqueCampaignBrands.forEach(normalizedBrand => {
                const displayName = brandMap.get(normalizedBrand);
                if (displayName) {
                    brandCounts[displayName] = (brandCounts[displayName] || 0) + 1;
                }
            });
        });
        counts.brands = brandCounts;

        return counts;
    }, [campaigns, searchTerm]);

    // 2. Kampanyaları Filtrele (Sıralama varsayılan: En yeni)
    const filteredCampaigns = useMemo(() => {
        let result = campaigns.filter(campaign => {
            if (!campaign || !campaign.id) return false;

            // Search Filter (Global)
            if (searchTerm) {
                const term = normalizeTurkish(searchTerm);
                const title = normalizeTurkish(campaign.title || '');
                const description = normalizeTurkish(campaign.description || '');
                const bank = normalizeTurkish(campaign.bank || '');
                const category = normalizeTurkish(campaign.category || '');
                const discount = normalizeTurkish(campaign.discount || '');

                const matches = title.includes(term) || description.includes(term) || bank.includes(term) || category.includes(term) || discount.includes(term);

                if (!matches) return false;
            }

            // Cüzdanım Filtresi (Öncelikli)
            if (isWalletFilterActive) {
                const normalizedBank = normalizeTurkish(campaign.bank).toLowerCase();
                const normalizedCardName = campaign.cardName ? normalizeTurkish(campaign.cardName).toLowerCase() : '';

                // Check if campaign matches any of my cards (ID based usually)
                // myCards contains IDs like 'axess', 'bonus'.
                // We check if bank name contains the ID OR card name contains the ID.
                const matchesWallet = myCards.some(cardId =>
                    normalizedBank.includes(cardId) || normalizedCardName.includes(cardId)
                );

                if (!matchesWallet) return false;
            }

            // Banka Filtresi
            if (selectedFilters.banks.length > 0 && !selectedFilters.banks.includes(campaign.bank)) {
                return false;
            }

            // Kart Filtresi
            if (selectedFilters.cards.length > 0 && campaign.cardName && !selectedFilters.cards.includes(campaign.cardName)) {
                return false;
            }

            // Kategori Filtresi
            if (selectedFilters.categories.length > 0 && !selectedFilters.categories.includes(campaign.category)) {
                return false;
            }
            // Marka Filtresi (Normalize Edilmiş Kontrol - Multi Brand)
            if (selectedFilters.brands.length > 0) {
                let campaignBrands: string[] = [];
                if (campaign.brand) {
                    campaignBrands = [campaign.brand];
                } else {
                    campaignBrands = extractMerchants(campaign.title, campaign.description);
                }

                if (campaignBrands.length === 0) return false;

                // Check if any of the campaign brands match any of the selected filters
                const match = campaignBrands.some(cBrand => {
                    const normalizedCBrand = normalizeTurkish(cBrand);
                    return selectedFilters.brands.some(selected =>
                        normalizeTurkish(selected) === normalizedCBrand
                    );
                });

                if (!match) return false;
            }
            return true;
        });

        // Varsayılan Sıralama: En yeniden eskiye
        result = [...result].sort((a, b) => {
            return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        });

        return result;
    }, [campaigns, selectedFilters, searchTerm]);

    // Sayfalama için Kesilmiş Liste
    const displayedCampaigns = useMemo(() => {
        return filteredCampaigns.slice(0, visibleCount);
    }, [filteredCampaigns, visibleCount]);

    // "Daha Fazla Göster" Handler
    const handleLoadMore = () => {
        setVisibleCount(prev => prev + 30);
    };

    // Filtre Değişim Handler'ı
    const handleFilterChange = (type: 'banks' | 'cards' | 'categories' | 'brands', value: string) => {
        setSelectedFilters(prev => {
            // @ts-ignore - Dynamic key access can be tricky with different array types
            const currentList = prev[type] as string[];
            if (currentList.includes(value)) {
                return { ...prev, [type]: currentList.filter(item => item !== value) };
            } else {
                return { ...prev, [type]: [...currentList, value] };
            }
        });
        // Filtre değişince sayfa başına dön
        setVisibleCount(60);
    };

    const handleClearAllFilters = () => {
        setSelectedFilters({ banks: [], cards: [], categories: [], brands: [] });
    };

    const handleSearchSubmit = () => {
        // Scroll to results
        const resultsElement = document.getElementById('campaign-results');
        if (resultsElement) {
            resultsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const handleClearSearch = () => {
        setSearchTerm('');
    };

    // Scroll To Top Logic
    const [showScrollTop, setShowScrollTop] = useState(false);
    useEffect(() => {
        const checkScroll = () => {
            setShowScrollTop(window.scrollY > 400);
        };
        window.addEventListener('scroll', checkScroll);
        return () => window.removeEventListener('scroll', checkScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };


    const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId);

    return (
        <div className="min-h-screen flex flex-col font-sans bg-gray-50 text-gray-900">
            <Header />
            <HeroSection
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onSearchSubmit={handleSearchSubmit}
            />

            {/* Reklam Alanı: Hero Altı */}
            <div className="container mx-auto px-4 mt-8">
                <AdUnit slotId="1234567890" />
            </div>

            {/* Ana İçerik Alanı (Sidebar + Grid) */}
            <section id="campaign-results" className="container mx-auto px-4 py-8 flex flex-col md:flex-row gap-6">
                {/* Sol Menü */}
                <Sidebar
                    counts={filterOptions}
                    selectedFilters={selectedFilters}
                    onFilterChange={handleFilterChange}
                    onClearAll={handleClearAllFilters}
                />

                {/* Sağ Taraf (Kartlar) */}
                <div className="flex-1">
                    {/* Üst Bar (Başlık ve Sıralama) */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-xl font-bold text-gray-800 tracking-tight">Tüm Kampanyalar</h1>

                                {/* Arama Temizleme İkonu */}
                                {searchTerm && (
                                    <button
                                        onClick={handleClearSearch}
                                        className="flex items-center gap-1.5 px-2 py-1 bg-red-50 text-red-600 rounded-full text-[10px] font-bold hover:bg-red-100 transition-colors animate-in fade-in zoom-in"
                                        title="Aramayı Temizle"
                                    >
                                        <X size={12} />
                                        Aramayı Temizle
                                    </button>
                                )}
                            </div>
                            <p className="text-[11px] text-gray-500 mt-0.5">{filteredCampaigns.length} kampanya bulundu</p>
                        </div>

                        {/* Wallet Toggle */}
                        <button
                            onClick={toggleWalletFilter}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all text-sm border shadow-sm ${isWalletFilterActive
                                ? 'bg-purple-600 text-white border-purple-600 ring-2 ring-purple-100'
                                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                                }`}
                        >
                            <Wallet size={18} className={isWalletFilterActive ? 'fill-current' : ''} />
                            <span>Cüzdanıma Göre</span>
                            {isWalletFilterActive && (
                                <span className="ml-1 bg-white/20 px-1.5 py-0.5 rounded text-[10px]">
                                    {myCards.length}
                                </span>
                            )}
                        </button>

                        {/* Sıralama Kısmı Kaldırıldı */}
                    </div>

                    {/* Admin Debug / Refresh */}
                    {isAdmin && (
                        <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-100 flex flex-col md:flex-row items-center justify-between text-xs text-purple-700 gap-2">
                            <div className="flex items-center gap-2">
                                <strong>Admin Modu:</strong>
                                <span>Toplam {campaigns.length} kampanya.</span>

                                {/* Connection Status Indicator */}
                                <div className="ml-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-white border border-gray-200 shadow-sm">
                                    <div className={`w-2 h-2 rounded-full ${campaigns.length > 0 && campaigns[0].id && Number(campaigns[0].id) > 100000 ? 'bg-orange-500' : 'bg-green-500'}`}></div>
                                    <span className="font-bold">
                                        {/* Simple heuristic: Supabase IDs are usually ints. If we fallback to local JSON, they might be small ints or specific values. 
                                            Actually, let's allow the user to click to test connection. 
                                        */}
                                        Veri Kaynağı: {campaigns.length > 0 && campaigns.some((c: any) => c.id < 1000) ? 'YEREL (Fallback)' : 'SUPABASE (Canlı)'}
                                    </span>
                                </div>
                            </div>

                            {/* Breadcrumbs (Active Filters) */}
                            {(selectedFilters.banks.length > 0 || selectedFilters.cards.length > 0 || selectedFilters.categories.length > 0 || selectedFilters.brands.length > 0) && (
                                <div className="flex flex-wrap gap-2 mb-4 animate-in fade-in slide-in-from-top-1">
                                    {selectedFilters.banks.map(f => (
                                        <button key={`bank-${f}`} onClick={() => handleFilterChange('banks', f)} className="flex items-center gap-1 px-2.5 py-1 bg-purple-50 text-purple-700 text-xs rounded-full border border-purple-100 hover:bg-purple-100 transition-colors group">
                                            <span className="font-medium">{f}</span> <X size={12} className="group-hover:scale-110" />
                                        </button>
                                    ))}
                                    {selectedFilters.cards.map(f => (
                                        <button key={`card-${f}`} onClick={() => handleFilterChange('cards', f)} className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-100 hover:bg-blue-100 transition-colors group">
                                            <span className="font-medium">{f}</span> <X size={12} className="group-hover:scale-110" />
                                        </button>
                                    ))}
                                    {selectedFilters.categories.map(f => (
                                        <button key={`cat-${f}`} onClick={() => handleFilterChange('categories', f)} className="flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 text-xs rounded-full border border-gray-200 hover:bg-gray-200 transition-colors group">
                                            {f} <X size={12} className="group-hover:scale-110" />
                                        </button>
                                    ))}
                                    {selectedFilters.brands.map(f => (
                                        <button key={`brand-${f}`} onClick={() => handleFilterChange('brands', f)} className="flex items-center gap-1 px-2.5 py-1 bg-pink-50 text-pink-700 text-xs rounded-full border border-pink-100 hover:bg-pink-100 transition-colors group">
                                            {f} <X size={12} className="group-hover:scale-110" />
                                        </button>
                                    ))}
                                    <button onClick={() => setSelectedFilters({ banks: [], cards: [], categories: [], brands: [] })} className="text-xs text-gray-400 hover:text-red-500 underline ml-1 transition-colors">
                                        Temizle
                                    </button>
                                </div>
                            )}
                            <button
                                onClick={() => {
                                    setCampaigns(campaignService.getCampaigns());
                                    alert("Veriler yenilendi!");
                                }}
                                className="underline hover:text-purple-900 cursor-pointer"
                            >
                                Verileri Yenile
                            </button>
                        </div>
                    )}

                    {/* Kart Grid Yapısı */}
                    {displayedCampaigns.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                            {displayedCampaigns.map((kampanya: CampaignProps) => (
                                <div
                                    key={kampanya.id}
                                    className="relative group cursor-pointer h-full"
                                    onClick={() => openModal(kampanya.id)}
                                >
                                    <CampaignCard data={kampanya} isAdmin={isAdmin} />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                            <p className="text-gray-500 text-lg">Seçilen kriterlere uygun kampanya bulunamadı.</p>
                            <button
                                onClick={() => setSelectedFilters({ banks: [], cards: [], categories: [], brands: [] })}
                                className="mt-4 text-purple-600 hover:text-purple-700 font-medium hover:underline"
                            >
                                Filtreleri Temizle
                            </button>
                        </div>
                    )}

                    {/* Daha Fazla Butonu */}
                    {visibleCount < filteredCampaigns.length && (
                        <div className="mt-12 text-center">
                            <button
                                onClick={handleLoadMore}
                                className="bg-white border border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 px-8 py-3 rounded-full shadow-sm transition-all cursor-pointer font-medium text-sm"
                            >
                                Daha Fazla Kampanya Gör (+30)
                            </button>
                        </div>
                    )}
                </div>
            </section >

            <Footer />

            {/* Scroll To Top Button */}
            <button
                onClick={scrollToTop}
                className={`fixed bottom-8 right-8 z-40 p-3 bg-white text-purple-600 rounded-full shadow-xl border border-purple-100 transition-all duration-300 transform hover:scale-110 ${showScrollTop ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}
            >
                <ChevronDown className="rotate-180" size={24} />
            </button>

            {/* Modal Yapısı */}
            <Modal isOpen={isModalOpen} onClose={closeModal}>
                {selectedCampaign && (
                    <CampaignDetail
                        data={selectedCampaign}
                        isAdmin={isAdmin}
                        onSave={handleUpdateCampaign}
                        onDelete={handleDeleteCampaign}
                    />
                )}
            </Modal>
        </div >
    );
}
