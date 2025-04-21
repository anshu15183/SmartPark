
import { useState, useEffect } from "react";

export function useMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkIsMobile();
    
    // Add event listener
    window.addEventListener("resize", checkIsMobile);
    
    // Cleanup
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  return isMobile;
}

// Add a hook to get more specific screen sizes
export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState({
    isMobile: false,     // < 768px
    isTablet: false,     // 768px - 1023px
    isDesktop: false,    // >= 1024px
    isLargeDesktop: false // >= 1280px
  });

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      setBreakpoint({
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
        isLargeDesktop: width >= 1280
      });
    };

    // Initial check
    updateBreakpoint();
    
    // Add event listener
    window.addEventListener("resize", updateBreakpoint);
    
    // Cleanup
    return () => window.removeEventListener("resize", updateBreakpoint);
  }, []);

  return breakpoint;
}
