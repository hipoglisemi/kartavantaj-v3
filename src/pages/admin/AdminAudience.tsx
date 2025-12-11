import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Users, Mail, TrendingUp, MoreHorizontal } from 'lucide-react';

const trafficData = [
    { name: 'Pzt', visitors: 1200, users: 40 },
    { name: 'Sal', visitors: 1450, users: 55 },
    { name: 'Çar', visitors: 1100, users: 35 },
    { name: 'Per', visitors: 1600, users: 70 },
    { name: 'Cum', visitors: 1950, users: 90 },
    { name: 'Cmt', visitors: 2400, users: 120 },
    { name: 'Paz', visitors: 2200, users: 110 },
];

const recentMembers = [
    { id: 1, name: 'Ahmet Yılmaz', email: 'ahmet@example.com', date: '01.05.2024', status: 'Aktif' },
    { id: 2, name: 'Ayşe Demir', email: 'ayse@example.com', date: '01.05.2024', status: 'Onay Bekliyor' },
    { id: 3, name: 'Mehmet Kaya', email: 'mehmet@example.com', date: '30.04.2024', status: 'Aktif' },
    { id: 4, name: 'Zeynep Çelik', email: 'zeynep@example.com', date: '29.04.2024', status: 'Pasif' },
];

import { useEffect, useState } from 'react';
import { newsletterService, type Subscriber } from '../../services/newsletterService';

export default function AdminAudience() {
    const [subscribers, setSubscribers] = useState<Subscriber[]>([]);

    useEffect(() => {
        setSubscribers(newsletterService.getSubscribers());
    }, []);

    return (
        <div className="space-y-8">
            {/* Başlık */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Kitle ve Trafik Analizi</h2>
                <p className="text-gray-500 mt-1">Site ziyaretçileri, üyelikler ve abonelik durumları.</p>
            </div>

            {/* Özet Kartlar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Haftalık Trafik</p>
                        <h3 className="text-3xl font-bold text-gray-900 mt-1">11,900</h3>
                        <div className="flex items-center gap-1 text-xs font-medium text-green-600 mt-2">
                            <TrendingUp size={14} />
                            <span>+%12 geçen haftaya göre</span>
                        </div>
                    </div>
                    <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                        <TrendingUp size={24} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Toplam Üye</p>
                        <h3 className="text-3xl font-bold text-gray-900 mt-1">2,450</h3>
                    </div>
                    <div className="bg-purple-100 p-3 rounded-full text-purple-600">
                        <Users size={24} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Bülten Aboneleri</p>
                        <h3 className="text-3xl font-bold text-gray-900 mt-1">{subscribers.length}</h3>
                    </div>
                    <div className="bg-orange-100 p-3 rounded-full text-orange-600">
                        <Mail size={24} />
                    </div>
                </div>
            </div>

            {/* Trafik Grafiği */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h4 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
                    Site Trafiği (Son 7 Gün)
                </h4>
                <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trafficData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorVis" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="name" axisLine={false} tickLine={false} />
                            <YAxis axisLine={false} tickLine={false} />
                            <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.4} />
                            <Tooltip />
                            <Area type="monotone" dataKey="visitors" stroke="#3b82f6" fillOpacity={1} fill="url(#colorVis)" strokeWidth={3} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Son Üyeler */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h4 className="font-bold text-gray-900">Son Kayıt Olanlar</h4>
                        <button className="text-sm text-blue-600 hover:underline">Tümünü Gör</button>
                    </div>
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                            <tr>
                                <th className="px-6 py-3">Kullanıcı</th>
                                <th className="px-6 py-3">Tarih</th>
                                <th className="px-6 py-3">Durum</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {recentMembers.map((member) => (
                                <tr key={member.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                                                {member.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">{member.name}</div>
                                                <div className="text-xs text-gray-500">{member.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 text-sm text-gray-500">{member.date}</td>
                                    <td className="px-6 py-3">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${member.status === 'Aktif' ? 'bg-green-100 text-green-800' :
                                            member.status === 'Pasif' ? 'bg-red-100 text-red-800' :
                                                'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {member.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Bülten Aboneleri */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h4 className="font-bold text-gray-900">Son Bülten Abonelikleri</h4>
                        <button className="text-gray-400 hover:text-gray-600">
                            <MoreHorizontal size={20} />
                        </button>
                    </div>
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                            <tr>
                                <th className="px-6 py-3">E-posta</th>
                                <th className="px-6 py-3">Kaynak</th>
                                <th className="px-6 py-3">Tarih</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {subscribers.map((sub) => (
                                <tr key={sub.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-3 text-sm font-medium text-gray-900">{sub.email}</td>
                                    <td className="px-6 py-3 text-sm text-gray-500">{sub.source}</td>
                                    <td className="px-6 py-3 text-sm text-gray-500">{sub.date}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
