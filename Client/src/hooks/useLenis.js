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
    // Initialize Lenis smooth scroll with robust nested scroll support
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
      infinite: false,
      allowNestedScroll: true,
      prevent: (node) => {
        if (!node || !(node instanceof HTMLElement)) return false;

        // 1. Explicit data-lenis-prevent attribute on node or any ancestor
        if (
          node.hasAttribute('data-lenis-prevent') ||
          node.closest?.('[data-lenis-prevent], [data-lenis-prevent="true"]')
        ) {
          return true;
        }

        // 2. Dashboards, sidebars, tables, dialogs, drawers, dropdowns
        if (
          node.closest?.(
            'aside, nav, table, tbody, [role="dialog"], [role="tabpanel"], .modal, .drawer, .sidebar-scroll, pre, code'
          )
        ) {
          return true;
        }

        // 3. Any element with overflow: auto or scroll that is currently scrollable
        let current = node;
        while (current && current !== document.body && current !== document.documentElement) {
          try {
            const style = window.getComputedStyle(current);
            const oy = style.overflowY;
            const ox = style.overflowX;
            const isScrollY =
              (oy === 'auto' || oy === 'scroll' || oy === 'overlay') &&
              current.scrollHeight > current.clientHeight;
            const isScrollX =
              (ox === 'auto' || ox === 'scroll' || ox === 'overlay') &&
              current.scrollWidth > current.clientWidth;

            if (isScrollY || isScrollX) {
              return true;
            }
          } catch {
            // Ignore error
          }
          current = current.parentElement;
        }

        return false;
      },
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
