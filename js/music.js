const musicPlayer = document.getElementById('music-player');
const musicDisc = document.querySelector('.music-disc');
const musicIcon = musicDisc.querySelector('span');

function updateMusicDisc() {
  const playing = !musicPlayer.paused && !musicPlayer.ended && !musicPlayer.error;
  const label = playing ? '暂停背景音乐' : '播放背景音乐';
  musicDisc.setAttribute('aria-label', label);
  musicDisc.title = label;
  musicDisc.classList.toggle('is-playing', playing);
  musicIcon.textContent = playing ? 'Ⅱ' : '▶';
}

function playMusic() {
  // Autoplay with sound can be denied until a guest taps the disc.
  musicPlayer.play().catch(updateMusicDisc);
}

for (const event of ['play', 'pause', 'ended', 'error']) {
  musicPlayer.addEventListener(event, updateMusicDisc);
}

let musicChoiceMade = false;
musicDisc.addEventListener('click', () => {
  musicChoiceMade = true;
  if (musicPlayer.paused) {
    playMusic();
  } else {
    musicPlayer.pause();
  }
});

musicPlayer.closest('.music').hidden = true;
musicDisc.hidden = false;
updateMusicDisc();

function autoplayMusic() {
  if (!musicChoiceMade) playMusic();
}

if (document.readyState === 'complete') {
  autoplayMusic();
} else {
  window.addEventListener('load', autoplayMusic, { once: true });
}
