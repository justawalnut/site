/**
 * Main JavaScript file for Walnut Nexus
 * Handles core functionality, navigation, and initialization
 */

// Configuration
const CONFIG = {
  // Scroll settings
  scrollThreshold: 0.1,
  scrollDebounceDelay: 10,
  
  // Animation settings
  animationDuration: 600,
  staggerDelay: 100,
  
  // Performance settings
  enableGPUAcceleration: true,
  respectReducedMotion: true
};

// State management
const state = {
  currentSection: 'hero',
  isScrolling: false,
  scrollProgress: 0,
  observers: new Map(),
  animationQueue: []
};

/**
 * Initialize the application
 */
function init() {
  console.log('Initializing Walnut Nexus...');
  
  // Check for reduced motion preference
  if (CONFIG.respectReducedMotion && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.body.classList.add('reduced-motion');
    console.log('Reduced motion preference detected');
  }
  
  // Initialize core features
  initNavigation();
  initScrollProgress();
  initSmoothScrolling();
  initAccessibility();
  
  console.log('Walnut Nexus initialized successfully');
}

/**
 * Initialize navigation functionality
 */
function initNavigation() {
  const navLinks = document.querySelectorAll('.nav-links a');
  const sections = document.querySelectorAll('section[id]');
  
  // Add click handlers for smooth scrolling
  navLinks.forEach(link => {
    link.addEventListener('click', handleNavClick);
  });
  
  // Set up intersection observer for active section tracking
  const navObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          updateActiveNavItem(entry.target.id);
          state.currentSection = entry.target.id;
        }
      });
    },
    {
      threshold: 0.5,
      rootMargin: '-20% 0px -20% 0px'
    }
  );
  
  sections.forEach(section => {
    navObserver.observe(section);
  });
  
  state.observers.set('navigation', navObserver);
}

/**
 * Handle navigation link clicks
 */
function handleNavClick(event) {
  event.preventDefault();
  
  const targetId = event.target.getAttribute('href').substring(1);
  const targetElement = document.getElementById(targetId);
  
  if (targetElement) {
    scrollToElement(targetElement);
    
    // Update focus for accessibility
    targetElement.focus({ preventScroll: true });
    targetElement.setAttribute('tabindex', '-1');
  }
}

/**
 * Update active navigation item
 */
function updateActiveNavItem(activeId) {
  const navLinks = document.querySelectorAll('.nav-links a');
  
  navLinks.forEach(link => {
    const href = link.getAttribute('href').substring(1);
    if (href === activeId) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    } else {
      link.classList.remove('active');
      link.removeAttribute('aria-current');
    }
  });
}

/**
 * Initialize scroll progress indicator
 */
function initScrollProgress() {
  const progressBar = document.querySelector('.scroll-progress');
  if (!progressBar) return;
  
  const updateProgress = throttle(() => {
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight - windowHeight;
    const scrolled = window.scrollY;
    
    const progress = Math.min((scrolled / documentHeight) * 100, 100);
    state.scrollProgress = progress;
    
    progressBar.style.width = `${progress}%`;
    progressBar.setAttribute('aria-valuenow', Math.round(progress));
  }, CONFIG.scrollDebounceDelay);
  
  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress(); // Initial call
}

/**
 * Initialize smooth scrolling for anchor links
 */
function initSmoothScrolling() {
  // Polyfill for browsers that don't support smooth scroll behavior
  if (!('scrollBehavior' in document.documentElement.style)) {
    import('./polyfills/smooth-scroll.js').then(module => {
      module.initSmoothScrollPolyfill();
    });
  }
}

/**
 * Scroll to element with smooth animation
 */
function scrollToElement(element, offset = 80) {
  const elementPosition = element.getBoundingClientRect().top + window.scrollY;
  const offsetPosition = elementPosition - offset;
  
  window.scrollTo({
    top: offsetPosition,
    behavior: 'smooth'
  });
}

/**
 * Initialize accessibility features
 */
function initAccessibility() {
  // Skip link functionality
  const skipLink = document.querySelector('.skip-link');
  if (skipLink) {
    skipLink.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(skipLink.getAttribute('href'));
      if (target) {
        target.focus();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }
  
  // Keyboard navigation for cards
  const interactiveCards = document.querySelectorAll('.thought-card, .idea-card, .project-card, .reading-item');
  interactiveCards.forEach(card => {
    card.setAttribute('tabindex', '0');
    card.addEventListener('keydown', handleCardKeydown);
  });
  
  // Focus management for modal-like interactions
  document.addEventListener('keydown', handleGlobalKeydown);
}

/**
 * Handle keyboard interactions for cards
 */
function handleCardKeydown(event) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    
    // Find any links within the card and trigger them
    const link = event.target.querySelector('a');
    if (link) {
      link.click();
    }
  }
}

/**
 * Handle global keyboard shortcuts
 */
function handleGlobalKeydown(event) {
  // Home key - scroll to top
  if (event.key === 'Home' && !event.target.matches('input, textarea')) {
    event.preventDefault();
    scrollToElement(document.getElementById('hero'));
  }
  
  // End key - scroll to bottom
  if (event.key === 'End' && !event.target.matches('input, textarea')) {
    event.preventDefault();
    scrollToElement(document.querySelector('.footer'));
  }
}

/**
 * Utility function to throttle function calls
 */
function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }
}

/**
 * Utility function to debounce function calls
 */
function debounce(func, wait, immediate) {
  let timeout;
  return function() {
    const context = this;
    const args = arguments;
    const later = function() {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
}

/**
 * Get scroll direction
 */
function getScrollDirection() {
  let lastScrollTop = 0;
  
  return function() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const direction = scrollTop > lastScrollTop ? 'down' : 'up';
    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
    return direction;
  };
}

/**
 * Check if element is in viewport
 */
function isInViewport(element, threshold = 0) {
  const rect = element.getBoundingClientRect();
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;
  const windowWidth = window.innerWidth || document.documentElement.clientWidth;
  
  return (
    rect.top >= -threshold &&
    rect.left >= -threshold &&
    rect.bottom <= windowHeight + threshold &&
    rect.right <= windowWidth + threshold
  );
}

/**
 * Performance monitoring
 */
function initPerformanceMonitoring() {
  if ('performance' in window) {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const perfData = performance.getEntriesByType('navigation')[0];
        console.log('Performance metrics:', {
          domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
          loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
          totalTime: perfData.loadEventEnd - perfData.fetchStart
        });
      }, 0);
    });
  }
}

/**
 * Error handling
 */
function initErrorHandling() {
  window.addEventListener('error', (event) => {
    console.error('JavaScript error:', event.error);
    
    // Graceful degradation - remove animations if there are script errors
    document.body.classList.add('no-js-fallback');
  });
  
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
  });
}

/**
 * Cleanup function
 */
function cleanup() {
  // Remove event listeners
  state.observers.forEach(observer => observer.disconnect());
  state.observers.clear();
  
  // Clear animation queue
  state.animationQueue.forEach(id => cancelAnimationFrame(id));
  state.animationQueue = [];
}

// Export functions for use in other modules
window.WalnutNexus = {
  init,
  scrollToElement,
  isInViewport,
  throttle,
  debounce,
  state,
  CONFIG
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Initialize performance monitoring and error handling
initPerformanceMonitoring();
initErrorHandling();

// Cleanup on page unload
window.addEventListener('beforeunload', cleanup);
