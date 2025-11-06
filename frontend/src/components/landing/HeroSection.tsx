import React from "react";
import { landingAssets } from "../../constants/landingAssets";

export const HeroSection: React.FC = () => {
  return (
    <section className="relative bg-white h-[calc(100vh-101px)] overflow-hidden w-full flex items-center justify-center">
      {/* Full-Width Background Container - Covers entire viewport */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
        {/* Combined Background: Grid Plane + Heatmap Overlay - Centered and extending beyond viewport */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <img
            src={landingAssets.hero.background}
            alt=""
            className="w-auto h-auto min-w-[100vw] min-h-[750px] object-cover"
          />
        </div>
      </div>

      {/* Content Container - Centered with max-width for content positioning */}
      <div className="relative z-10 w-full max-w-[1280px] mx-auto px-[64px] flex flex-col items-center gap-[90px] py-[100px]">
        {/* Decorative Hazard Pins - Exact Figma positioning relative to 1280px container */}
        <div
          className="absolute -left-[6vw] top-[1vh] w-[108px] h-[142px] blur-[7.5px] pointer-events-none"
          aria-hidden="true"
        >
          <img
            src={landingAssets.hero.pinVolcano}
            alt=""
            className="w-full h-full"
          />
        </div>

        <div
          className="absolute -right-[13vw] top-[4vh] w-[108px] h-[142px] blur-[5px] pointer-events-none"
          aria-hidden="true"
        >
          <img
            src={landingAssets.hero.pinFlood}
            alt=""
            className="w-full h-full"
          />
        </div>

        <div
          className="absolute -left-[15vw] bottom-[35vh] w-[108px] h-[142px] blur-[2.5px] pointer-events-none"
          aria-hidden="true"
        >
          <img
            src={landingAssets.hero.pinEarthquake}
            alt=""
            className="w-full h-full"
          />
        </div>

        <div
          className="absolute right-[10vw] bottom-[30vh] w-[108px] h-[142px] blur-[3.5px] pointer-events-none"
          aria-hidden="true"
        >
          <img
            src={landingAssets.hero.pinLandslide}
            alt=""
            className="w-full h-full"
          />
        </div>

        {/* Hero Content */}
        <div className="flex flex-col items-center gap-[48px] w-full max-w-[740px]">
          <h1 className="font-lato font-bold text-[64px] leading-[1.1] tracking-[-1.28px] text-[#005a9c] text-center">
            Empower Your Response. Protect Your Community.
          </h1>

          <div className="flex flex-wrap gap-[16px] items-center justify-center">
            <button
              className="bg-[#0a2a4d] text-white hover:bg-[#0a2a4d]/90 px-[16px] py-[8px] text-[14px] font-lato font-medium rounded-[6px] transition-colors"
              onClick={() => window.location.assign("/map")}
            >
              View Live Hazard Map
            </button>
            <button
              className="border border-[#005a9c] border-solid text-[#005a9c] hover:bg-[#005a9c] hover:text-white px-[16px] py-[8px] text-[14px] font-lato font-medium rounded-[6px] transition-colors"
              onClick={() => {
                document
                  .getElementById("how-it-works-section")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              How It Works
            </button>
          </div>
        </div>

        {/* Glassmorphism Card Placeholder */}
        <div
          className="w-[709px] h-[415px] rounded-[32px] backdrop-blur-[4.7px] bg-[rgba(26,66,224,0.2)] border border-[rgba(255,255,255,0.4)] opacity-80"
          style={{
            boxShadow:
              "inset 2.15px 1.72px 8.6px 0px rgba(255,255,255,0.15), inset 1.15px 0.92px 4.3px 0px rgba(255,255,255,0.15)",
          }}
        />
      </div>
    </section>
  );
};
