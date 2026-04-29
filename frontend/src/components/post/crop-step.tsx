import type { Dispatch, SetStateAction } from "react";
import Cropper from "react-easy-crop";
import {
  ChevronLeft,
  ChevronRight,
  Crop as CropIcon,
  ZoomIn,
} from "lucide-react";

interface CropStepProps {
  previews: string[];
  currentIndex: number;
  setCurrentIndex: Dispatch<SetStateAction<number>>;
  crops: Record<number, { x: number; y: number }>;
  setCrops: Dispatch<SetStateAction<Record<number, { x: number; y: number }>>>;
  zooms: Record<number, number>;
  setZooms: Dispatch<SetStateAction<Record<number, number>>>;
  aspect: number;
  setAspect: Dispatch<SetStateAction<number>>;
  onCropComplete: (
    idx: number,
    croppedArea: any,
    croppedAreaPixels: any,
  ) => void;
  isVideo: boolean;
}

export default function CropStep({
  previews,
  currentIndex,
  setCurrentIndex,
  crops,
  setCrops,
  zooms,
  setZooms,
  aspect,
  setAspect,
  onCropComplete,
  isVideo,
}: CropStepProps) {
  return (
    <div className="flex w-full h-full relative">
      <div className="relative bg-black flex flex-col items-center justify-center w-[60%] border-r border-neutral-800 overflow-hidden">
        {isVideo ? (
          <video
            src={previews[currentIndex]}
            controls
            className="w-full h-full object-contain"
          />
        ) : (
          <Cropper
            image={previews[currentIndex]}
            crop={crops[currentIndex]}
            zoom={zooms[currentIndex]}
            aspect={aspect}
            onCropChange={(crop) =>
              setCrops((prev) => ({ ...prev, [currentIndex]: crop }))
            }
            onZoomChange={(zoom) =>
              setZooms((prev) => ({ ...prev, [currentIndex]: zoom }))
            }
            onCropComplete={(croppedArea, croppedAreaPixels) =>
              onCropComplete(currentIndex, croppedArea, croppedAreaPixels)
            }
            objectFit="vertical-cover"
          />
        )}

        {previews.length > 1 && (
          <>
            {currentIndex > 0 && (
              <button
                onClick={() => setCurrentIndex((prev) => prev - 1)}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white z-50 hover:bg-black/80"
              >
                <ChevronLeft size={20} />
              </button>
            )}
            {currentIndex < previews.length - 1 && (
              <button
                onClick={() => setCurrentIndex((prev) => prev + 1)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white z-50 hover:bg-black/80"
              >
                <ChevronRight size={20} />
              </button>
            )}
          </>
        )}
      </div>

      <div className="w-[40%] bg-[#262626] flex flex-col h-full p-4 relative">
        {!isVideo ? (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3 text-white">
                <ZoomIn size={18} />
                <span className="font-semibold text-sm">Zoom</span>
              </div>
              <input
                type="range"
                value={zooms[currentIndex]}
                min={1}
                max={3}
                step={0.1}
                onChange={(e) =>
                  setZooms((prev) => ({
                    ...prev,
                    [currentIndex]: Number(e.target.value),
                  }))
                }
                className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3 text-white">
                <CropIcon size={18} />
                <span className="font-semibold text-sm">Aspect Ratio</span>
              </div>
              <div className="flex gap-2">
                {[
                  { label: "1:1", value: 1 },
                  { label: "4:5", value: 4 / 5 },
                  { label: "16:9", value: 16 / 9 },
                ].map((ratio) => (
                  <button
                    key={ratio.label}
                    onClick={() => setAspect(ratio.value)}
                    className={`flex-1 py-2 text-sm rounded-md border font-medium transition-colors ${
                      aspect === ratio.value
                        ? "bg-white text-black border-white"
                        : "bg-transparent text-neutral-400 border-neutral-700 hover:border-neutral-500"
                    }`}
                  >
                    {ratio.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-neutral-500 text-sm text-center px-4">
            Video cropping is not supported in the web editor yet. Click "Next"
            to continue.
          </div>
        )}
      </div>
    </div>
  );
}
