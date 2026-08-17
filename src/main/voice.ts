import vosk from 'vosk';
import { record } from 'node-wav';
import { exec } from 'child_process';

let recognizer: any;

export function initVosk() {
  vosk.setLogLevel(-1);
  const model = new vosk.Model('./models/vosk-model-small-en-us-0.15');
  recognizer = new vosk.Recognizer({ model, sampleRate: 16000 });
}

export function startListening(): Promise<string> {
  return new Promise((resolve) => {
    // Record audio for 5 seconds
    record({
      sampleRate: 16000,
      channels: 1,
      duration: 5,
    }).then((audioData: any) => {
      const result = recognizer.acceptWaveform(audioData);
      if (result) {
        const text = recognizer.result().text;
        resolve(text);
      } else {
        resolve('');
      }
    });
  });
}

export function speakText(text: string) {
  // Free Windows TTS (no API key needed)
  exec(`powershell -Command "Add-Type -AssemblyName System.Speech; (New-Object System.Speech.Synthesis.SpeechSynthesizer).Speak('${text}')"`);
}
