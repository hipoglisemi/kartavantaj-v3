import { useState, useEffect } from 'react';
import { Timer, Clock } from 'lucide-react';

interface CampaignCountdownProps {
    validUntil: string | null;
}

export default function CampaignCountdown({ validUntil }: CampaignCountdownProps) {
    const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number, isExpired: boolean, isUrgent: boolean } | null>(null);

    useEffect(() => {
        if (!validUntil) return;

        const calculateTimeLeft = () => {
            const now = new Date().getTime();
            const end = new Date(validUntil).getTime();
            const diff = end - now;

            if (diff <= 0) {
                setTimeLeft({ days: 0, hours: 0, isExpired: true, isUrgent: false });
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

            // Urgent if less than 3 days
            setTimeLeft({ days, hours, isExpired: false, isUrgent: days < 3 });
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 60000); // Update every minute

        return () => clearInterval(timer);
    }, [validUntil]);

    if (!validUntil || !timeLeft) return null;

    if (timeLeft.isExpired) {
        return (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-500 rounded-lg text-sm font-bold border border-gray-200">
                <Clock size={16} />
                <span>Sona Erdi</span>
            </div>
        );
    }

    const colorClass = timeLeft.isUrgent
        ? "bg-red-50 text-red-600 border-red-100 animate-pulse"
        : "bg-emerald-50 text-emerald-600 border-emerald-100";

    return (
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold border shadow-sm ${colorClass}`}>
            <Timer size={16} className={timeLeft.isUrgent ? 'animate-bounce' : ''} />
            <span className="tabular-nums">
                {timeLeft.days > 0 ? `${timeLeft.days} Gün` : ''}
                {timeLeft.days > 0 && timeLeft.hours > 0 ? ' ' : ''}
                {timeLeft.hours > 0 || timeLeft.days === 0 ? `${timeLeft.hours} Saat` : ''}
                {' '}Kaldı
            </span>
        </div>
    );
}
