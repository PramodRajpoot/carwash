/**
 * Play booking success MP3 chime.
 * Handles browser autoplay policies by attaching a one-time gesture listener if needed.
 */
let successAudioInstance = null;

export function playBookingSuccessSound() {
  try {
    if (!successAudioInstance) {
      successAudioInstance = new Audio('/sounds/booking_success.mp3');
      successAudioInstance.preload = 'auto';
    }

    // Reset playback position if previously played
    successAudioInstance.currentTime = 0;
    const playPromise = successAudioInstance.play();

    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn('Autoplay prevented or playback error:', err);
        // Fallback: If autoplay policy blocked the audio (e.g. following a cross-domain redirect),
        // trigger playback on the user's first click or touch on the screen.
        const triggerOnInteraction = () => {
          if (successAudioInstance) {
            successAudioInstance.currentTime = 0;
            successAudioInstance.play().catch(() => {});
          }
          window.removeEventListener('click', triggerOnInteraction, true);
          window.removeEventListener('touchstart', triggerOnInteraction, true);
          window.removeEventListener('keydown', triggerOnInteraction, true);
        };
        window.addEventListener('click', triggerOnInteraction, { once: true, capture: true });
        window.addEventListener('touchstart', triggerOnInteraction, { once: true, capture: true });
        window.addEventListener('keydown', triggerOnInteraction, { once: true, capture: true });
      });
    }
  } catch (error) {
    console.warn('Unable to play booking success audio:', error);
  }
}
