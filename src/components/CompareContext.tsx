import React, { createContext, useContext, useState } from 'react';

// Simplified Context
interface CompareContextType {
    addToCompare: (item: any) => void;
    removeFromCompare: (id: number) => void;
    isInCompare: (id: number) => boolean;
    compareList: any[];
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

export function CompareProvider({ children }: { children: React.ReactNode }) {
    const [compareList, setCompareList] = useState<any[]>([]);

    const addToCompare = (item: any) => {
        if (!isInCompare(item.id)) {
            setCompareList([...compareList, item]);
        }
    };

    const removeFromCompare = (id: number) => {
        setCompareList(compareList.filter(item => item.id !== id));
    };

    const isInCompare = (id: number) => {
        return compareList.some(item => item.id === id);
    };

    return (
        <CompareContext.Provider value={{ addToCompare, removeFromCompare, isInCompare, compareList }}>
            {children}
        </CompareContext.Provider>
    );
}

export function useCompare() {
    const context = useContext(CompareContext);
    if (context === undefined) {
        // Return dummy implementation if used outside provider to prevent crash
        return {
            addToCompare: () => { },
            removeFromCompare: () => { },
            isInCompare: () => false,
            compareList: []
        };
    }
    return context;
}
