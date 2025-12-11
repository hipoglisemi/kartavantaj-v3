export const logoMap: Record<string, string> = {
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
    'shop&fly': '/assets/logos/shop&fly.png'
};

export const getLogoForBank = (bankName: string): string | null => {
    const lowerName = bankName.toLowerCase();

    // 1. Check direct map
    for (const [key, logo] of Object.entries(logoMap)) {
        if (lowerName.includes(key)) return logo;
    }

    return null;
};
