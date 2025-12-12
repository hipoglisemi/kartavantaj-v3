import { useState, useEffect } from "react";

const STORAGE_KEY = 'site_settings';

export interface SiteSettings {
    header: {
        announcements: Array<{
            id: string;
            text: string;
            link: string;
            label: string; // e.g. "Duyuru", "Fırsat"
            type: 'default' | 'warning' | 'success'; // for color
            isActive: boolean;
        }>;
    };
    footer: {
        address: string;
        email: string;
        description: string;
        copyright: string;
    };
    social: {
        facebook?: string;
        twitter?: string;
        instagram?: string;
        linkedin?: string;
        youtube?: string;
    };
    legal: {
        terms: string;
        privacy: string;
        cookies: string;
        kvkk: string;
        help: string;
        about: string;
    };
    ads: {
        sidebarAdImage: string;
        sidebarAdLink: string;
        showSidebarAd: boolean;
    };
    logo: {
        url: string;
        height: number;
        opacity: number;
        offsetX: number;
        offsetY: number;
    };
    footerLogo: {
        url: string;
        height: number;
        opacity: number;
        offsetX: number;
        offsetY: number;
    };
    // New Fields for Cloud-First Admin
    admins: string[];
    newsletter: {
        apiKey: string;
        subscribers: Array<{ email: string; date: string; status: 'Subscribed' | 'Unsubscribed' }>;
    };
    demoUsers: Array<{
        id: number;
        name: string;
        email: string;
        role: 'Admin' | 'Editor' | 'User';
        joined: string;
        status: 'Active' | 'Inactive' | 'Blocked';
    }>;
}

const defaultSettings: SiteSettings = {
    header: {
        announcements: [
            {
                id: '1',
                text: "Akbank'a özel 20.000 TL faizsiz kredi fırsatı başladı!",
                link: "#",
                label: "Duyuru",
                type: 'default',
                isActive: true
            }
        ]
    },
    footer: {
        address: "Maslak Mah. Büyükdere Cad. No:123 Sarıyer, İstanbul",
        email: "info@kartavantaj.com",
        description: "Türkiye'nin en güncel ve kapsamlı kampanya platformu.",
        copyright: "© 2025 KartAvantaj. Tüm yasal hakları saklıdır."
    },
    social: {
        facebook: "",
        twitter: "",
        instagram: "",
        linkedin: "",
        youtube: ""
    },
    legal: {
        terms: "<h2>Kullanım Koşulları</h2><p>Varsayılan metin...</p>",
        privacy: "<h2>Gizlilik Politikası</h2><p>Varsayılan metin...</p>",
        cookies: "<h2>Çerez Politikası</h2><p>Varsayılan metin...</p>",
        kvkk: "<h2>KVKK Aydınlatma Metni</h2><p>Varsayılan metin...</p>",
        help: "<h2>Yardım Merkezi</h2><p>Varsayılan metin...</p>",
        about: "<h2>Hakkımızda</h2><p>Varsayılan metin...</p>"
    },
    ads: {
        sidebarAdImage: "",
        sidebarAdLink: "#",
        showSidebarAd: false
    },
    logo: {
        url: '', // Empty defaults to local asset import in Header
        height: 48,
        opacity: 1,
        offsetX: 0,
        offsetY: 0
    },
    footerLogo: {
        url: '',
        height: 32,
        opacity: 0.9,
        offsetX: 0,
        offsetY: 0
    },
    // Defaults for new fields
    admins: [],
    newsletter: {
        apiKey: '',
        subscribers: []
    },
    demoUsers: []
};

import { supabase } from './authService';

// ... (existing interfaces and defaultSettings)

export const settingsService = {
    // 1. Local Read (Synchronous for initial render)
    getLocalSettings: (): SiteSettings => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return defaultSettings;
        try {
            const parsed = JSON.parse(stored);
            return {
                ...defaultSettings,
                ...parsed,
                // Deep merge crucial objects to strict defaults
                logo: { ...defaultSettings.logo, ...(parsed.logo || {}) },
                footerLogo: { ...defaultSettings.footerLogo, ...(parsed.footerLogo || {}) },
                header: { ...defaultSettings.header, ...(parsed.header || {}) },
                footer: { ...defaultSettings.footer, ...(parsed.footer || {}) }
            };
        } catch (e) {
            return defaultSettings;
        }
    },

    // 2. Remote Fetch (Supabase)
    fetchRemoteSettings: async (): Promise<SiteSettings | null> => {
        if (!supabase) return null;
        try {
            const { data, error } = await supabase
                .from('site_settings')
                .select('settings')
                .single();

            if (error) {
                // If table empty, try to insert defaults (only if we have permission/it's new)
                if (error.code === 'PGRST116') { // Row not found
                    console.log("No remote settings found, using defaults.");
                }
                return null;
            }

            if (data?.settings) {
                // Return merged remote settings
                return {
                    ...defaultSettings,
                    ...data.settings,
                    logo: { ...defaultSettings.logo, ...(data.settings.logo || {}) },
                    footerLogo: { ...defaultSettings.footerLogo, ...(data.settings.footerLogo || {}) },
                    header: { ...defaultSettings.header, ...(data.settings.header || {}) },
                    footer: { ...defaultSettings.footer, ...(data.settings.footer || {}) }
                };
            }
        } catch (err) {
            console.error("Failed to fetch settings:", err);
        }
        return null;
    },

    // 3. Save Draft (Local Only)
    saveDraftSettings: (newSettings: SiteSettings): void => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
        // Mark as dirty (unsaved changes)
        localStorage.setItem('settings_needs_sync', 'true');

        window.dispatchEvent(new Event('site-settings-changed'));
    },

    // 4. Publish to Live (Remote)
    publishSettings: async (): Promise<boolean> => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
            alert("Hata: Kaydedilecek yerel ayar bulunamadı.");
            return false;
        }

        const currentSettings = JSON.parse(stored);

        if (!supabase) {
            alert("Hata: Supabase bağlantısı kurulamadı. Lütfen 'Ayarlar & Entegrasyonlar' sayfasından API anahtarlarınızı kontrol edin ve sayfayı yenileyin.");
            return false;
        }

        try {
            const { error } = await supabase
                .from('site_settings')
                .upsert({ id: 1, settings: currentSettings, updated_at: new Date().toISOString() });

            if (error) {
                console.error("Supabase Error:", error);
                alert(`Sunucu Hatası: ${error.message} (Kod: ${error.code})`);
                throw error;
            }

            // Clear dirty flag
            localStorage.removeItem('settings_needs_sync');
            window.dispatchEvent(new Event('site-settings-changed'));
            return true;
        } catch (err: any) {
            console.error("Failed to sync settings to Supabase:", err);
            // Alert already shown above for Supabase errors, but catch unexpected ones
            if (!err.code) alert("Beklenmeyen Hata: " + err.message);
            return false;
        }
    },

    // Check if we have unsaved changes
    hasUnsavedChanges: (): boolean => {
        return localStorage.getItem('settings_needs_sync') === 'true';
    },

    // Hook for components
    useSettings: () => {
        // Initialize with Local Storage for instant UI
        const [settings, setSettings] = useState<SiteSettings>(settingsService.getLocalSettings());

        useEffect(() => {
            let isMounted = true;

            // 1. Listen for local changes (from other tabs or Admin actions)
            const handleStorageChange = () => {
                if (isMounted) setSettings(settingsService.getLocalSettings());
            };
            window.addEventListener('site-settings-changed', handleStorageChange);
            window.addEventListener('storage', handleStorageChange);

            // 2. Hydrate from Server (Background Sync)
            const hydrate = async () => {
                const remote = await settingsService.fetchRemoteSettings();
                if (remote && isMounted) {
                    // If remote matches local, do nothing to avoid re-render loop/flicker
                    // But usually we just update local storage and state
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(remote));
                    setSettings(remote);
                }
            };
            hydrate();

            return () => {
                isMounted = false;
                window.removeEventListener('site-settings-changed', handleStorageChange);
                window.removeEventListener('storage', handleStorageChange);
            };
        }, []);

        return settings;
    }
};
