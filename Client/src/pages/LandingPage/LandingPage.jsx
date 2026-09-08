import HeroSection from './sections/HeroSection';
import ActiveTenders from './sections/ActiveTenders';
import AboutSection from './sections/AboutSection';
import HowItWorks from './sections/HowItWorks';
import WhyChoose from './sections/WhyChoose';
import Testimonials from './sections/Testimonials';
import CtaBanner from './sections/CtaBanner';

const LandingPage = () => {
  return (
    <div className="w-full">
      <HeroSection />
      <ActiveTenders />
      <AboutSection />
      <HowItWorks />
      <WhyChoose />
      <Testimonials />
      <CtaBanner />
    </div>
  );
};

export default LandingPage;
