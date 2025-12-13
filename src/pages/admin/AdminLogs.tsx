import { useState, useEffect } from 'react';
import { Activity, Filter, Download, Trash2, RefreshCw, Calendar, User, AlertTriangle, Info, CheckCircle, AlertCircle } from 'lucide-react';
import { activityService, type ActivityLog } from '../../services/activityService';
import { useConfirmation } from '../../context/ConfirmationContext';

export default function AdminLogs() {
    const { confirm } = useConfirmation();
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [filteredLogs, setFilteredLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        category: 'all' as ActivityLog['category'] | 'all',
        severity: 'all' as ActivityLog['severity'] | 'all',
        admin: 'all',
        dateRange: '7' // Son 7 gün
    });

    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        loadLogs();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [logs, filters]);

    const loadLogs = () => {
        setLoading(true);
        try {
            const allLogs = activityService.getLogs();
            setLogs(allLogs);
            setStats(activityService.getStats());
        } catch (error) {
            console.error('Error loading logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...logs];

        // Kategori filtresi
        if (filters.category !== 'all') {
            filtered = filtered.filter(log => log.category === filters.category);
        }

        // Severity filtresi
        if (filters.severity !== 'all') {
            filtered = filtered.filter(log => log.severity === filters.severity);
        }

        // Admin filtresi
        if (filters.admin !== 'all') {
            filtered = filtered.filter(log => log.adminEmail === filters.admin);
        }

        // Tarih filtresi
        if (filters.dateRange !== 'all') {
            const days = parseInt(filters.dateRange);
            const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
            filtered = filtered.filter(log => log.timestamp >= cutoffDate);
        }

        setFilteredLogs(filtered);
    };

    const handleClearLogs = async () => {
        const confirmed = await confirm({
            title: 'Tüm Logları Temizle',
            message: 'Bu işlem geri alınamaz. Tüm sistem logları silinecek. Devam etmek istiyor musunuz?',
            type: 'danger'
        });

        if (confirmed) {
            activityService.clearLogs();
            loadLogs();
        }
    };

    const handleExportLogs = () => {
        const exportData = activityService.exportLogs();
        const blob = new Blob([exportData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `admin-logs-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const getSeverityIcon = (severity: ActivityLog['severity']) => {
        switch (severity) {
            case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
            case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
            case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
            default: return <Info className="w-4 h-4 text-blue-500" />;
        }
    };

    const getCategoryColor = (category: ActivityLog['category']) => {
        switch (category) {
            case 'auth': return 'bg-purple-100 text-purple-700';
            case 'campaign': return 'bg-blue-100 text-blue-700';
            case 'user': return 'bg-green-100 text-green-700';
            case 'system': return 'bg-red-100 text-red-700';
            case 'settings': return 'bg-yellow-100 text-yellow-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        }).format(date);
    };

    const uniqueAdmins = [...new Set(logs.map(log => log.adminEmail))];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <RefreshCw className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Sistem logları yükleniyor...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Sistem Logları</h2>
                    <p className="text-gray-500 mt-1">Admin işlemleri ve sistem aktivitelerini takip edin</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={loadLogs}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <RefreshCw size={16} />
                        Yenile
                    </button>
                    <button
                        onClick={handleExportLogs}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                        <Download size={16} />
                        Dışa Aktar
                    </button>
                    <button
                        onClick={handleClearLogs}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                        <Trash2 size={16} />
                        Temizle
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Toplam Log</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                            </div>
                            <Activity className="w-8 h-8 text-blue-500" />
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Bugün</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.today}</p>
                            </div>
                            <Calendar className="w-8 h-8 text-green-500" />
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Bu Hafta</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.thisWeek}</p>
                            </div>
                            <Calendar className="w-8 h-8 text-purple-500" />
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Hatalar</p>
                                <p className="text-2xl font-bold text-red-600">{stats.bySeverity.error}</p>
                            </div>
                            <AlertCircle className="w-8 h-8 text-red-500" />
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                        <Filter size={16} className="text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">Filtreler:</span>
                    </div>

                    <select
                        value={filters.category}
                        onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value as any }))}
                        className="text-sm border border-gray-300 rounded-lg px-3 py-1"
                    >
                        <option value="all">Tüm Kategoriler</option>
                        <option value="auth">Kimlik Doğrulama</option>
                        <option value="campaign">Kampanyalar</option>
                        <option value="user">Kullanıcılar</option>
                        <option value="system">Sistem</option>
                        <option value="settings">Ayarlar</option>
                    </select>

                    <select
                        value={filters.severity}
                        onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value as any }))}
                        className="text-sm border border-gray-300 rounded-lg px-3 py-1"
                    >
                        <option value="all">Tüm Seviyeler</option>
                        <option value="info">Bilgi</option>
                        <option value="success">Başarılı</option>
                        <option value="warning">Uyarı</option>
                        <option value="error">Hata</option>
                    </select>

                    <select
                        value={filters.admin}
                        onChange={(e) => setFilters(prev => ({ ...prev, admin: e.target.value }))}
                        className="text-sm border border-gray-300 rounded-lg px-3 py-1"
                    >
                        <option value="all">Tüm Adminler</option>
                        {uniqueAdmins.map(admin => (
                            <option key={admin} value={admin}>{admin}</option>
                        ))}
                    </select>

                    <select
                        value={filters.dateRange}
                        onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                        className="text-sm border border-gray-300 rounded-lg px-3 py-1"
                    >
                        <option value="1">Son 1 Gün</option>
                        <option value="7">Son 7 Gün</option>
                        <option value="30">Son 30 Gün</option>
                        <option value="90">Son 90 Gün</option>
                        <option value="all">Tüm Zamanlar</option>
                    </select>

                    <div className="text-sm text-gray-500">
                        {filteredLogs.length} / {logs.length} log gösteriliyor
                    </div>
                </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Zaman</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Seviye</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Kategori</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Admin</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">İşlem</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Detaylar</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-8 text-gray-500">
                                        Seçilen filtrelere uygun log bulunamadı
                                    </td>
                                </tr>
                            ) : (
                                filteredLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50">
                                        <td className="py-3 px-4 text-sm text-gray-600">
                                            {formatDate(log.timestamp)}
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                {getSeverityIcon(log.severity)}
                                                <span className="text-sm capitalize">{log.severity}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(log.category)}`}>
                                                {log.category}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-sm text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <User size={14} />
                                                {log.adminEmail}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-sm font-medium text-gray-900">
                                            {log.action}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-gray-600 max-w-xs truncate">
                                            {log.details}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}