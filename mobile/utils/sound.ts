import { Platform } from 'react-native';

let lastPlayedTimestamp = 0;
let playerInstance: any = null;

export const playBookingSuccessSound = async (): Promise<void> => {
  const now = Date.now();
  if (now - lastPlayedTimestamp < 1500) {
    return;
  }
  lastPlayedTimestamp = now;

  try {
    // Web platform fallback using HTML5 Audio
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.Audio) {
      try {
        const audio = new window.Audio(require('../assets/sounds/booking_success.mp3'));
        audio.play().catch((e) => console.warn('Web audio play warning:', e));
        return;
      } catch (webErr) {
        console.warn('Web audio fallback failed:', webErr);
      }
    }

    // Use expo-audio (official Expo SDK 58 audio engine)
    const ExpoAudio = require('expo-audio');
    if (ExpoAudio && typeof ExpoAudio.createAudioPlayer === 'function') {
      if (!playerInstance) {
        playerInstance = ExpoAudio.createAudioPlayer(require('../assets/sounds/booking_success.mp3'));
      } else {
        if (typeof playerInstance.seekTo === 'function') {
          await playerInstance.seekTo(0).catch(() => {});
        }
      }
      if (playerInstance && typeof playerInstance.play === 'function') {
        playerInstance.play();
      }
    }
  } catch (error) {
    console.warn('Failed to play booking success sound:', error);
  }
};
