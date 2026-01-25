"use client";

type AdBannerProps = {
  size?: "small" | "medium" | "large";
  position?: "top" | "sidebar" | "bottom";
};

const AD_CONTENT = [
  {
    title: "STOP THE WOKE AGENDA",
    subtitle: "Join the Movement",
    cta: "Learn More →",
    colors: "from-red-600 to-red-800",
    textColor: "text-white",
  },
  {
    title: "FIGHT FOR FREEDOM",
    subtitle: "Stand With Us",
    cta: "Donate Now",
    colors: "from-blue-600 to-blue-800",
    textColor: "text-white",
  },
  {
    title: "AMERICA FIRST",
    subtitle: "Make a Difference",
    cta: "Take Action",
    colors: "from-red-700 via-blue-700 to-red-700",
    textColor: "text-white",
  },
];

export function AdBanner({ size = "medium", position = "sidebar" }: AdBannerProps) {
  const ad = AD_CONTENT[Math.floor(Math.random() * AD_CONTENT.length)];

  const sizeClasses = {
    small: "h-32",
    medium: "h-48",
    large: "h-64",
  };

  const widthClasses = {
    small: "w-48",
    medium: "w-full",
    large: "w-full",
  };

  return (
    <div
      className={`${sizeClasses[size]} ${widthClasses[size]} bg-gradient-to-br ${ad.colors} rounded-lg border-2 border-gray-800 flex flex-col items-center justify-center p-4 relative overflow-hidden shadow-lg`}
    >
      <div className="absolute top-1 right-1 text-[8px] text-white/70 font-semibold uppercase tracking-wider bg-black/30 px-1 rounded">
        Ad
      </div>
      <div className="text-center z-10">
        <div className={`${ad.textColor} font-bold text-lg mb-1 tracking-tight`}>
          {size === "large" ? ad.title : ad.title.split(" ")[0]}
        </div>
        {size !== "small" && (
          <>
            <div className={`${ad.textColor} text-xs mb-2 font-semibold`}>
              {ad.subtitle}
            </div>
            <button className={`${ad.textColor} bg-white/20 hover:bg-white/30 px-4 py-1.5 rounded font-bold text-xs border border-white/30 transition-colors`}>
              {ad.cta}
            </button>
          </>
        )}
        {size === "small" && (
          <div className={`${ad.textColor} text-[10px] font-semibold mt-1`}>
            {ad.cta}
          </div>
        )}
      </div>
      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-20 h-20 border-4 border-white rounded-full -translate-x-10 -translate-y-10"></div>
        <div className="absolute bottom-0 right-0 w-20 h-20 border-4 border-white rounded-full translate-x-10 translate-y-10"></div>
      </div>
    </div>
  );
}
