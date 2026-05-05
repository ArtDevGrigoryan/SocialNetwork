import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { FloatingReactionsProps, Particle } from "../../types/story.types";

export const FloatingReactions = ({
  reaction,
  liked,
  storyId,
}: FloatingReactionsProps) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!reaction && !liked) return;

    const newParticles: Particle[] = Array.from({ length: 6 }).map((_, i) => ({
      id: Date.now() + i,
      type: liked ? "like" : "reaction",
      value: reaction || "❤️",
      left: 20 + Math.random() * 60,
      delay: Math.random() * 0.2,
      size: 24 + Math.random() * 24,
      duration: 1.5 + Math.random() * 1,
      dxMid: (Math.random() - 0.5) * 100,
      dxEnd: (Math.random() - 0.5) * 150,
    }));

    setParticles((prev) => [...prev, ...newParticles]);

    const timer = setTimeout(() => {
      setParticles((prev) =>
        prev.filter((p) => !newParticles.find((np) => np.id === p.id)),
      );
    }, 3000);

    return () => clearTimeout(timer);
  }, [reaction, liked, storyId]);

  return (
    <div className="absolute inset-0 pointer-events-none z-[45] overflow-hidden">
      <AnimatePresence>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 100, x: 0, scale: 0.5 }}
            animate={{
              opacity: [0, 1, 1, 0],
              y: -window.innerHeight * 0.6,
              x: [0, p.dxMid, p.dxEnd],
              scale: [0.5, 1.2, 1],
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              ease: "easeOut",
            }}
            className="absolute bottom-16 drop-shadow-2xl"
            style={{ left: `${p.left}%`, fontSize: p.size }}
          >
            {p.type === "like" ? "❤️" : p.value}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
