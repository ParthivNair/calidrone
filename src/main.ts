import './styles.css';

// ── Sticky nav shadow + viewer dock on scroll ────────────────
const nav = document.getElementById('nav')!;
const viewerWrap = document.getElementById('viewer-wrap')!;

function onScroll() {
  nav.style.boxShadow = window.scrollY > 10
    ? '0 1px 24px rgba(0,0,0,0.5)'
    : 'none';

  const dockThreshold = window.innerHeight * 0.2;
  viewerWrap.classList.toggle('docked', window.scrollY > dockThreshold);
}
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// ── 3D Viewer ─────────────────────────────────────────────────
const canvas = document.getElementById('drone-canvas') as HTMLCanvasElement;
const loaderOverlay = document.getElementById('loader-overlay')!;
const loaderFill = document.getElementById('loader-fill')!;
const loaderLabel = document.getElementById('loader-label')!;

function onProgress(pct: number) {
  loaderFill.style.width = `${pct}%`;
  loaderLabel.textContent = `Loading model… ${pct}%`;
}

function onLoaded() {
  loaderOverlay.classList.add('hidden');
  setTimeout(() => { loaderOverlay.style.display = 'none'; }, 600);
}

// Dynamic import keeps Three.js out of the critical parse path
import('./viewer').then(({ initViewer }) => {
  initViewer(canvas, onProgress, onLoaded);
});
