import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import type { FloatingReactionsProps, Particle } from "../../types/story.types";

export const FloatingReactions = ({
  reaction,
  liked,
  storyId,
}: FloatingReactionsProps) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!reaction && !liked) {
      setParticles([]);
      return;
    }

    const newParticles: Particle[] = [];
    const count = 12;

    for (let i = 0; i < count; i++) {
      const isLike = liked && (!reaction || Math.random() > 0.5);

      newParticles.push({
        id: Math.random(),
        type: isLike ? "like" : "reaction",
        value: reaction || undefined,
        left: Math.random() * 60 + 20,
        delay: Math.random() * 0.3,
        size: Math.random() * 16 + 24,
        duration: Math.random() * 1 + 1.5,
        dxMid: (Math.random() - 0.5) * 60,
        dxEnd: (Math.random() - 0.5) * 120,
      });
    }

    setParticles(newParticles);

    // Մաքրում ենք DOM-ը անիմացիայի ավարտից հետո (3 վայրկյանը բավական է)
    const timer = setTimeout(() => {
      setParticles([]);
    }, 3000);

    return () => clearTimeout(timer);
  }, [storyId, reaction, liked]); // Աշխատում է հենց սթորին կամ ռեակցիան փոխվում է

  if (particles.length === 0) return null;

  return (
    <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
      {/* Գլոբալ Keyframe անիմացիան դնում ենք հենց այստեղ, որ լրիվ isolated լինի */}
      <style>{`
        @keyframes floatUpOrganic {
          0% { 
            transform: translate(0, 100px) scale(0.5); 
            opacity: 0; 
          }
          20% { 
            opacity: 1; 
            transform: translate(var(--dx-mid), 0px) scale(1.2); 
          }
          100% { 
            transform: translate(var(--dx-end), -400px) scale(1.5); 
            opacity: 0; 
          }
        }
      `}</style>

      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute bottom-24 opacity-0 flex justify-center items-center"
          style={
            {
              left: `${p.left}%`,
              fontSize: `${p.size}px`,
              animation: `floatUpOrganic ${p.duration}s ease-out ${p.delay}s forwards`,
              "--dx-mid": `${p.dxMid}px`,
              "--dx-end": `${p.dxEnd}px`,
            } as React.CSSProperties
          }
        >
          {p.type === "like" ? (
            <Heart
              className="text-red-500 fill-red-500 drop-shadow-2xl"
              size={p.size}
            />
          ) : (
            <span className="drop-shadow-2xl">{p.value}</span>
          )}
        </div>
      ))}
    </div>
  );
};
