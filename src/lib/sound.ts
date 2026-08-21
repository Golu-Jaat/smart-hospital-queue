/**
 * Sound and Speech Synthesis utility for Hospital Queue System
 */

// Web Audio API gentle notification chime
export function playChime() {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const now = ctx.currentTime;
    
    // First tone (higher)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.4);

    // Second tone (lower harmony)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880.00, now + 0.15); // A5
    gain2.gain.setValueAtTime(0.3, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.6);
  } catch (e) {
    console.warn("Chime playback error:", e);
  }
}

export type AnnouncementParams = {
  tokenNumber: number | string;
  doctorName?: string;
  roomNumber?: string;
  departmentName?: string;
  lang?: 'en' | 'hi';
};

/**
 * Text-to-speech announcement in English and Hindi
 */
export function announceToken({
  tokenNumber,
  doctorName,
  roomNumber,
  lang = 'en',
}: AnnouncementParams) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  // Play chime first
  playChime();

  setTimeout(() => {
    try {
      window.speechSynthesis.cancel(); // Cancel any ongoing speech

      let text = '';
      if (lang === 'hi') {
        text = `टोकन नंबर ${tokenNumber}`;
        if (roomNumber) text += `, कमरा नंबर ${roomNumber}`;
        if (doctorName) text += `, डॉक्टर ${doctorName}`;
        text += `, कृपया अंदर आएं।`;
      } else {
        text = `Token number ${tokenNumber}`;
        if (roomNumber) text += `, please proceed to Room ${roomNumber}`;
        if (doctorName) text += `, with Doctor ${doctorName}`;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9; // clear, steady pace
      utterance.pitch = 1.0;

      // Pick Hindi voice if selected and available
      const voices = window.speechSynthesis.getVoices();
      if (lang === 'hi') {
        const hindiVoice = voices.find(v => v.lang.includes('hi') || v.name.toLowerCase().includes('hindi'));
        if (hindiVoice) utterance.voice = hindiVoice;
        utterance.lang = 'hi-IN';
      } else {
        const engVoice = voices.find(v => (v.lang.includes('en-IN') || v.lang.includes('en-US')) && !v.name.includes('Google'));
        if (engVoice) utterance.voice = engVoice;
        utterance.lang = 'en-US';
      }

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis error:", e);
    }
  }, 400);
}
