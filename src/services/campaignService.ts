
import { type CampaignProps } from '../components/CampaignCard';
import { supabase } from '../lib/supabase';
import { createClient } from '@supabase/supabase-js';

// Helper to create dynamic client (duplicated to avoid circular deps if in lib)
const createDynamicClient = (url: string, key: string) => {
    return createClient(url, key);
};

const STORAGE_KEY = 'campaigns_data';

export const FALLBACK_LOGOS: Record<string, string> = {
    'axess': '/assets/logos/axess.png',
    'bonus': '/assets/logos/bonus.png',
    'maximum': '/assets/logos/maximum.png',
    'world': '/assets/logos/world.png',
    'paraf': '/assets/logos/paraf.png',
    'cardfinans': '/assets/logos/cardfinans.png',
    'bankkart': '/assets/logos/bankkart.png',
    'advantage': '/assets/logos/advantage.png',
    'shopandfly': '/assets/logos/shopandfly.png',
    'wings': '/assets/logos/wings.png',
    'milesandsmiles': '/assets/logos/milesandsmiles.png',
    'play': '/assets/logos/play.png',
    'adios': '/assets/logos/adios.png',
    'amex': '/assets/logos/amex.png',
    'maximiles': '/assets/logos/maximiles.png',
    'crystal': '/assets/logos/crystal.png'
};

export const campaignService = {
    // Get ALL campaigns (Admin view - Deduplicated but includes Unapproved)
    getAllCampaigns: (): CampaignProps[] => {
        // 1. Get Legacy/Seeded Data
        // 1. Get Legacy/Seeded Data
        let legacyCampaigns: CampaignProps[] = [];
        try {
            const storedLegacy = localStorage.getItem(STORAGE_KEY);
            if (storedLegacy) {
                const parsed = JSON.parse(storedLegacy);
                if (Array.isArray(parsed)) {
                    legacyCampaigns = parsed;
                }
            }
            // Removed auto-seeding from campaignsData to prevent phantom data
        } catch (e) {
            console.error("Failed to load legacy campaigns", e);
        }

        // 2. Get Admin Bulk Upload Data (Stored by Card ID)
        let adminCampaigns: CampaignProps[] = [];
        try {
            // Load Bank Config to map Card ID -> Bank Name
            const scraperConfigStr = localStorage.getItem('scraper_config');
            let cardToBankMap: Record<string, { name: string, logo: string, cardName: string }> = {};

            if (scraperConfigStr) {
                try {
                    const banks = JSON.parse(scraperConfigStr);
                    if (Array.isArray(banks)) {
                        banks.forEach((b: any) => {
                            if (b.cards && Array.isArray(b.cards)) {
                                b.cards.forEach((c: any) => {
                                    cardToBankMap[c.id] = {
                                        name: b.name,
                                        logo: FALLBACK_LOGOS[c.id] || c.logo || b.logo,
                                        cardName: c.name
                                    };
                                });
                            }
                        });
                    }
                } catch (e) {
                    console.error("Failed to parse bank config", e);
                }
            }

            const storedAdmin = localStorage.getItem('campaign_data');
            if (storedAdmin) {
                const parsedAdmin = JSON.parse(storedAdmin);
                if (parsedAdmin && typeof parsedAdmin === 'object') {
                    // Flatten { cardId: [Campaigns] } -> [Campaigns]
                    adminCampaigns = Object.entries(parsedAdmin).flatMap(([cardId, campaigns]) => {
                        if (!Array.isArray(campaigns)) return [];

                        const correctBank = cardToBankMap[cardId];
                        return campaigns.map((c: any) => ({
                            ...c,
                            bank: correctBank?.name || c.bank,
                            cardName: correctBank?.cardName || c.cardName, // Pass specific card name
                            cardLogo: correctBank?.logo
                        }));
                    }) as CampaignProps[];
                }
            }
        } catch (e) {
            console.error("Failed to parse admin campaigns", e);
        }

        // 3. Merge & Deduplicate
        const combined = [...adminCampaigns, ...legacyCampaigns];
        const uniqueMap = new Map();
        combined.forEach(c => {
            if (!uniqueMap.has(c.id)) {
                uniqueMap.set(c.id, c);
            }
        });

        return Array.from(uniqueMap.values()).sort((a, b) => Number(b.id) - Number(a.id));
    },

    // Get Public campaigns (Approved only)
    getCampaigns: (): CampaignProps[] => {
        const all = campaignService.getAllCampaigns();

        // Filter by Approval Status and Sanitize
        return all.filter(c => c && (c.isApproved === true || c.isApproved === undefined)).map(c => ({
            ...c,
            bank: c.bank || 'Diğer',
            category: c.category || 'Genel',
            title: c.title || 'Başlıksız Kampanya'
        }));
    },

    // NEW: Async fetch for Supabase
    fetchCampaigns: async (includeHidden: boolean = false): Promise<CampaignProps[]> => {
        if (supabase) {
            let query = supabase
                .from('campaigns')
                .select('*')
                .order('created_at', { ascending: false });

            // Only filter if we DON'T want hidden ones
            if (!includeHidden) {
                query = query.eq('is_approved', true);
            }

            const { data, error } = await query;

            if (!error && data) {
                return data.map((d: any) => ({
                    id: d.id, // Supabase ID is int/bigint
                    title: d.title,
                    description: d.description,
                    bank: d.bank,
                    cardName: d.card_name,
                    category: d.category,
                    validUntil: d.valid_until,
                    image: d.image,
                    isApproved: d.is_approved,
                    createdAt: d.created_at,
                    url: d.url,
                    badgeText: d.badge_text || 'Fırsat',
                    badgeColor: d.badge_color || 'purple',
                    views: d.views || 0,
                    // Detailed Fields
                    min_spend: d.min_spend,
                    earning: d.earning,
                    discount: d.discount,
                    participation_method: d.participation_method,
                    valid_from: d.valid_from,
                    eligible_customers: d.eligible_customers,
                    conditions: d.conditions,
                    participation_points: d.participation_points
                }));
            }
        }
        // Fallback to local
        return campaignService.getCampaigns();
    },

    // Update a single campaign
    updateCampaign: (updatedCampaign: CampaignProps): boolean => {
        const campaigns = campaignService.getCampaigns();
        const index = campaigns.findIndex(c => c.id === updatedCampaign.id);

        if (index !== -1) {
            campaigns[index] = updatedCampaign;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(campaigns));
            return true;
        }
        return false;
    },

    // Delete a campaign
    deleteCampaign: (id: number): boolean => {
        // 1. Try Legacy
        const storedLegacy = localStorage.getItem(STORAGE_KEY);
        if (storedLegacy) {
            let legacyCampaigns: CampaignProps[] = JSON.parse(storedLegacy);
            const initialLength = legacyCampaigns.length;
            legacyCampaigns = legacyCampaigns.filter(c => c.id !== id);

            if (legacyCampaigns.length < initialLength) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(legacyCampaigns));
                return true;
            }
        }

        // 2. Try Admin Data
        const storedAdmin = localStorage.getItem('campaign_data');
        if (storedAdmin) {
            const adminMap: Record<string, CampaignProps[]> = JSON.parse(storedAdmin);
            let found = false;

            for (const [cardId, list] of Object.entries(adminMap)) {
                const initialLength = list.length;
                const filteredList = list.filter(c => c.id !== id);

                if (filteredList.length < initialLength) {
                    adminMap[cardId] = filteredList;
                    found = true;
                    // Keep searching? IDs should be unique, so we can break.
                    break;
                }
            }

            if (found) {
                localStorage.setItem('campaign_data', JSON.stringify(adminMap));
                return true;
            }
        }

        return false;
    },

    // Increment View Count (Fire & Forget)
    incrementView: async (id: number) => {
        if (!supabase) return;

        // Use RPC if available for atomic increment
        const { error } = await supabase.rpc('increment_campaign_view', { row_id: id });

        if (error) {
            // Fallback: Logic requires getting current value then updating, 
            // which handles race conditions poorly, but okay for MVP fallback.
            // console.error("RPC failed, simple update not implemented for safety", error);
        }
    },

    // Reset to default (Debug helper)
    resetData: () => {
        localStorage.removeItem(STORAGE_KEY);
        window.location.reload();
    },

    // Sync to Supabase (Full Overwrite)
    syncToSupabase: async (url: string, key: string, onProgress?: (count: number) => void): Promise<{ success: boolean, count: number, error?: any }> => {
        if (!url || !key) {
            return { success: false, count: 0, error: "Eksik API Anahtarları" };
        }

        try {
            const client = createDynamicClient(url, key);

            // 1. Check connection
            const { error: testError } = await client.from('campaigns').select('count', { count: 'exact', head: true });
            if (testError) throw new Error("Bağlantı Hatası: " + testError.message);

            // 2. Prepare Data from Local Storage
            const all = campaignService.getAllCampaigns(); // Gets everything (Admin view)

            // Map to DB Schema
            const dbRecords = all.map(c => ({
                title: c.title,
                description: c.description || '',
                bank: c.bank || 'Diğer',
                card_name: c.cardName,
                category: c.category || 'Genel',
                valid_until: c.validUntil || null,
                is_approved: c.isApproved !== false, // Default to true if undefined
                image: c.image || null,
                url: c.url || null,

                // Optional fields
                badge_text: c.badgeText,
                badge_color: c.badgeColor,
                brand: c.brand,

                // New Detail Fields
                min_spend: c.min_spend || (c.spendAmount ? parseInt(c.spendAmount.replace(/\D/g, '')) : 0),
                earning: c.earning || c.earnAmount,
                discount: c.discount,
                participation_method: c.participation_method || c.joinMethod,
                valid_from: c.valid_from,

                // JSONB fields
                eligible_customers: c.eligible_customers || (c.validCards ? c.validCards.split(',').map(s => s.trim()) : []),
                conditions: c.conditions || (c.terms || []),
                participation_points: c.participation_points || []
            }));

            // 3. WIPE EXISTING DATA (Full Sync)
            // We assume "id=0" or similar safeties aren't needed unless specified, but to be safe we can delete everything.
            const { error: deleteError } = await client
                .from('campaigns')
                .delete()
                .neq('id', 0); // Delete all rows where ID is not 0

            if (deleteError) {
                throw new Error("Eski veriler silinemedi: " + deleteError.message);
            }

            // 4. Insert in batches
            const BATCH_SIZE = 50;
            let successCount = 0;

            for (let i = 0; i < dbRecords.length; i += BATCH_SIZE) {
                const batch = dbRecords.slice(i, i + BATCH_SIZE);
                const { error } = await client.from('campaigns').insert(batch);

                if (error) {
                    console.error("Batch Error:", error);
                    // Continue or throw? Let's throw to warn user of partial fail
                    throw error;
                } else {
                    successCount += batch.length;
                    if (onProgress) onProgress(successCount);
                }
            }

            return { success: true, count: successCount };

        } catch (e: any) {
            console.error("Sync Failed:", e);
            return { success: false, count: 0, error: e.message || e };
        }
    },

    // DANGEROUS: Clear ALL data from Supabase
    clearAllRemoteData: async (): Promise<boolean> => {
        if (!supabase) return false;
        try {
            const { error } = await supabase
                .from('campaigns')
                .delete()
                .neq('id', 0); // Delete all

            if (error) {
                console.error("Clear Failed:", error);
                return false;
            }
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    }
};
