import React from 'react';
import { landingAssets } from '../../constants/landingAssets';

export const FeaturesSection: React.FC = () => {
  const features = [
    {
      title: 'AI-Driven Classification',
      description: 'Utilizes Zero-Shot Classification to instantly understand and categorize environmental hazards from unstructured RSS feeds.',
      image: landingAssets.features.aiClassification,
    },
    {
      title: 'Automated Geo-NER',
      description: 'Incorporates Geo-Named Entity Recognition to automatically extract, verify, and pinpoint precise locations from text.',
      image: landingAssets.features.geoNer,
    },
    {
      title: 'Unified Command Dashboard',
      description: 'A multi-channel hub that visualizes all verified hazard data on an interactive map for real-time situational awareness.',
      image: landingAssets.features.commandDashboard,
    },
  ];

  return (
    <ul className="box-border flex flex-col gap-[32px] items-center overflow-visible px-[64px] py-[120px] w-[1280px] mx-auto">
      <li className="flex flex-col font-lato font-extrabold justify-center text-[39px] leading-[59px] text-[#334155]">
        <p>The Core Components of GAIA</p>
      </li>
      <li className="box-border flex flex-wrap gap-[32px] items-start justify-center overflow-visible p-0 w-full">
        {features.map((feature, index) => (
          <div 
            key={index}
            className="basis-0 flex flex-col gap-[32px] grow items-start max-w-[388px] min-w-[336px] rounded-[8px]"
          >
            <div className="h-[350px] w-full rounded-[16px] overflow-hidden">
              <img 
                src={feature.image} 
                alt={feature.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col gap-[8px] items-start w-full">
              <h5 className="font-inter font-semibold text-[24px] leading-[1.2] tracking-[-0.48px] text-black">
                {feature.title}
              </h5>
              <p className="font-inter font-medium text-[18px] leading-[1.45] tracking-[-0.09px] text-[rgba(0,0,0,0.55)]">
                {feature.description}
              </p>
            </div>
          </div>
        ))}
      </li>
    </ul>
  );
};
