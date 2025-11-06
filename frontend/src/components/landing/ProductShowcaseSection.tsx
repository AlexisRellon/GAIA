import React from 'react';

export const ProductShowcaseSection: React.FC = () => {
  const showcaseItems = [
    {
      title: 'Live Hazard Map',
      description: 'The central dashboard view, showing all active, geolocated hazard reports in real-time.',
    },
    {
      title: 'AI-Classified Report Feed',
      description: 'The central dashboard view, showing all active, geolocated hazard reports in real-time.',
    },
    {
      title: 'Hazard Density Heatmap',
      description: 'The central dashboard view, showing all active, geolocated hazard reports in real-time.',
    },
    {
      title: 'Real-Time Filtering',
      description: 'The central dashboard view, showing all active, geolocated hazard reports in real-time.',
    },
  ];

  return (
    <div className="box-border flex flex-col gap-[80px] h-[1030px] items-center justify-center overflow-clip px-[64px] py-[10px] w-[1280px] mx-auto">
      <div className="box-border flex flex-col gap-[10px] items-center justify-center px-[20px] py-0 text-center">
        <h2 className="flex flex-col font-lato font-extrabold justify-center text-[39px] leading-[59px] text-[#334155]">
          GAIA&apos;s AI-Generated Assessments
        </h2>
        <p className="flex flex-col font-lato justify-center max-w-[620px] text-[16px] leading-[24px] text-black">
          Explore the real-time outputs from our AI pipeline, turning unstructured reports into live intelligence.
        </p>
      </div>

      <div className="flex flex-wrap gap-[20px] items-center justify-center overflow-clip w-full">
        {showcaseItems.map((item, index) => (
          <div 
            key={index}
            className={`bg-[#d9d9d9] flex flex-col gap-[10px] h-[360px] items-start justify-end min-w-[330px] ${index % 2 === 0 ? 'w-[405px]' : 'w-[406px]'}`}
          >
            <div className="bg-gradient-to-t box-border flex flex-col from-10% from-[rgba(10,42,77,0.9)] gap-[10px] items-start justify-end overflow-clip px-[20px] py-[50px] text-white to-95% to-[rgba(0,0,0,0)] w-full">
              <h5 className="flex flex-col font-lato font-semibold justify-center text-[20px] leading-[30px] text-center">
                {item.title}
              </h5>
              <p className="flex flex-col font-lato font-semibold justify-center text-[20px] leading-[30px] w-full">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
