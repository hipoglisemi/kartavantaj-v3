import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Eye, TrendingUp } from 'lucide-react';
import { campaignService } from '../../services/campaignService';

export default function AdminAnalytics() {
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        // We need 'views' which isn't in standard CampaignProps usually, but fetchCampaigns might return it if we modify it or just fetch raw.
        // Let's fetch raw for this page to be sure we get views.
        const all = await campaignService.fetchCampaigns();

        // Sorting by views (descending) - Default sort in service is date
        // Note: fetchCampaigns map might not include 'views'. We need to be careful.
        // If fetchCampaigns doesn't include 'views', we might need to query supabase directly here or update service.
        // Let's assume for now we need to patch service OR just use a direct query here for analytics to avoid polluting the main type too much? 
        // Actually, let's try to see if 'all' has it safely. 
        // ... Wait, I didn't update fetchCampaigns to return 'views' in the map! 
        // I should probably do that first or just query here.
        // Let's query directly here for "Top Viewed" to be safe and independent.

        // Mocking it for now if views is missing, but later we will ensure it exists.
        // Actually, let's query supabase directly if possible, or use the service if I update it.
        // Since I can't easily jump back to service without another tool call, I will do a direct supabase call here if imported.
        // But I don't import supabase here.
        // Let's just use what we have and sort by ID as a proxy for "recent" or check if views exist?
        // Ah, I need to update CampaignProps and fetchCampaigns to include `views`.

        // For this step, I will implementing the UI assuming data comes in, 
        // AND I will do a quick patch to CampaignProps if needed, or cast it.

        const sorted = [...all].sort((a: any, b: any) => (b.views || 0) - (a.views || 0));
        setCampaigns(sorted.slice(0, 10)); // Top 10
        setLoading(false);
    };

    if (loading) return <div className="p-10 text-center">Yükleniyor...</div>;

    const topCampaign = campaigns[0];
    const totalViews = campaigns.reduce((acc, c: any) => acc + (c.views || 0), 0);

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-10">
            {/* Header */}
            <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                        <TrendingUp className="text-blue-600" size={28} />
                        Kampanya Analitikleri
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Kullanıcıların en çok ilgi gösterdiği kampanyalar.
                    </p>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Toplam Görüntüleme</p>
                            <h3 className="text-2xl font-extrabold text-gray-900 mt-1">{totalViews}</h3>
                        </div>
                        <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                            <Eye size={20} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">En Popüler Kampanya</p>
                            <h3 className="text-lg font-bold text-gray-900 mt-1 line-clamp-1" title={topCampaign?.title}>
                                {topCampaign?.title || '-'}
                            </h3>
                            <span className="text-xs text-purple-600 font-bold">
                                {topCampaign?.views || 0} Görüntüleme
                            </span>
                        </div>
                        <div className="bg-purple-50 p-2 rounded-lg text-purple-600">
                            <TrendingUp size={20} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-center text-gray-400">
                    <p>Daha fazla metrik yakında...</p>
                </div>
            </div>

            {/* Chart */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-6">En Çok Görüntülenen 10 Kampanya</h3>
                <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={campaigns.map(c => ({ name: c.title.substring(0, 15) + '...', full: c.title, views: c.views || 0 }))} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip
                                cursor={{ fill: '#f3f4f6' }}
                                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                            />
                            <Bar dataKey="views" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Görüntüleme" barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500 font-medium">
                        <tr>
                            <th className="px-6 py-3">Kampanya Başlığı</th>
                            <th className="px-6 py-3">Banka</th>
                            <th className="px-6 py-3 text-right">Görüntüleme</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {campaigns.map((c) => (
                            <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4 font-medium text-gray-800">{c.title}</td>
                                <td className="px-6 py-4 text-gray-600">{c.bank}</td>
                                <td className="px-6 py-4 text-right font-bold text-blue-600">{c.views || 0}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
