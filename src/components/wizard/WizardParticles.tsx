import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  delay: number;
  duration: number;
}

interface WizardParticlesProps {
  active?: boolean;
  count?: number;
}

export const WizardParticles = ({ active = true, count = 20 }: WizardParticlesProps) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!active) {
      setParticles([]);
      return;
    }

    const colors = [
      'hsl(var(--primary))',
      'hsl(var(--primary) / 0.7)',
      'hsl(260 80% 70%)', // Purple
      'hsl(0 0% 85%)', // Silver
      'hsl(260 60% 80%)', // Light purple
    ];

    const newParticles: Particle[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 0.5,
      duration: Math.random() * 2 + 2,
    }));

    setParticles(newParticles);
  }, [active, count]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: particle.size,
              height: particle.size,
              backgroundColor: particle.color,
              boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
            }}
            initial={{ 
              opacity: 0, 
              scale: 0,
              y: 0,
            }}
            animate={{ 
              opacity: [0, 1, 1, 0],
              scale: [0, 1, 1, 0.5],
              y: [-20, -40, -60, -80],
            }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              ease: "easeOut",
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};
