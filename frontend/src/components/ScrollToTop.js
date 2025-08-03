import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { isMobile, smoothScrollToTop, debounce } from '../utils/mobileNavigation';

export default function ScrollToTop() {
  const { pathname } = useLocation();
  const scrollTimeout = useRef(null);

  // Debounced scroll function
  const debouncedScroll = useRef(
    debounce(() => {
      smoothScrollToTop();
    }, 100)
  ).current;

  useEffect(() => {
    // Clear any existing timeout
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }

    // Add a small delay for mobile to prevent refresh issues
    const delay = isMobile() ? 150 : 0;
    
    scrollTimeout.current = setTimeout(() => {
      debouncedScroll();
    }, delay);

    return () => {
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, [pathname, debouncedScroll]);

  return null;
} 