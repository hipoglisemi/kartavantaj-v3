// Türkçe karakterleri normalize et
export function normalizeTurkish(str: string): string {
    if (!str) return '';
    return str
        .toLowerCase()
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ı/g, 'i')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c');
}

// Türkçe alfabetik sıralama
export function sortTurkish(arr: string[]): string[] {
    return arr.sort((a, b) => a.localeCompare(b, 'tr-TR'));
}

// Benzersiz liste (Türkçe karakter destekli)
export function uniqueTurkish(arr: string[]): string[] {
    const map = new Map();
    arr.forEach(item => {
        if (!item) return;
        const normalized = normalizeTurkish(item);
        if (!map.has(normalized)) {
            map.set(normalized, item);
        }
    });
    return Array.from(map.values());
}
