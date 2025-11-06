import React from 'react';

export const SocialProofSection: React.FC = () => {
  return (
    <div className="bg-[#0a2a4d] box-border flex flex-col gap-[10px] h-[229px] items-center justify-center overflow-clip px-[64px] py-[10px] w-full mx-auto">
      <div className="box-border flex flex-col gap-[10px] items-center justify-center px-[20px] py-0 text-[#f0f4f8] text-center">
        <h2 className="flex flex-col font-lato font-extrabold justify-center text-[39px] leading-[59px]">
          A Tool Built for Responders
        </h2>
        <p className="flex flex-col font-lato justify-center max-w-[620px] text-[16px] leading-[24px]">
          GAIA is designed to meet the critical needs of Local Government Units (LGUs) and Disaster Risk Reduction and Management Offices (DRRMOs) across the Philippines.
        </p>
      </div>
    </div>
  );
};
