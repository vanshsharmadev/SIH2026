import React from 'react';
import HeroSection from './sections/HeroSection';
import ActiveTenders from './sections/ActiveTenders';
import HowItWorks from './sections/HowItWorks';
import WhyChoose from './sections/WhyChoose';
import AboutSection from './sections/AboutSection';
import Testimonials from './sections/Testimonials';
import CtaBanner from './sections/CtaBanner';

const LandingPage = () => {
  return (
    <div className="w-full bg-[#f8fafc] dark:bg-[#121212] transition-colors duration-200">
      <HeroSection />
      <ActiveTenders />
      <HowItWorks />
      <WhyChoose />
      <AboutSection />
      <Testimonials />
      <CtaBanner />
    </div>
  );
};

export default LandingPage;
