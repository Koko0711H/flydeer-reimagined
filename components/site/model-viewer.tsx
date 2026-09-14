'use client';
import { useEffect, useRef, useState, type RefObject } from 'react';
import { useLanguage } from './provider';
import { Film } from './media';

export default function ModelViewer({
  id,
  onClose,
  presentation,
}: {
  id: string;
  onClose: () => void;
  presentation?: RefObject<number>;
}) {
  const mount = useRef<HTMLDivElement>(null);
  const reset = useRef<() => void>(() => {});
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [rotating, setRotating] = useState(false);
  const rotation = useRef(false);
  const { lang } = useLanguage();
  const enclosure = id === 'silent' || id === 'container';
  useEffect(() => {
    rotation.current = rotating;
  }, [rotating]);
  useEffect(() => {
    let disposed = false;
    let cleaned = false;
    const releases: Array<() => void> = [];
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      reset.current = () => {};
      for (const release of releases.reverse()) {
        try {
          release();
        } catch {
          /* Continue releasing independent resources. */
        }
      }
    };
    Promise.all([
      import('three'),
      import('three/addons/loaders/GLTFLoader.js'),
      import('three/addons/loaders/DRACOLoader.js'),
      import('three/addons/controls/OrbitControls.js'),
      import('three/addons/environments/RoomEnvironment.js'),
    ])
      .then(
        async ([
          THREE,
          { GLTFLoader },
          { DRACOLoader },
          { OrbitControls },
          { RoomEnvironment },
        ]) => {
          const container = mount.current;
          if (disposed || !container) return;
          setState('loading');
          let renderer: InstanceType<typeof THREE.WebGLRenderer>;
          try {
            renderer = new THREE.WebGLRenderer({
              antialias: true,
              alpha: true,
            });
          } catch {
            setState('error');
            return;
          }
          releases.push(() => {
            renderer.dispose();
            renderer.domElement.remove();
          });
          renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
          renderer.outputColorSpace = THREE.SRGBColorSpace;
          const refinedGenerator =
            id === 'open-frame-small' || id === 'silent' || id === 'container';
          renderer.toneMapping = refinedGenerator
            ? THREE.NeutralToneMapping
            : THREE.ACESFilmicToneMapping;
          renderer.toneMappingExposure = refinedGenerator ? 1 : 1.5;
          container.appendChild(renderer.domElement);
          const scene = new THREE.Scene();
          const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 1000);
          // GLB is Y-up. The supplied enclosures expose their detailed long
          // side at +X; their reference ends face -Z (silent) and +Z (container).
          const initialView = new THREE.Vector3(
            id === 'silent' || id === 'container' ? 5 : 4,
            2.7,
            id === 'open-frame-small' || id === 'silent' ? -5 : 5,
          );
          camera.position.copy(initialView);
          const controls = new OrbitControls(camera, renderer.domElement);
          releases.push(() => controls.dispose());
          controls.enableDamping = true;
          controls.dampingFactor = 0.07;
          controls.enablePan = false;
          controls.enableZoom = false;
          controls.maxPolarAngle = Math.PI * 0.49;
          controls.minPolarAngle = Math.PI * 0.1;
          controls.autoRotateSpeed = 0.65;
          controls.enabled = !presentation;
          renderer.domElement.setAttribute(
            'aria-label',
            lang === 'zh'
              ? '发电机组三维模型；可拖动旋转，也可使用左右方向键。'
              : '3D generator model. Drag or use left and right arrow keys to rotate.',
          );
          renderer.domElement.setAttribute('role', 'img');
          renderer.domElement.tabIndex = presentation ? -1 : 0;
          if (presentation)
            renderer.domElement.setAttribute(
              'aria-label',
              lang === 'zh'
                ? '随页面滚动旋转的发电机组三维模型'
                : 'A generator model turning with page scroll',
            );
          const pmrem = new THREE.PMREMGenerator(renderer);
          releases.push(() => pmrem.dispose());
          const room = new RoomEnvironment();
          releases.push(() => room.dispose());
          const environment = pmrem.fromScene(room, 0.04);
          releases.push(() => environment.dispose());
          scene.environment = environment.texture;
          scene.add(
            new THREE.HemisphereLight(
              0xf5f5f7,
              0x626268,
              refinedGenerator ? 1.2 : 3,
            ),
          );
          const key = new THREE.DirectionalLight(
            0xffffff,
            refinedGenerator ? 2 : 3,
          );
          key.position.set(4, 8, 5);
          scene.add(key);
          const draco = new DRACOLoader();
          releases.push(() => draco.dispose());
          draco.setDecoderPath('/media/draco/');
          const loader = new GLTFLoader();
          loader.setDRACOLoader(draco);
          let object: InstanceType<typeof THREE.Group> | null = null;
          let modelGroup: InstanceType<typeof THREE.Group> | null = null;
          let modelRadius = 0;
          const fitCamera = () => {
            if (!modelRadius) return;
            const verticalHalfFov = THREE.MathUtils.degToRad(camera.fov / 2);
            const halfFov = Math.min(
              verticalHalfFov,
              Math.atan(Math.tan(verticalHalfFov) * camera.aspect),
            );
            // Fit the bounding sphere, so every rotation stays inside the
            // canvas, including portrait displays and after a resize.
            const distance = modelRadius / Math.sin(halfFov) / 0.9;
            camera.position.setLength(
              Math.max(
                presentation ? camera.position.length() : initialView.length(),
                distance,
              ),
            );
          };
          let visible = true;
          let frame = 0;
          releases.push(() => cancelAnimationFrame(frame));
          const reduce = matchMedia('(prefers-reduced-motion: reduce)');
          const draw = () => {
            if (disposed || cleaned) return;
            frame = requestAnimationFrame(draw);
            if (!visible || document.hidden) return;
            controls.autoRotate = rotation.current && !reduce.matches;
            if (presentation && modelGroup) {
              const phase = reduce.matches ? 0.25 : presentation.current;
              modelGroup.rotation.y = -0.75 + phase * Math.PI * 1.15;
              modelGroup.rotation.z = Math.sin(phase * Math.PI * 2) * 0.025;
              const radius = 6.6 - Math.sin(phase * Math.PI) * 1.25;
              camera.position.set(
                radius * 0.58,
                2.5 + Math.sin(phase * Math.PI) * 0.65,
                radius * 0.8,
              );
              fitCamera();
              camera.lookAt(0, 0, 0);
            } else controls.update();
            renderer.render(scene, camera);
          };
          const size = () => {
            if (disposed || cleaned) return;
            const w = container.clientWidth,
              h = container.clientHeight;
            if (w && h) {
              renderer.setSize(w, h);
              camera.aspect = w / h;
              camera.updateProjectionMatrix();
              fitCamera();
            }
          };
          const observer = new ResizeObserver(size);
          releases.push(() => observer.disconnect());
          observer.observe(container);
          const visibility = new IntersectionObserver(([entry]) => {
            visible = entry.isIntersecting;
          });
          releases.push(() => visibility.disconnect());
          visibility.observe(container);
          const disposeObject = (target: InstanceType<typeof THREE.Group>) => {
            target.traverse((node) => {
              if (node instanceof THREE.Mesh) {
                node.geometry.dispose();
                const materials = Array.isArray(node.material)
                  ? node.material
                  : [node.material];
                materials.forEach((material) => {
                  Object.values(material).forEach((value) => {
                    if (value instanceof THREE.Texture) value.dispose();
                  });
                  material.dispose();
                });
              }
            });
          };
          releases.push(() => {
            if (object) disposeObject(object);
          });
          const keys = (event: KeyboardEvent) => {
            if (presentation) return;
            if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
              event.preventDefault();
              rotation.current = false;
              setRotating(false);
              const angle = event.key === 'ArrowLeft' ? -0.18 : 0.18;
              camera.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
              controls.update();
            }
          };
          renderer.domElement.addEventListener('keydown', keys);
          releases.push(() =>
            renderer.domElement.removeEventListener('keydown', keys),
          );
          const lost = (event: Event) => {
            event.preventDefault();
            if (!disposed) {
              cleanup();
              setState('error');
            }
          };
          renderer.domElement.addEventListener('webglcontextlost', lost);
          releases.push(() =>
            renderer.domElement.removeEventListener('webglcontextlost', lost),
          );
          size();
          draw();
          try {
            const gltf = await loader.loadAsync(`/media/models/${id}.glb`);
            if (disposed || cleaned) {
              disposeObject(gltf.scene);
              return;
            }
            object = gltf.scene;
            const bounds = new THREE.Box3().setFromObject(object);
            const center = bounds.getCenter(new THREE.Vector3());
            const dimensions = bounds.getSize(new THREE.Vector3());
            const longest = Math.max(dimensions.x, dimensions.y, dimensions.z);
            if (!Number.isFinite(longest) || longest <= 0)
              throw new Error('The model has no visible geometry.');
            const scale = 4 / longest;
            object.position.sub(center);
            const group = new THREE.Group();
            modelGroup = group;
            group.add(object);
            group.scale.setScalar(scale);
            scene.add(group);
            modelRadius = (dimensions.length() * scale) / 2;
            camera.position.copy(initialView);
            fitCamera();
            controls.target.set(0, 0, 0);
            controls.update();
            reset.current = () => {
              rotation.current = false;
              controls.autoRotate = false;
              const damping = controls.enableDamping;
              controls.enableDamping = false;
              controls.update();
              camera.position.copy(initialView);
              fitCamera();
              controls.target.set(0, 0, 0);
              controls.update();
              controls.enableDamping = damping;
              setRotating(false);
            };
            setState('ready');
          } catch {
            if (!disposed) {
              cleanup();
              setState('error');
            }
          }
        },
      )
      .catch(() => {
        cleanup();
        if (!disposed) setState('error');
      });
    return () => {
      disposed = true;
      cleanup();
    };
  }, [id, lang, presentation]);
  return (
    <>
      {presentation && state !== 'ready' ? (
        enclosure ? (
          <img
            src={`/media/story/${id}/poster.webp`}
            className="journey-fallback"
            alt={
              lang === 'zh'
                ? '所选发电机组外观'
                : 'Selected generator appearance'
            }
          />
        ) : (
          <Film
            src={`/media/products/${id}.mp4`}
            className="journey-fallback"
            controls={state === 'error'}
          />
        )
      ) : null}
      <div
        ref={mount}
        className={`model-canvas ${presentation ? 'presentation-canvas' : ''}`}
        data-model-state={state}
      />
      {state === 'loading' ? (
        <output
          className={`model-status ${presentation ? 'presentation-status' : ''}`}
        >
          {lang === 'zh'
            ? '正在加载产品三维模型…'
            : 'Loading the product 3D model…'}
        </output>
      ) : null}
      {state === 'error' && !presentation ? (
        <div className="model-error" role="alert">
          <p>
            {lang === 'zh'
              ? '此设备暂时无法显示三维模型，您仍可查看所选产品的外观预览。'
              : 'This device could not display the 3D model. You can still view the selected product preview.'}
          </p>
          <button className="pill primary" onClick={onClose}>
            {lang === 'zh' ? '返回产品预览' : 'Back to product preview'}
          </button>
        </div>
      ) : null}
      {state === 'ready' && !presentation ? (
        <div className="model-controls">
          <span>
            {lang === 'zh'
              ? '拖动或方向键旋转 · 滚动继续浏览页面'
              : 'Drag or use arrow keys · Scroll to continue'}
          </span>
          <div>
            <button
              onClick={() => setRotating(!rotating)}
              aria-pressed={rotating}
            >
              {rotating
                ? lang === 'zh'
                  ? '暂停旋转'
                  : 'Pause rotation'
                : lang === 'zh'
                  ? '自动旋转'
                  : 'Auto-rotate'}
            </button>
            <button onClick={() => reset.current()}>
              {lang === 'zh' ? '重置视角' : 'Reset view'}
            </button>
            <button onClick={onClose}>
              {lang === 'zh' ? '外观预览' : 'Preview'}
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
