// List of Known Merchants to prioritize
// Order matters: specific before general
export const KNOWN_MERCHANTS = [
    // E-Ticaret & Pazaryeri
    'Hepsiburada', 'Trendyol', 'Amazon', 'N11', 'Çiçeksepeti', 'Sahibinden',
    'Modanisa', 'AliExpress', 'Pazarama', 'Morhipo', 'İdefix', 'D&R', 'Kitapyurdu',

    // Market & Gıda
    'Migros', 'Carrefour', 'CarrefourSA', 'Şok', 'A101', 'Bim', 'File',
    'Macro Center', 'Macro', 'Metro', 'Kiler', 'Bizim Toptan', 'Getir',
    'Yemeksepeti', 'Banabi', 'İsteGelsin',

    // Giyim & Moda
    'Boyner', 'Zara', 'Mango', 'H&M', 'LC Waikiki', 'Defacto', 'Koton', 'Mavi',
    'Pull & Bear', 'Bershka', 'Stradivarius', 'Beymen', 'Network', 'Altınyıldız',
    'Kiğılı', 'Sarar', 'Flo', 'Adidas', 'Nike', 'Puma', 'Under Armour', 'Skechers',

    // Teknoloji & Elektronik
    'MediaMarkt', 'Teknosa', 'Vatan', 'Apple', 'Samsung', 'Arçelik', 'Beko',
    'Vestel', 'Bosch', 'Siemens', 'Dyson', 'Monster', 'Casper',

    // Ev & Yaşam
    'Ikea', 'Koçtaş', 'Tekzen', 'Bauhaus', 'English Home', 'Madame Coco',
    'Karaca', 'Yataş', 'Mudo', 'Vivense', 'Kelebek Mobilya',

    // Akaryakıt & Otomotiv
    'Shell', 'Opet', 'Petrol Ofisi', 'BP', 'Total', 'Aytemiz', 'Alpet',
    'TotalEnergies', 'Lukoil',

    // Seyahat & Turizm
    'THY', 'Türk Hava Yolları', 'Pegasus', 'SunExpress', 'AnadoluJet',
    'Uçak', 'Otobüs', 'TatilSepeti', 'Jolly Tur', 'ETS', 'Etstur',
    'Hotels.com', 'Booking', 'Airbnb', 'Obilet', 'Turna', 'Enuygun',

    // Yeme - İçme
    'Starbucks', 'Kahve Dünyası', 'McDonald\'s', 'Burger King', 'KFC',
    'Domino\'s', 'Pizza Hut', 'Little Caesars',

    // Eğlence & Dijital
    'Netflix', 'Spotify', 'Youtube', 'Disney+', 'BluTV', 'Digitürk',
    'Biletix', 'Passo', 'Cinemaximum', 'Paribu Cineverse', 'Steam', 'PlayStation'
];

// Blocklist for generic words
const IGNORED_WORDS = new Set([
    'kampanya', 'kampanyası', 'fırsat', 'fırsatı', 'tüm', 'her', 'yeni', 'özel', 'nakit', 'taksit', 'faizsiz', 'indirim',
    'hediye', 'puan', 'lira', 'tl', 'üzeri', 'alışveriş', 'harcama', 'kazan', 'kazanın', 'katılım',
    'ücretsiz', 'vade', 'farksız', 'son', 'büyük', 'süper', 'ekstra', 'taksitli', 'erteleme',
    'toplam', 'adet', 'sadece', 'ile', 'için', 've', 'veya', 'dahil', 'geçerli', 'web', 'sitesi', 'sitesinde',
    'cep', 'şube', 'mobil', 'internet', 'bankacılık', 'banka', 'kart', 'kredi', 'bankamatik',

    // Sectors & Categories (Generic)
    'okul', 'eğitim', 'giyim', 'market', 'akaryakıt', 'benzin', 'mazot', 'seyahat', 'tatil',
    'restoran', 'gıda', 'eticaret', 'e-ticaret', 'beyaz', 'eşya', 'mobilya', 'sağlık',
    'kozmetik', 'aksesuar', 'kuyum', 'iletişim', 'teknoloji', 'elektronik', 'marketler',
    'online', 'yurtdışı', 'yurt', 'içi', 'veteriner', 'otel', 'sigorta', 'tekstil', 'gıda',
    'beyazeşya', 'kırtasiye', 'tekstil', 'zookart',

    // Card Names & Banks (Generic)
    'bankkart', 'maximum', 'axess', 'world', 'bonus', 'paraf', 'cardfinans', 'advantage',
    'wings', 'milesandsmiles', 'shopandfly', 'amex', 'american', 'express', 'ziraat',
    'vakıfbank', 'halkbank', 'garanti', 'yapı', 'kredi', 'iş', 'akbank', 'finansbank',
    'denizbank', 'teb', 'ing', 'kuveyt', 'türk', 'qnb', 'enpara', 'fastpay', 'sanal',
    'troy', 'visa', 'mastercard',

    // Audience
    'emekli', 'emeklilerimiz', 'müşteri', 'müşterilerimiz', 'öğrenci', 'genç', 'kamu',
    'memur', 'çalışan', 'esnaf', 'kobi', 'ticari', 'bireysel'
]);

// Kampanya başlığı ve açıklamasından mağaza isimlerini çıkar
export function extractMerchants(title: string, description?: string): string[] {
    const merchants: Set<string> = new Set();
    const combinedText = `${title} ${description || ''}`;

    // 1. Check Known Merchants (Regex)
    KNOWN_MERCHANTS.forEach(merchant => {
        // Escape special characters for regex
        const escapedMerchant = merchant.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Case insensitive word boundary match
        // Handle specific Turkish char casing manually if needed, but 'i' flag helps
        const regex = new RegExp(`\\b${escapedMerchant}\\b`, 'i');

        if (regex.test(combinedText)) {
            merchants.add(merchant);
        }
    });

    // 2. Heuristic Extraction (if no known merchant found?)
    // The user guide suggests: "Akıllı algoritma ile çıkarılır: Migros tespit edilir"
    // If we found a known merchant, we might stop there or continue. 
    // For now, let's strictly stick to KNOWN_MERCHANTS as it's cleaner, 
    // UNLESS the user explicitly wants heuristic for unknowns too.
    // The guide implies "Mağaza isimleri JSON'da direkt YOK! Akıllı algoritma ile çıkarılır".

    // Let's verify if we need heuristic for unknown brands.
    // "Trendyol, Hepsiburada... 100+ mağaza tespit edilebilir" -> Supports strictly using the list.
    // However, purely relying on list might miss niche stores.
    // Let's add a robust fallback for unknown brands if the list yields nothing.

    if (merchants.size === 0) {
        const tokens = combinedText.split(/\s+/);
        for (const token of tokens) {
            let clean = token;
            // URL Handling
            if (clean.includes('.') && (clean.includes('www') || clean.includes('com'))) {
                try {
                    clean = clean.replace(/https?:\/\/(www\.)?/, '').split('.')[0];
                } catch (e) { }
            }

            clean = clean.split("'")[0];
            clean = clean.replace(/[.,:;!?(){}[\]""]/g, '').trim();

            if (!clean || clean.length < 3) continue;
            if (/^\d/.test(clean)) continue;

            const lower = clean.toLocaleLowerCase('tr-TR');
            if (IGNORED_WORDS.has(lower)) continue;
            if (['com', 'tr', 'net', 'org'].includes(lower)) continue;

            // If we are here, it's a potential brand candidate (Capitalized?)
            // Checking for Capitalization as a strong signal
            if (clean[0] === clean[0].toLocaleUpperCase('tr-TR') && clean[0] !== clean[0].toLocaleLowerCase('tr-TR')) {
                // Only take the first likely candidate to avoid garbage
                merchants.add(clean);
                break;
            }
        }
    }

    return Array.from(merchants);
}

// Tüm kampanyalardan mağazaları çıkar
export function getAllMerchantsFromCampaigns(campaigns: any[]): string[] {
    const allMerchants: Set<string> = new Set();

    campaigns.forEach(campaign => {
        // Use existing brand field if available, otherwise extract
        if (campaign.brand) {
            allMerchants.add(campaign.brand);
        } else {
            const extracted = extractMerchants(campaign.title, campaign.description);
            extracted.forEach(m => allMerchants.add(m));
        }
    });

    return Array.from(allMerchants).sort((a, b) => a.localeCompare(b, 'tr-TR'));
}

// Kampanya mağaza filtresine uyuyor mu?
export function matchesMerchantFilter(campaign: any, selectedMerchants: string[]): boolean {
    if (selectedMerchants.length === 0) return true;

    // If campaign has explicit brand field
    if (campaign.brand && selectedMerchants.includes(campaign.brand)) return true;

    const campaignMerchants = extractMerchants(campaign.title, campaign.description);

    return selectedMerchants.some(selectedMerchant =>
        campaignMerchants.includes(selectedMerchant)
    );
}
