/**
 * Advanced Animations for Walnut Nexus
 * Handles micro-interactions, hover effects, and advanced UI animations
 */

// Animation state management
const animationState = {
  activeAnimations: new Set(),
  animationQueue: [],
  isAnimating: false,
  performanceMode: 'auto' // auto, high, low
};

/**
 * Initialize animations system
 */
function initAnimations() {
  console.log('Initializing animations system...');
  
  // Detect performance capabilities
  detectPerformanceCapabilities();
  
  // Initialize micro-interactions
  initMicroInteractions();
  
  // Initialize hover effects
  initHoverEffects();
  
  // Initialize loading animations
  initLoadingAnimations();
  
  // Initialize gesture animations
  initGestureAnimations();
  
  console.log(`Animations initialized in ${animationState.performanceMode} performance mode`);
}

/**
 * Detect device performance capabilities
 */
function detectPerformanceCapabilities() {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const memory = navigator.deviceMemory;
  const cores = navigator.hardwareConcurrency;
  
  // Determine performance mode based on device capabilities
  if (
    (connection && connection.effectiveType === 'slow-2g') ||
    (memory && memory < 4) ||
    (cores && cores < 4) ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    animationState.performanceMode = 'low';
    document.body.classList.add('performance-low');
  } else if (
    (memory && memory >= 8) &&
    (cores && cores >= 8) &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    animationState.performanceMode = 'high';
    document.body.classList.add('performance-high');
  } else {
    animationState.performanceMode = 'auto';
    document.body.classList.add('performance-auto');
  }
}

/**
 * Initialize micro-interactions
 */
function initMicroInteractions() {
  // Button press animations
  const buttons = document.querySelectorAll('.cta-button, .project-link, button');
  buttons.forEach(button => {
    button.addEventListener('mousedown', handleButtonPress);
    button.addEventListener('mouseup', handleButtonRelease);
    button.addEventListener('mouseleave', handleButtonRelease);
  });
  
  // Input focus animations
  const inputs = document.querySelectorAll('input, textarea, select');
  inputs.forEach(input => {
    input.addEventListener('focus', handleInputFocus);
    input.addEventListener('blur', handleInputBlur);
  });
  
  // Link hover animations
  const links = document.querySelectorAll('a:not(.cta-button):not(.project-link)');
  links.forEach(link => {
    link.addEventListener('mouseenter', handleLinkHover);
    link.addEventListener('mouseleave', handleLinkLeave);
  });
}

/**
 * Handle button press animation
 */
function handleButtonPress(event) {
  if (animationState.performanceMode === 'low') return;
  
  const button = event.target;
  button.style.transform = 'scale(0.98)';
  button.style.transition = 'transform 0.1s ease-out';
}

/**
 * Handle button release animation
 */
function handleButtonRelease(event) {
  if (animationState.performanceMode === 'low') return;
  
  const button = event.target;
  button.style.transform = 'scale(1)';
  
  // Add ripple effect for high performance mode
  if (animationState.performanceMode === 'high') {
    createRippleEffect(button, event);
  }
}

/**
 * Create ripple effect animation
 */
function createRippleEffect(element, event) {
  const rect = element.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = event.clientX - rect.left - size / 2;
  const y = event.clientY - rect.top - size / 2;
  
  const ripple = document.createElement('div');
  ripple.style.cssText = `
    position: absolute;
    width: ${size}px;
    height: ${size}px;
    left: ${x}px;
    top: ${y}px;
    background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%);
    border-radius: 50%;
    pointer-events: none;
    transform: scale(0);
    z-index: 1;
  `;
  
  element.style.position = 'relative';
  element.style.overflow = 'hidden';
  element.appendChild(ripple);
  
  // Animate ripple
  requestAnimationFrame(() => {
    ripple.style.transition = 'transform 0.6s ease-out, opacity 0.6s ease-out';
    ripple.style.transform = 'scale(2)';
    ripple.style.opacity = '0';
  });
  
  // Remove ripple after animation
  setTimeout(() => {
    if (ripple.parentNode) {
      ripple.parentNode.removeChild(ripple);
    }
  }, 600);
}

/**
 * Handle input focus animations
 */
function handleInputFocus(event) {
  const input = event.target;
  input.parentElement?.classList.add('input-focused');
  
  if (animationState.performanceMode !== 'low') {
    input.style.transform = 'scale(1.02)';
    input.style.transition = 'transform 0.2s ease-out';
  }
}

/**
 * Handle input blur animations
 */
function handleInputBlur(event) {
  const input = event.target;
  input.parentElement?.classList.remove('input-focused');
  
  if (animationState.performanceMode !== 'low') {
    input.style.transform = 'scale(1)';
  }
}

/**
 * Handle link hover animations
 */
function handleLinkHover(event) {
  if (animationState.performanceMode === 'low') return;
  
  const link = event.target;
  link.style.transition = 'all 0.2s ease-out';
  link.style.textDecoration = 'underline';
  link.style.textUnderlineOffset = '4px';
}

/**
 * Handle link leave animations
 */
function handleLinkLeave(event) {
  if (animationState.performanceMode === 'low') return;
  
  const link = event.target;
  link.style.textDecoration = 'none';
}

/**
 * Initialize hover effects for cards and interactive elements
 */
function initHoverEffects() {
  if (animationState.performanceMode === 'low') return;
  
  const hoverElements = document.querySelectorAll(`
    .thought-card,
    .idea-card,
    .project-card,
    .reading-item,
    .observation-content
  `);
  
  hoverElements.forEach(element => {
    element.addEventListener('mouseenter', handleCardHoverEnter);
    element.addEventListener('mouseleave', handleCardHoverLeave);
    element.addEventListener('mousemove', handleCardMouseMove);
  });
}

/**
 * Handle card hover enter with enhanced effects
 */
function handleCardHoverEnter(event) {
  const card = event.target;
  
  // Add hover class for CSS transitions
  card.classList.add('is-hovered');
  
  // Enhanced effects for high performance mode
  if (animationState.performanceMode === 'high') {
    // Add subtle glow effect
    card.style.boxShadow = `
      0 20px 40px rgba(0, 0, 0, 0.3),
      0 0 0 1px rgba(255, 255, 255, 0.1),
      0 0 20px rgba(102, 126, 234, 0.1)
    `;
    
    // Add subtle scale and rotation
    card.style.transform = 'translateY(-8px) scale(1.02) rotateX(2deg)';
  }
}

/**
 * Handle card hover leave
 */
function handleCardHoverLeave(event) {
  const card = event.target;
  
  card.classList.remove('is-hovered');
  
  if (animationState.performanceMode === 'high') {
    card.style.transform = 'translateY(0) scale(1) rotateX(0deg)';
    card.style.boxShadow = '';
  }
}

/**
 * Handle card mouse move for tilt effect
 */
function handleCardMouseMove(event) {
  if (animationState.performanceMode !== 'high') return;
  
  const card = event.target;
  const rect = card.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;
  
  const rotateX = (y - centerY) / 20;
  const rotateY = (centerX - x) / 20;
  
  card.style.transform = `
    translateY(-8px) 
    scale(1.02) 
    rotateX(${rotateX}deg) 
    rotateY(${rotateY}deg)
  `;
}

/**
 * Initialize loading animations
 */
function initLoadingAnimations() {
  // Animate elements as they load
  const images = document.querySelectorAll('img');
  images.forEach(img => {
    if (!img.complete) {
      img.style.opacity = '0';
      img.addEventListener('load', () => {
        img.style.transition = 'opacity 0.5s ease-out';
        img.style.opacity = '1';
      });
    }
  });
  
  // Progressive content reveal
  revealContentProgressively();
}

/**
 * Reveal content progressively for better perceived performance
 */
function revealContentProgressively() {
  const revealOrder = [
    '.nav-header',
    '.hero-section',
    '.thoughts-section .section-title',
    '.thoughts-section .section-description',
    '.thoughts-grid .thought-card',
    '.ideas-section .section-title',
    '.ideas-section .section-description',
    '.ideas-grid .idea-card',
    '.projects-section .section-title',
    '.projects-section .section-description',
    '.projects-grid .project-card',
    '.observations-section .section-title',
    '.observations-section .section-description',
    '.observations-timeline .observation-item',
    '.reading-section .section-title',
    '.reading-section .section-description',
    '.reading-grid .reading-item',
    '.footer'
  ];
  
  revealOrder.forEach((selector, index) => {
    const elements = document.querySelectorAll(selector);
    elements.forEach((element, elementIndex) => {
      const delay = (index * 100) + (elementIndex * 50);
      
      element.style.opacity = '0';
      element.style.transform = 'translateY(20px)';
      
      setTimeout(() => {
        element.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';
      }, delay);
    });
  });
}

/**
 * Initialize gesture animations for mobile
 */
function initGestureAnimations() {
  if (!('ontouchstart' in window)) return;
  
  let touchStartY = 0;
  let touchStartX = 0;
  
  document.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
    touchStartX = e.touches[0].clientX;
  }, { passive: true });
  
  document.addEventListener('touchmove', (e) => {
    const touchCurrentY = e.touches[0].clientY;
    const touchCurrentX = e.touches[0].clientX;
    
    const deltaY = touchCurrentY - touchStartY;
    const deltaX = touchCurrentX - touchStartX;
    
    // Add subtle parallax effect on mobile scroll
    if (Math.abs(deltaY) > Math.abs(deltaX) && animationState.performanceMode !== 'low') {
      const parallaxElements = document.querySelectorAll('.hero-section, .section-title');
      parallaxElements.forEach(element => {
        const speed = 0.1;
        element.style.transform = `translateY(${deltaY * speed}px)`;
      });
    }
  }, { passive: true });
}

/**
 * Animate text with typewriter effect
 */
function typewriterAnimation(element, text, speed = 50) {
  return new Promise((resolve) => {
    let i = 0;
    element.textContent = '';
    
    const timer = setInterval(() => {
      element.textContent += text.charAt(i);
      i++;
      
      if (i > text.length) {
        clearInterval(timer);
        resolve();
      }
    }, speed);
  });
}

/**
 * Animate numbers counting up
 */
function animateNumber(element, start, end, duration = 1000) {
  const range = end - start;
  const startTime = performance.now();
  
  function updateNumber(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Easing function (ease-out)
    const easeOut = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(start + (range * easeOut));
    
    element.textContent = current.toLocaleString();
    
    if (progress < 1) {
      requestAnimationFrame(updateNumber);
    }
  }
  
  requestAnimationFrame(updateNumber);
}

/**
 * Create particle effect
 */
function createParticleEffect(x, y, count = 5) {
  if (animationState.performanceMode === 'low') return;
  
  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div');
    particle.style.cssText = `
      position: fixed;
      width: 4px;
      height: 4px;
      background: rgba(102, 126, 234, 0.8);
      border-radius: 50%;
      pointer-events: none;
      z-index: 9999;
      left: ${x}px;
      top: ${y}px;
    `;
    
    document.body.appendChild(particle);
    
    const angle = (i / count) * Math.PI * 2;
    const velocity = 50 + Math.random() * 50;
    const vx = Math.cos(angle) * velocity;
    const vy = Math.sin(angle) * velocity;
    
    let life = 1;
    
    function animateParticle() {
      life -= 0.02;
      
      if (life <= 0) {
        document.body.removeChild(particle);
        return;
      }
      
      const currentX = parseFloat(particle.style.left);
      const currentY = parseFloat(particle.style.top);
      
      particle.style.left = (currentX + vx * 0.016) + 'px';
      particle.style.top = (currentY + vy * 0.016) + 'px';
      particle.style.opacity = life;
      particle.style.transform = `scale(${life})`;
      
      requestAnimationFrame(animateParticle);
    }
    
    requestAnimationFrame(animateParticle);
  }
}

/**
 * Performance monitoring for animations
 */
function monitorAnimationPerformance() {
  let frameCount = 0;
  let lastTime = performance.now();
  
  function measureFPS() {
    frameCount++;
    const currentTime = performance.now();
    
    if (currentTime - lastTime >= 1000) {
      const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
      
      // Adjust performance mode based on FPS
      if (fps < 30 && animationState.performanceMode === 'high') {
        animationState.performanceMode = 'auto';
        console.log('Reducing animation performance due to low FPS:', fps);
      } else if (fps > 55 && animationState.performanceMode === 'auto') {
        animationState.performanceMode = 'high';
        console.log('Increasing animation performance due to high FPS:', fps);
      }
      
      frameCount = 0;
      lastTime = currentTime;
    }
    
    requestAnimationFrame(measureFPS);
  }
  
  requestAnimationFrame(measureFPS);
}

/**
 * Cleanup animations
 */
function cleanupAnimations() {
  // Cancel all active animations
  animationState.activeAnimations.forEach(id => {
    cancelAnimationFrame(id);
  });
  
  animationState.activeAnimations.clear();
  animationState.animationQueue = [];
}

// Export functions
window.WalnutNexus = window.WalnutNexus || {};
Object.assign(window.WalnutNexus, {
  initAnimations,
  typewriterAnimation,
  animateNumber,
  createParticleEffect,
  cleanupAnimations,
  animationState
});

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAnimations);
} else {
  initAnimations();
}

// Start performance monitoring
monitorAnimationPerformance();

// Cleanup on page unload
window.addEventListener('beforeunload', cleanupAnimations);
