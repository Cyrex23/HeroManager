import { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import * as THREE from 'three';

/** Creates a soft radial-gradient circle canvas texture for round particles */
function makeSoftCircle(): THREE.CanvasTexture {
  const s = 64;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = s;
  const ctx = canvas.getContext('2d')!;
  const grd = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  grd.addColorStop(0,    'rgba(255,255,255,1)');
  grd.addColorStop(0.35, 'rgba(255,255,255,0.85)');
  grd.addColorStop(0.65, 'rgba(255,255,255,0.35)');
  grd.addColorStop(1,    'rgba(255,255,255,0)');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, s, s);
  return new THREE.CanvasTexture(canvas);
}

/**
 * Rising crimson fire-energy particles.
 * Each particle oscillates sinusoidally around its spawn column (fire flicker),
 * rises upward, and resets at the bottom when it exits the top.
 */
function EmberField() {
  const ref = useRef<THREE.Points>(null!);
  const count = 420;

  const { positions, speeds, initX, phases } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const speeds    = new Float32Array(count);
    const initX     = new Float32Array(count);
    const phases    = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 36;
      positions[i * 3]     = x;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 22;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 14;
      speeds[i]  = 0.005 + Math.random() * 0.013;
      initX[i]   = x;
      phases[i]  = Math.random() * Math.PI * 2;
    }
    return { positions, speeds, initX, phases };
  }, []);

  const tex = useMemo(makeSoftCircle, []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const attr = ref.current.geometry.getAttribute('position') as THREE.BufferAttribute;
    const arr  = attr.array as Float32Array;
    const t    = clock.getElapsedTime();
    for (let i = 0; i < count; i++) {
      // Sinusoidal flicker around the column (fire-like sway)
      arr[i * 3]     = initX[i] + Math.sin(t * 0.85 + phases[i]) * 0.75;
      arr[i * 3 + 1] += speeds[i];
      if (arr[i * 3 + 1] > 11) {
        arr[i * 3 + 1] = -11;
        const nx = (Math.random() - 0.5) * 36;
        initX[i] = nx;
        arr[i * 3] = nx;
        phases[i]  = Math.random() * Math.PI * 2;
      }
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.28}
        color="#ff5533"
        transparent
        opacity={0.72}
        sizeAttenuation
        map={tex}
        alphaMap={tex}
        depthWrite={false}
      />
    </points>
  );
}

/** Slower gold ember sparks */
function GoldEmbers() {
  const ref = useRef<THREE.Points>(null!);
  const count = 190;

  const { positions, speeds, initX, phases } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const speeds    = new Float32Array(count);
    const initX     = new Float32Array(count);
    const phases    = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 30;
      positions[i * 3]     = x;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8;
      speeds[i]  = 0.003 + Math.random() * 0.007;
      initX[i]   = x;
      phases[i]  = Math.random() * Math.PI * 2;
    }
    return { positions, speeds, initX, phases };
  }, []);

  const tex = useMemo(makeSoftCircle, []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const attr = ref.current.geometry.getAttribute('position') as THREE.BufferAttribute;
    const arr  = attr.array as Float32Array;
    const t    = clock.getElapsedTime();
    for (let i = 0; i < count; i++) {
      arr[i * 3]     = initX[i] + Math.sin(t * 0.6 + phases[i]) * 0.55;
      arr[i * 3 + 1] += speeds[i];
      if (arr[i * 3 + 1] > 10) {
        arr[i * 3 + 1] = -10;
        const nx = (Math.random() - 0.5) * 30;
        initX[i] = nx;
        arr[i * 3] = nx;
        phases[i]  = Math.random() * Math.PI * 2;
      }
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.22}
        color="#fbbf24"
        transparent
        opacity={0.55}
        sizeAttenuation
        map={tex}
        alphaMap={tex}
        depthWrite={false}
      />
    </points>
  );
}

/** Large atmospheric orb that bobs in a gentle sine arc */
function FloatingOrb({ color, size, x, y, z, speed, phase }: {
  color: string; size: number; x: number; y: number; z: number; speed: number; phase: number;
}) {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    ref.current.position.y = y + Math.sin(t * speed + phase) * 1.3;
    ref.current.position.x = x + Math.cos(t * speed * 0.65 + phase) * 0.8;
  });
  return (
    <mesh ref={ref} position={[x, y, z]}>
      <sphereGeometry args={[size, 8, 8]} />
      <meshBasicMaterial color={color} transparent opacity={0.045} />
    </mesh>
  );
}

function Scene() {
  return (
    <>
      <EmberField />
      <GoldEmbers />
      {/* Purple energy wisps */}
      <Sparkles count={80}  size={4}   scale={[34, 24, 10]} color="#a78bfa" speed={0.28} opacity={0.38} />
      {/* Crimson energy traces */}
      <Sparkles count={55}  size={3}   scale={[28, 18,  8]} color="#e94560" speed={0.22} opacity={0.32} />
      {/* Atmospheric glow orbs */}
      <FloatingOrb color="#e94560" size={3}   x={-6} y={1}  z={-5} speed={0.28} phase={0} />
      <FloatingOrb color="#a78bfa" size={2.5} x={5}  y={-1} z={-4} speed={0.35} phase={2} />
      <FloatingOrb color="#fbbf24" size={2}   x={0}  y={2}  z={-6} speed={0.22} phase={4} />
    </>
  );
}

function FallbackBackground() {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
      background:
        'radial-gradient(ellipse at 20% 30%, rgba(233,69,96,0.14) 0%, transparent 55%),' +
        'radial-gradient(ellipse at 80% 70%, rgba(167,139,250,0.09) 0%, transparent 55%),' +
        'radial-gradient(ellipse at 50% 110%, rgba(251,191,36,0.06) 0%, transparent 40%),' +
        '#07041a',
    }} />
  );
}

export default function ParticleBackground() {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
      <Suspense fallback={<FallbackBackground />}>
        <Canvas
          camera={{ position: [0, 0, 6], fov: 65 }}
          dpr={[1, 1.5]}
          gl={{ antialias: false, powerPreference: 'default', alpha: false }}
          style={{ background: '#07041a' }}
        >
          <ambientLight intensity={0.02} />
          <Scene />
        </Canvas>
      </Suspense>
    </div>
  );
}
