interface OwlMascotProps {
    size?: number;
    opacity?: number;
    className?: string;
}

export default function OwlMascot({ size = 200, opacity = 0.1, className = "" }: OwlMascotProps) {
    return (
        <svg 
            width={size} 
            height={size} 
            viewBox="0 0 200 200" 
            className={className}
            style={{ opacity }}
        >
            {/* Baykuş Gövdesi */}
            <circle cx="100" cy="120" r="60" fill="#4A90E2" stroke="#2C3E50" strokeWidth="3"/>
            
            {/* Sol Göz Çerçevesi */}
            <circle cx="85" cy="90" r="25" fill="#E8F4FD" stroke="#2C3E50" strokeWidth="2"/>
            <circle cx="85" cy="90" r="18" fill="#E74C3C"/>
            <circle cx="85" cy="90" r="8" fill="#2C3E50"/>
            <circle cx="88" cy="87" r="3" fill="white"/>
            
            {/* Sağ Göz Çerçevesi */}
            <circle cx="115" cy="90" r="25" fill="#E8F4FD" stroke="#2C3E50" strokeWidth="2"/>
            <circle cx="115" cy="90" r="18" fill="#F39C12"/>
            <circle cx="115" cy="90" r="8" fill="#2C3E50"/>
            <circle cx="118" cy="87" r="3" fill="white"/>
            
            {/* Gaga */}
            <polygon points="100,105 95,115 105,115" fill="#F39C12" stroke="#2C3E50" strokeWidth="2"/>
            
            {/* Sol Kanat */}
            <ellipse cx="70" cy="130" rx="15" ry="25" fill="#F39C12" stroke="#2C3E50" strokeWidth="2"/>
            
            {/* Sağ Kanat */}
            <ellipse cx="130" cy="130" rx="15" ry="25" fill="#F39C12" stroke="#2C3E50" strokeWidth="2"/>
            
            {/* Göğüs */}
            <ellipse cx="100" cy="140" rx="25" ry="20" fill="#E74C3C" stroke="#2C3E50" strokeWidth="2"/>
            
            {/* Sol Ayak */}
            <ellipse cx="90" cy="175" rx="8" ry="5" fill="#F39C12" stroke="#2C3E50" strokeWidth="2"/>
            <circle cx="85" cy="175" r="2" fill="#F39C12"/>
            <circle cx="95" cy="175" r="2" fill="#F39C12"/>
            
            {/* Sağ Ayak */}
            <ellipse cx="110" cy="175" rx="8" ry="5" fill="#F39C12" stroke="#2C3E50" strokeWidth="2"/>
            <circle cx="105" cy="175" r="2" fill="#F39C12"/>
            <circle cx="115" cy="175" r="2" fill="#F39C12"/>
        </svg>
    );
}