import { type CampaignProps } from '../components/CampaignCard';
import { createClient } from '@supabase/supabase-js';

// Helper for dynamic supabase
const getSupabase = () => {
    const url = localStorage.getItem('supabase_project_url');
    const key = localStorage.getItem('supabase_anon_key');
    if (!url || !key) return null;
    return createClient(url, key);
};


/**
 * Service to fetch and parse campaign data from external URLs.
 * Uses a CORS proxy to bypass browser restrictions.
 */
export const campaignParser = {
    /**
     * Fetches and parses a campaign URL.
     * @param url The campaign URL to fetch.
     * @returns A partial CampaignProps object with extracted data.
     */
    async fetchAndParse(url: string, apiKey?: string): Promise<Partial<CampaignProps>> {
        try {
            const proxies = [
                (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
                (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
                (u: string) => `https://thingproxy.freeboard.io/fetch/${u}`
            ];

            let lastError;
            for (const proxyGen of proxies) {
                try {
                    const proxyUrl = proxyGen(url);
                    const response = await fetch(proxyUrl);
                    if (response.ok) {
                        const html = await response.text();
                        // Verify we actually got HTML and not a proxy error page
                        if (html.includes('<html') || html.includes('<!DOCTYPE')) {
                            // Parse logic...
                            const parser = new DOMParser();
                            const doc = parser.parseFromString(html, 'text/html');
                            return this.parseContent(doc, url, apiKey);
                        }
                    }
                    console.warn(`Proxy failed: ${proxyUrl}`);
                } catch (e) {
                    console.warn(`Proxy error: ${e}`);
                    lastError = e;
                }
            }
            throw new Error('Hiçbir proxy ile bağlantı kurulamadı. ' + (lastError || ''));
        } catch (error) {
            console.error('Campaign Parsing Error:', error);
            throw error;
        }
    },

    async parseContent(doc: Document, url: string, apiKey?: string): Promise<Partial<CampaignProps>> {
        // 1. Basic Metadata Extraction (Always do this as fallback/baseline)
        let basicData: Partial<CampaignProps> = {};

        // Detect Provider based on URL
        let currentProvider = 'unknown';
        if (url.includes('maximum.com.tr')) currentProvider = 'maximum';
        else if (url.includes('garantibbva')) currentProvider = 'bonus';
        else if (url.includes('world')) currentProvider = 'world';
        else if (url.includes('axess')) currentProvider = 'axess';

        // Parse based on provider logic for baseline
        switch (currentProvider) {
            case 'maximum':
                basicData = this.parseMaximum(doc, url);
                break;
            default:
                basicData = this.parseGeneric(doc, url);
                break;
        }

        // 2. AI ENHANCEMENT
        if (apiKey) {
            try {
                // Get clean text for AI
                const bodyText = doc.body.innerText || doc.body.textContent || "";
                // Remove excessive whitespace to save tokens
                const cleanText = bodyText.replace(/\s+/g, ' ').substring(0, 20000);

                console.log("🤖 Gemini AI Analizi Başlıyor...");
                const aiData = await this.parseWithGemini(cleanText, apiKey);

                console.log("✨ AI Sonuçları:", aiData);

                // Merge AI data ON TOP of basic data (AI is smarter)
                // However, keep Image from basic data if AI didn't find one better (AI usually doesn't extract images well from text)
                return {
                    ...basicData,
                    ...aiData,
                    // Prefer basicData image if AI returns nothing or invalid
                    image: (aiData.image && aiData.image.startsWith('http')) ? aiData.image : basicData.image,
                    // Merge conditions if both exist? Or just trust AI? Trust AI for text fields.
                };

            } catch (aiError) {
                console.error("⚠️ AI Analizi Başarısız Oldu, standart parser kullanılıyor:", aiError);
                // Fallback to basic data essentially happens by returning it below if we didn't return above
            }
        }

        return basicData;
    },

    /**
     * Resumed...
     */
    parser_placeholder() {
        return;
    },

    /**
     * Parser for Maximum (İş Bankası) campaigns.
     */
    parseMaximum(doc: Document, originalUrl: string): Partial<CampaignProps> {
        const title = doc.querySelector('h1')?.textContent?.trim() || 'Yeni Kampanya';

        // Image: Try to find the detailed campaign image
        // Maximum usually puts it in a specfic banner or figure
        let image = doc.querySelector('.img-responsive')?.getAttribute('src') ||
            doc.querySelector('img[alt="' + title + '"]')?.getAttribute('src') ||
            '';

        if (image && !image.startsWith('http')) {
            image = `https://www.maximum.com.tr${image}`;
        }

        // Details content
        // Maximum usually has text in a specific container
        const detailContainer = doc.querySelector('.campaign-detail-content') || doc.body;
        const rawText = detailContainer.textContent || '';

        // Extract Dates
        const dateRegex = /(\d{1,2}\s+[a-zA-ZçğıöşüÇĞİÖŞÜ]+\s+\d{4})\s*-\s*(\d{1,2}\s+[a-zA-ZçğıöşüÇĞİÖŞÜ]+\s+\d{4})/;
        const dateMatch = rawText.match(dateRegex);

        let valid_from = '';
        let validUntil = '';

        if (dateMatch) {
            // Convert Turkish dates to ISO? Or keep as string.
            // For now, let's try to keep them as strings or simple formats.
            valid_from = dateMatch[1]; // e.g. 1 Ocak 2024
            validUntil = dateMatch[2]; // e.g. 31 Ocak 2024
        } else {
            // Fallback: look for generic date patterns associated with "tarihine kadar"
            const untilMatch = rawText.match(/(\d{1,2}\s+[a-zA-ZçğıöşüÇĞİÖŞÜ]+\s+\d{4})\s*tarihine kadar/i);
            if (untilMatch) {
                validUntil = untilMatch[1];
            }
        }

        // Conditions & Participation Steps
        // Maximum lists are usually ul/li or just paragraphs
        const conditions: string[] = [];
        const participation_points: string[] = [];

        const listItems = detailContainer.querySelectorAll('li');
        listItems.forEach(li => {
            const text = li.textContent?.trim();
            if (!text) return;

            // Basic heuristic: shorter items or items with imperative verbs might be steps
            if (text.toLowerCase().includes('katıl') || text.toLowerCase().includes('indir') || text.toLowerCase().includes('tıkla')) {
                participation_points.push(text);
            } else {
                conditions.push(text);
            }
        });

        // Fallback if no lists found (paragraphs splitting)
        if (conditions.length === 0) {
            const paragraphs = detailContainer.querySelectorAll('p');
            paragraphs.forEach(p => {
                const text = p.textContent?.trim();
                if (text && text.length > 20) {
                    conditions.push(text);
                }
            });
        }

        return {
            title,
            image,
            bank: 'Maximum',
            category: 'Genel', // User will need to fix this
            badgeText: 'Fırsat',
            badgeColor: 'purple',
            valid_from,
            validUntil,
            url: originalUrl,
            conditions,
            participation_points,
            isApproved: false,
            // Try to extract dynamic fields
            min_spend: this.extractMoney(rawText, 'alışveriş'),
            earning: this.extractMoney(rawText, 'puan') || this.extractMoney(rawText, 'indirim')
        };
    },

    /**
     * Generic parser for unknown sites.
     */
    parseGeneric(doc: Document, originalUrl: string): Partial<CampaignProps> {
        const title = doc.querySelector('h1')?.textContent?.trim() || doc.title || 'Yeni Kampanya';
        const image = doc.querySelector('meta[property="og:image"]')?.getAttribute('content') || '';
        const desc = doc.querySelector('meta[property="og:description"]')?.getAttribute('content') || '';

        return {
            title,
            image,
            description: desc,
            url: originalUrl,
            conditions: [desc],
            bank: 'Diğer',
            badgeColor: 'gray',
            isApproved: false
        };
    },

    /**
     * Helper to extract money values associated with keywords.
     */
    extractMoney(text: string, keyword: string): any {
        // Look for pattern: Keyword ... number TL 
        // Very basic regex
        const regex = new RegExp(`${keyword}[^\\d]*(\\d+[.,]?\\d*)\\s*(TL|tl)`, 'i');
        const match = text.match(regex);
        if (match) {
            return match[1] + ' TL'; // Return as string for now
        }
        return undefined;
    },

    /**
     * Uses Gemini AI to intelligently parse campaign text and extract structured data.
     */
    async parseWithGemini(rawText: string, apiKey: string): Promise<Partial<CampaignProps>> {
        if (!apiKey) throw new Error("API Key required");
        // Ultra-strict cleaning: allows only alphanumeric, underscore, dash. Removes hidden chars.
        const cleanKey = apiKey.replace(/[^a-zA-Z0-9_\-]/g, '');

        // FETCH USER RULES
        let userRules = "";
        try {
            const rules = await this.fetchRules();
            if (rules.length > 0) {
                userRules = `\n\n!!! KULLANICI TARAFINDAN TANIMLANAN ZORUNLU KURALLAR (USER DEFINED RULES) !!!\nBu kurallar diğer tüm kurallardan daha önceliklidir. Kesinlikle uymalısın:\n${rules.map((r, i) => `${i + 1}. ${r.rule_text} (${r.user_feedback})`).join('\n')}\n!!! KURALLAR BİTTİ !!!\n\n`;
                console.log("🧠 AI Memory: Applied " + rules.length + " custom rules.");
            }
        } catch (e) {
            console.warn("Could not fetch AI rules", e);
        }

        const prompt = `
            You are a smart data extraction assistant for "KartAvantaj".
            Your task is to analyze the provided campaign text and extract structured data into a VALID JSON object.
            ${userRules}
            CRITICAL RULES:
            1. **LANGUAGE**: ALL OUTPUT MUST BE IN **TURKISH**. Never use English.
            
            2. **DATES (Exactness is Key)**:
               - Extract the EXACT dates mentioned. DO NOT round up or change years.
               - "31 Aralık 2025" -> validUntil: "2025-12-31".
               - "30 Aralık" -> validUntil: "2025-12-30" (Use current/next logical year).
               - DO NOT convert "end of year" to "Jan 1st". 

            3. **PARTICIPATION METHOD (Short & Concise)**:
               - This field must be a **MAXIMUM OF 5-7 WORDS**.
               - Examples: "Juzdan ile Katıl", "SMS: KAYIT > 4455", "Otomatik Katılım".
               - **DO NOT** paste long instructions.

            4. **EARNING & EXTRA ADVANTAGE (Smart Categorization)**: 
               - **earning**: The PRIMARY benefit. Priority Order:
                 1. Points/Cashback (e.g. "300 TL Chip-para", "5000 Puan")
                 2. Direct Discount (e.g. "100 TL İndirim", "%20 İndirim")
                 3. Gift Code (e.g. "Ücretsiz Kod", "Hediye Çeki")
                 4. Installment (e.g. "Peşin Fiyatına 9 Taksit") - ONLY if it is the ONLY benefit.
               - **discount**: The SECONDARY benefit or Installment (if points exist).
                 * Example: If "200 TL Puan" AND "3 Taksit" -> earning: "200 TL Puan", discount: "+3 Taksit".
                 * Example: If ONLY "9 Taksit" -> earning: "9 Taksit", discount: null.
               - **min_spend**: Calculated total spend for MAX reward.

            5. **VALID CARDS**:
               - List specific card brands.

            6. **BRAND (Search Filter)**:
               - Extract the specific store or merchant name (e.g. "Trendyol", "Migros", "Starbucks", "A101").
               - This is CRITICAL for search filters.
               - **IGNORE** generic terms like "Akbanklılar", "Alışveriş".
               - If it is a general sector campaign without a specific store, return "Genel".

            7. **CATEGORY (Sector)**:
               - You MUST classify the campaign into ONE of these exact categories:
               - "Market", "Akaryakıt", "Elektronik", "Giyim", "Restoran", "Seyahat", "E-Ticaret", "Mobilya", "Kozmetik", "Eğitim", "Diğer".
               - Choose "Diğer" only if absolutely no other category fits.

            FIELDS TO EXTRACT:
            - min_spend (number): Calculated total minimum spend.
            - earning (string): Primary reward (e.g. "500 TL Puan").
            - discount (string): Extra advantage (e.g. "8 Taksit" or "%20 İndirim").
            - valid_from (string): YYYY-MM-DD.
            - validUntil (string): YYYY-MM-DD.
            - valid_cards (string): Comma-separated list.
            - brand (string): Merchant/Store Name.
            - category (string): Strictly one of the allowed categories.
            - participation_method (string): VERY SHORT summary.
            - participation_points (array of strings): Full instructions.
            - conditions (array of strings): Detailed rules.
            - description (string): Short summary (Max 2 sentences).
            - bank (string): Bank name.

            TEXT:
            "${rawText.replace(/"/g, '\\"').substring(0, 15000)}" 
        `;

        // Helper to try models sequentially
        const tryModel = async (modelName: string, apiVersion: string = 'v1beta'): Promise<any> => {
            const url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${modelName}:generateContent?key=${cleanKey}`;

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });

            if (!response.ok) {
                if (response.status === 404) throw new Error("MODEL_NOT_FOUND");
                const errorBody = await response.text();
                throw new Error(`${modelName} Error (${response.status}): ${errorBody}`);
            }

            const data = await response.json();
            const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!responseText) throw new Error("No text extraction");

            const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanJson);
        };

        // Fallback Chain (Based on User's Available Models)
        let errors: string[] = [];

        // 1. Try Gemini 2.5 Flash (Preferred, Newest & Provided by User)
        try { return await tryModel("gemini-2.5-flash", "v1beta"); }
        catch (e: any) { errors.push(`2.5 Flash: ${e.message}`); }

        // 2. Try Gemini 2.0 Flash (Stable Next-Gen)
        try { return await tryModel("gemini-2.0-flash", "v1beta"); }
        catch (e: any) { errors.push(`2.0 Flash: ${e.message}`); }

        // 3. Try Gemini 2.5 Pro (Powerful)
        try { return await tryModel("gemini-2.5-pro", "v1beta"); }
        catch (e: any) { errors.push(`2.5 Pro: ${e.message}`); }

        // 4. Try Gemini 3 Pro Preview (Bleeding Edge - as seen in logs)
        try { return await tryModel("gemini-3-pro-preview", "v1beta"); }
        catch (e: any) { errors.push(`3 Pro Preview: ${e.message}`); }

        console.error("All AI models failed.", errors);

        // Return a consolidated error message
        const maskedKey = apiKey ? `${apiKey.substring(0, 5)}***${apiKey.substring(apiKey.length - 3)} (${apiKey.length} chars)` : 'No Key';
        throw new Error(`AI Hatası: Hiçbir model çalıştırılamadı.\nKullanılan Anahtar: ${maskedKey}\n\nDetaylar:\n${errors.map(e => '- ' + e).join('\n')}`);
    },

    /**
     * Fetches custom AI rules from Supabase.
     */
    async fetchRules(): Promise<{ rule_text: string, user_feedback: string }[]> {
        const client = getSupabase();
        if (!client) return [];

        const { data, error } = await client
            .from('ai_rules')
            .select('rule_text, user_feedback')
            .eq('is_active', true);

        if (error) {
            console.error("Error fetching AI rules:", error);
            return [];
        }
        return data || [];
    },

    /**
     * Converts a user's natural language feedback into a strict rule and saves it.
     */
    async learnRule(userFeedback: string, apiKey: string): Promise<string> {
        if (!apiKey) throw new Error("API Key required");
        const client = getSupabase();
        if (!client) throw new Error("Supabase connection required to save rules.");

        // 1. Distill Rule with Gemini
        const cleanKey = apiKey.replace(/[^a-zA-Z0-9_\-]/g, '');
        const prompt = `
            User Feedback: "${userFeedback}"

            Task: Convert this feedback into a short, strict rule for an AI data extraction bot.
            Example Feedback: "Migros is always a Market, don't say E-commerce"
            Example Rule: "IF brand is Migros THEN set category to 'Market'."
            
            Output ONLY the rule text. No explanations.
        `;

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${cleanKey}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        if (!response.ok) throw new Error("Gemini API Error during learning.");
        const data = await response.json();
        const ruleText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

        if (!ruleText) throw new Error("Could not extract rule.");

        // 2. Save to Supabase
        const { error } = await client
            .from('ai_rules')
            .insert({
                rule_text: ruleText,
                user_feedback: userFeedback,
                is_active: true
            });

        if (error) throw new Error("Database Error: " + error.message);

        return ruleText;
    }
};
