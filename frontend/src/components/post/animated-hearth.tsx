import { Heart } from "lucide-react";
import { cn } from "../../lib/utils";
import { useEffect, useState } from "react";

export const AnimatedHeart = ({
  x,
  y,
  onComplete,
}: {
  x: number;
  y: number;
  onComplete: () => void;
}) => {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    // 10ms-ը լրիվ հերիք ա, որ React-ը DOM-ում նկարի սկզբնական վիճակը,
    // որից հետո նոր CSS transition-ը կմիանա ու սահուն կշարժվի:
    const startTimer = setTimeout(() => setStage(1), 10);
    const removeTimer = setTimeout(onComplete, 1000);

    return () => {
      clearTimeout(startTimer);
      clearTimeout(removeTimer);
    };
  }, [onComplete]);

  return (
    <Heart
      size={100}
      className={cn(
        "absolute text-red-500 fill-red-500 pointer-events-none drop-shadow-[0_0_15px_rgba(239,68,68,0.5)] transition-all duration-1000 ease-out z-[60]",
        stage === 0
          ? "scale-0 opacity-100 translate-y-0"
          : "scale-[1.2] opacity-0 -translate-y-32 -rotate-12",
      )}
      style={{ left: x - 50, top: y - 50 }}
    />
  );
};
