interface OwlMascotProps {
    size?: number;
    opacity?: number;
    className?: string;
}

export default function OwlMascot({ size = 200, opacity = 0.1, className = "" }: OwlMascotProps) {
    return (
        <img 
            src="/Owlmascot.png"
            alt="Baykuş Maskot"
            width={size} 
            height={size} 
            className={className}
            style={{ 
                opacity,
                objectFit: 'contain',
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))'
            }}

        />
    );
}