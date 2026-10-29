// Speech services for the simulated check-in.
// Recognition uses the browser's built-in Web Speech API when available (in some browsers
// this sends audio to the browser vendor's speech service). Nothing is recorded or stored
// by Blink itself; only the text transcript is kept, and only if the user chooses.
// A production version would route speech-to-text through Blink's own backend — never with
// API keys in the frontend.

type Rec = {
  lang: string; continuous: boolean; interimResults: boolean;
  start(): void; stop(): void; abort(): void;
  onresult: ((e: any) => void) | null; onerror: ((e: any) => void) | null; onend: (() => void) | null;
};

export function speechRecognitionSupported() {
  return typeof window !== 'undefined' && !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
}

export function speechSynthesisSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export interface Listener { stop(): void; abort(): void }

export function listen(handlers: { onText: (finalText: string, interim: string) => void; onError: (msg: string) => void; onEnd: () => void }): Listener | null {
  const Ctor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!Ctor) return null;
  const rec: Rec = new Ctor();
  rec.lang = navigator.language || 'en-GB';
  rec.continuous = true;
  rec.interimResults = true;
  let finalText = '';
  rec.onresult = (e: any) => {
    let interim = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i];
      if (r.isFinal) finalText += (finalText ? ' ' : '') + r[0].transcript.trim();
      else interim += r[0].transcript;
    }
    handlers.onText(finalText, interim);
  };
  rec.onerror = (e: any) => {
    const map: Record<string, string> = {
      'not-allowed': 'Microphone permission was declined. You can type your answer instead.',
      'service-not-allowed': 'Speech recognition isn’t available in this browser. You can type instead.',
      'no-speech': 'We didn’t catch anything. Try again, or type instead.',
      'network': 'Speech recognition needs a network connection in this browser. You can type instead.',
      'audio-capture': 'No microphone was found. You can type instead.',
      'aborted': '',
    };
    const msg = map[e.error] ?? 'Speech recognition stopped unexpectedly. You can try again or type.';
    if (msg) handlers.onError(msg);
  };
  rec.onend = () => handlers.onEnd();
  try { rec.start(); } catch { return null; }
  return { stop: () => { try { rec.stop(); } catch { /* */ } }, abort: () => { try { rec.abort(); } catch { /* */ } } };
}

export function speak(text: string, onDone?: () => void) {
  if (!speechSynthesisSupported()) { onDone?.(); return; }
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.95; u.pitch = 1; u.lang = 'en-GB';
    const voices = speechSynthesis.getVoices();
    const v = voices.find(v => /en-GB/i.test(v.lang) && /female|serena|kate|libby|sonia/i.test(v.name)) || voices.find(v => /^en/i.test(v.lang));
    if (v) u.voice = v;
    u.onend = () => onDone?.();
    u.onerror = () => onDone?.();
    speechSynthesis.speak(u);
  } catch { onDone?.(); }
}

export function stopSpeaking() { try { speechSynthesis.cancel(); } catch { /* */ } }
