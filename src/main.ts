import './styles.css';

// ── Sticky nav shadow on scroll ───────────────────────────────
const nav = document.getElementById('nav')!;
window.addEventListener('scroll', () => {
  nav.style.boxShadow = window.scrollY > 10
    ? '0 1px 24px rgba(0,0,0,0.5)'
    : 'none';
}, { passive: true });

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
