import { ThumbsUp, ThumbsDown } from 'lucide-react';

interface ThumbsProps {
    onLike: () => void;
    onDislike: () => void;
}

const Thumbs: React.FC<ThumbsProps> = ({ onLike, onDislike }) => {
    return (
        <div className="flex items-center gap-4 text-gray-600">
            <button className="flex items-center gap-1 hover:text-green-600 transition-colors" onClick={onLike}>
                <ThumbsUp size={16} /> Beğendim
            </button>
            <button className="flex items-center gap-1 hover:text-red-600 transition-colors" onClick={onDislike}>
                <ThumbsDown size={16} /> Beğenmedim
            </button>
        </div>
    );
};

export default Thumbs;