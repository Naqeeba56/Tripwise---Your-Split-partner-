import anime from 'animejs';

/**
 * Animate number counting smoothly with Anime.js
 * 
 * @param {HTMLElement} element - DOM element to animate
 * @param {number} startVal - Start number
 * @param {number} endVal - End number
 * @param {string} prefix - Currency prefix like '₹'
 * @param {number} duration - Animation duration in ms
 */
export const animateCounter = (element, startVal = 0, endVal = 0, prefix = '₹', duration = 900) => {
  if (!element) return;

  const obj = { val: startVal };
  anime({
    targets: obj,
    val: endVal,
    round: 1,
    easing: 'easeOutExpo',
    duration: duration,
    update: () => {
      element.innerHTML = `${prefix}${obj.val.toLocaleString('en-IN')}`;
    },
  });
};

/**
 * Attaches smooth 3D perspective tilt effect to an element on mouse move
 * 
 * @param {HTMLElement} card - The element to tilt
 */
export const attach3DTilt = (card) => {
  if (!card) return () => {};

  const handleMouseMove = (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    const rotateX = (-y / (rect.height / 2)) * 6;
    const rotateY = (x / (rect.width / 2)) * 6;

    anime({
      targets: card,
      rotateX: rotateX,
      rotateY: rotateY,
      scale: 1.012,
      perspective: 900,
      duration: 120,
      easing: 'easeOutQuad',
    });
  };

  const handleMouseLeave = () => {
    anime({
      targets: card,
      rotateX: 0,
      rotateY: 0,
      scale: 1,
      duration: 400,
      easing: 'easeOutElastic(1, .7)',
    });
  };

  card.addEventListener('mousemove', handleMouseMove);
  card.addEventListener('mouseleave', handleMouseLeave);

  return () => {
    card.removeEventListener('mousemove', handleMouseMove);
    card.removeEventListener('mouseleave', handleMouseLeave);
  };
};

/**
 * Animates a circular SVG progress gauge stroke
 * 
 * @param {SVGElement} circleElement - Circle SVG element
 * @param {number} percentage - 0 to 100
 * @param {number} circumference - 2 * PI * r
 */
export const animateCircleProgress = (circleElement, percentage = 0, circumference = 283) => {
  if (!circleElement) return;

  const offset = circumference - (Math.min(100, Math.max(0, percentage)) / 100) * circumference;
  anime({
    targets: circleElement,
    strokeDashoffset: [circumference, offset],
    duration: 1200,
    easing: 'easeOutCubic',
  });
};

/**
 * Triggers a stagger entrance reveal for a list of items
 * 
 * @param {string} selector - CSS selector for the items
 */
export const staggerReveal = (selector) => {
  anime({
    targets: selector,
    opacity: [0, 1],
    translateY: [18, 0],
    scale: [0.97, 1],
    delay: anime.stagger(50, { start: 40 }),
    easing: 'easeOutCubic',
    duration: 500,
  });
};

/**
 * Triggers a pulse alert animation for budget breach
 * 
 * @param {HTMLElement} element - Alert container
 */
export const pulseAlert = (element) => {
  if (!element) return;
  anime({
    targets: element,
    scale: [1, 1.03, 1],
    borderColor: ['rgba(244, 63, 94, 0.3)', 'rgba(244, 63, 94, 1)', 'rgba(244, 63, 94, 0.3)'],
    duration: 700,
    easing: 'easeInOutSine',
    loop: 3,
  });
};
