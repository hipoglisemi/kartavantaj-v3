import { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { supabase, authService } from '../services/authService';

interface CampaignFeedbackProps {
    campaignId: number;
}

export default function CampaignFeedback({ campaignId }: CampaignFeedbackProps) {
    const [vote, setVote] = useState<'up' | 'down' | null>(null);
    const [counts, setCounts] = useState({ up: 0, down: 0 });
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        loadData();
    }, [campaignId]);

    const loadData = async () => {
        const currentUser = await authService.getUser();
        setUser(currentUser);

        if (currentUser) {
            // Get user's vote
            const { data } = await supabase!
                .from('campaign_votes')
                .select('vote_type')
                .eq('campaign_id', campaignId)
                .eq('user_id', currentUser.id)
                .single();

            if (data) setVote(data.vote_type as 'up' | 'down');
        }

        // Get counts (This is expensive to do client side with count(*), ideally use a materialized view or column)
        // For now, we will perform a simple count query
        const { count: upCount } = await supabase!
            .from('campaign_votes')
            .select('*', { count: 'exact', head: true })
            .eq('campaign_id', campaignId)
            .eq('vote_type', 'up');

        const { count: downCount } = await supabase!
            .from('campaign_votes')
            .select('*', { count: 'exact', head: true })
            .eq('campaign_id', campaignId)
            .eq('vote_type', 'down');

        setCounts({ up: upCount || 0, down: downCount || 0 });
    };

    const handleVote = async (type: 'up' | 'down') => {
        if (!user) {
            alert('Oy kullanmak için giriş yapmalısınız.');
            return;
        }

        setLoading(true);
        // Optimistic update
        const previousVote = vote;
        const previousCounts = { ...counts };

        if (previousVote === type) {
            // Toggle off? Not implemented for simplicity, just assume switching or setting.
            // Let's allow un-voting if clicking same.
            setVote(null);
            setCounts(prev => ({ ...prev, [type]: prev[type] - 1 }));

            const { error } = await supabase!
                .from('campaign_votes')
                .delete()
                .eq('campaign_id', campaignId)
                .eq('user_id', user.id);

            if (error) {
                // Revert
                setVote(previousVote);
                setCounts(previousCounts);
            }
        } else {
            // New vote or switch
            setVote(type);
            setCounts(prev => ({
                up: type === 'up' ? prev.up + 1 : (previousVote === 'up' ? prev.up - 1 : prev.up),
                down: type === 'down' ? prev.down + 1 : (previousVote === 'down' ? prev.down - 1 : prev.down)
            }));

            const { error } = await supabase!
                .from('campaign_votes')
                .upsert({
                    campaign_id: campaignId,
                    user_id: user.id,
                    vote_type: type
                }, { onConflict: 'campaign_id,user_id' });

            if (error) {
                // Revert
                setVote(previousVote);
                setCounts(previousCounts);
            }
        }
        setLoading(false);
    };

    return (
        <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1 border border-gray-200">
            <button
                onClick={() => handleVote('up')}
                disabled={loading}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${vote === 'up'
                    ? 'bg-green-100 text-green-700 shadow-sm'
                    : 'text-gray-500 hover:bg-gray-100'
                    }`}
                title="Şartlar Uygun / Çalışıyor"
            >
                <ThumbsUp size={14} className={vote === 'up' ? 'fill-current' : ''} />
                <span>{counts.up}</span>
            </button>

            <div className="w-px h-4 bg-gray-200"></div>

            <button
                onClick={() => handleVote('down')}
                disabled={loading}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${vote === 'down'
                    ? 'bg-red-100 text-red-700 shadow-sm'
                    : 'text-gray-500 hover:bg-gray-100'
                    }`}
                title="Sorunlu / Bitmiş"
            >
                <ThumbsDown size={14} className={vote === 'down' ? 'fill-current' : ''} />
                <span>{counts.down}</span>
            </button>
        </div>
    );
}
