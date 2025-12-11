import { useState, useEffect } from 'react';
import { Calculator, Sparkles, TrendingUp } from 'lucide-react';
import type { CampaignProps } from './CampaignCard';

interface CampaignCalculatorProps {
    campaign: CampaignProps;
}

export default function CampaignCalculator({ campaign }: CampaignCalculatorProps) {
    const [spendAmount, setSpendAmount] = useState<string>('');
    const [reward, setReward] = useState<number>(0);
    const [roi, setRoi] = useState<number>(0); // Return on Investment %

    // Parse numeric values from campaign data
    const minSpend = campaign.min_spend || parseFloat(String(campaign.spendAmount || '0').replace(/[^0-9.-]+/g, '')) || 0;

    // Try to extract earning number
    const earningRaw = campaign.earning || campaign.earnAmount || '0';
    const earningNum = typeof earningRaw === 'number' ? earningRaw : parseFloat(String(earningRaw).replace(/[^0-9.-]+/g, '')) || 0;

    // Check if it's a percentage based campaign (naive check)
    const isPercentage = String(earningRaw).includes('%');
    const percentageVal = isPercentage ? earningNum : 0;

    useEffect(() => {
        calculateReward(spendAmount);
    }, [spendAmount]);

    const calculateReward = (amountStr: string) => {
        const amount = parseFloat(amountStr) || 0;

        if (amount <= 0) {
            setReward(0);
            setRoi(0);
            return;
        }

        let calculatedReward = 0;

        if (isPercentage) {
            // Percentage logic (e.g. %20 discount)
            calculatedReward = (amount * percentageVal) / 100;
            // Cap at a theoretical limit if we had one, for now assume purely linear or fixed max
            // Many campaigns have a max cap (e.g. Max 100 TL), we might need to look for that text later.
        } else {
            // Fixed amount logic (e.g. Spend 1000, Get 100)
            if (minSpend > 0) {
                // If it's "Every 1000 TL", logic would be floor(amount/minSpend) * earning
                // But for safety, simpler logic first: Threshold based
                if (amount >= minSpend) {
                    // Assume it might be scalable? Let's assume scalable for "Every X" or fixed for "Once"
                    // Heuristic: If minSpend is round like 1000/2000, usually "Every".
                    // Ideally we need an 'isScalable' flag from AI.
                    // For now: Linear scaling logic if amount > minSpend * 2?
                    // Let's stick to simple: If you spend X, you qualify for AT LEAST the fixed amount

                    // BETTER LOGIC: calculatedReward = earningNum
                    // If user enters 2x minSpend, do we double?
                    // Let's assume singular for now unless we detect "her" keyword in description later.
                    calculatedReward = earningNum;
                }
            } else {
                // No min spend? Maybe just direct earning?
                calculatedReward = earningNum;
            }
        }

        setReward(calculatedReward);
        setRoi(amount > 0 ? (calculatedReward / amount) * 100 : 0);
    };

    return (
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-6 border border-indigo-100 shadow-sm relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 -mr-4 -mt-4 text-indigo-100 opacity-50">
                <Calculator size={120} />
            </div>

            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-white rounded-lg shadow-sm text-indigo-600">
                        <Sparkles size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-indigo-900">Kazanç Hesapla</h3>
                        <p className="text-xs text-indigo-600/80">Harcamanıza göre tahmini kazanç</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-indigo-800 mb-1 ml-1">Harcama Tutarı</label>
                        <div className="relative">
                            <input
                                type="number"
                                value={spendAmount}
                                onChange={(e) => setSpendAmount(e.target.value)}
                                placeholder={minSpend > 0 ? `Örn: ${minSpend}` : "Örn: 2000"}
                                className="w-full pl-4 pr-12 py-3 bg-white border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-gray-700"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">TL</span>
                        </div>
                        {minSpend > 0 && (spendAmount === '' || parseFloat(spendAmount) < minSpend) && (
                            <p className="text-[10px] text-amber-600 mt-1.5 flex items-center gap-1 font-medium ml-1">
                                ⚠️ Minimum harcama: {minSpend} TL
                            </p>
                        )}
                    </div>

                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-indigo-100 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-600">Tahmini Kazanç:</span>
                            <div className="text-right">
                                <span className={`text-2xl font-black ${reward > 0 ? 'text-green-600' : 'text-gray-300'}`}>
                                    {Math.floor(reward).toLocaleString('tr-TR')}
                                </span>
                                <span className="text-xs font-bold text-gray-400 ml-1">TL Puan</span>
                            </div>
                        </div>

                        {reward > 0 && (
                            <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                                <span className="text-indigo-600 font-medium flex items-center gap-1">
                                    <TrendingUp size={12} /> Geri Dönüş
                                </span>
                                <span className="font-bold text-indigo-800 border border-indigo-200 px-1.5 py-0.5 rounded bg-indigo-50">
                                    %{roi.toFixed(1)}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
