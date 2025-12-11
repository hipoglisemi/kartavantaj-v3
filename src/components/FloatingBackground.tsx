import { useEffect, useState } from 'react';

interface FloatingElement {
    id: number;
    type: 'text' | 'symbol';
    content: string;
    left: string;
    top: string;
    animationDelay: string;
    duration: string;
    opacity: number;
    scale: number;
    rotation: number;
}

export default function FloatingBackground() {
    const [elements, setElements] = useState<FloatingElement[]>([]);

    useEffect(() => {
        // Generate static random elements only once on mount
        const count = 15; // Number of floating items
        const newElements: FloatingElement[] = [];

        for (let i = 0; i < count; i++) {
            const isText = Math.random() > 0.5;
            newElements.push({
                id: i,
                type: isText ? 'text' : 'symbol',
                content: isText ? 'İNDİRİM' : '%',
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                duration: `${15 + Math.random() * 20}s`, // Slow movement (15-35s)
                opacity: 0.03 + Math.random() * 0.04, // Very subtle opacity (0.03 - 0.07)
                scale: 0.8 + Math.random() * 1.5,
                rotation: Math.random() * 360,
            });
        }

        setElements(newElements);
    }, []);

    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
            {elements.map((el) => (
                <div
                    key={el.id}
                    className="absolute font-black text-gray-900 whitespace-nowrap will-change-transform animate-float"
                    style={{
                        left: el.left,
                        top: el.top,
                        fontSize: el.type === 'symbol' ? '8rem' : '4rem',
                        opacity: el.opacity,
                        transform: `rotate(${el.rotation}deg) scale(${el.scale})`,
                        animation: `float ${el.duration} linear infinite`,
                        animationDelay: el.animationDelay,
                        fontFamily: el.type === 'symbol' ? 'sans-serif' : 'inherit' // Ensure % looks geometric
                    }}
                >
                    {el.content}
                </div>
            ))}
            <style>{`
        @keyframes float {
          0% {
            transform: translateY(0) rotate(0deg) scale(1);
          }
          33% {
            transform: translateY(-30px) translateX(20px) rotate(5deg) scale(1.05);
          }
          66% {
            transform: translateY(20px) translateX(-20px) rotate(-5deg) scale(0.95);
          }
          100% {
            transform: translateY(0) rotate(0deg) scale(1);
          }
        }
      `}</style>
        </div>
    );
}
