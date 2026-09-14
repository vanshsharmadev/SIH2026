import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

/**
 * Custom hook to initialize and manage Lenis smooth scrolling.
 * @param {Object} options - Custom Lenis configuration options
 * @returns {React.MutableRefObject<Lenis|null>} Ref containing the Lenis instance
 */
export default function useLenis(options = {}) {
  const lenisRef = useRef(null);

  useEffect(() => {
    // Initialize Lenis smooth scroll
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
      infinite: false,
      ...options,
    });

    lenisRef.current = lenis;
    window.lenis = lenis;

    let rafId;
    function raf(time) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }

    rafId = requestAnimationFrame(raf);

    // Keep Lenis dimensions in sync when React components mount or change height dynamically
    const resizeObserver = new ResizeObserver(() => {
      lenis.resize();
    });

    if (document.body) {
      resizeObserver.observe(document.body);
    }

    const handleWindowResize = () => {
      lenis.resize();
    };
    window.addEventListener('resize', handleWindowResize);

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleWindowResize);
      lenis.destroy();
      lenisRef.current = null;
      if (window.lenis === lenis) {
        window.lenis = null;
      }
    };
  }, []);

  return lenisRef;
}
