import { useState, useEffect } from 'react';
import { Database, ChevronDown, ChevronRight, Trash2, Calendar, Tag, CreditCard, Link, Plus, Sparkles, Loader2, Settings, CloudUpload } from 'lucide-react';
import { type CampaignProps } from '../../components/CampaignCard';
import { campaignParser } from '../../services/campaignParser';
import { campaignService } from '../../services/campaignService';
import CampaignValidationPanel from '../../components/CampaignValidationPanel';
import { logActivity } from '../../services/activityService';
// import { syncToSupabase } from '../../services/universalSyncService'; // DISABLED: Admin tables don't exist in Supabase

interface CardConfig {
    id: string;
    name: string;
}

interface BankConfig {
    id: string;
    name: string;
    logo: string;
    cards: CardConfig[];
}

// Helper to get banks
const getBanksConfig = (): BankConfig[] => {
    const saved = localStorage.getItem('scraper_config');
    if (saved) return JSON.parse(saved);
    return [];
};

// Storage for campaigns
const getCampaignsData = (): Record<string, CampaignProps[]> => {
    const saved = localStorage.getItem('campaign_data');
    return saved ? JSON.parse(saved) : {};
};

import CampaignDetail from '../../components/CampaignDetail';
import Modal from '../../components/Modal';
import { useConfirmation } from '../../context/ConfirmationContext';

export default function AdminCampaigns() {
    // ... (rest of the code)

    const [banks, setBanks] = useState<BankConfig[]>([]);
    const [campaignsMap, setCampaignsMap] = useState<Record<string, CampaignProps[]>>({});

    // Auto-Archiving Logic
    useEffect(() => {
        const checkExpiry = () => {
            const now = new Date();
            let hasChanges = false;
            const currentMap = getCampaignsData();
            const newMap = { ...currentMap };

            Object.keys(newMap).forEach(cardId => {
                const list = newMap[cardId];
                const updatedList = list.map(c => {
                    if (c.validUntil && !c.isArchived) {
                        const endDate = new Date(c.validUntil);
                        // If validUntil is yesterday or before (end of campaign)
                        // Simple check: if now > endDate (assuming endDate is 23:59 usually effectively, but here date string 00:00)
                        // Let's add 1 day to be safe or strictly check date parts. 
                        // "2023-12-31" usually means it IS valid on 31st. So expire on Jan 1.
                        const expiryCheck = new Date(endDate);
                        expiryCheck.setDate(expiryCheck.getDate() + 1);

                        if (now > expiryCheck) {
                            hasChanges = true;
                            return { ...c, isArchived: true, isApproved: false };
                        }
                    }
                    return c;
                });
                newMap[cardId] = updatedList;
            });

            if (hasChanges) {
                console.log("Auto-archiving expired campaigns...");
                updateCampaigns(newMap);
            }
        };

        // Run once on mount (with a slight delay to ensure data loaded)
        // Actually getCampaignsData() is synchronous so we can run it.
        // We added it to the main effect below or separate? 
        // Let's put it in a separate effect that depends on nothing but runs after mount.
        const timer = setTimeout(checkExpiry, 1000);
        return () => clearTimeout(timer);
    }, []);

    const [expandedBank, setExpandedBank] = useState<string | null>(null);
    const [expandedCard, setExpandedCard] = useState<string | null>(null);
    const [showArchived, setShowArchived] = useState(false);
    
    // Bank and Card Management States
    const [isAddingBank, setIsAddingBank] = useState(false);
    const [newBankName, setNewBankName] = useState('');
    const [isAddingCard, setIsAddingCard] = useState<string | null>(null);
    const [newCardName, setNewCardName] = useState('');



    const { confirm, alert } = useConfirmation();

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCampaign, setSelectedCampaign] = useState<CampaignProps | null>(null);

    useEffect(() => {
        // Initial Load
        const initialBanks = getBanksConfig();
        setBanks([
            ...initialBanks,
            {
                id: 'other_bank',
                name: 'Diğer / Kategorisiz',
                logo: 'https://cdn-icons-png.flaticon.com/512/10009/10009968.png',
                cards: [{ id: 'uncategorized_card', name: 'Tanımsız Kampanyalar' }]
            }
        ]);
        // Load campaigns from Supabase (same as Dashboard and Homepage)
        const loadCampaignsFromSupabase = async () => {
            try {
                if (localStorage.getItem('isAdmin') === 'true') {
                    console.log("AdminCampaigns: Loading campaigns from Supabase...");
                }
                const supabaseCampaigns = await campaignService.fetchCampaigns(true); // Include unapproved
                
                if (supabaseCampaigns.length > 0) {
                    // Convert flat array to card-based map
                    const newMap: Record<string, CampaignProps[]> = {};
                    
                    // Initialize all card buckets
                    const currentBanks = getBanksConfig();
                    currentBanks.forEach(b => b.cards.forEach(c => {
                        newMap[c.id] = [];
                    }));
                    newMap['uncategorized_card'] = [];
                    
                    // Distribute campaigns to appropriate cards
                    supabaseCampaigns.forEach((campaign: any) => {
                        let targetCardId = 'uncategorized_card';
                        
                        // Try to find matching card by cardName
                        if (campaign.cardName) {
                            for (const bank of currentBanks) {
                                const match = bank.cards.find(c => c.name === campaign.cardName);
                                if (match) {
                                    targetCardId = match.id;
                                    break;
                                }
                            }
                        }
                        
                        if (newMap[targetCardId]) {
                            newMap[targetCardId].push(campaign);
                        }
                    });
                    
                    setCampaignsMap(newMap);
                    // Also update localStorage for consistency
                    localStorage.setItem('campaign_data', JSON.stringify(newMap));
                    if (localStorage.getItem('isAdmin') === 'true') {
                        console.log(`AdminCampaigns: Loaded ${supabaseCampaigns.length} campaigns from Supabase`);
                    }
                } else {
                    if (localStorage.getItem('isAdmin') === 'true') {
                        console.log("AdminCampaigns: No campaigns found in Supabase, checking localStorage...");
                    }
                    // Fallback to localStorage if Supabase is empty
                    setCampaignsMap(getCampaignsData());
                }
            } catch (error) {
                console.error("AdminCampaigns: Failed to load from Supabase, using localStorage:", error);
                setCampaignsMap(getCampaignsData());
            }
        };
        
        loadCampaignsFromSupabase();

        // Listen for storage changes in case other tabs update it
        const handleStorage = () => {
            setBanks([
                ...getBanksConfig(),
                {
                    id: 'other_bank',
                    name: 'Diğer / Kategorisiz',
                    logo: 'https://cdn-icons-png.flaticon.com/512/10009/10009968.png',
                    cards: [{ id: 'uncategorized_card', name: 'Tanımsız Kampanyalar' }]
                }
            ]);
            // setCampaignsMap(getCampaignsData()); // Disable local listener override? 
            // Actually, if we edit in another tab, we might want to see it? 
            // unique requirement: "Cloud First". 
            // Let's keep local sync active ONLY for intra-session updates (like 'Save' button in modal updating layout).
            // But relying on cloud for initial state is the key.
            const saved = localStorage.getItem('campaign_data');
            if (saved) setCampaignsMap(JSON.parse(saved));
        };
        window.addEventListener('storage', handleStorage);
        // Custom event for same-tab sync
        window.addEventListener('campaigns-updated', handleStorage);
        return () => {
            window.removeEventListener('storage', handleStorage);
            window.removeEventListener('campaigns-updated', handleStorage);
        };
    }, []);

    // Placeholder for manual creation if needed later, or remove if unused.
    // For now, removing the unused "handleCreateNew" that depended on separate state.
    // Use "Linkten Ekle" as the primary new flow.
    const handleCreateNew = () => {
        if (!expandedCard) {
            alert('Lütfen önce soldan bir kart seçiniz!');
            return;
        }

        // Seçili kart ve banka bilgisini al
        const activeBank = banks.find(b => b.id === expandedBank);
        const activeCard = activeBank?.cards.find(c => c.id === expandedCard);

        const newCampaign: CampaignProps = {
            id: Date.now(),
            title: 'Yeni Kampanya',
            image: 'https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?auto=format&fit=crop&q=80&w=800',
            badgeText: 'Fırsat',
            badgeColor: 'purple',
            bank: activeBank?.name || 'Diğer', // Gerçek banka adı
            cardName: activeCard?.name, // Kart adı
            category: 'Genel',
            validUntil: '2025-12-31',
            isApproved: false
        };

        const updatedList = [newCampaign, ...(campaignsMap[expandedCard] || [])];
        const newMap = { ...campaignsMap, [expandedCard]: updatedList };
        updateCampaigns(newMap);

        // Automatically open the modal for the new campaign
        setSelectedCampaign(newCampaign);
        setIsModalOpen(true);
    };

    const handleDeleteCampaign = async (cardId: string, campaignId: number) => {
        if (await confirm({
            title: 'Kampanyayı Sil',
            message: 'Bu kampanyayı silmek istediğinize emin misiniz? Bu işlem hem yerel hem Supabase\'den silinecek ve geri alınamaz.',
            type: 'danger'
        })) {
            const campaign = (campaignsMap[cardId] || []).find(c => c.id === campaignId);
            console.log(`🗑️ DELETING Campaign ID: ${campaignId} from card: ${cardId}`);
            console.log(`🗑️ Campaign title: ${campaign?.title}`);
            
            // 1. Delete from Supabase FIRST (to prevent re-sync issues)
            const supabaseUrl = localStorage.getItem('sb_url');
            const supabaseKey = localStorage.getItem('sb_key');
            
            let supabaseDeleted = false;
            
            if (supabaseUrl && supabaseKey) {
                try {
                    const { createClient } = await import('@supabase/supabase-js');
                    const supabase = createClient(supabaseUrl, supabaseKey);
                    
                    console.log(`🗑️ Step 1: Deleting from Supabase first...`);
                    
                    // Delete directly without checking existence (more reliable)
                    const { error: deleteError, count } = await supabase
                        .from('campaigns')
                        .delete({ count: 'exact' })
                        .eq('id', campaignId);
                    
                    if (deleteError) {
                        console.error('🚨 Supabase delete error:', deleteError);
                        await alert(`❌ Supabase Silme Hatası:\n\n${deleteError.message}\n\nYerel silme işlemi iptal edildi.`, 'Hata');
                        return; // Don't proceed with local delete if Supabase fails
                    } else {
                        console.log(`✅ Campaign ${campaignId} deleted from Supabase. Rows affected: ${count}`);
                        supabaseDeleted = true;
                        
                        // Wait a moment for Supabase to process
                        await new Promise(resolve => setTimeout(resolve, 500));
                    }
                } catch (error) {
                    console.error('🚨 Supabase delete failed:', error);
                    await alert(`❌ Supabase Bağlantı Hatası:\n\n${error}\n\nYerel silme işlemi iptal edildi.`, 'Hata');
                    return; // Don't proceed with local delete if Supabase fails
                }
            }
            
            // 2. Delete from localStorage AFTER Supabase success
            console.log(`🗑️ Step 2: Deleting from localStorage...`);
            const updatedList = (campaignsMap[cardId] || []).filter(c => c.id !== campaignId);
            const newMap = { ...campaignsMap, [cardId]: updatedList };
            console.log(`🗑️ Updated list length: ${updatedList.length} (was ${(campaignsMap[cardId] || []).length})`);
            
            updateCampaigns(newMap);
            console.log(`🗑️ localStorage updated`);
            
            // 3. Force refresh all components to prevent ghost data
            setTimeout(() => {
                window.dispatchEvent(new Event('campaigns-updated'));
                window.dispatchEvent(new Event('storage'));
                console.log(`🔄 Forced refresh events dispatched`);
            }, 100);
            
            // 4. Log the successful operation
            if (supabaseDeleted) {
                logActivity.campaign('Campaign Deleted', `Campaign "${campaign?.title || campaignId}" deleted from both Supabase and localStorage`, 'warning');
                console.log(`✅ Complete deletion successful for campaign ${campaignId}`);
            } else {
                logActivity.campaign('Campaign Deleted', `Campaign "${campaign?.title || campaignId}" deleted from localStorage only (Supabase config missing)`, 'warning');
                console.log(`⚠️ Local-only deletion for campaign ${campaignId}`);
            }
        }
    };

    const handlePublishAll = async (cardId: string) => {
        if (await confirm({
            title: 'Tümünü Yayınla',
            message: 'Bu karta ait TÜM kampanyalar yayına alınacak (Onaylanacak). Emin misiniz?',
            type: 'warning'
        })) {
            const updatedList = (campaignsMap[cardId] || []).map(c => ({ ...c, isApproved: true }));
            const newMap = { ...campaignsMap, [cardId]: updatedList };
            updateCampaigns(newMap);
            logActivity.campaign('Bulk Publish', `All campaigns published for ${cardId}`, 'success');
        }
    };

    const handleDeleteAllCampaigns = async (cardId: string) => {
        if (await confirm({
            title: 'Tümünü Sil',
            message: 'Bu karta ait TÜM kampanyalar SİLİNECEK! Bu işlem hem yerel hem Supabase\'den silinecek ve geri alınamaz. Emin misiniz?',
            type: 'danger'
        })) {
            const campaigns = campaignsMap[cardId] || [];
            const campaignCount = campaigns.length;
            const campaignIds = campaigns.map(c => c.id);
            
            console.log(`🗑️ BULK DELETE: ${campaignCount} campaigns from ${cardId}`);
            console.log(`🗑️ Campaign IDs:`, campaignIds);
            
            // 1. Delete from Supabase FIRST
            const supabaseUrl = localStorage.getItem('sb_url');
            const supabaseKey = localStorage.getItem('sb_key');
            
            let supabaseDeleted = false;
            
            if (supabaseUrl && supabaseKey && campaignIds.length > 0) {
                try {
                    const { createClient } = await import('@supabase/supabase-js');
                    const supabase = createClient(supabaseUrl, supabaseKey);
                    
                    console.log(`🗑️ Step 1: Bulk deleting ${campaignIds.length} campaigns from Supabase...`);
                    
                    const { error, count } = await supabase
                        .from('campaigns')
                        .delete({ count: 'exact' })
                        .in('id', campaignIds);
                    
                    if (error) {
                        console.error('🚨 Supabase bulk delete error:', error);
                        await alert(`❌ Supabase Toplu Silme Hatası:\n\n${error.message}\n\nYerel silme işlemi iptal edildi.`, 'Hata');
                        return; // Don't proceed with local delete if Supabase fails
                    } else {
                        console.log(`✅ ${count || campaignIds.length} campaigns deleted from Supabase`);
                        supabaseDeleted = true;
                        
                        // Wait for Supabase to process
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                } catch (error) {
                    console.error('🚨 Supabase bulk delete failed:', error);
                    await alert(`❌ Supabase Bağlantı Hatası:\n\n${error}\n\nYerel silme işlemi iptal edildi.`, 'Hata');
                    return; // Don't proceed with local delete if Supabase fails
                }
            }
            
            // 2. Delete from localStorage AFTER Supabase success
            console.log(`🗑️ Step 2: Clearing localStorage for ${cardId}...`);
            const newMap = { ...campaignsMap, [cardId]: [] };
            updateCampaigns(newMap);
            
            // 3. Force refresh all components
            setTimeout(() => {
                window.dispatchEvent(new Event('campaigns-updated'));
                window.dispatchEvent(new Event('storage'));
                console.log(`🔄 Forced refresh after bulk delete`);
            }, 100);
            
            // 4. Log the operation
            if (supabaseDeleted) {
                logActivity.campaign('Bulk Delete', `All ${campaignCount} campaigns deleted from ${cardId} (Supabase + localStorage)`, 'warning');
                console.log(`✅ Complete bulk deletion successful for ${cardId}`);
            } else {
                logActivity.campaign('Bulk Delete', `All ${campaignCount} campaigns deleted from ${cardId} (localStorage only)`, 'warning');
                console.log(`⚠️ Local-only bulk deletion for ${cardId}`);
            }
        }
    };

    const handleToggleApproval = (cardId: string, campaignId: number, currentStatus: boolean | undefined) => {
        const updatedList = (campaignsMap[cardId] || []).map(c =>
            c.id === campaignId ? { ...c, isApproved: !currentStatus } : c
        );
        const newMap = { ...campaignsMap, [cardId]: updatedList };
        updateCampaigns(newMap);
    };

    const handleFindDuplicates = async () => {
        const allCampaigns: { cardId: string, campaign: CampaignProps }[] = [];
        Object.keys(campaignsMap).forEach(cardId => {
            campaignsMap[cardId].forEach(c => allCampaigns.push({ cardId, campaign: c }));
        });

        // Simple check by Title and Bank
        const seen = new Map<string, { cardId: string, campaign: CampaignProps }[]>();
        allCampaigns.forEach(item => {
            const key = (item.campaign.title + '-' + item.campaign.bank).toLowerCase().trim();
            if (!seen.has(key)) seen.set(key, []);
            seen.get(key)?.push(item);
        });

        const duplicates: string[] = [];
        seen.forEach((items) => {
            if (items.length > 1) {
                duplicates.push(`${items[0].campaign.bank} - ${items[0].campaign.title} (${items.length} adet)`);
            }
        });

        if (duplicates.length > 0) {
            await alert(`⚠️ Tekrarlayan Kampanyalar Bulundu:\n\n${duplicates.slice(0, 10).join('\n')}\n...ve daha fazlası.`, "Tekrarlayanlar");
        } else {
            await alert('✅ Süper! Tekrarlayan kampanya bulunamadı.', "Temiz Durum");
        }
    };

    const handleSaveCampaignDetail = (updated: CampaignProps) => {
        if (!expandedCard) return;
        // Find which card it belongs to if we were passed purely the campaign
        // But here we rely on expandedCard context.

        const updatedList = (campaignsMap[expandedCard] || []).map(c =>
            c.id === updated.id ? updated : c
        );
        const newMap = { ...campaignsMap, [expandedCard]: updatedList };
        updateCampaigns(newMap);

        // Update modal data too so it reflects immediately
        setSelectedCampaign(updated);
    };

    const handleDeleteFromDetail = (id: number) => {
        if (expandedCard) {
            closeModal(); // Close detail modal first
            handleDeleteCampaign(expandedCard, id); // Trigger confirm modal
        }
    };

    // Helper to update state and storage events with auto-sync
    const updateCampaigns = (newMap: Record<string, CampaignProps[]>) => {
        setCampaignsMap(newMap);
        localStorage.setItem('campaign_data', JSON.stringify(newMap));
        window.dispatchEvent(new Event('campaigns-updated'));
        
        // Auto-sync to Supabase (fire and forget)
        autoSyncToSupabase(newMap);
    };

    // Auto-sync function (non-blocking)
    const autoSyncToSupabase = async (campaignsMap: Record<string, CampaignProps[]>) => {
        const supabaseUrl = localStorage.getItem('sb_url');
        const supabaseKey = localStorage.getItem('sb_key');
        
        if (!supabaseUrl || !supabaseKey) return; // Skip if no config
        
        try {
            // Convert map to flat array for Supabase
            const allCampaigns: CampaignProps[] = [];
            Object.entries(campaignsMap).forEach(([, campaigns]) => {
                campaigns.forEach(campaign => {
                    allCampaigns.push(campaign);
                });
            });
            
            const { createClient } = await import('@supabase/supabase-js');
            const supabase = createClient(supabaseUrl, supabaseKey);
            
            // Clear existing campaigns first (use neq 0 for reliable deletion)
            const { error: deleteError } = await supabase.from('campaigns').delete().neq('id', 0);
            if (deleteError && localStorage.getItem('isAdmin') === 'true') {
                console.error('🚨 Auto-sync delete error:', deleteError);
            }
            
            // Insert new campaigns
            if (allCampaigns.length > 0) {
                const dbRecords = allCampaigns.map(c => ({
                    id: c.id,
                    title: c.title,
                    description: c.description || '',
                    bank: c.bank || 'Diğer',
                    card_name: c.cardName,
                    category: c.category || 'Genel',
                    valid_until: c.validUntil && c.validUntil.length > 4 ? c.validUntil : null,
                    is_approved: c.isApproved !== false,
                    image: c.image || null,
                    url: c.url || null,
                    badge_text: c.badgeText,
                    badge_color: c.badgeColor,
                    min_spend: c.min_spend || 0,
                    earning: c.earning,
                    discount: c.discount,
                    participation_method: c.participation_method,
                    valid_from: c.valid_from && c.valid_from.length > 4 ? c.valid_from : null,
                    eligible_customers: c.eligible_customers || [],
                    conditions: c.conditions || [],
                    participation_points: c.participation_points || []
                }));
                
                const { error: insertError } = await supabase.from('campaigns').insert(dbRecords);
                if (insertError && localStorage.getItem('isAdmin') === 'true') {
                    console.error('🚨 Auto-sync insert error:', insertError);
                }
            }
            
            if (localStorage.getItem('isAdmin') === 'true') {
                console.log(`🔄 Auto-synced ${allCampaigns.length} campaigns to Supabase`);
            }
        } catch (error) {
            // Silent fail - don't interrupt user experience
            if (localStorage.getItem('isAdmin') === 'true') {
                console.error('Auto-sync failed:', error);
            }
        }
    };

    // Bank and Card Management Functions
    const saveBanksConfig = async (banks: BankConfig[]) => {
        localStorage.setItem('scraper_config', JSON.stringify(banks));
        
        // Universal sync - DISABLED: Admin tables don't exist in Supabase
        // await syncToSupabase('admin_logos', banks, { 
        //     action: 'banks_update',
        //     count: banks.length
        // });
        
        // Dispatch event for other components to update
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new Event('campaigns-updated'));
    };

    const handleAddBank = async () => {
        if (!newBankName.trim()) return;
        
        const id = newBankName.toLowerCase().replace(/[^a-z0-9]/g, '');
        const newBank: BankConfig = {
            id,
            name: newBankName,
            logo: `https://placehold.co/100x100?text=${newBankName.substring(0, 2).toUpperCase()}`,
            cards: []
        };
        
        // Exclude the "other_bank" from the saved config
        const currentBanks = banks.filter(b => b.id !== 'other_bank');
        const updated = [...currentBanks, newBank];
        
        // Update state with the new bank + other_bank
        setBanks([...updated, {
            id: 'other_bank',
            name: 'Diğer / Kategorisiz',
            logo: 'https://cdn-icons-png.flaticon.com/512/10009/10009968.png',
            cards: [{ id: 'uncategorized_card', name: 'Tanımsız Kampanyalar' }]
        }]);
        
        await saveBanksConfig(updated);
        
        // Activity log
        logActivity.settings('Bank Added', `New bank added: ${newBankName}`, 'success');
        
        setNewBankName('');
        setIsAddingBank(false);
        
        // Auto-expand the new bank
        setExpandedBank(id);
    };

    const handleAddCard = async (bankId: string) => {
        if (!newCardName.trim()) return;
        
        const cardId = newCardName.toLowerCase().replace(/[^a-z0-9]/g, '');
        const newCard: CardConfig = {
            id: cardId,
            name: newCardName,
        };

        // Exclude the "other_bank" from the saved config
        const currentBanks = banks.filter(b => b.id !== 'other_bank');
        const updatedBanks = currentBanks.map(bank => {
            if (bank.id === bankId) {
                return {
                    ...bank,
                    cards: [...bank.cards, newCard]
                };
            }
            return bank;
        });

        // Update state with the updated banks + other_bank
        setBanks([...updatedBanks, {
            id: 'other_bank',
            name: 'Diğer / Kategorisiz',
            logo: 'https://cdn-icons-png.flaticon.com/512/10009/10009968.png',
            cards: [{ id: 'uncategorized_card', name: 'Tanımsız Kampanyalar' }]
        }]);

        await saveBanksConfig(updatedBanks);
        
        // Activity log
        const bankName = banks.find(b => b.id === bankId)?.name;
        logActivity.settings('Card Added', `New card added: ${newCardName} to ${bankName}`, 'success');
        
        setNewCardName('');
        setIsAddingCard(null);
        
        // Auto-select the new card
        setExpandedCard(cardId);
    };

    const openModal = (campaign: CampaignProps) => {
        setSelectedCampaign(campaign);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedCampaign(null);
    };

    // Import Modal State
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importUrl, setImportUrl] = useState('');
    const [importApiKey, setImportApiKey] = useState(''); // Local state for the modal input
    const [importStep, setImportStep] = useState<'idle' | 'analyzing' | 'success'>('idle');

    const handleOpenImportModal = () => {
        const key = localStorage.getItem('gemini_key') || import.meta.env.VITE_GEMINI_API_KEY || '';
        setImportApiKey(key);
        setImportUrl('');
        setImportStep('idle');
        setIsImportModalOpen(true);
    };

    const handleUrlImport = async () => {
        if (!importUrl) return;

        setImportStep('analyzing');
        try {
            // Use the key from the modal input (user might have just pasted it)
            const effectiveKey = importApiKey.trim();

            // Save it if it was missing or changed, so they don't have to enter it again
            if (effectiveKey && effectiveKey !== localStorage.getItem('gemini_key')) {
                localStorage.setItem('gemini_key', effectiveKey);
            }

            const parsedData = await campaignParser.fetchAndParse(importUrl, effectiveKey);

            if (!expandedCard) {
                alert('Lütfen arka planda bir kart seçiniz! (Bu modal kapatılacak)');
                setIsImportModalOpen(false);
                return;
            }

            // Seçili kart ve banka bilgisini al
            const activeBank = banks.find(b => b.id === expandedBank);
            const activeCard = activeBank?.cards.find(c => c.id === expandedCard);

            const newCampaign: CampaignProps = {
                id: Date.now(),
                title: parsedData.title || 'Yeni Kampanya',
                image: parsedData.image || 'https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?auto=format&fit=crop&q=80&w=800',
                badgeText: parsedData.badgeText || 'Fırsat',
                badgeColor: parsedData.badgeColor || 'purple',
                bank: activeBank?.name || parsedData.bank || 'Diğer', // Önce seçili banka, sonra parsed data
                cardName: activeCard?.name, // Seçili kartın adı
                category: parsedData.category || 'Genel',
                validUntil: parsedData.validUntil || '2025-12-31',
                valid_from: parsedData.valid_from,
                isApproved: false,
                conditions: parsedData.conditions,
                participation_points: parsedData.participation_points,
                description: parsedData.description,
                min_spend: parsedData.min_spend,
                earning: parsedData.earning,
                discount: parsedData.discount,
                validCards: parsedData.validCards,
                participation_method: parsedData.participation_method,
                url: parsedData.url
            };

            const updatedList = [newCampaign, ...(campaignsMap[expandedCard] || [])];
            const newMap = { ...campaignsMap, [expandedCard]: updatedList };
            updateCampaigns(newMap);

            // Close Import Modal
            setIsImportModalOpen(false);

            // Open Detail Modal for Review
            setSelectedCampaign(newCampaign);
            setIsModalOpen(true);

        } catch (error) {
            alert('Hata: ' + error);
            setImportStep('idle');
        }
    };




    // Batch AI State
    const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
    const [batchProgress, setBatchProgress] = useState(0); // 0 to 100
    const [batchStatus, setBatchStatus] = useState('');
    const [timeRemaining, setTimeRemaining] = useState('');

    const handleBatchAI = async () => {
        // ... (existing code for handleBatchAI)
        if (!expandedCard) {
            alert('Lütfen bir kart seçiniz.');
            return;
        }

        const list = campaignsMap[expandedCard] || [];
        // Filter campaigns that need fixing? For now, let's fix ALL active ones or filter by those with generic descriptions?
        // Let's prompt user or just process all unarchived.
        const toProcess = list.filter(c => !c.isArchived);

        if (toProcess.length === 0) {
            alert('İşlenecek kampanya bulunamadı.');
            return;
        }

        const confirmStart = await confirm({
            title: 'Toplu AI Düzenleme',
            message: `${toProcess.length} adet kampanya analiz edilip detayları zenginleştirilecek. Bu işlem model limitlerine takılmamak için biraz zaman alabilir. Devam edilsin mi?`,
            type: 'info'
        });

        if (!confirmStart) return;

        setIsBatchModalOpen(true);
        setBatchProgress(0);

        let processed = 0;
        const startTime = Date.now();
        const apiKey = localStorage.getItem('gemini_key') || '';

        if (!apiKey) {
            setBatchStatus('API Anahtarı bulunamadı! Ayarladan ekleyin.');
            // Keep modal open to show error
            return;
        }

        const updatedList = [...list];

        for (const camp of toProcess) {
            setBatchStatus(`Analiz ediliyor: ${camp.title.substring(0, 30)}...`);

            try {
                // If url exists, we can re-parse. If not, we can only improve existing text (implementation choice).
                // Let's assume we re-fetch if URL exists for fresh data, OR just improve description.
                // campaignParser currently fetches URL.
                if (camp.url) {
                    const parsed = await campaignParser.fetchAndParse(camp.url, apiKey);

                    // Merge
                    const refined: CampaignProps = {
                        ...camp,
                        ...parsed,
                        id: camp.id, // Keep ID
                        isApproved: true, // Auto approve? Maybe not.
                        brand: parsed.brand || camp.brand // Keep parsed brand
                    };

                    // Update local list array
                    const idx = updatedList.findIndex(c => c.id === camp.id);
                    if (idx !== -1) updatedList[idx] = refined;
                }
            } catch (e) {
                console.error("Batch fail for", camp.id, e);
                // Continue to next
            }

            processed++;
            setBatchProgress((processed / toProcess.length) * 100);

            // Estimate time remaining
            const elapsed = Date.now() - startTime;
            const avgTime = elapsed / processed;
            const remainingArray = toProcess.length - processed;
            const remTimeMs = remainingArray * avgTime;
            setTimeRemaining(`${Math.ceil(remTimeMs / 1000)} sn`);

            // Save intermediate progress
            // (Optional: safer to save at end to avoid flicker, but here we update state map at end)

            // Rate limit wait
            await new Promise(r => setTimeout(r, 2000));
        }

        setBatchStatus('Tamamlandı!');
        updateCampaigns({ ...campaignsMap, [expandedCard]: updatedList });

        setTimeout(() => {
            setIsBatchModalOpen(false);
            alert('Toplu işlem başarıyla tamamlandı!');
        }, 1000);
    };

    // Clear Supabase Only Function
    const handleClearSupabaseOnly = async () => {
        if (await confirm({
            title: '🗑️ Supabase Kampanyalarını Temizle',
            message: 'Bu işlem SADECE Supabase\'deki tüm kampanyaları silecek.\n\nYerel veriler (localStorage) korunacak.\n\nBu işlem geri alınamaz!\n\nEmin misiniz?',
            confirmText: 'EVET, Supabase\'i Temizle',
            type: 'warning'
        })) {
            const supabaseUrl = localStorage.getItem('sb_url');
            const supabaseKey = localStorage.getItem('sb_key');
            
            if (!supabaseUrl || !supabaseKey) {
                await alert('❌ Hata: Supabase bağlantı bilgileri bulunamadı!\n\nEntegrasyonlar sayfasından Supabase ayarlarını kontrol edin.', 'Bağlantı Hatası');
                return;
            }
            
            try {
                const { createClient } = await import('@supabase/supabase-js');
                const supabase = createClient(supabaseUrl, supabaseKey);
                
                // Admin-only debug logs (hidden from public)
                const isAdmin = localStorage.getItem('isAdmin') === 'true';
                if (isAdmin) {
                    console.log('🔍 SUPABASE CLEAR: Testing connection...');
                    console.log(`URL: ${supabaseUrl}`);
                    console.log(`Key: ${supabaseKey.substring(0, 20)}...`);
                }
                
                // Get current count first
                const { count: initialCount, error: countError } = await supabase
                    .from('campaigns')
                    .select('*', { count: 'exact', head: true });
                
                if (countError) {
                    console.error('🚨 Count error:', countError);
                    throw new Error(`Count error: ${countError.message}`);
                }
                
                console.log(`📊 Supabase'de ${initialCount || 0} kampanya bulundu`);
                
                if (!initialCount || initialCount === 0) {
                    await alert('ℹ️ Supabase zaten boş!\n\nSilinecek kampanya bulunamadı.', 'Bilgi');
                    return;
                }
                
                // Show sample data for confirmation
                const { data: sampleData } = await supabase
                    .from('campaigns')
                    .select('id, title, bank')
                    .limit(3);
                
                console.log('📋 Sample campaigns to be deleted:', sampleData);
                
                // Get all campaign IDs first, then delete them
                console.log('🗑️ Getting all campaign IDs...');
                const { data: allCampaigns, error: fetchError } = await supabase
                    .from('campaigns')
                    .select('id');
                
                if (fetchError) {
                    throw new Error(`Fetch error: ${fetchError.message}`);
                }
                
                if (!allCampaigns || allCampaigns.length === 0) {
                    console.log('ℹ️ No campaigns found to delete');
                    await alert('ℹ️ Supabase zaten boş!\n\nSilinecek kampanya bulunamadı.', 'Bilgi');
                    return;
                }
                
                const allIds = allCampaigns.map(c => c.id);
                console.log(`🗑️ Deleting ${allIds.length} campaigns by ID...`, allIds);
                
                // Delete using IN clause with all IDs (with RLS bypass attempt)
                const { error: deleteError, count: deletedCount } = await supabase
                    .from('campaigns')
                    .delete({ count: 'exact' })
                    .in('id', allIds);
                
                if (deleteError) {
                    console.error('🚨 Delete operation failed:', deleteError);
                    throw new Error(`Delete error: ${deleteError.message}`);
                }
                
                console.log(`✅ Delete operation completed. Rows affected: ${deletedCount}`);
                
                // Verify deletion with longer delay for Supabase consistency
                console.log('⏳ Waiting for Supabase to process deletion...');
                await new Promise(resolve => setTimeout(resolve, 3000));
                
                console.log('🔍 Verifying deletion...');
                const { count: remainingCount } = await supabase
                    .from('campaigns')
                    .select('*', { count: 'exact', head: true });
                
                console.log(`🔍 Verification: ${remainingCount || 0} campaigns remaining`);
                
                logActivity.campaign('Supabase Cleared', `${deletedCount || initialCount} campaigns deleted from Supabase only`, 'warning');
                
                await alert(`✅ Supabase Temizlendi!\n\n${deletedCount || initialCount} kampanya silindi.\n${remainingCount || 0} kampanya kaldı.\n\nYerel veriler korundu.\n\nAnasayfa ve dashboard artık sadece yerel verileri gösterecek.`, 'Temizlik Tamamlandı');
                
                // Force refresh to show the change
                setTimeout(() => {
                    window.dispatchEvent(new Event('campaigns-updated'));
                    window.dispatchEvent(new Event('storage'));
                }, 500);
                
            } catch (error) {
                console.error('🚨 Supabase temizleme hatası:', error);
                await alert(`❌ Hata Oluştu:\n\n${error}\n\nDetaylar konsola yazıldı.\n\nSupabase bağlantı bilgilerinizi kontrol edin.`, 'Supabase Hatası');
            }
        }
    };

    // Removed unused clear functions - auto-sync handles everything now

    // New: Sync to Live Logic
    const [isSyncing, setIsSyncing] = useState(false);

    const handleSyncToLive = async () => {
        const url = localStorage.getItem('sb_url');
        const key = localStorage.getItem('sb_key');

        if (!url || !key) {
            await alert("Hata: Supabase bağlantı bilgileri eksik. Lütfen 'Ayarlar' sayfasından yapılandırın.", "Bağlantı Hatası");
            return;
        }

        if (!await confirm({
            title: 'Canlıya Gönder',
            message: 'TÜM yerel kampanya verileri canlı veritabanına (Supabase) aktarılacak ve mevcut canlı verilerin üzerine yazılacaktır. Bu işlem diğer kullanıcılar için içeriği günceller.\n\nEmin misiniz?',
            confirmText: 'Evet, Yayınla',
            type: 'warning'
        })) {
            return;
        }

        setIsSyncing(true);

        // Use the service helper
        const result = await campaignService.syncToSupabase(url, key);

        setIsSyncing(false);

        if (result.success) {
            await alert(`✅ Başarılı!\n\n${result.count} kampanya canlıya gönderildi.`, "Yayında");
        } else {
            await alert(`❌ Hata Oluştu:\n\n${result.error}`, "Senkronizasyon Hatası");
        }
    };


    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-10">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
                <div className="relative z-10">
                    <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                        <Database className="text-blue-400" size={32} />
                        Kampanya Yönetimi
                    </h1>
                    <p className="text-blue-100 opacity-90 max-w-xl">
                        Mevcut kampanyaları inceleyin. Yayına almak için <strong>"Onayla"</strong> butonunu kullanın.
                    </p>
                    <div className="grid grid-cols-4 gap-1.5 mt-4">
                        {/* İlk Sıra - Ana İşlemler */}
                        <button
                            onClick={handleOpenImportModal}
                            className="bg-blue-600 text-white px-2 py-1 rounded text-xs flex items-center gap-1 hover:bg-blue-700 transition-colors justify-center"
                        >
                            <Link size={12} />
                            Link Ekle
                        </button>
                        <button
                            onClick={handleCreateNew}
                            className="bg-purple-600 text-white px-2 py-1 rounded text-xs flex items-center gap-1 hover:bg-purple-700 transition-colors justify-center"
                        >
                            <Plus size={12} />
                            Yeni
                        </button>
                        <button
                            onClick={handleFindDuplicates}
                            className="bg-cyan-600 text-white px-2 py-1 rounded text-xs flex items-center gap-1 hover:bg-cyan-700 transition-colors justify-center"
                        >
                            <Sparkles size={12} />
                            Tekrar
                        </button>
                        <button
                            onClick={handleBatchAI}
                            className="bg-indigo-600 text-white px-2 py-1 rounded text-xs flex items-center gap-1 hover:bg-indigo-700 transition-colors justify-center"
                        >
                            <Sparkles size={12} />
                            AI
                        </button>
                        
                        {/* İkinci Sıra - Sync ve Temizlik İşlemleri */}
                        <button
                            onClick={handleSyncToLive}
                            disabled={isSyncing}
                            className={`px-2 py-1 rounded text-xs flex items-center gap-1 transition-colors justify-center
                                ${isSyncing
                                    ? 'bg-gray-400 cursor-not-allowed text-white'
                                    : 'bg-green-600 hover:bg-green-700 text-white'
                                }
                            `}
                        >
                            {isSyncing ? (
                                <Loader2 size={12} className="animate-spin" />
                            ) : (
                                <CloudUpload size={12} />
                            )}
                            {isSyncing ? 'Sync...' : 'Canlı'}
                        </button>
                        <button
                            onClick={handleClearSupabaseOnly}
                            className="bg-orange-600 text-white px-2 py-1 rounded text-xs flex items-center gap-1 hover:bg-orange-700 transition-colors justify-center"
                        >
                            <CloudUpload size={12} />
                            SB Sil
                        </button>
                        <div className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-500 flex items-center justify-center">
                            Otomatik Sync
                        </div>
                    </div>
                </div>
                <div className="absolute right-0 top-0 h-full w-1/3 opacity-5">
                    <CreditCard size={300} strokeWidth={0.5} />
                </div>
            </div>


            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Banks */}
                <div className="lg:col-span-4 space-y-3">
                    <div className="flex items-center justify-between px-1">
                        <h2 className="text-lg font-bold text-gray-800">Bankalar & Kartlar</h2>
                        <button
                            onClick={() => setIsAddingBank(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors"
                        >
                            <Plus size={16} />
                            Banka Ekle
                        </button>
                    </div>
                    
                    {/* Add Bank Form */}
                    {isAddingBank && (
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-100 animate-in fade-in slide-in-from-top-2">
                            <div className="flex gap-2 items-center">
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Banka Adı (örn: Garanti BBVA)"
                                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                                    value={newBankName}
                                    onChange={e => setNewBankName(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleAddBank()}
                                />
                                <button 
                                    onClick={handleAddBank} 
                                    className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                                >
                                    Kaydet
                                </button>
                                <button 
                                    onClick={() => {
                                        setIsAddingBank(false);
                                        setNewBankName('');
                                    }} 
                                    className="bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-300 transition-colors"
                                >
                                    İptal
                                </button>
                            </div>
                        </div>
                    )}
                    {banks.length === 0 && (
                        <div className="text-gray-500 italic text-sm p-4 bg-gray-50 rounded-lg">
                            Henüz banka tanımı yok. "Scraper Araçları" sayfasından ekleyebilirsiniz.
                        </div>
                    )}
                    {banks.map(bank => (
                        <div key={bank.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                            <button
                                onClick={() => setExpandedBank(expandedBank === bank.id ? null : bank.id)}
                                className={`w-full flex items-center justify-between p-4 transition-colors hover:bg-gray-50
                                    ${expandedBank === bank.id ? 'bg-blue-50/50' : ''}
                                `}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-white border border-gray-100 p-1.5 flex items-center justify-center shadow-sm overflow-hidden">
                                        <img src={bank.logo} alt={bank.name} className="w-full h-full object-contain" />
                                    </div>
                                    <span className="font-semibold text-gray-700">{bank.name}</span>
                                </div>
                                {expandedBank === bank.id ? <ChevronDown size={18} className="text-gray-400" /> : <ChevronRight size={18} className="text-gray-400" />}
                            </button>
                            {expandedBank === bank.id && (
                                <div className="border-t border-gray-100 bg-gray-50/50">
                                    {bank.cards.map(card => {
                                        const campaigns = campaignsMap[card.id] || [];
                                        const activeCount = campaigns.filter(c => !c.isArchived).length;
                                        const archivedCount = campaigns.filter(c => c.isArchived).length;
                                        const visibleCount = showArchived ? archivedCount : activeCount;
                                        const pendingCount = campaigns.filter(c => !c.isApproved && !c.isArchived).length;

                                        return (
                                            <button
                                                key={card.id}
                                                onClick={() => setExpandedCard(card.id)}
                                                className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-all border-b border-gray-100
                                                      ${expandedCard === card.id
                                                        ? 'bg-blue-100 text-blue-800 font-semibold'
                                                        : 'hover:bg-gray-100 text-gray-600'
                                                    }
                                                  `}
                                            >
                                                <span className="flex items-center gap-2">
                                                    <CreditCard size={14} />
                                                    {card.name}
                                                </span>
                                                <div className="flex items-center gap-1">
                                                    {pendingCount > 0 && (
                                                        <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full" title={`${pendingCount} Bekleyen Onay`}>
                                                            {pendingCount}
                                                        </span>
                                                    )}
                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${visibleCount > 0 ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-500'}`}>
                                                        {visibleCount}
                                                    </span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                    
                                    {/* Add Card Section */}
                                    {bank.id !== 'other_bank' && (
                                        <div className="border-t border-gray-200">
                                            {isAddingCard === bank.id ? (
                                                <div className="p-3 bg-white">
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="text"
                                                            placeholder="Kart adı (örn: Bonus Card, Maximum)"
                                                            value={newCardName}
                                                            onChange={(e) => setNewCardName(e.target.value)}
                                                            onKeyDown={(e) => e.key === 'Enter' && handleAddCard(bank.id)}
                                                            className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                                            autoFocus
                                                        />
                                                        <button 
                                                            onClick={() => handleAddCard(bank.id)}
                                                            className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                                                        >
                                                            Kaydet
                                                        </button>
                                                        <button 
                                                            onClick={() => {
                                                                setIsAddingCard(null);
                                                                setNewCardName('');
                                                            }}
                                                            className="bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-300 transition-colors"
                                                        >
                                                            İptal
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setIsAddingCard(bank.id)}
                                                    className="w-full p-3 text-left text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors flex items-center gap-2 bg-gray-50"
                                                >
                                                    <Plus size={14} />
                                                    Yeni Kart Ekle
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Right Column: Campaign List */}
                <div className="lg:col-span-8">
                    {expandedCard ? (
                        <div className="space-y-4">
                            {(() => {
                                const activeBank = banks.find(b => b.id === expandedBank);
                                const activeCard = activeBank?.cards.find(c => c.id === expandedCard);
                                const currentCampaigns = campaignsMap[expandedCard] || [];

                                if (!activeCard) return null;

                                return (
                                    <>
                                        <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                                    {activeCard.name}
                                                    <span className="text-sm font-normal text-gray-500">({activeBank?.name})</span>
                                                </h3>
                                                <p className="text-sm text-gray-500">
                                                    {currentCampaigns.filter(c => showArchived ? c.isArchived : !c.isArchived).length} kampanya listeleniyor
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setShowArchived(!showArchived)}
                                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${showArchived ? 'bg-gray-200 border-gray-300 text-gray-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                                >
                                                    {showArchived ? 'Arşivi Gizle' : 'Arşivi Göster'}
                                                </button>
                                                {currentCampaigns.length > 0 && !showArchived && (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handlePublishAll(activeCard.id)}
                                                            className="text-green-600 hover:bg-green-50 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border border-green-200"
                                                        >
                                                            Tümünü Yayınla
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteAllCampaigns(activeCard.id)}
                                                            className="text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border border-red-200"
                                                        >
                                                            Tümünü Sil
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {currentCampaigns.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-dashed border-gray-300 text-gray-400">
                                                <Database size={48} className="mb-4 opacity-20" />
                                                <p>Bu kart için henüz kampanya yüklenmemiş.</p>
                                                <p className="text-sm">"Toplu Yükleme" sayfasından ekleyebilirsiniz.</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {currentCampaigns
                                                    .filter(c => showArchived ? c.isArchived : !c.isArchived)
                                                    .map((camp) => (
                                                        <div key={camp.id} className={`bg-white p-4 rounded-xl border shadow-sm hover:shadow-md transition-all group relative ${camp.isArchived ? 'border-gray-200 bg-gray-50 opacity-75' : camp.isApproved ? 'border-green-100 bg-green-50/10' : 'border-amber-200 bg-amber-50/30'}`}>
                                                            <div className="flex justify-between items-start gap-4">
                                                                {/* Status Indicator */}
                                                                <div className="absolute top-4 right-12 z-10">
                                                                    {camp.isArchived ? (
                                                                        <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-gray-600 bg-gray-200 px-2 py-0.5 rounded-full border border-gray-300 shadow-sm">
                                                                            Arşivlendi
                                                                        </span>
                                                                    ) : camp.isApproved ? (
                                                                        <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full border border-green-200 shadow-sm">
                                                                            Yayında
                                                                        </span>
                                                                    ) : (
                                                                        <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200 shadow-sm animate-pulse">
                                                                            Onay Bekliyor
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                <div
                                                                    className="cursor-pointer flex-1"
                                                                    onClick={() => openModal(camp)}
                                                                >
                                                                    <h4 className="font-semibold text-gray-800 line-clamp-1 pr-20 hover:text-blue-600 transition-colors">{camp.title}</h4>
                                                                    <p className="text-sm text-gray-600 mt-1 line-clamp-2 flex-1">{camp.description}</p>
                                                                    <div className="flex items-center gap-4 mt-3">
                                                                        {camp.category && (
                                                                            <span className="inline-flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                                                                <Tag size={12} /> {camp.category}
                                                                            </span>
                                                                        )}
                                                                        {camp.validUntil && (
                                                                            <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                                                                                <Calendar size={12} /> {camp.validUntil}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* Approval Action */}
                                                                <div className="mt-4 flex items-center gap-3">
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); handleToggleApproval(expandedCard, camp.id, camp.isApproved); }}
                                                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border
                                                                            ${camp.isApproved
                                                                                ? 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                                                                                : 'bg-green-600 text-white border-transparent hover:bg-green-700 shadow-md'
                                                                            }
                                                                        `}
                                                                    >
                                                                        {camp.isApproved ? 'Yayından Kaldır' : 'Yayına Al (Onayla)'}
                                                                    </button>
                                                                </div>

                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleDeleteCampaign(expandedCard, camp.id); }}
                                                                    className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all absolute top-2 right-2"
                                                                    title="Sil"
                                                                >
                                                                    <Trash2 size={18} />
                                                                </button>

                                                            </div>
                                                        </div>
                                                    ))}
                                            </div>
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 p-10 bg-gray-50/50 rounded-2xl border border-dashed border-gray-300">
                            <ChevronDown size={48} className="mb-4 opacity-20 rotate-90 lg:rotate-0" />
                            <h3 className="text-lg font-semibold text-gray-600">Bir Kart Seçin</h3>
                            <p className="max-w-sm mx-auto mt-2 text-sm">
                                Kampanyaları görüntülemek için soldaki menüden bir banka ve kart seçin.
                            </p>
                        </div>
                    )}
                </div>
            </div>


            {/* Modal */}
            <Modal isOpen={isModalOpen} onClose={closeModal}>
                {selectedCampaign && (
                    <CampaignDetail
                        data={selectedCampaign}
                        isAdmin={true}
                        onSave={handleSaveCampaignDetail}
                        onDelete={handleDeleteFromDetail}
                    />
                )}
            </Modal>

            {/* Import Modal */}
            <Modal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)}>
                <div className="p-1">
                    <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                        <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                            <Sparkles size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">Kampanya Ekle</h2>
                            <p className="text-sm text-gray-500">URL'den otomatik veri çekme</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {/* URL Input */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Kampanya Linki</label>
                            <input
                                type="text"
                                value={importUrl}
                                onChange={(e) => setImportUrl(e.target.value)}
                                placeholder="https://www.maximum.com.tr/kampanyalar/..."
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        {/* API Key Section */}
                        <div className={`p-4 rounded-xl border ${importApiKey ? 'bg-green-50 border-green-100' : 'bg-amber-50 border-amber-100'}`}>
                            <div className="flex justify-between items-start mb-2">
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-800">
                                    {importApiKey ? <span className="text-green-700">AI Bağlantısı Aktif</span> : <span className="text-amber-700">AI Bağlantısı Yok</span>}
                                </label>
                                <a href="/admin/settings" className="text-xs text-gray-500 underline flex items-center gap-1">
                                    <Settings size={12} /> Ayarlar
                                </a>
                            </div>

                            {!importApiKey && (
                                <p className="text-xs text-amber-800 mb-3">
                                    Mevcut bir API anahtarı bulunamadı. Daha iyi veri çekmek için aşağıya bir Gemini API anahtarı girebilirsiniz (otomatik kaydedilir).
                                </p>
                            )}

                            <div className="relative">
                                <input
                                    type="password"
                                    value={importApiKey}
                                    onChange={(e) => setImportApiKey(e.target.value)}
                                    placeholder="Gemini API Key (Opsiyonel)"
                                    className={`w-full border rounded-lg px-3 py-2 text-sm outline-none ${importApiKey ? 'bg-white border-green-200' : 'bg-white border-amber-300'}`}
                                />
                                {importApiKey && <div className="absolute right-3 top-2.5 text-green-500"><Sparkles size={16} /></div>}
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 gap-2">
                            <button
                                onClick={() => setIsImportModalOpen(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                            >
                                İptal
                            </button>
                            <button
                                onClick={handleUrlImport}
                                disabled={!importUrl || importStep === 'analyzing'}
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold shadow-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {importStep === 'analyzing' ? (
                                    <>
                                        <Loader2 className="animate-spin" size={18} />
                                        Analiz Ediliyor...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={18} />
                                        Analiz Et ve Ekle
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Kampanya Doğrulama Sistemi */}
            <CampaignValidationPanel 
                campaigns={expandedCard ? (campaignsMap[expandedCard] || []) : []}
                onValidationComplete={(validCampaigns: any) => {
                    if (expandedCard) {
                        const newMap = { ...campaignsMap, [expandedCard]: validCampaigns };
                        updateCampaigns(newMap);
                    }
                }}
            />

            {/* Batch Progress Modal */}
            <Modal isOpen={isBatchModalOpen} onClose={() => { }}>
                <div className="p-4 text-center">
                    <div className="mb-4 flex justify-center text-indigo-600">
                        <Sparkles size={48} className="animate-pulse" />
                    </div>
                    <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                        Toplu AI İyileştirme
                    </h2>
                    <p className="text-sm text-gray-500 mt-2 mb-6"> Kampanyalar tek tek analiz ediliyor...</p>

                    <div className="relative w-full bg-gray-100 rounded-full h-4 mb-2 overflow-hidden">
                        <div
                            className="bg-indigo-600 h-full transition-all duration-300 ease-out flex items-center justify-center text-[8px] text-white font-bold"
                            style={{ width: `${batchProgress}%` }}
                        >
                            {Math.round(batchProgress)}%
                        </div>
                    </div>

                    <div className="flex justify-between text-xs font-bold text-gray-500 mb-6">
                        <span>{batchStatus}</span>
                        <span>{timeRemaining ? `Kalan: ~${timeRemaining}` : '...'}</span>
                    </div>

                    <button disabled className="text-gray-400 text-xs cursor-not-allowed">
                        İşlem sırasında pencereyi kapatmayınız
                    </button>
                </div>
            </Modal>

        </div>
    );
}
