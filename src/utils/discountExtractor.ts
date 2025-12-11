export const extractDiscountInfo = (title: string, _discount: any) => {
    // Simple extraction logic
    if (title.includes("Taksit")) {
        const match = title.match(/(\d+)\s*Taksit/i);
        return {
            type: 'installment',
            value: match ? match[1] : '6',
            displayText: match ? `${match[1]} Taksit` : 'Taksit Fırsatı',
            color: 'green'
        };
    }
    if (title.includes("İndirim") || title.includes("%")) {
        const match = title.match(/%(\d+)/);
        return {
            type: 'percentage',
            value: match ? match[1] : '10',
            displayText: match ? `%${match[1]} İndirim` : 'İndirim Fırsatı',
            color: 'purple'
        };
    }
    return {
        type: 'text',
        value: '',
        displayText: 'Fırsat',
        color: 'blue'
    };
};

export const shouldShowDiscount = (_info: any) => true;

export const getDiscountGradient = (color: string) => {
    switch (color) {
        case 'green': return 'from-emerald-500 to-emerald-600';
        case 'purple': return 'from-purple-500 to-purple-600';
        case 'red': return 'from-rose-500 to-rose-600';
        default: return 'from-blue-500 to-blue-600';
    }
};
