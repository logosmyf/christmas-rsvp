const envelopeTrack = document.querySelector('.envelope-scroll');
const envelope = envelopeTrack.querySelector('.envelope');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const clamp = (value) => Math.min(1, Math.max(0, value));
let frame = 0;

function updateEnvelope() {
  frame = 0;
  const stage = envelopeTrack.firstElementChild;
  const distance = envelopeTrack.offsetHeight - stage.offsetHeight;
  const progress = clamp(-envelopeTrack.getBoundingClientRect().top / Math.max(1, distance));
  const flap = clamp((progress - .15) / .2);
  const letter = clamp((progress - .35) / .4);

  envelope.style.setProperty('--flap', `${175 * flap}deg`);
  envelope.style.setProperty('--flap-layer', flap < .52 ? '4' : '1');
  envelope.style.setProperty('--letter', `${-72 * letter}%`);
  envelope.style.setProperty('--seal', String(1 - clamp((progress - .12) / .16)));
}

function queueEnvelopeFrame() {
  if (envelopeTrack.classList.contains('is-animated') && !frame) frame = requestAnimationFrame(updateEnvelope);
}

function updateMotionPreference() {
  envelopeTrack.classList.toggle('is-animated', !reducedMotion.matches && CSS.supports('position', 'sticky'));
  queueEnvelopeFrame();
}

addEventListener('scroll', queueEnvelopeFrame, { passive: true });
addEventListener('resize', queueEnvelopeFrame);
reducedMotion.addEventListener?.('change', updateMotionPreference);
updateMotionPreference();

if ('IntersectionObserver' in window) {
  const snow = document.querySelector('.snow');
  new IntersectionObserver(([entry]) => {
    snow.classList.toggle('paused', !entry.isIntersecting);
  }).observe(document.querySelector('.hero'));
}
