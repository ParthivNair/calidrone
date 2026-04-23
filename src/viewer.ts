import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function initViewer(
  canvas: HTMLCanvasElement,
  onProgress: (pct: number) => void,
  onLoaded: () => void,
): () => void {
  // ── Renderer ──────────────────────────────────────────────
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  // ── Scene ─────────────────────────────────────────────────
  const scene = new THREE.Scene();

  // ── Camera ────────────────────────────────────────────────
  const camera = new THREE.PerspectiveCamera(40, 1, 0.01, 1000);
  camera.position.set(0, 0.5, 3);

  // ── Lighting ──────────────────────────────────────────────
  const hemi = new THREE.HemisphereLight(0xb0c8ff, 0x181820, 1.2);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xffffff, 2.5);
  key.position.set(3, 5, 3);
  scene.add(key);

  const rim = new THREE.DirectionalLight(0x4a9eff, 1.0);
  rim.position.set(-3, 2, -4);
  scene.add(rim);

  const fill = new THREE.DirectionalLight(0xffffff, 0.5);
  fill.position.set(0, -3, 2);
  scene.add(fill);

  // ── Controls ──────────────────────────────────────────────
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.minDistance = 0.5;
  controls.maxDistance = 10;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 1.2;

  // ── Render-on-demand ──────────────────────────────────────
  let renderPending = false;
  let idleFrames = 0;
  const IDLE_THRESHOLD = 120;

  function requestRender() {
    idleFrames = 0;
    if (!renderPending) {
      renderPending = true;
      requestAnimationFrame(renderLoop);
    }
  }

  function renderLoop() {
    controls.update();

    const moving = controls.autoRotate || idleFrames < IDLE_THRESHOLD;
    if (!moving) {
      renderPending = false;
      return;
    }

    idleFrames++;
    renderer.render(scene, camera);
    requestAnimationFrame(renderLoop);
  }

  controls.addEventListener('start', () => {
    idleFrames = 0;
    controls.autoRotate = false;
  });
  controls.addEventListener('change', requestRender);

  // ── Resize ────────────────────────────────────────────────
  const ro = new ResizeObserver(() => {
    const w = canvas.parentElement!.clientWidth;
    const h = canvas.parentElement!.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    requestRender();
  });
  ro.observe(canvas.parentElement!);

  // ── Loader ────────────────────────────────────────────────
  const draco = new DRACOLoader();
  draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
  draco.preload();

  const loader = new GLTFLoader();
  loader.setDRACOLoader(draco);

  loader.load(
    '/models/drone5.glb',
    (gltf) => {
      const model = gltf.scene;

      // Compute local bounding box before any transform
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 2 / maxDim;

      // Offset model so its geometry center sits at pivot origin
      model.position.copy(center).negate();

      // Pivot handles uniform scale + display rotation, anchored at world origin
      const pivot = new THREE.Group();
      pivot.scale.setScalar(scale);
      pivot.rotation.x = Math.PI / 2;   // bring drone upright (side-on) instead of top-down
      pivot.add(model);
      scene.add(pivot);

      // Camera near eye-level for a side-on hero perspective
      camera.position.set(0, 0.15, 3.4);
      controls.target.set(0, 0, 0);
      controls.update();

      onLoaded();
      requestRender();
    },
    (event) => {
      if (event.total > 0) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    },
    (err) => {
      console.error('GLTFLoader error:', err);
    },
  );

  // Kick off the loop (auto-rotate starts before model arrives so canvas isn't blank)
  requestRender();

  // ── Cleanup ───────────────────────────────────────────────
  return () => {
    ro.disconnect();
    controls.dispose();
    renderer.dispose();
    draco.dispose();
  };
}
