import React from "react";
import { useNavigate } from "react-router-dom";
import { landingAssets } from "../../constants/landingAssets";

export const HeroSection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="relative bg-background min-h-[60vh] sm:min-h-[70vh] md:min-h-[calc(100vh-101px)] overflow-hidden w-full flex items-center justify-center">
      {/* Full-Width Background Container */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <img
            src={landingAssets.hero.background}
            alt=""
            aria-hidden="true"
            className="w-auto h-auto min-w-[100vw] min-h-[500px] sm:min-h-[650px] md:min-h-[750px] object-cover"
            loading="eager"
            width={1920}
            height={1125}
          />
        </div>
        <div
          className="absolute inset-0 bg-background/0 dark:bg-background/70 pointer-events-none"
          aria-hidden="true"
        />
      </div>

      {/* Content Container - Centered with max-width for content positioning */}
      <div className="relative z-10 w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-16 flex flex-col items-center gap-8 sm:gap-[72px] py-10 sm:py-16 md:py-[100px]">
        {/* Decorative Hazard Pins - Exact Figma positioning relative to 1280px container */}
        <div className="hidden md:block">
          <div
            className="absolute -left-[6vw] top-[1vh] w-[84px] h-[108px] lg:w-[108px] lg:h-[142px] blur-[7.5px] pointer-events-none"
            aria-hidden="true"
          >
            <img
              src={landingAssets.hero.pinVolcano}
              alt=""
              aria-hidden="true"
              className="w-full h-full"
            />
          </div>

          <div
            className="absolute -right-[13vw] top-[4vh] w-[84px] h-[108px] lg:w-[108px] lg:h-[142px] blur-[5px] pointer-events-none"
            aria-hidden="true"
          >
            <img
              src={landingAssets.hero.pinFlood}
              alt=""
              aria-hidden="true"
              className="w-full h-full"
            />
          </div>

          <div
            className="absolute -left-[15vw] bottom-[35vh] w-[84px] h-[108px] lg:w-[108px] lg:h-[142px] blur-[2.5px] pointer-events-none"
            aria-hidden="true"
          >
            <img
              src={landingAssets.hero.pinEarthquake}
              alt=""
              aria-hidden="true"
              className="w-full h-full"
            />
          </div>

          <div
            className="absolute right-[10vw] bottom-[30vh] w-[84px] h-[108px] lg:w-[108px] lg:h-[142px] blur-[3.5px] pointer-events-none"
            aria-hidden="true"
          >
            <img
              src={landingAssets.hero.pinLandslide}
              alt=""
              aria-hidden="true"
              className="w-full h-full"
            />
          </div>
        </div>

        {/* Hero Content */}
        <div className="flex flex-col items-center gap-5 sm:gap-[48px] w-full max-w-[740px]">
          <h1 className="font-lato font-bold text-[28px] sm:text-[44px] md:text-[56px] lg:text-[64px] leading-[1.15] sm:leading-[1.1] tracking-[-0.5px] sm:tracking-[-0.8px] md:tracking-[-1.1px] lg:tracking-[-1.28px] text-primary text-center text-balance drop-shadow-sm dark:drop-shadow-md dark:text-primary-foreground">
            Empower Your Response. Protect Your Community.
          </h1>

          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-[10px] sm:gap-[16px] items-stretch sm:items-center justify-center w-full sm:w-auto">
            <button
              type="button"
              className="inline-flex items-center justify-center bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-md hover:shadow-lg hover:from-primary/90 hover:to-secondary/90 px-[20px] sm:px-[16px] py-[10px] sm:py-[8px] text-[15px] sm:text-[14px] font-lato font-semibold rounded-[8px] sm:rounded-[6px] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              onClick={() => navigate("/report")}
              aria-label="Report a Hazard"
            >
              Report a Hazard
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center border-2 border-secondary/45 bg-transparent text-foreground hover:border-secondary hover:bg-secondary/10 px-[20px] sm:px-[16px] py-[10px] sm:py-[8px] text-[15px] sm:text-[14px] font-lato font-medium rounded-[8px] sm:rounded-[6px] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:border-secondary/50 dark:hover:bg-secondary/15"
              onClick={() => navigate("/map")}
              aria-label="View Live Hazard Map"
            >
              View Live Hazard Map
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center border-2 border-secondary/45 bg-transparent text-foreground hover:border-secondary hover:bg-secondary/10 px-[20px] sm:px-[16px] py-[10px] sm:py-[8px] text-[15px] sm:text-[14px] font-lato font-medium rounded-[8px] sm:rounded-[6px] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:border-secondary/50 dark:hover:bg-secondary/15"
              onClick={() => {
                document
                  .getElementById("how-it-works-section")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
              aria-label="How It Works"
            >
              How It Works
            </button>
          </div>
        </div>

        {/* Glassmorphism Card with Showcase Image */}
        <div
          className="w-full max-w-[709px] h-[200px] sm:h-[340px] md:h-[415px] rounded-[20px] sm:rounded-[32px] backdrop-blur-[4.7px] bg-secondary/20 dark:bg-card/40 border border-white/40 dark:border-border overflow-hidden p-2 sm:p-3 md:p-4 opacity-95 dark:opacity-100"
          style={{
            boxShadow:
              "inset 2.15px 1.72px 8.6px 0px rgba(255,255,255,0.15), inset 1.15px 0.92px 4.3px 0px rgba(255,255,255,0.15)",
          }}
        >
          <img
            src={landingAssets.hero.showcaseImage}
            alt="Showcase of AGAILA's live hazard map with real-time data filtering and AI classification features."
            className="w-full h-full object-contain rounded-[calc(20px-0.5rem)] sm:rounded-[calc(32px-0.75rem)]"
            loading="eager"
          />
        </div>
      </div>
    </section>
  );
};