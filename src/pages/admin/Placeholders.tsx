import { Wrench, Database, Upload, Plus } from 'lucide-react';

export function QuickAdd() {
    return (
        <div className="flex flex-col items-center justify-center h-96 bg-white border border-dashed border-gray-300 rounded-xl">
            <div className="bg-blue-50 p-4 rounded-full mb-4">
                <Plus className="text-blue-600" size={32} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Hızlı Ekle</h3>
            <p className="text-gray-500 mt-2">Tekli kampanya ekleme formu burada olacak.</p>
        </div>
    );
}

export function AdvancedManagement() {
    return (
        <div className="flex flex-col items-center justify-center h-96 bg-white border border-dashed border-gray-300 rounded-xl">
            <div className="bg-purple-50 p-4 rounded-full mb-4">
                <Wrench className="text-purple-600" size={32} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Gelişmiş Yönetim</h3>
            <p className="text-gray-500 mt-2">Kullanıcı yönetimi ve sistem ayarları burada olacak.</p>
        </div>
    );
}

export function BulkUpload() {
    return (
        <div className="flex flex-col items-center justify-center h-96 bg-white border border-dashed border-gray-300 rounded-xl">
            <div className="bg-orange-50 p-4 rounded-full mb-4">
                <Upload className="text-orange-600" size={32} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Toplu Yükleme</h3>
            <p className="text-gray-500 mt-2">CSV veya Excel ile kampanya yükleme alanı.</p>
        </div>
    );
}

export function ScraperTools() {
    return (
        <div className="flex flex-col items-center justify-center h-96 bg-white border border-dashed border-gray-300 rounded-xl">
            <div className="bg-green-50 p-4 rounded-full mb-4">
                <Database className="text-green-600" size={32} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Scraper Araçları</h3>
            <p className="text-gray-500 mt-2">Veri botları ve zamanlayıcı yönetimi.</p>
        </div>
    );
}
