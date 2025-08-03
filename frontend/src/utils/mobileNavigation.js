// Mobile navigation utilities to prevent refresh issues

// Detect if device is mobile
export const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Prevent pull-to-refresh on mobile
export const preventPullToRefresh = () => {
  if (!isMobile()) return;

  let startY = 0;
  let currentY = 0;

  const handleTouchStart = (e) => {
    startY = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    currentY = e.touches[0].clientY;
    
    // Prevent pull-to-refresh when scrolling up at the top
    if (window.scrollY === 0 && currentY > startY) {
      e.preventDefault();
    }
  };

  document.addEventListener('touchstart', handleTouchStart, { passive: false });
  document.addEventListener('touchmove', handleTouchMove, { passive: false });

  return () => {
    document.removeEventListener('touchstart', handleTouchStart);
    document.removeEventListener('touchmove', handleTouchMove);
  };
};

// Debounce function for mobile navigation
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Prevent double-tap zoom on navigation elements
export const preventDoubleTapZoom = () => {
  if (!isMobile()) return;

  const elements = document.querySelectorAll('a, button, [role="button"]');
  
  elements.forEach(element => {
    element.style.touchAction = 'manipulation';
    element.style.webkitTapHighlightColor = 'transparent';
  });
};

// Smooth scroll to top for mobile
export const smoothScrollToTop = () => {
  if (isMobile()) {
    // Use instant scroll for mobile to prevent refresh
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  } else {
    // Use smooth scroll for desktop
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }
};

// Initialize mobile-specific behaviors
export const initMobileBehaviors = () => {
  if (!isMobile()) return;

  // Prevent pull-to-refresh
  preventPullToRefresh();
  
  // Prevent double-tap zoom
  preventDoubleTapZoom();
  
  // Add mobile-specific classes
  document.body.classList.add('mobile-device');
}; 