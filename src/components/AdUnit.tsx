import { useEffect, useRef, useState } from 'react';

interface AdUnitProps {
    slotId: string;
    format?: 'auto' | 'fluid' | 'rectangle';
    layout?: string;
    className?: string;
    style?: React.CSSProperties;
}

declare global {
    interface Window {
        adsbygoogle: any[];
    }
}

export default function AdUnit({ slotId, format = 'auto', layout, className = '', style }: AdUnitProps) {
    const adRef = useRef<HTMLModElement>(null);
    const [config, setConfig] = useState<{ enabled: boolean; clientId: string; slotId: string } | null>(null);

    useEffect(() => {
        // Load config
        const saved = localStorage.getItem('ad_config');
        if (saved) {
            setConfig(JSON.parse(saved));
        } else {
            // Default/Fallback state (e.g. Disabled by default if not set)
            setConfig({ enabled: false, clientId: '', slotId: '' });
        }
    }, []);

    useEffect(() => {
        if (!config?.enabled) return;

        try {
            if (adRef.current && window.adsbygoogle) {
                // Prevent double injection if already filled (basic check)
                if (adRef.current.innerHTML.trim() === '') {
                    (window.adsbygoogle = window.adsbygoogle || []).push({});
                }
            }
        } catch (e) {
            console.error("AdSense Error:", e);
        }
    }, [config]);

    // If config says disabled, don't show anything (User request: "aktif pasif yapabileyim")
    if (config && !config.enabled) return null;

    // Use configured ID or fallback to props/placeholder
    const effectiveSlotId = config?.slotId || slotId;
    const effectiveClientId = config?.clientId || 'ca-pub-XXXXXXXXXXXXXXXX';

    return (
        <div className={`w-full flex justify-center my-4 ${className}`}>
            {/* Placeholder for Development/When AdBlock is on - Only show if NO client ID configured yet */}
            {(!effectiveClientId || effectiveClientId.includes('XXX')) && (
                <div className="bg-gray-50 border border-gray-200 text-gray-400 text-xs flex flex-col gap-1 items-center justify-center w-full min-h-[100px] md:min-h-[90px] rounded-lg">
                    <span className="font-semibold">Reklam Alanı</span>
                    <span className="text-[10px]">(Admin panelinden yapılandırılabilir)</span>
                </div>
            )}

            {effectiveClientId && !effectiveClientId.includes('XXX') && (
                <ins
                    ref={adRef}
                    className="adsbygoogle"
                    style={{ display: 'block', width: '100%', ...style }}
                    data-ad-client={effectiveClientId}
                    data-ad-slot={effectiveSlotId}
                    data-ad-format={format}
                    data-full-width-responsive="true"
                    {...(layout ? { 'data-ad-layout': layout } : {})}
                />
            )}
        </div>
    );
}
