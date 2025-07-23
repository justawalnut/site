/**
 * Performance and Accessibility Optimization for Walnut Nexus
 * Ensures fast loading times and accessibility compliance
 */

// Performance configuration
const PERFORMANCE_CONFIG = {
  targetFPS: 60,
  animationBudget: 16.67, // ~60fps budget in ms
  maxAnimationDuration: 1000,
  enablePerformanceMonitoring: true
};

/**
 * Initialize performance optimizations
 */
function initPerformanceOptimizations() {
  console.log('Initializing performance optimizations...');
  
  // Optimize images
  optimizeImages();
  
  // Preload critical resources
  preloadCriticalResources();
  
  // Monitor and optimize animations
  if (PERFORMANCE_CONFIG.enablePerformanceMonitoring) {
    monitorAnimationPerformance();
  }
  
  // Implement intersection observer for efficient scroll handling
  optimizeScrollHandling();
  
  console.log('Performance optimizations initialized');
}

/**
 * Optimize image loading
 */
function optimizeImages() {
  const images = document.querySelectorAll('img');
  
  images.forEach(img => {
    // Add loading lazy for non-critical images
    if (!img.hasAttribute('loading')) {
      img.setAttribute('loading', 'lazy');
    }
    
    // Add decode async for better performance
    img.setAttribute('decoding', 'async');
    
    // Handle image load errors gracefully
    img.addEventListener('error', function() {
      this.style.display = 'none';
      console.warn('Failed to load image:', this.src);
    });
  });
}

/**
 * Preload critical resources
 */
function preloadCriticalResources() {
  const criticalResources = [
    { href: 'styles/main.css', as: 'style' },
    { href: 'styles/components.css', as: 'style' },
    { href: 'styles/animations.css', as: 'style' }
  ];
  
  criticalResources.forEach(resource => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = resource.href;
    link.as = resource.as;
    document.head.appendChild(link);
  });
}

/**
 * Monitor animation performance
 */
function monitorAnimationPerformance() {
  let lastFrameTime = performance.now();
  let frameCount = 0;
  let fps = 60;
  
  function measureFrame(currentTime) {
    const deltaTime = currentTime - lastFrameTime;
    lastFrameTime = currentTime;
    
    frameCount++;
    
    if (frameCount % 60 === 0) {
      fps = Math.round(1000 / (deltaTime));
      
      // Adjust performance based on FPS
      if (fps < 30) {
        document.body.classList.add('performance-low');
        console.warn('Low FPS detected:', fps);
      } else if (fps > 55) {
        document.body.classList.remove('performance-low');
      }
    }
    
    requestAnimationFrame(measureFrame);
  }
  
  requestAnimationFrame(measureFrame);
}

/**
 * Optimize scroll handling for better performance
 */
function optimizeScrollHandling() {
  let scrollTimeout;
  let isScrolling = false;
  
  // Debounced scroll handler
  function handleScroll() {
    if (!isScrolling) {
      isScrolling = true;
      document.body.classList.add('is-scrolling');
    }
    
    clearTimeout(scrollTimeout);
    
    scrollTimeout = setTimeout(() => {
      isScrolling = false;
      document.body.classList.remove('is-scrolling');
    }, 150);
  }
  
  // Use passive event listener for better performance
  window.addEventListener('scroll', handleScroll, { 
    passive: true,
    capture: false 
  });
}

/**
 * Ensure accessibility compliance
 */
function ensureAccessibility() {
  console.log('Checking accessibility compliance...');
  
  // Ensure all interactive elements are keyboard accessible
  const interactiveElements = document.querySelectorAll('a, button, [tabindex]');
  interactiveElements.forEach(element => {
    if (!element.hasAttribute('tabindex') && element.tagName.toLowerCase() !== 'a' && element.tagName.toLowerCase() !== 'button') {
      element.setAttribute('tabindex', '0');
    }
  });
  
  // Ensure all images have alt text
  const images = document.querySelectorAll('img');
  images.forEach(img => {
    if (!img.hasAttribute('alt')) {
      img.setAttribute('alt', '');
      console.warn('Image missing alt text:', img.src);
    }
  });
  
  // Ensure proper heading hierarchy
  checkHeadingHierarchy();
  
  // Ensure sufficient color contrast
  checkColorContrast();
  
  console.log('Accessibility check completed');
}

/**
 * Check heading hierarchy for accessibility
 */
function checkHeadingHierarchy() {
  const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
  let lastLevel = 0;
  
  headings.forEach(heading => {
    const currentLevel = parseInt(heading.tagName.charAt(1));
    
    if (currentLevel > lastLevel + 1) {
      console.warn('Heading hierarchy issue: skipped from h' + lastLevel + ' to h' + currentLevel);
    }
    
    lastLevel = currentLevel;
  });
}

/**
 * Basic color contrast check
 */
function checkColorContrast() {
  // This is a simplified check - in production, you'd use a more robust solution
  const elements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, a, button');
  
  elements.forEach(element => {
    const styles = window.getComputedStyle(element);
    const backgroundColor = styles.backgroundColor;
    const color = styles.color;
    
    // Skip if colors are not set or transparent
    if (backgroundColor === 'rgba(0, 0, 0, 0)' || backgroundColor === 'transparent') {
      return;
    }
    
    // Log potential contrast issues for manual review
    if (color === backgroundColor) {
      console.warn('Potential color contrast issue:', element, { color, backgroundColor });
    }
  });
}

/**
 * Implement service worker for caching (production optimization)
 */
function initServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('SW registered: ', registration);
        })
        .catch(registrationError => {
          console.log('SW registration failed: ', registrationError);
        });
    });
  }
}

/**
 * Optimize for Core Web Vitals
 */
function optimizeCoreWebVitals() {
  // Largest Contentful Paint (LCP) optimization
  const heroImage = document.querySelector('.hero-section img');
  if (heroImage) {
    heroImage.setAttribute('fetchpriority', 'high');
  }
  
  // Cumulative Layout Shift (CLS) optimization
  const images = document.querySelectorAll('img');
  images.forEach(img => {
    if (!img.hasAttribute('width') || !img.hasAttribute('height')) {
      // Set aspect ratio to prevent layout shift
      img.style.aspectRatio = '16/9';
      img.style.width = '100%';
      img.style.height = 'auto';
    }
  });
  
  // First Input Delay (FID) optimization
  document.addEventListener('DOMContentLoaded', () => {
    // Defer non-critical JavaScript
    setTimeout(() => {
      // Load non-critical features after initial paint
      initNonCriticalFeatures();
    }, 100);
  });
}

/**
 * Initialize non-critical features after initial load
 */
function initNonCriticalFeatures() {
  // Initialize any non-critical animations or features here
  console.log('Non-critical features initialized');
}

/**
 * Error handling and graceful degradation
 */
function initErrorHandling() {
  window.addEventListener('error', (event) => {
    console.error('JavaScript error:', event.error);
    
    // Graceful degradation - disable animations on error
    document.body.classList.add('no-js-fallback');
    
    // Show user-friendly message
    showErrorMessage('Some interactive features may not be working properly.');
  });
  
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
  });
}

/**
 * Show user-friendly error message
 */
function showErrorMessage(message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;
  errorDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgba(239, 68, 68, 0.9);
    color: white;
    padding: 16px;
    border-radius: 8px;
    z-index: 10000;
    max-width: 300px;
    backdrop-filter: blur(10px);
  `;
  
  document.body.appendChild(errorDiv);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (errorDiv.parentNode) {
      errorDiv.parentNode.removeChild(errorDiv);
    }
  }, 5000);
}

// Initialize all optimizations
function initialize() {
  initPerformanceOptimizations();
  ensureAccessibility();
  optimizeCoreWebVitals();
  initErrorHandling();
  
  // Log performance metrics after initialization
  setTimeout(() => {
    if ('performance' in window && 'getEntriesByType' in performance) {
      const navigation = performance.getEntriesByType('navigation')[0];
      console.log('Performance metrics:', {
        domContentLoaded: Math.round(navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart),
        loadComplete: Math.round(navigation.loadEventEnd - navigation.loadEventStart),
        firstPaint: Math.round(performance.getEntriesByType('paint')[0]?.startTime || 0),
        largestContentfulPaint: Math.round(performance.getEntriesByType('largest-contentful-paint')[0]?.startTime || 0)
      });
    }
  }, 1000);
}

// Export functions
window.WalnutNexus = window.WalnutNexus || {};
Object.assign(window.WalnutNexus, {
  initPerformanceOptimizations: initialize,
  ensureAccessibility,
  optimizeCoreWebVitals,
  PERFORMANCE_CONFIG
});

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}
