export function playScanBeep(times = 1) {
  if (typeof window === "undefined") return;

  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) return;

  const count = Math.max(1, Number(times) || 1);
  const audioContext = new AudioCtor();
  const beepDuration = 0.12;
  const gap = 0.1;
  const lastStop = audioContext.currentTime + count * (beepDuration + gap);

  for (let index = 0; index < count; index += 1) {
    const start = audioContext.currentTime + index * (beepDuration + gap);
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = "square";
    oscillator.frequency.value = count > 1 ? 420 : 880;

    gainNode.gain.setValueAtTime(0.0001, start);
    gainNode.gain.exponentialRampToValueAtTime(0.12, start + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, start + beepDuration);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start(start);
    oscillator.stop(start + beepDuration);
  }

  window.setTimeout(
    () => {
      audioContext.close().catch(() => {});
    },
    Math.ceil((lastStop - audioContext.currentTime) * 1000) + 50,
  );
}

export function playUnauthorizedBeep() {
  playScanBeep(3);
}
