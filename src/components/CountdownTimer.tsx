import { useEffect, useState } from "react";

export function CountdownTimer({ targetDate }: { targetDate: string }) {
    const [timeLeft, setTimeLeft] = useState("");

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date().getTime();
            const target = new Date(targetDate).getTime();
            const distance = target - now;

            if (distance < 0) {
                clearInterval(timer);
                setTimeLeft("Süre Doldu");
                return;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

            setTimeLeft(`${days}g ${hours}s`);
        }, 1000);

        return () => clearInterval(timer);
    }, [targetDate]);

    return <span>{timeLeft}</span>;
}
