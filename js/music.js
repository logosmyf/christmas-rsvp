const musicPlayer = document.getElementById('music-player');
const musicDisc = document.querySelector('.music-disc');
const musicIcon = musicDisc.querySelector('span');

let musicPlaying = false;
let musicRequested = false;

function updateMusicDisc(playing, loading = false) {
  musicPlaying = playing;
  const label = playing ? '暂停背景音乐' : loading ? '正在载入背景音乐' : '播放背景音乐';
  musicDisc.setAttribute('aria-label', label);
  musicDisc.title = label;
  musicDisc.classList.toggle('is-playing', playing);
  musicDisc.classList.toggle('is-loading', loading);
  musicIcon.textContent = playing ? 'Ⅱ' : loading ? '…' : '▶';
}

function playMusic() {
  updateMusicDisc(false, true);
  musicPlayer.play()?.catch(() => {
    if (!musicPlaying && musicPlayer.paused) updateMusicDisc(false);
  });
}

musicPlayer.addEventListener('playing', () => updateMusicDisc(true));
for (const event of ['pause', 'ended', 'error']) {
  musicPlayer.addEventListener(event, () => updateMusicDisc(false));
}

musicDisc.addEventListener('click', () => {
  musicRequested = true;
  if (musicPlaying) {
    musicPlayer.pause();
  } else {
    // A tap can authorize a pending or blocked autoplay request on iOS.
    playMusic();
  }
});

document.addEventListener('click', (event) => {
  if (musicRequested || musicDisc.contains(event.target)) return;
  musicRequested = true;
  if (!musicPlaying) playMusic();
}, { capture: true });

musicPlayer.closest('.music').hidden = true;
musicDisc.hidden = false;

function autoplayMusic() {
  if (!musicRequested) playMusic();
}

if (document.readyState === 'complete') {
  autoplayMusic();
} else {
  window.addEventListener('load', autoplayMusic, { once: true });
}
