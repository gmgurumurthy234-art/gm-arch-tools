/**
 * GM ARCH TOOLS — GM DESIGN PORTAL OPENING ANIMATION CONTROLLER
 * Visual Reference: Artboard 1 (media_1790448579657.png)
 *
 * Sequence:
 *   Phase 1 (0.0s - 0.8s): Pitch black silence
 *   Phase 2 (0.8s - 2.5s): Circular light ring forms and rotates into place
 *   Phase 3 (2.0s - 3.4s): GM interlocking monogram fades in with subtle scale settling
 *   Phase 4 (3.6s - 4.6s): DESIGN PORTAL subtitle fades in below monogram
 *   Phase 5 (4.6s - 5.5s): Full composition hold (exact Artboard 1 match)
 *   Phase 6 (5.5s+):       Seamless portal unlock & reveal to GM ARCH TOOLS main site
 *
 * Interactivity:
 *   - Click anywhere or press Escape to skip immediately.
 *   - Scroll/wheel naturally advances the timeline.
 *   - Session memory (sessionStorage) prevents repetitive replays.
 *   - Replay button allows experiencing the opening on demand.
 */

const CIRCLE_RADIUS = 230;
const STROKE_LENGTH = 2 * Math.PI * CIRCLE_RADIUS; // ~1445.13
const TOTAL_DURATION = 5.5; // seconds

let animFrameId = null;
let startTime = null;
let pausedOffset = 0;
let isDismissed = false;
let isAccelerating = false;

export function initIntro() {
  const overlay = document.getElementById('intro-overlay');
  if (!overlay) return;

  const ringSvg = document.getElementById('intro-ring-svg');
  const ringStroke = document.getElementById('intro-ring-stroke');
  const ringGlow = document.getElementById('intro-ring-glow');
  const gmContainer = document.getElementById('intro-gm-container');
  const portalContainer = document.getElementById('intro-portal-container');
  const progressBar = document.getElementById('intro-progress-bar');
  const skipBtn = document.getElementById('intro-skip-btn');
  const replayBtn = document.getElementById('replay-intro-btn');

  // Check reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    overlay.style.display = 'none';
    document.body.style.overflow = '';
    return;
  }

  // Check session memory
  if (sessionStorage.getItem('gm_design_portal_seen') === 'true') {
    overlay.classList.add('dismissed');
    overlay.style.display = 'none';
    document.body.style.overflow = '';
  } else {
    // Initial launch
    startIntroAnimation();
  }

  // Bind Replay Button in Header
  if (replayBtn) {
    replayBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      replayIntro();
    });
  }

  function startIntroAnimation() {
    isDismissed = false;
    isAccelerating = false;
    pausedOffset = 0;
    startTime = null;

    overlay.style.display = 'flex';
    overlay.classList.remove('dismissed');
    document.body.style.overflow = 'hidden';

    // Reset initial visuals
    applyTimeline(0);

    if (animFrameId) cancelAnimationFrame(animFrameId);
    animFrameId = requestAnimationFrame(animationLoop);
  }

  function animationLoop(timestamp) {
    if (isDismissed) return;

    if (!startTime) startTime = timestamp;
    const elapsed = ((timestamp - startTime) / 1000) + pausedOffset;

    applyTimeline(elapsed);

    if (elapsed >= TOTAL_DURATION) {
      completeIntro();
    } else {
      animFrameId = requestAnimationFrame(animationLoop);
    }
  }

  function applyTimeline(t) {
    // 1. Progress Bar (0 to 100%)
    const pct = Math.min(100, Math.max(0, (t / TOTAL_DURATION) * 100));
    if (progressBar) {
      progressBar.style.width = `${pct}%`;
    }

    // Phase 1 (0.0s - 0.8s): Pitch Black
    if (t < 0.8) {
      if (ringStroke) {
        ringStroke.style.strokeDashoffset = `${STROKE_LENGTH}`;
        ringStroke.style.opacity = '0';
      }
      if (ringSvg) {
        ringSvg.style.transform = 'rotate(-90deg)';
      }
      if (ringGlow) ringGlow.style.opacity = '0';
      if (gmContainer) {
        gmContainer.style.opacity = '0';
        gmContainer.style.transform = 'translate(-50%, -50%) scale(0.95)';
        gmContainer.style.filter = 'blur(4px)';
      }
      if (portalContainer) {
        portalContainer.style.opacity = '0';
        portalContainer.style.transform = 'translate(-50%, -50%) translateY(6px)';
        portalContainer.style.filter = 'blur(3px)';
      }
      return;
    }

    // Phase 2 (0.8s - 2.5s): Circle Forms & Rotates In
    const ringT = Math.min(1, Math.max(0, (t - 0.8) / 1.7));
    // Smooth cubic ease-in-out
    const easedRing = ringT < 0.5 
      ? 4 * ringT * ringT * ringT 
      : 1 - Math.pow(-2 * ringT + 2, 3) / 2;

    if (ringStroke) {
      ringStroke.style.opacity = Math.min(1, ringT * 3).toString();
      ringStroke.style.strokeDashoffset = `${STROKE_LENGTH * (1 - easedRing)}`;
    }
    if (ringSvg) {
      // Rotate from -90deg towards 0deg as it settles
      const angle = -90 + (easedRing * 90);
      ringSvg.style.transform = `rotate(${angle}deg)`;
    }

    // Atmospheric Glow & Horizon Flares cross-fade in as ring closes (from 2.0s to 3.0s)
    if (ringGlow) {
      if (t >= 2.0) {
        const glowT = Math.min(1, (t - 2.0) / 1.0);
        ringGlow.style.opacity = (glowT * 0.95).toString();
      } else {
        ringGlow.style.opacity = '0';
      }
    }

    // Phase 3 (2.0s - 3.4s): GM Monogram Emerges Smoothly
    if (gmContainer) {
      if (t >= 2.0) {
        const gmT = Math.min(1, (t - 2.0) / 1.4);
        // Smooth ease out
        const easedGm = 1 - Math.pow(1 - gmT, 3);
        gmContainer.style.opacity = easedGm.toString();
        const scale = 0.96 + (0.04 * easedGm);
        gmContainer.style.transform = `translate(-50%, -50%) scale(${scale})`;
        const blur = (1 - easedGm) * 4;
        gmContainer.style.filter = `blur(${blur.toFixed(1)}px)`;
      } else {
        gmContainer.style.opacity = '0';
      }
    }

    // Phase 4 (3.6s - 4.6s): DESIGN PORTAL Subtitle Fades In
    if (portalContainer) {
      if (t >= 3.6) {
        const portalT = Math.min(1, (t - 3.6) / 1.0);
        const easedPortal = 1 - Math.pow(1 - portalT, 3);
        portalContainer.style.opacity = easedPortal.toString();
        const translateY = (1 - easedPortal) * 6;
        portalContainer.style.transform = `translate(-50%, -50%) translateY(${translateY.toFixed(1)}px)`;
        const blur = (1 - easedPortal) * 3;
        portalContainer.style.filter = `blur(${blur.toFixed(1)}px)`;
      } else {
        portalContainer.style.opacity = '0';
      }
    }

    // Phase 5 (4.6s - 5.5s): Complete Composition Hold
    // Everything is at 100% stable luminance matching Artboard 1
  }

  function completeIntro() {
    if (isDismissed) return;
    isDismissed = true;

    if (animFrameId) cancelAnimationFrame(animFrameId);

    // Save session flag
    try {
      sessionStorage.setItem('gm_design_portal_seen', 'true');
    } catch (e) {
      // Ignore in private browsing
    }

    // Smooth cinematic zoom and fadeout
    overlay.classList.add('dismissed');
    document.body.style.overflow = '';

    setTimeout(() => {
      overlay.style.display = 'none';
    }, 850);
  }

  function accelerateAndReveal() {
    if (isDismissed || isAccelerating) return;
    isAccelerating = true;

    // Bring elements immediately to full composition then smoothly dismiss
    applyTimeline(TOTAL_DURATION);

    setTimeout(() => {
      completeIntro();
    }, 180);
  }

  // Click anywhere to accelerate / skip
  overlay.addEventListener('click', (e) => {
    // If clicking directly on skip button
    if (e.target === skipBtn || skipBtn.contains(e.target)) {
      e.stopPropagation();
      completeIntro();
      return;
    }
    accelerateAndReveal();
  });

  // Skip button handler
  if (skipBtn) {
    skipBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      completeIntro();
    });
  }

  // Keyboard skip
  window.addEventListener('keydown', (e) => {
    if (overlay.classList.contains('dismissed')) return;
    if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
      accelerateAndReveal();
    }
  });

  // Wheel / Scroll scrub progression
  window.addEventListener('wheel', (e) => {
    if (overlay.classList.contains('dismissed') || isDismissed) return;
    const delta = Math.abs(e.deltaY) > 0 ? e.deltaY : e.deltaX;
    if (delta > 0) {
      // User scrolling down: advance timeline
      pausedOffset += 0.45;
      if (startTime) {
        const currentElapsed = ((performance.now() - startTime) / 1000) + pausedOffset;
        if (currentElapsed >= TOTAL_DURATION) {
          accelerateAndReveal();
        }
      }
    }
  }, { passive: true });

  // Touch swipe support for mobile
  let touchStartY = 0;
  window.addEventListener('touchstart', (e) => {
    if (e.touches && e.touches[0]) {
      touchStartY = e.touches[0].clientY;
    }
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (overlay.classList.contains('dismissed') || isDismissed) return;
    if (e.touches && e.touches[0]) {
      const touchY = e.touches[0].clientY;
      const deltaY = touchStartY - touchY;
      if (deltaY > 10) {
        pausedOffset += 0.5;
        if (startTime) {
          const currentElapsed = ((performance.now() - startTime) / 1000) + pausedOffset;
          if (currentElapsed >= TOTAL_DURATION) {
            accelerateAndReveal();
          }
        }
      }
    }
  }, { passive: true });

  // Public Replay Method
  window.replayIntroSequence = startIntroAnimation;
}

export function replayIntro() {
  if (typeof window.replayIntroSequence === 'function') {
    window.replayIntroSequence();
  }
}

