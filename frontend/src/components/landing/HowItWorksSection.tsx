import React from 'react';
import { landingAssets } from '../../constants/landingAssets';

export const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      number: '01',
      title: 'Multi-Source Ingestion',
      description: 'The system continuously monitors and ingests data from a wide array of sources, including official RSS feeds from agencies like PAGASA and PHIVOLCS.',
    },
    {
      number: '02',
      title: 'AI Hazard Classification',
      description: 'Our AI model (Zero-Shot) instantly reads and understands each report, classifying the specific environmental hazard (e.g., flood, fire, landslide).',
    },
    {
      number: '03',
      title: 'Geo-NER Location Extraction',
      description: 'An advanced Geo-Named Entity Recognition (Geo-NER) model automatically identifies and extracts precise location data from the text.',
    },
    {
      number: '04',
      title: 'Actionable Visualization',
      description: 'All verified and geolocated alerts are instantly plotted on the central command dashboard and hazard map, ready for LGU responders.',
    },
  ];

  return (
    <div id="how-it-works-section" className="box-border flex flex-col gap-[10px] h-[769px] items-center justify-center overflow-clip px-[64px] py-[10px] w-[1280px] mx-auto">
      <div className="box-border flex flex-col gap-[10px] items-center justify-center px-[20px] py-0 text-center">
        <h2 className="flex flex-col font-lato font-extrabold justify-center text-[39px] leading-[59px] text-[#334155]">
          From Raw Data to Real-Time Decision
        </h2>
        <p className="flex flex-col font-lato justify-center max-w-[620px] text-[16px] leading-[24px] text-black">
          GAIA&apos;s intelligent pipeline transforms unstructured text reports into verified, actionable geospatial alerts in four steps.
        </p>
      </div>

      <div className="flex flex-wrap gap-[10px] items-center justify-center w-full">
        {steps.map((step, index) => (
          <React.Fragment key={index}>
            <div className="flex flex-col gap-[10px] items-start overflow-clip w-[230px] h-full">
              <p className="flex flex-col font-lato font-black justify-center text-[61px] leading-[92px] text-[#575757] w-full">
                {step.number}
              </p>
              <h3 className="flex flex-col font-lato font-bold justify-center text-[20px] leading-[30px] text-black">
                {step.title}
              </h3>
              <p className="flex flex-col font-lato justify-center text-[16px] leading-[24px] text-black w-full">
                {step.description}
              </p>
            </div>
            
            {index < steps.length - 1 && (
              <div className="flex items-center justify-center relative shrink-0">
                <div className="flex-none scale-y-[-100%]">
                  <img 
                    src={landingAssets.icons.arrowRight} 
                    alt="" 
                    className="w-[50px] h-[50px]"
                  />
                </div>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
