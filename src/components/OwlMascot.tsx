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
            {/* Ana Baykuş Gövdesi - Mavi */}
            <circle cx="100" cy="100" r="80" fill="#5B9BD5" stroke="#2C3E50" strokeWidth="4"/>
            
            {/* Sol Göz Çerçevesi */}
            <circle cx="80" cy="80" r="30" fill="#E8F4FD" stroke="#2C3E50" strokeWidth="3"/>
            {/* Sol Göz - Kırmızı */}
            <circle cx="80" cy="80" r="22" fill="#E74C3C"/>
            <circle cx="80" cy="80" r="12" fill="#2C3E50"/>
            <circle cx="83" cy="77" r="4" fill="white"/>
            
            {/* Sağ Göz Çerçevesi */}
            <circle cx="120" cy="80" r="30" fill="#E8F4FD" stroke="#2C3E50" strokeWidth="3"/>
            {/* Sağ Göz - Yeşil/Turuncu */}
            <circle cx="120" cy="80" r="22" fill="#52C41A"/>
            <circle cx="120" cy="80" r="12" fill="#2C3E50"/>
            <circle cx="123" cy="77" r="4" fill="white"/>
            
            {/* Gaga - Turuncu */}
            <polygon points="100,95 90,110 110,110" fill="#F39C12" stroke="#2C3E50" strokeWidth="2"/>
            
            {/* Sol Kanat - Turuncu */}
            <ellipse cx="65" cy="120" rx="20" ry="35" fill="#F39C12" stroke="#2C3E50" strokeWidth="3"/>
            
            {/* Sağ Kanat - Turuncu */}
            <ellipse cx="135" cy="120" rx="20" ry="35" fill="#F39C12" stroke="#2C3E50" strokeWidth="3"/>
            
            {/* Göğüs - Kırmızı */}
            <ellipse cx="100" cy="130" rx="35" ry="25" fill="#E74C3C" stroke="#2C3E50" strokeWidth="3"/>
            
            {/* Sol Ayak */}
            <ellipse cx="85" cy="175" rx="10" ry="6" fill="#F39C12" stroke="#2C3E50" strokeWidth="2"/>
            <circle cx="78" cy="175" r="3" fill="#F39C12"/>
            <circle cx="92" cy="175" r="3" fill="#F39C12"/>
            
            {/* Sağ Ayak */}
            <ellipse cx="115" cy="175" rx="10" ry="6" fill="#F39C12" stroke="#2C3E50" strokeWidth="2"/>
            <circle cx="108" cy="175" r="3" fill="#F39C12"/>
            <circle cx="122" cy="175" r="3" fill="#F39C12"/>
        </svg>
    );
}