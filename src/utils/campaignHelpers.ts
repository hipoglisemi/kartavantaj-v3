export const formatTitle = (title: string) => title;
export const formatProvider = (provider: string) => provider;
export const formatCategory = (category: string) => category;
export const formatDiscount = (discount: any) => discount;
export const cleanHtmlTags = (text: string) => text?.replace(/<[^>]*>/g, '') || '';
export const generateCampaignSlug = (title: string, id: number) => {
    return `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${id}`;
};
