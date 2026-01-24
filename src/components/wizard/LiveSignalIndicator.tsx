import { motion } from 'framer-motion';

interface LiveSignalIndicatorProps {
  className?: string;
}

export const LiveSignalIndicator = ({ className }: LiveSignalIndicatorProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
        {/* Pulsing Dot */}
        <div className="relative">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <motion.div
            className="absolute inset-0 w-2 h-2 rounded-full bg-primary"
            animate={{
              scale: [1, 2, 1],
              opacity: [0.8, 0, 0.8],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>
        
        <span className="text-xs font-medium text-primary">
          Waiting for first click...
        </span>
      </div>
    </motion.div>
  );
};
