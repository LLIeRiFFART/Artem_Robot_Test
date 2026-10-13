/**
 * robot3d.js — procedural 3D robot vacuum (Three.js).
 * Three.js is loaded from the CDN at runtime (see the note below).
 *
 * Exposes window.Robot3D.mount(canvas, { mode, colors }) which returns an instance
 * (or null if WebGL is unavailable). Modes:
 *   hero     — slowly rotating robot, follows the mouse
 *   anatomy  — exploded view driven by page scroll (setProgress)
 *   viewer   — product page: drag to rotate, explode slider (setExplode)
 */
/*
 * NOTE: this is a classic script (not type="module"), so it also works when the
 * site is opened straight from disk (file://). Three.js is loaded with dynamic
 * import(); bare names ("three") are resolved by the <script type="importmap">
 * that is placed in the <head> of index.html and product.html.
 * Helpers used from main.js: clamp().
 */
let THREE;
let RoomEnvironment;

const instances = [];
let loopStarted = false;
let lastTime = performance.now();

const smooth = t => t * t * (3 - 2 * t);

/* --------------------------------------------------------------------------
   Model: every group is one "layer" that moves apart in the exploded view.
   userData.by = assembled Y, userData.ex = exploded Y
   -------------------------------------------------------------------------- */
function buildRobot(c) {
  const root = new THREE.Group();
  const P = {};

  const mat = o => new THREE.MeshPhysicalMaterial(o);
  const shell  = mat({ color: c.shell, roughness: .3, metalness: .15, clearcoat: 1, clearcoatRoughness: .1 });
  const dark   = mat({ color: 0x14162b, roughness: .4, metalness: .6 });
  const glass  = mat({ color: 0x07080f, roughness: .08, metalness: .3, clearcoat: 1, clearcoatRoughness: .03 });
  const accent = mat({ color: c.accent, roughness: .35, emissive: c.accent, emissiveIntensity: .55 });
  const metal  = mat({ color: 0xc6c9d8, roughness: .25, metalness: 1 });
  const rubber = mat({ color: 0x1d1f33, roughness: .85 });
  const pcb    = mat({ color: 0x2b2377, roughness: .5, metalness: .3 });
  const bin    = mat({ color: 0x9aa6ff, roughness: .12, transparent: true, opacity: .42, clearcoat: 1 });

  const group = (name, assembledY, explodedY) => {
    const g = new THREE.Group();
    g.userData = { by: assembledY, ex: explodedY };
    g.position.y = assembledY;
    root.add(g);
    P[name] = g;
    return g;
  };
  const add = (g, geometry, material, x = 0, y = 0, z = 0) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    g.add(mesh);
    return mesh;
  };
  const Cyl = THREE.CylinderGeometry;
  const Box = THREE.BoxGeometry;

  /* shell */
  let g = group('shell', .32, 2.15);
  add(g, new Cyl(1, 1, .14, 96), shell);
  add(g, new Cyl(.8, .8, .145, 96), glass, 0, .002, 0);
  add(g, new THREE.TorusGeometry(.81, .012, 12, 128), accent, 0, .076, 0).rotation.x = Math.PI / 2;
  add(g, new THREE.TorusGeometry(.985, .065, 16, 64, Math.PI), dark, 0, -.015, 0).rotation.x = Math.PI / 2;
  add(g, new Cyl(.07, .07, .012, 32), accent, 0, .078, .55);
  add(g, new Cyl(.035, .035, .012, 24), metal, -.2, .078, .5);
  add(g, new Cyl(.035, .035, .012, 24), metal, .2, .078, .5);

  /* LiDAR turret */
  g = group('turret', .5, 3.0);
  add(g, new Cyl(.3, .3, .16, 64), dark);
  add(g, new Cyl(.306, .306, .035, 64), accent, 0, .01, 0);
  add(g, new Cyl(.24, .24, .05, 64), shell, 0, .105, 0);
  add(g, new Cyl(.06, .06, .02, 24), glass, 0, 0, .3).rotation.x = Math.PI / 2;

  /* main board */
  g = group('board', .22, 1.4);
  add(g, new Cyl(.72, .72, .03, 64), pcb);
  add(g, new THREE.TorusGeometry(.72, .01, 8, 96), accent, 0, .016, 0).rotation.x = Math.PI / 2;
  let seed = 11;
  const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  for (let i = 0; i < 9; i++) {
    const a = rnd() * Math.PI * 2;
    const r = .25 + rnd() * .38;
    add(g, new Box(.1 + rnd() * .1, .03, .1 + rnd() * .1), i % 3 ? dark : metal, Math.cos(a) * r, .03, Math.sin(a) * r);
  }
  add(g, new Box(.3, .05, .3), metal, 0, .04, 0);
  add(g, new Box(.18, .052, .18), accent, 0, .045, 0);

  /* turbine + dust bin */
  g = group('turbine', .08, .65);
  add(g, new Cyl(.3, .3, .26, 48), metal, 0, 0, .38);
  const fan = new THREE.Group();
  fan.position.set(0, .15, .38);
  g.add(fan);
  for (let i = 0; i < 10; i++) {
    const blade = new THREE.Mesh(new Box(.27, .012, .07), accent);
    blade.position.x = .15;
    blade.rotation.y = .4;
    const pivot = new THREE.Group();
    pivot.rotation.y = i / 10 * Math.PI * 2;
    pivot.add(blade);
    fan.add(pivot);
  }
  fan.add(new THREE.Mesh(new Cyl(.07, .07, .03, 24), dark));
  P.fan = fan;
  add(g, new Box(.95, .22, .5), bin, 0, 0, -.42);
  add(g, new Box(.8, .04, .4), dark, 0, -.1, -.42);

  /* battery */
  g = group('battery', .03, -.1);
  add(g, new Box(.9, .16, .52), dark, 0, 0, -.02);
  add(g, new Box(.62, .006, .1), accent, 0, .083, -.02);
  add(g, new Box(.1, .06, .05), metal, -.2, 0, .27);
  add(g, new Box(.1, .06, .05), metal, .2, 0, .27);

  /* chassis */
  g = group('chassis', 0, -.85);
  const wall = add(g, new Cyl(.98, .95, .42, 96, 1, true), dark, 0, .04, 0);
  wall.material = dark.clone();
  wall.material.side = THREE.DoubleSide;
  add(g, new Cyl(.95, .95, .04, 96), rubber, 0, -.15, 0);

  /* brushes */
  g = group('brushes', -.2, -1.45);
  const roller = new THREE.Group();
  roller.position.set(0, 0, .42);
  g.add(roller);
  const core = new THREE.Mesh(new Cyl(.085, .085, .8, 32), rubber);
  core.rotation.z = Math.PI / 2;
  roller.add(core);
  for (let i = 0; i < 6; i++) {
    const pivot = new THREE.Group();
    pivot.rotation.x = i / 6 * Math.PI * 2;
    const fin = new THREE.Mesh(new Box(.78, .07, .012), accent);
    fin.position.y = .115;
    pivot.add(fin);
    roller.add(pivot);
  }
  P.roller = roller;

  const side = new THREE.Group();
  side.position.set(.62, 0, .66);
  g.add(side);
  side.add(new THREE.Mesh(new Cyl(.06, .06, .05, 24), accent));
  for (let i = 0; i < 3; i++) {
    const pivot = new THREE.Group();
    pivot.rotation.y = i / 3 * Math.PI * 2;
    const arm = new THREE.Mesh(new Box(.3, .012, .035), dark);
    arm.position.x = .17;
    const tip = new THREE.Mesh(new THREE.SphereGeometry(.045, 12, 12), accent);
    tip.position.x = .33;
    pivot.add(arm, tip);
    side.add(pivot);
  }
  P.side = side;

  /* drive wheels */
  g = group('drive', -.12, -2.1);
  const makeWheel = sign => {
    const w = new THREE.Group();
    const tyre = new THREE.Mesh(new Cyl(.24, .24, .14, 48), rubber);
    tyre.rotation.z = Math.PI / 2;
    const hub = new THREE.Mesh(new Cyl(.12, .12, .16, 32), metal);
    hub.rotation.z = Math.PI / 2;
    w.add(tyre, hub);
    w.position.set(sign * .93, 0, -.05);
    g.add(w);
    return w;
  };
  P.wheelL = makeWheel(-1);
  P.wheelR = makeWheel(1);
  add(g, new THREE.SphereGeometry(.09, 24, 24), metal, 0, -.03, .68);

  return { root, P };
}

/* --------------------------------------------------------------------------
   Scene mounting
   -------------------------------------------------------------------------- */
function mount(canvas, { mode, colors }) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    if (!renderer.getContext()) return null;
  } catch (err) {
    return null;                       // WebGL unavailable → SVG fallback stays visible
  }

  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
  keyLight.position.set(3, 6, 4);
  const rimLight = new THREE.DirectionalLight(0xa48bff, 2.2);
  rimLight.position.set(-4, 2, -4);
  scene.add(keyLight, rimLight, new THREE.AmbientLight(0xffffff, .2));

  const { root, P } = buildRobot(colors);
  const rig = new THREE.Group();
  rig.add(root);
  scene.add(rig);

  const camera = new THREE.PerspectiveCamera(32, 1, .1, 100);
  const S = { p: 0, pt: 0, stage: 0, ex: 0, ext: 0, mx: 0, my: 0, tmx: 0, tmy: 0, focus: .2, dist: 7, dragging: false, lastX: 0 };
  const layers = ['shell', 'turret', 'board', 'turbine', 'battery', 'chassis', 'brushes', 'drive'].map(k => P[k]);

  let w = 1, h = 1;
  const resize = () => {
    w = canvas.clientWidth || 1;
    h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  resize();

  const inst = {
    visible: false,

    setProgress(p, stage) { S.pt = p; S.stage = stage; },
    setExplode(v) { S.ext = v; },

    frame(time, dt) {
      S.mx += (S.tmx - S.mx) * Math.min(1, dt * 4);
      S.my += (S.tmy - S.my) * Math.min(1, dt * 4);

      // spinning parts
      P.fan.rotation.y -= dt * (5 + S.ex * 10);
      P.roller.rotation.x -= dt * 4;
      P.side.rotation.y += dt * 5;

      let explode = 0;

      if (mode === 'hero') {
        rig.rotation.y += dt * .38;
        rig.rotation.x = S.my * .14;
        rig.rotation.z = -S.mx * .08;
        root.position.y = Math.sin(time * 1.4) * .05;
        camera.position.set(0, 2.9, 5.7);
        camera.lookAt(0, -.05, 0);

      } else if (mode === 'anatomy') {
        S.p += (S.pt - S.p) * Math.min(1, dt * 5);
        const p = S.p;
        explode = smooth(clamp((p - .05) / .13, 0, 1)) * (1 - smooth(clamp((p - .84) / .13, 0, 1)));
        S.ex = explode;
        rig.rotation.y = -.5 + p * Math.PI * 2.6;
        rig.rotation.x = 0;
        rig.rotation.z = 0;

        const focusNames = ['all', 'turret', 'board', 'turbine', 'battery', 'brushes', 'all'];
        const target = focusNames[S.stage];
        const portrait = w / h < .95;
        let ty = .2 + explode * .45;
        let dist = (portrait ? 9 : 7.2) + explode * (portrait ? 5.2 : 3.2);
        if (target !== 'all') {
          ty = P[target].position.y;
          dist = portrait ? 8.4 : 6.0;
        }
        S.focus += (ty - S.focus) * Math.min(1, dt * 3.2);
        S.dist += (dist - S.dist) * Math.min(1, dt * 3.2);
        camera.position.set(0, S.focus + S.dist * .36, S.dist);
        camera.lookAt(0, S.focus, 0);

        // slightly enlarge the layer that is being described
        layers.forEach(layer => {
          const active = target !== 'all' && (P[target] === layer || (target === 'brushes' && layer === P.drive));
          const s = active ? 1.05 : 1;
          layer.scale.setScalar(layer.scale.x + (s - layer.scale.x) * Math.min(1, dt * 5));
        });

      } else {   // viewer
        S.ex += (S.ext - S.ex) * Math.min(1, dt * 4);
        explode = S.ex;
        if (!S.dragging) rig.rotation.y += dt * .35;
        rig.rotation.x = 0;
        rig.rotation.z = 0;
        const portrait = w / h < .95;
        const dist = (portrait ? 7.4 : 6.2) + explode * 5;
        const fy = .15 + explode * .5;
        camera.position.set(0, fy + dist * .42, dist);
        camera.lookAt(0, fy, 0);
      }

      layers.forEach(layer => {
        const u = layer.userData;
        layer.position.y = u.by + (u.ex - u.by) * explode;
      });
      P.wheelL.position.x = -(.93 + .45 * explode);
      P.wheelR.position.x = .93 + .45 * explode;

      renderer.render(scene, camera);
    },

    dispose() {
      const i = instances.indexOf(inst);
      if (i > -1) instances.splice(i, 1);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      canvas.removeEventListener('pointerdown', onDown);
      removeEventListener('pointermove', onMove);
      removeEventListener('pointerup', onUp);
      removeEventListener('mousemove', onMouse);
      scene.traverse(o => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose());
      });
      if (scene.environment) scene.environment.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    }
  };

  // render only while the canvas is on screen
  const visibilityObserver = new IntersectionObserver(entries => { inst.visible = entries[0].isIntersecting; }, { threshold: 0 });
  visibilityObserver.observe(canvas);

  const onMouse = e => { S.tmx = (e.clientX / innerWidth - .5) * 2; S.tmy = (e.clientY / innerHeight - .5) * 2; };
  const onDown = e => { S.dragging = true; S.lastX = e.clientX; if (canvas.setPointerCapture) canvas.setPointerCapture(e.pointerId); };
  const onMove = e => { if (!S.dragging) return; rig.rotation.y += (e.clientX - S.lastX) * .012; S.lastX = e.clientX; };
  const onUp = () => { S.dragging = false; };

  if (mode === 'hero') addEventListener('mousemove', onMouse, { passive: true });
  if (mode === 'viewer') {
    canvas.addEventListener('pointerdown', onDown);
    addEventListener('pointermove', onMove);
    addEventListener('pointerup', onUp);
  }

  instances.push(inst);
  if (!loopStarted) { loopStarted = true; requestAnimationFrame(loop); }
  return inst;
}

function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(.05, (now - lastTime) / 1000);
  lastTime = now;
  if (document.hidden) return;
  for (const inst of instances) if (inst.visible) inst.frame(now / 1000, dt);
}

// Load Three.js, then announce that window.Robot3D is ready.
// If loading fails (offline, blocked CDN) the static SVG robot simply stays visible.
(async function loadThree() {
  try {
    THREE = await import('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js');
    ({ RoomEnvironment } = await import('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/environments/RoomEnvironment.js'));
    window.Robot3D = { mount };
    window.dispatchEvent(new Event('robot3d'));
  } catch (err) {
    console.error('Lunevo 3D: could not load Three.js', err);
  }
})();
