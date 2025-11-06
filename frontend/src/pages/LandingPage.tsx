import React from 'react';
import {
  Header,
  HeroSection,
  FeaturesSection,
  HowItWorksSection,
  ProductShowcaseSection,
  SocialProofSection,
  CTASection,
  Footer,
} from '../components/landing';

/**
 * Landing Page Component
 * 
 * Main entry point for the GAIA landing page.
 * Orchestrates all section components in the designed order.
 * 
 * Sections:
 * 0. Header - Navigation bar with logo and CTA buttons
 * 1. Hero - Main headline with CTAs and glassmorphism card
 * 2. Features - Core components showcase (AI Classification, Geo-NER, Dashboard)
 * 3. How It Works - 4-step pipeline explanation
 * 4. Product Showcase - AI-generated assessments preview
 * 5. Social Proof - Target audience messaging
 * 6. CTA - Final call-to-action
 * 7. Footer - Branding, navigation, contact, copyright
 */
const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      <div className="flex flex-col items-center">
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <ProductShowcaseSection />
        <SocialProofSection />
        <CTASection />
        <Footer />
      </div>
    </div>
  );
};

export default LandingPage;
