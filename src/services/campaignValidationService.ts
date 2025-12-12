import { supabase } from './authService';

export interface ValidationError {
    field: string;
    message: string;
    severity: 'error' | 'warning' | 'info';
    suggestion?: string;
    autoFix?: boolean;
}

export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationError[];
    score: number; // 0-100 kalite skoru
    autoFixedFields: string[];
}

export interface Campaign {
    id?: number;
    title: string;
    description?: string;
    bank: string;
    cardName?: string;
    category: string;
    validUntil?: string;
    isApproved?: boolean;
    image?: string;
    url?: string;
    slug?: string;
    brand?: string;
    offer?: string;
    sector?: string;
    views?: number;
    clicks?: number;
}

export class CampaignValidationService {
    // Ana doğrulama fonksiyonu
    static validateCampaign(campaign: Campaign): ValidationResult {
        const errors: ValidationError[] = [];
        const warnings: ValidationError[] = [];
        const autoFixedFields: string[] = [];
        let score = 100;

        // 1. Zorunlu Alan Kontrolleri
        this.validateRequiredFields(campaign, errors);

        // 2. Veri Formatı Kontrolleri
        this.validateDataFormats(campaign, errors, warnings);

        // 3. İş Kuralları Kontrolleri
        this.validateBusinessRules(campaign, warnings);

        // 4. SEO ve Kalite Kontrolleri
        this.validateSEOAndQuality(campaign, warnings);

        // 5. Otomatik Düzeltmeler
        this.applyAutoFixes(campaign, autoFixedFields);

        // Skor hesaplama
        score = this.calculateQualityScore(errors, warnings);

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            score,
            autoFixedFields
        };
    }

    // Zorunlu alan kontrolleri
    private static validateRequiredFields(campaign: Campaign, errors: ValidationError[]): void {
        if (!campaign.title || campaign.title.trim().length === 0) {
            errors.push({
                field: 'title',
                message: 'Kampanya başlığı zorunludur',
                severity: 'error',
                suggestion: 'Açıklayıcı bir başlık girin'
            });
        }

        if (!campaign.bank || campaign.bank.trim().length === 0) {
            errors.push({
                field: 'bank',
                message: 'Banka adı zorunludur',
                severity: 'error',
                suggestion: 'Geçerli bir banka seçin'
            });
        }

        if (!campaign.category || campaign.category.trim().length === 0) {
            errors.push({
                field: 'category',
                message: 'Kategori zorunludur',
                severity: 'error',
                suggestion: 'Uygun bir kategori seçin'
            });
        }
    }

    // Veri formatı kontrolleri
    private static validateDataFormats(campaign: Campaign, errors: ValidationError[], warnings: ValidationError[]): void {
        // Başlık uzunluğu
        if (campaign.title && campaign.title.length > 100) {
            warnings.push({
                field: 'title',
                message: 'Başlık çok uzun (100 karakterden fazla)',
                severity: 'warning',
                suggestion: 'Başlığı kısaltın, SEO için daha iyi'
            });
        }

        if (campaign.title && campaign.title.length < 10) {
            warnings.push({
                field: 'title',
                message: 'Başlık çok kısa (10 karakterden az)',
                severity: 'warning',
                suggestion: 'Daha açıklayıcı bir başlık yazın'
            });
        }

        // URL formatı
        if (campaign.url && !this.isValidURL(campaign.url)) {
            errors.push({
                field: 'url',
                message: 'Geçersiz URL formatı',
                severity: 'error',
                suggestion: 'https:// ile başlayan geçerli bir URL girin',
                autoFix: true
            });
        }

        // Tarih formatı
        if (campaign.validUntil && !this.isValidDate(campaign.validUntil)) {
            errors.push({
                field: 'validUntil',
                message: 'Geçersiz tarih formatı',
                severity: 'error',
                suggestion: 'YYYY-MM-DD formatında tarih girin'
            });
        }

        // Geçmiş tarih kontrolü
        if (campaign.validUntil && this.isPastDate(campaign.validUntil)) {
            warnings.push({
                field: 'validUntil',
                message: 'Geçerlilik tarihi geçmişte',
                severity: 'warning',
                suggestion: 'Gelecek bir tarih seçin'
            });
        }

        // Resim URL kontrolü
        if (campaign.image && !this.isValidImageURL(campaign.image)) {
            warnings.push({
                field: 'image',
                message: 'Geçersiz resim URL\'i',
                severity: 'warning',
                suggestion: 'jpg, png, webp formatında resim URL\'i girin'
            });
        }
    }

    // İş kuralları kontrolleri
    private static validateBusinessRules(campaign: Campaign, warnings: ValidationError[]): void {
        // Banka-kart uyumu
        if (campaign.bank && campaign.cardName) {
            if (!this.isBankCardCompatible(campaign.bank, campaign.cardName)) {
                warnings.push({
                    field: 'cardName',
                    message: 'Kart adı banka ile uyumlu değil',
                    severity: 'warning',
                    suggestion: `${campaign.bank} bankasına ait bir kart seçin`
                });
            }
        }

        // Kategori-sektör uyumu
        if (campaign.category && campaign.sector) {
            if (!this.isCategorySectorCompatible(campaign.category, campaign.sector)) {
                warnings.push({
                    field: 'sector',
                    message: 'Sektör kategori ile uyumlu değil',
                    severity: 'info',
                    suggestion: 'Kategori ile uyumlu bir sektör seçin'
                });
            }
        }

        // Teklif türü kontrolü
        if (campaign.offer && !this.isValidOfferType(campaign.offer)) {
            warnings.push({
                field: 'offer',
                message: 'Bilinmeyen teklif türü',
                severity: 'info',
                suggestion: 'discount, cashback, points, miles gibi standart türler kullanın'
            });
        }
    }

    // SEO ve kalite kontrolleri
    private static validateSEOAndQuality(campaign: Campaign, warnings: ValidationError[]): void {
        // Açıklama kontrolü
        if (!campaign.description || campaign.description.trim().length === 0) {
            warnings.push({
                field: 'description',
                message: 'Açıklama eksik',
                severity: 'warning',
                suggestion: 'SEO için açıklama ekleyin'
            });
        }

        if (campaign.description && campaign.description.length < 50) {
            warnings.push({
                field: 'description',
                message: 'Açıklama çok kısa',
                severity: 'info',
                suggestion: 'En az 50 karakter açıklama yazın'
            });
        }

        // Slug kontrolü
        if (!campaign.slug) {
            warnings.push({
                field: 'slug',
                message: 'SEO URL (slug) eksik',
                severity: 'info',
                suggestion: 'Otomatik oluşturulacak',
                autoFix: true
            });
        }

        // Resim kontrolü
        if (!campaign.image) {
            warnings.push({
                field: 'image',
                message: 'Kampanya resmi eksik',
                severity: 'warning',
                suggestion: 'Görsel çekicilik için resim ekleyin'
            });
        }

        // Marka kontrolü
        if (!campaign.brand) {
            warnings.push({
                field: 'brand',
                message: 'Marka bilgisi eksik',
                severity: 'info',
                suggestion: 'Marka adı ekleyin',
                autoFix: true
            });
        }
    }

    // Otomatik düzeltmeler
    private static applyAutoFixes(campaign: Campaign, autoFixedFields: string[]): Campaign {
        const fixed = { ...campaign };

        // URL düzeltme
        if (fixed.url && !this.isValidURL(fixed.url)) {
            if (!fixed.url.startsWith('http')) {
                fixed.url = 'https://' + fixed.url;
                autoFixedFields.push('url');
            }
        }

        // Slug oluşturma
        if (!fixed.slug && fixed.title) {
            fixed.slug = this.generateSlug(fixed.title);
            autoFixedFields.push('slug');
        }

        // Marka çıkarma (başlıktan)
        if (!fixed.brand && fixed.title) {
            const extractedBrand = this.extractBrandFromTitle(fixed.title);
            if (extractedBrand) {
                fixed.brand = extractedBrand;
                autoFixedFields.push('brand');
            }
        }

        // Kategori normalizasyonu
        if (fixed.category) {
            const normalizedCategory = this.normalizeCategory(fixed.category);
            if (normalizedCategory !== fixed.category) {
                fixed.category = normalizedCategory;
                autoFixedFields.push('category');
            }
        }

        return fixed;
    }

    // Kalite skoru hesaplama
    private static calculateQualityScore(errors: ValidationError[], warnings: ValidationError[]): number {
        let score = 100;
        
        // Her hata için -20 puan
        score -= errors.length * 20;
        
        // Her uyarı için -5 puan
        score -= warnings.filter(w => w.severity === 'warning').length * 5;
        
        // Her bilgi için -2 puan
        score -= warnings.filter(w => w.severity === 'info').length * 2;
        
        return Math.max(0, score);
    }

    // Yardımcı fonksiyonlar
    private static isValidURL(url: string): boolean {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    private static isValidDate(dateString: string): boolean {
        const date = new Date(dateString);
        return !isNaN(date.getTime());
    }

    private static isPastDate(dateString: string): boolean {
        const date = new Date(dateString);
        const now = new Date();
        return date < now;
    }

    private static isValidImageURL(url: string): boolean {
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
        return imageExtensions.some(ext => url.toLowerCase().includes(ext));
    }

    private static isBankCardCompatible(bank: string, cardName: string): boolean {
        const bankCardMap: Record<string, string[]> = {
            'garanti': ['bonus', 'garanti'],
            'yapı kredi': ['world', 'maximum'],
            'akbank': ['axess', 'akbank'],
            'işbank': ['maximum', 'işbank'],
            'ziraat': ['bankkart', 'ziraat']
        };

        const bankKey = bank.toLowerCase();
        const cardKey = cardName.toLowerCase();
        
        return bankCardMap[bankKey]?.some(card => cardKey.includes(card)) || false;
    }

    private static isCategorySectorCompatible(category: string, sector: string): boolean {
        const categoryMap: Record<string, string[]> = {
            'market': ['gıda', 'market', 'süpermarket'],
            'yakıt': ['petrol', 'benzin', 'akaryakıt'],
            'restoran': ['yemek', 'restoran', 'cafe'],
            'teknoloji': ['elektronik', 'bilgisayar', 'telefon']
        };

        const catKey = category.toLowerCase();
        const secKey = sector.toLowerCase();
        
        return categoryMap[catKey]?.some(sec => secKey.includes(sec)) || true;
    }

    private static isValidOfferType(offer: string): boolean {
        const validTypes = ['discount', 'cashback', 'points', 'miles', 'bonus', 'gift'];
        return validTypes.includes(offer.toLowerCase());
    }

    private static generateSlug(title: string): string {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    }

    private static extractBrandFromTitle(title: string): string | null {
        const commonBrands = [
            'migros', 'bim', 'a101', 'şok', 'carrefour',
            'shell', 'bp', 'petrol ofisi', 'opet',
            'mcdonald\'s', 'burger king', 'kfc', 'dominos',
            'teknosa', 'vatan', 'media markt'
        ];

        const titleLower = title.toLowerCase();
        return commonBrands.find(brand => titleLower.includes(brand)) || null;
    }

    private static normalizeCategory(category: string): string {
        const categoryMap: Record<string, string> = {
            'market': 'Market & Gıda',
            'yakıt': 'Yakıt & Akaryakıt',
            'restoran': 'Restoran & Yemek',
            'teknoloji': 'Teknoloji & Elektronik',
            'giyim': 'Giyim & Moda',
            'sağlık': 'Sağlık & Güzellik'
        };

        const key = category.toLowerCase();
        return categoryMap[key] || category;
    }

    // Toplu kampanya doğrulama
    static async validateCampaigns(campaigns: Campaign[]): Promise<{
        validCampaigns: Campaign[];
        invalidCampaigns: { campaign: Campaign; validation: ValidationResult }[];
        summary: {
            total: number;
            valid: number;
            invalid: number;
            averageScore: number;
        };
    }> {
        const validCampaigns: Campaign[] = [];
        const invalidCampaigns: { campaign: Campaign; validation: ValidationResult }[] = [];
        let totalScore = 0;

        for (const campaign of campaigns) {
            const validation = this.validateCampaign(campaign);
            totalScore += validation.score;

            if (validation.isValid) {
                validCampaigns.push(campaign);
            } else {
                invalidCampaigns.push({ campaign, validation });
            }
        }

        return {
            validCampaigns,
            invalidCampaigns,
            summary: {
                total: campaigns.length,
                valid: validCampaigns.length,
                invalid: invalidCampaigns.length,
                averageScore: campaigns.length > 0 ? totalScore / campaigns.length : 0
            }
        };
    }

    // Supabase'e güvenli kaydetme
    static async saveCampaignToSupabase(campaign: Campaign): Promise<{
        success: boolean;
        campaign?: Campaign;
        validation?: ValidationResult;
        error?: string;
    }> {
        if (!supabase) {
            return { success: false, error: 'Supabase bağlantısı yok' };
        }

        // Önce doğrula
        const validation = this.validateCampaign(campaign);
        
        if (!validation.isValid) {
            return { 
                success: false, 
                validation, 
                error: `Doğrulama hatası: ${validation.errors.map(e => e.message).join(', ')}` 
            };
        }

        try {
            // Otomatik düzeltmeleri uygula
            const fixedCampaign = this.applyAutoFixes(campaign, []);

            const { data, error } = await supabase
                .from('campaigns')
                .insert({
                    title: fixedCampaign.title,
                    description: fixedCampaign.description,
                    bank: fixedCampaign.bank,
                    card_name: fixedCampaign.cardName,
                    category: fixedCampaign.category,
                    valid_until: fixedCampaign.validUntil,
                    is_approved: false, // Varsayılan olarak onaysız
                    image: fixedCampaign.image,
                    url: fixedCampaign.url,
                    slug: fixedCampaign.slug,
                    brand: fixedCampaign.brand,
                    offer: fixedCampaign.offer,
                    sector: fixedCampaign.sector
                })
                .select()
                .single();

            if (error) {
                return { success: false, error: error.message };
            }

            return { 
                success: true, 
                campaign: data,
                validation 
            };
        } catch (error) {
            return { 
                success: false, 
                error: error instanceof Error ? error.message : 'Bilinmeyen hata' 
            };
        }
    }

    // Kampanya kalite raporu
    static generateQualityReport(campaigns: Campaign[]): {
        totalCampaigns: number;
        qualityDistribution: { excellent: number; good: number; fair: number; poor: number };
        commonIssues: { issue: string; count: number }[];
        recommendations: string[];
    } {
        const qualityDistribution = { excellent: 0, good: 0, fair: 0, poor: 0 };
        const issueCount: Record<string, number> = {};

        campaigns.forEach(campaign => {
            const validation = this.validateCampaign(campaign);
            
            // Kalite dağılımı
            if (validation.score >= 90) qualityDistribution.excellent++;
            else if (validation.score >= 70) qualityDistribution.good++;
            else if (validation.score >= 50) qualityDistribution.fair++;
            else qualityDistribution.poor++;

            // Yaygın sorunları say
            [...validation.errors, ...validation.warnings].forEach(issue => {
                issueCount[issue.message] = (issueCount[issue.message] || 0) + 1;
            });
        });

        const commonIssues = Object.entries(issueCount)
            .map(([issue, count]) => ({ issue, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        const recommendations = [
            'Tüm kampanyalar için açıklama ekleyin',
            'Geçerlilik tarihlerini kontrol edin',
            'Resim URL\'lerini doğrulayın',
            'Banka-kart uyumunu kontrol edin',
            'SEO için slug\'ları optimize edin'
        ];

        return {
            totalCampaigns: campaigns.length,
            qualityDistribution,
            commonIssues,
            recommendations
        };
    }
}

export default CampaignValidationService;