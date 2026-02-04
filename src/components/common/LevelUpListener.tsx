import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';

export function LevelUpListener() {
    useEffect(() => {
        const handleLevelUp = (e: CustomEvent<{ rank: string }>) => {
            const { rank } = e.detail;

            // Explosion Effect
            const duration = 3 * 1000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 99999 };

            const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

            const interval: any = setInterval(function () {
                const timeLeft = animationEnd - Date.now();

                if (timeLeft <= 0) {
                    return clearInterval(interval);
                }

                const particleCount = 50 * (timeLeft / duration);
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
            }, 250);

            // Toast Notification
            toast.success(`LEVEL UP! You are now a ${rank}!`, {
                description: "Keep building to reach the next tier.",
                duration: 5000,
                style: {
                    background: 'rgba(139, 92, 246, 0.1)',
                    borderColor: 'rgba(139, 92, 246, 0.5)',
                    color: '#fff'
                }
            });
        };

        const listener = (e: Event) => handleLevelUp(e as CustomEvent);
        document.addEventListener('levelUp', listener);
        return () => document.removeEventListener('levelUp', listener);
    }, []);

    return null;
}
