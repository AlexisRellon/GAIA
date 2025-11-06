import React from 'react';
import { landingAssets } from '../../constants/landingAssets';

export const Footer: React.FC = () => {
  const navigationLinks = ['Home', 'Documentation', 'Hazard Map', 'Contact'];

  return (
    <footer className="w-full bg-[#171717]">
      <div className="max-w-[1280px] mx-auto px-[64px]">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-[40px] h-[553px] overflow-clip py-[31px]">
          {/* Column 1: Branding */}
          <div className="flex flex-col gap-[20px] items-start justify-center px-[17px]">
            <div className="flex flex-wrap gap-[10px] items-center justify-center w-full">
              <img 
                src={landingAssets.logos.gaiaWhite} 
                alt="GAIA Logo" 
                className="h-[53px] w-[133px]" 
              />
            <p className="font-lato font-bold text-[16px] leading-[24px] text-white">
              Geospatial AI-driven Assessment
            </p>
          </div>
          
          <p className="font-lato text-[16px] leading-[24px] text-white w-[155px]">
            An Undergraduate Thesis Project
          </p>
          
          <img 
            src={landingAssets.logos.lpuc} 
            alt="LPU-C Logo" 
            className="h-[71px] w-[168px] object-cover" 
          />
          
          <img 
            src={landingAssets.logos.astars} 
            alt="A-STARS Logo" 
            className="h-[52px] w-[55px]" 
          />
        </div>

        {/* Column 2: Navigation */}
        <div className="flex flex-col gap-[20px] items-start justify-center px-[17px] font-lato text-[16px] leading-[24px] text-white">
          {navigationLinks.map((link, index) => (
            <p key={index} className="w-[155px]">
              {link}
            </p>
          ))}
        </div>

        {/* Column 3: Contact */}
        <div className="flex flex-col gap-[20px] items-start justify-center px-[17px] font-lato text-[16px] leading-[24px]">
          <p className="text-white w-[155px]">
            contact@gaia-assessment.com.ph
          </p>
          <p className="text-[#d9d9d9] w-[155px]">
            +63-998 7654 3210
          </p>
        </div>

        {/* Column 4: Description */}
        <div className="flex flex-col gap-[20px] items-start justify-center px-[17px]">
          <p className="font-lato text-[16px] leading-[24px] text-white w-full">
            GAIA (Geospatial AI-driven Assessment) is an AI framework designed to provide real-time environmental hazard reporting by integrating zero-shot classification and Geo-NER.
          </p>
        </div>
      </div>

        {/* Copyright Bar */}
        <div className="border-t border-white h-[69px] flex items-center justify-center">
          <p className="font-lato text-[13px] leading-[20px] text-white text-center">
            © 2025 GAIA. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
