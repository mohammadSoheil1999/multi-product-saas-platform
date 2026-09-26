export const playClickSound = () => {
  const audio = new Audio('../../barber_sound.mp3'); // path from public folder
  audio.volume = 0.5; // optional, adjust volume 0 to 1
  audio.play();
};