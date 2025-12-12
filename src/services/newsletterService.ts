export interface Subscriber {
    id: number;
    email: string;
    date: string;
    source: string;
}

const STORAGE_KEY = 'newsletter_subscribers';

const initialSubscribers: Subscriber[] = [];

export const newsletterService = {
    getSubscribers: (): Subscriber[] => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
            // Seed initial data if empty
            localStorage.setItem(STORAGE_KEY, JSON.stringify(initialSubscribers));
            return initialSubscribers;
        }
        return JSON.parse(stored);
    },

    subscribe: (email: string, source: string = 'Footer'): boolean => {
        const subscribers = newsletterService.getSubscribers();

        // Check if already exists
        if (subscribers.some(s => s.email === email)) {
            return false;
        }

        const newSubscriber: Subscriber = {
            id: Date.now(),
            email,
            date: new Date().toLocaleDateString('tr-TR'),
            source
        };

        const updated = [newSubscriber, ...subscribers];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return true;
    }
};
