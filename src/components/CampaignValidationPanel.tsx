import { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, Info, Zap, Shield, TrendingUp, RefreshCw, Upload } from 'lucide-react';
import CampaignValidationService, { type ValidationResult } from '../services/campaignValidationService';
import { useToast } from '../context/ToastContext';

interface CampaignValidationPanelProps {
    campaigns: any[];
    onValidationComplete: (validCampaigns: any[]) => void;
}

export default function CampaignValidationPanel({ campaigns, onValidationComplete }: CampaignValidationPanelProps) {
    const { success, error } = useToast();
    const [validationResults, setValidationResults] = useState<Map<string, ValidationResult>>(new Map());
    const [isValidating, setIsValidating] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [qualityReport, setQualityReport] = useState<any>(null);

    // Kampanyalar değiştiğinde otomatik doğrula
    useEffect(() => {
        if (campaigns.length > 0) {
            validateAllCampaigns();
        }
    }, [campaigns]);

    const validateAllCampaigns = async () => {
        setIsValidating(true);
        const results = new Map<string, ValidationResult>();

        for (const campaign of campaigns) {
            const validation = CampaignValidationService.validateCampaign(campaign);
            results.set(campaign.id || campaign.title, validation);
        }

        setValidationResults(results);
        
        // Kalite raporu oluştur
        const report = CampaignValidationService.generateQualityReport(campaigns);
        setQualityReport(report);
        
        setIsValidating(false);
    };

    const fixAllIssues = async () => {
        setIsValidating(true);
        const fixedCampaigns = [];

        for (const campaign of campaigns) {
            // Otomatik düzeltmeleri uygula
            const fixed = { ...campaign };
            
            // URL düzeltme
            if (fixed.url && !fixed.url.startsWith('http')) {
                fixed.url = 'https://' + fixed.url;
            }
            
            // Slug oluşturma
            if (!fixed.slug && fixed.title) {
                fixed.slug = fixed.title
                    .toLowerCase()
                    .replace(/[^a-z0-9\s-]/g, '')
                    .replace(/\s+/g, '-')
                    .replace(/-+/g, '-')
                    .trim();
            }
            
            // Marka çıkarma
            if (!fixed.brand && fixed.title) {
                const brands = ['migros', 'bim', 'a101', 'şok', 'carrefour'];
                const titleLower = fixed.title.toLowerCase();
                const foundBrand = brands.find(brand => titleLower.includes(brand));
                if (foundBrand) {
                    fixed.brand = foundBrand.charAt(0).toUpperCase() + foundBrand.slice(1);
                }
            }
            
            fixedCampaigns.push(fixed);
        }

        onValidationComplete(fixedCampaigns);
        success('Otomatik düzeltmeler uygulandı!');
        setIsValidating(false);
    };

    const uploadToSupabase = async () => {
        setIsValidating(true);
        let successCount = 0;
        let errorCount = 0;

        for (const campaign of campaigns) {
            const result = await CampaignValidationService.saveCampaignToSupabase(campaign);
            if (result.success) {
                successCount++;
            } else {
                errorCount++;
            }
        }

        if (successCount > 0) {
            success(`${successCount} kampanya Supabase'e kaydedildi!`);
        }
        if (errorCount > 0) {
            error(`${errorCount} kampanya kaydedilemedi.`);
        }

        setIsValidating(false);
    };

    const getValidationIcon = (validation: ValidationResult) => {
        if (validation.errors.length > 0) {
            return <AlertTriangle className="text-red-500" size={16} />;
        }
        if (validation.warnings.length > 0) {
            return <Info className="text-yellow-500" size={16} />;
        }
        return <CheckCircle className="text-green-500" size={16} />;
    };

    const getScoreColor = (score: number) => {
        if (score >= 90) return 'text-green-600 bg-green-100';
        if (score >= 70) return 'text-blue-600 bg-blue-100';
        if (score >= 50) return 'text-yellow-600 bg-yellow-100';
        return 'text-red-600 bg-red-100';
    };

    const validCampaigns = Array.from(validationResults.values()).filter(v => v.isValid).length;
    const totalCampaigns = campaigns.length;
    const averageScore = Array.from(validationResults.values()).reduce((sum, v) => sum + v.score, 0) / totalCampaigns || 0;

    if (campaigns.length === 0) {
        return (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
                <Shield className="mx-auto text-gray-400 mb-2" size={32} />
                <p className="text-gray-500">Doğrulanacak kampanya yok</p>
            </div>
        );
    }

    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                            <Shield className="text-blue-600" size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800">Kampanya Doğrulama Sistemi</h3>
                            <p className="text-sm text-gray-600">
                                {validCampaigns}/{totalCampaigns} kampanya geçerli • 
                                Ortalama kalite: <span className="font-semibold">{averageScore.toFixed(0)}/100</span>
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowDetails(!showDetails)}
                            className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                        >
                            {showDetails ? 'Gizle' : 'Detaylar'}
                        </button>
                        
                        <button
                            onClick={validateAllCampaigns}
                            disabled={isValidating}
                            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-1"
                        >
                            <RefreshCw className={isValidating ? 'animate-spin' : ''} size={14} />
                            Yenile
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="p-4 bg-gray-50 border-b border-gray-200">
                <div className="grid grid-cols-4 gap-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{validCampaigns}</div>
                        <div className="text-xs text-gray-500">Geçerli</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{totalCampaigns - validCampaigns}</div>
                        <div className="text-xs text-gray-500">Hatalı</div>
                    </div>
                    <div className="text-center">
                        <div className={`text-2xl font-bold ${getScoreColor(averageScore).split(' ')[0]}`}>
                            {averageScore.toFixed(0)}
                        </div>
                        <div className="text-xs text-gray-500">Ortalama Skor</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                            {Array.from(validationResults.values()).reduce((sum, v) => sum + v.autoFixedFields.length, 0)}
                        </div>
                        <div className="text-xs text-gray-500">Otomatik Düzeltme</div>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="p-4 bg-white border-b border-gray-200">
                <div className="flex items-center gap-3">
                    <button
                        onClick={fixAllIssues}
                        disabled={isValidating}
                        className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors disabled:opacity-50"
                    >
                        <Zap size={16} />
                        Otomatik Düzelt
                    </button>
                    
                    <button
                        onClick={uploadToSupabase}
                        disabled={isValidating || validCampaigns === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                        <Upload size={16} />
                        Supabase'e Kaydet ({validCampaigns})
                    </button>
                    
                    <div className="flex-1"></div>
                    
                    <div className="text-sm text-gray-500">
                        {isValidating && (
                            <div className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                İşleniyor...
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Detailed Results */}
            {showDetails && (
                <div className="p-4">
                    <div className="space-y-3">
                        {campaigns.map((campaign, index) => {
                            const validation = validationResults.get(campaign.id || campaign.title);
                            if (!validation) return null;

                            return (
                                <div key={index} className="border border-gray-200 rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            {getValidationIcon(validation)}
                                            <span className="font-medium text-gray-800 truncate">
                                                {campaign.title}
                                            </span>
                                        </div>
                                        <div className={`px-2 py-1 rounded-full text-xs font-bold ${getScoreColor(validation.score)}`}>
                                            {validation.score}/100
                                        </div>
                                    </div>
                                    
                                    {validation.errors.length > 0 && (
                                        <div className="mb-2">
                                            <div className="text-xs font-semibold text-red-600 mb-1">Hatalar:</div>
                                            {validation.errors.map((error, i) => (
                                                <div key={i} className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded mb-1">
                                                    <strong>{error.field}:</strong> {error.message}
                                                    {error.suggestion && (
                                                        <div className="text-red-500 mt-1">💡 {error.suggestion}</div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    
                                    {validation.warnings.length > 0 && (
                                        <div className="mb-2">
                                            <div className="text-xs font-semibold text-yellow-600 mb-1">Uyarılar:</div>
                                            {validation.warnings.slice(0, 3).map((warning, i) => (
                                                <div key={i} className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded mb-1">
                                                    <strong>{warning.field}:</strong> {warning.message}
                                                </div>
                                            ))}
                                            {validation.warnings.length > 3 && (
                                                <div className="text-xs text-gray-500">
                                                    +{validation.warnings.length - 3} uyarı daha...
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    
                                    {validation.autoFixedFields.length > 0 && (
                                        <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                                            ✨ Otomatik düzeltildi: {validation.autoFixedFields.join(', ')}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Quality Report */}
            {qualityReport && showDetails && (
                <div className="p-4 bg-gray-50 border-t border-gray-200">
                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <TrendingUp size={16} />
                        Kalite Raporu
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <div className="text-sm font-medium text-gray-700 mb-2">Kalite Dağılımı:</div>
                            <div className="space-y-1 text-xs">
                                <div className="flex justify-between">
                                    <span>Mükemmel (90+):</span>
                                    <span className="font-semibold text-green-600">{qualityReport.qualityDistribution.excellent}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>İyi (70-89):</span>
                                    <span className="font-semibold text-blue-600">{qualityReport.qualityDistribution.good}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Orta (50-69):</span>
                                    <span className="font-semibold text-yellow-600">{qualityReport.qualityDistribution.fair}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Zayıf (0-49):</span>
                                    <span className="font-semibold text-red-600">{qualityReport.qualityDistribution.poor}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div>
                            <div className="text-sm font-medium text-gray-700 mb-2">Yaygın Sorunlar:</div>
                            <div className="space-y-1 text-xs">
                                {qualityReport.commonIssues.slice(0, 4).map((issue: any, i: number) => (
                                    <div key={i} className="flex justify-between">
                                        <span className="truncate">{issue.issue.substring(0, 25)}...</span>
                                        <span className="font-semibold text-red-600">{issue.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}