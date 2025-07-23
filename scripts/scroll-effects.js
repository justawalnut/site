/**
 * Scroll Effects for Walnut Nexus
 * Handles scroll-triggered animations and content loading
 */

// Animation configurations
const SCROLL_ANIMATIONS = {
  fadeInUp: {
    initial: { opacity: 0, transform: 'translateY(30px)' },
    final: { opacity: 1, transform: 'translateY(0)' },
    duration: 600,
    easing: 'ease-out'
  },
  fadeInLeft: {
    initial: { opacity: 0, transform: 'translateX(-30px)' },
    final: { opacity: 1, transform: 'translateX(0)' },
    duration: 600,
    easing: 'ease-out'
  },
  fadeInRight: {
    initial: { opacity: 0, transform: 'translateX(30px)' },
    final: { opacity: 1, transform: 'translateX(0)' },
    duration: 600,
    easing: 'ease-out'
  },
  scaleIn: {
    initial: { opacity: 0, transform: 'scale(0.9)' },
    final: { opacity: 1, transform: 'scale(1)' },
    duration: 500,
    easing: 'ease-out'
  }
};

// Intersection Observer instances
let animationObserver = null;
let parallaxObserver = null;

/**
 * Initialize scroll effects
 */
function initScrollEffects() {
  console.log('Initializing scroll effects...');
  
  // Don't initialize animations if user prefers reduced motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    console.log('Reduced motion detected, skipping scroll animations');
    return;
  }
  
  setupScrollAnimations();
  setupParallaxEffects();
  setupNavigationEffects();
  
  console.log('Scroll effects initialized');
}

/**
 * Set up scroll-triggered animations using Intersection Observer
 */
function setupScrollAnimations() {
  // Elements to animate
  const elementsToAnimate = document.querySelectorAll(`
    .thought-card,
    .idea-card,
    .project-card,
    .reading-item,
    .observation-item,
    .section-title,
    .section-description
  `);
  
  // Add initial animation classes
  elementsToAnimate.forEach((element, index) => {
    element.classList.add('animate-on-scroll');
    
    // Assign animation types based on element type and position
    if (element.classList.contains('section-title') || element.classList.contains('section-description')) {
      element.classList.add('fade-up');
    } else if (element.classList.contains('observation-item')) {
      element.classList.add('fade-left');
    } else {
      element.classList.add('fade-up');
    }
    
    // Add stagger delay for grid items
    if (element.closest('.thoughts-grid, .ideas-grid, .projects-grid, .reading-grid')) {
      const delay = (index % 3) * 100; // Stagger by position in grid
      element.style.setProperty('--animation-delay', `${delay}ms`);
    }
  });
  
  // Create Intersection Observer for animations
  animationObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          triggerAnimation(entry.target);
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: '0px 0px -10% 0px'
    }
  );
  
  // Observe all elements
  elementsToAnimate.forEach(element => {
    animationObserver.observe(element);
  });
}

/**
 * Trigger animation for an element
 */
function triggerAnimation(element) {
  // Remove from observer to prevent re-triggering
  animationObserver.unobserve(element);
  
  // Get animation delay if set
  const delay = parseInt(element.style.getPropertyValue('--animation-delay')) || 0;
  
  // Apply animation after delay
  setTimeout(() => {
    if (element.classList.contains('fade-up')) {
      element.classList.add('animate-fade-in-up');
    } else if (element.classList.contains('fade-left')) {
      element.classList.add('animate-fade-in-left');
    } else if (element.classList.contains('fade-right')) {
      element.classList.add('animate-fade-in-right');
    } else if (element.classList.contains('scale')) {
      element.classList.add('animate-scale-in');
    }
    
    // Remove initial state classes
    element.classList.remove('animate-on-scroll', 'fade-up', 'fade-left', 'fade-right', 'scale');
  }, delay);
}

/**
 * Set up subtle parallax effects
 */
function setupParallaxEffects() {
  const parallaxElements = document.querySelectorAll('.hero-section, .section-title');
  
  if (parallaxElements.length === 0) return;
  
  // Use a throttled scroll handler for better performance
  const handleParallax = window.WalnutNexus.throttle(() => {
    const scrolled = window.pageYOffset;
    
    parallaxElements.forEach(element => {
      const rect = element.getBoundingClientRect();
      const speed = element.dataset.parallaxSpeed || 0.5;
      
      // Only apply parallax if element is in viewport
      if (rect.bottom >= 0 && rect.top <= window.innerHeight) {
        const yPos = -(scrolled * speed);
        element.style.transform = `translateY(${yPos}px)`;
      }
    });
  }, 16); // ~60fps
  
  window.addEventListener('scroll', handleParallax, { passive: true });
}

/**
 * Set up navigation effects
 */
function setupNavigationEffects() {
  const nav = document.querySelector('.nav-header');
  if (!nav) return;
  
  let lastScrollY = window.scrollY;
  let isNavVisible = true;
  
  const handleNavScroll = window.WalnutNexus.throttle(() => {
    const currentScrollY = window.scrollY;
    const scrollDifference = Math.abs(currentScrollY - lastScrollY);
    
    // Only react to significant scroll changes
    if (scrollDifference < 5) return;
    
    // Show/hide navigation based on scroll direction
    if (currentScrollY > lastScrollY && currentScrollY > 100) {
      // Scrolling down and past hero section
      if (isNavVisible) {
        nav.style.transform = 'translateY(-100%)';
        isNavVisible = false;
      }
    } else {
      // Scrolling up
      if (!isNavVisible) {
        nav.style.transform = 'translateY(0)';
        isNavVisible = true;
      }
    }
    
    // Add background when scrolled
    if (currentScrollY > 50) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
    
    lastScrollY = currentScrollY;
  }, 16);
  
  window.addEventListener('scroll', handleNavScroll, { passive: true });
}

/**
 * Animate cards in a staggered fashion
 */
function animateCardsStaggered(cards, delay = 100) {
  cards.forEach((card, index) => {
    setTimeout(() => {
      card.classList.add('card-entrance');
    }, index * delay);
  });
}

/**
 * Set up content loading animations
 */
function setupContentLoading() {
  // Animate hero content
  const heroElements = document.querySelectorAll('.hero-title, .hero-subtitle, .hero-cta');
  heroElements.forEach((element, index) => {
    element.style.animationDelay = `${(index + 1) * 200}ms`;
  });
  
  // Animate navigation
  const navHeader = document.querySelector('.nav-header');
  if (navHeader) {
    navHeader.style.animationDelay = '100ms';
  }
}

/**
 * Handle scroll-based section transitions
 */
function setupSectionTransitions() {
  const sections = document.querySelectorAll('section');
  
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('section-in-view');
          
          // Trigger any section-specific animations
          const sectionId = entry.target.id;
          handleSectionEntry(sectionId);
        } else {
          entry.target.classList.remove('section-in-view');
        }
      });
    },
    {
      threshold: 0.2
    }
  );
  
  sections.forEach(section => {
    sectionObserver.observe(section);
  });
}

/**
 * Handle specific animations when sections come into view
 */
function handleSectionEntry(sectionId) {
  switch (sectionId) {
    case 'thoughts':
      const thoughtCards = document.querySelectorAll('.thought-card');
      if (thoughtCards.length > 0) {
        animateCardsStaggered(thoughtCards, 150);
      }
      break;
      
    case 'ideas':
      const ideaCards = document.querySelectorAll('.idea-card');
      if (ideaCards.length > 0) {
        animateCardsStaggered(ideaCards, 100);
      }
      break;
      
    case 'projects':
      const projectCards = document.querySelectorAll('.project-card');
      if (projectCards.length > 0) {
        animateCardsStaggered(projectCards, 200);
      }
      break;
      
    case 'observations':
      const observationItems = document.querySelectorAll('.observation-item');
      observationItems.forEach((item, index) => {
        setTimeout(() => {
          item.classList.add('observe-slide-left', 'visible');
        }, index * 100);
      });
      break;
      
    case 'reading':
      const readingItems = document.querySelectorAll('.reading-item');
      if (readingItems.length > 0) {
        animateCardsStaggered(readingItems, 120);
      }
      break;
  }
}

/**
 * Performance optimization: Use requestAnimationFrame for smooth animations
 */
function optimizeAnimationPerformance() {
  // Add GPU acceleration to animated elements
  const animatedElements = document.querySelectorAll(`
    .animate-on-scroll,
    .nav-header,
    .hero-title,
    .hero-subtitle,
    .hero-cta,
    .thought-card,
    .idea-card,
    .project-card,
    .reading-item
  `);
  
  animatedElements.forEach(element => {
    element.classList.add('gpu-accelerate');
  });
}

/**
 * Clean up scroll effects
 */
function cleanupScrollEffects() {
  if (animationObserver) {
    animationObserver.disconnect();
    animationObserver = null;
  }
  
  if (parallaxObserver) {
    parallaxObserver.disconnect();
    parallaxObserver = null;
  }
}

/**
 * Initialize all scroll effects when called
 */
function initialize() {
  initScrollEffects();
  setupContentLoading();
  setupSectionTransitions();
  optimizeAnimationPerformance();
}

// Export functions
window.WalnutNexus = window.WalnutNexus || {};
Object.assign(window.WalnutNexus, {
  initScrollEffects: initialize,
  cleanupScrollEffects,
  animateCardsStaggered,
  triggerAnimation
});

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

// Cleanup on page unload
window.addEventListener('beforeunload', cleanupScrollEffects);
