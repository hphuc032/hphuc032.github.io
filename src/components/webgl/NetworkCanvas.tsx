"use client";

import { createRoot, extend, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import { Color, Vector3, WebGLRenderer, Group, Mesh, LineSegments, LineBasicMaterial, Points, PointsMaterial, BufferGeometry, BufferAttribute, SphereGeometry, MeshBasicMaterial } from "three";
import { network, mobileNetwork, nodeColor } from "@/lib/network-topology";
import { skillPoints, type SphereController } from "@/lib/skill-sphere";

type Props = { active: boolean; paused: boolean; mobile: boolean; controllerRef: RefObject<SphereController>; onReady: (ready: boolean) => void; onFailure: () => void };
extend({ Group, Mesh, LineSegments, LineBasicMaterial, Points, PointsMaterial, BufferGeometry, BufferAttribute, SphereGeometry, MeshBasicMaterial });
// R3F disposes the renderer. An already-lost context needs no second loss.
class NetworkRenderer extends WebGLRenderer {
  constructor(...args: ConstructorParameters<typeof WebGLRenderer>) {
    super(...args);
    this.forceContextLoss = () => {
      const context = this.getContext();
      if (!context.isContextLost()) context.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }
}
function NetworkScene({ active, paused, mobile, controllerRef, onReady, onFailure }: Props) {
  const group = useRef<Group>(null);
  const highlight = useRef<Mesh>(null);
  const signal = useRef<Mesh>(null);
  const skillGeometry = useRef<BufferGeometry>(null);
  const announced = useRef(false);
  const { invalidate, gl, camera, size } = useThree();
  const topology = mobile ? mobileNetwork : network;
  const scratch = useMemo(() => new Vector3(), []);
  const data = useMemo(() => {
    const positions = new Float32Array(topology.nodes.flat());
    const colors = new Float32Array(topology.nodes.length * 3);
    const edges = new Float32Array(topology.edges.length * 6);
    const edgeColors = new Float32Array(topology.edges.length * 6);
    const color = new Color();
    topology.nodes.forEach((point, index) => {
      color.set(nodeColor(index)).multiplyScalar(.35 + (point[2] + 1) * .3);
      color.toArray(colors, index * 3);
    });
    topology.edges.forEach(([a, b], index) => {
      const p = topology.nodes[a]!, q = topology.nodes[b]!;
      edges.set(p, index * 6); edges.set(q, index * 6 + 3);
      color.set("#88939b").multiplyScalar(.14 + (p[2] + q[2] + 2) * .105);
      color.toArray(edgeColors, index * 6); color.toArray(edgeColors, index * 6 + 3);
    });
    return { positions, colors, edges, edgeColors, skills: new Float32Array(skillPoints.flat()), skillColors: new Float32Array(skillPoints.length * 3), skillColor: new Color("#00c8ff") };
  }, [topology]);
  useEffect(() => {
    const controls = controllerRef.current;
    controls.invalidate = () => { if (active) invalidate(); };
    if (active) invalidate();
    return () => { controls.invalidate = () => {}; };
  }, [active, controllerRef, invalidate]);
  useEffect(() => { announced.current = false; return () => onReady(false); }, [onReady]);
  useEffect(() => {
    const canvas = gl.domElement;
    const lost = (event: Event) => { event.preventDefault(); onFailure(); };
    canvas.addEventListener("webglcontextlost", lost);
    return () => canvas.removeEventListener("webglcontextlost", lost);
  }, [gl, onFailure]);
  useFrame((state, delta) => {
    if (!group.current || !active) return;
    if (!announced.current) { announced.current = true; onReady(true); }
    const frameDelta = Math.min(delta, .06);
    const elapsedRelease = performance.now() - controllerRef.current.releasedAt;
    const resume = Math.max(0, Math.min(1, (elapsedRelease - 700) / 1600));
    if (!paused && !controllerRef.current.dragging && controllerRef.current.activeSkill < 0) controllerRef.current.yaw += frameDelta * Math.PI * 2 / 180 * resume;
    const ease = 1 - Math.exp(-frameDelta * 12);
    group.current.rotation.x += (controllerRef.current.pitch - group.current.rotation.x) * ease;
    group.current.rotation.y += (controllerRef.current.yaw - group.current.rotation.y) * ease;
    group.current.updateMatrixWorld();
    skillPoints.forEach((point, index) => {
      scratch.set(...point).applyMatrix4(group.current!.matrixWorld);
      const depth = scratch.z;
      const brightness = .2 + Math.max(0, Math.min(1, (depth + 1.02) / 2.04)) * .8;
      data.skillColors[index * 3] = data.skillColor.r * brightness;
      data.skillColors[index * 3 + 1] = data.skillColor.g * brightness;
      data.skillColors[index * 3 + 2] = data.skillColor.b * brightness;
      scratch.project(camera);
      controllerRef.current.project(index, (scratch.x + 1) * size.width / 2, (1 - scratch.y) * size.height / 2, depth, size.width);
    });
    if (skillGeometry.current) skillGeometry.current.getAttribute("color").needsUpdate = true;
    if (highlight.current) {
      highlight.current.visible = controllerRef.current.activeSkill >= 0;
      if (controllerRef.current.activeSkill >= 0) highlight.current.position.set(...skillPoints[controllerRef.current.activeSkill]!);
    }
    if (signal.current) {
      const progress = (state.clock.elapsedTime % 9 - 5) / 1.3;
      signal.current.visible = !paused && controllerRef.current.activeSkill < 0 && progress >= 0 && progress <= 1;
      if (signal.current.visible) {
        const [a, b] = topology.edges[38]!;
        const p = topology.nodes[a]!, q = topology.nodes[b]!;
        signal.current.position.set(p[0] + (q[0] - p[0]) * progress, p[1] + (q[1] - p[1]) * progress, p[2] + (q[2] - p[2]) * progress);
      }
    }
    if (paused && (Math.abs(controllerRef.current.pitch - group.current.rotation.x) + Math.abs(controllerRef.current.yaw - group.current.rotation.y) > .0001)) invalidate();
  });
  return <group ref={group}>
    <lineSegments><bufferGeometry><bufferAttribute attach="attributes-position" args={[data.edges, 3]} /><bufferAttribute attach="attributes-color" args={[data.edgeColors, 3]} /></bufferGeometry><lineBasicMaterial vertexColors toneMapped={false} /></lineSegments>
    <points><bufferGeometry><bufferAttribute attach="attributes-position" args={[data.positions, 3]} /><bufferAttribute attach="attributes-color" args={[data.colors, 3]} /></bufferGeometry><pointsMaterial size={2.6} sizeAttenuation={false} vertexColors toneMapped={false} /></points>
    <points><bufferGeometry ref={skillGeometry}><bufferAttribute attach="attributes-position" args={[data.skills, 3]} /><bufferAttribute attach="attributes-color" args={[data.skillColors, 3]} /></bufferGeometry><pointsMaterial size={4.5} sizeAttenuation={false} vertexColors toneMapped={false} /></points>
    <mesh ref={highlight} visible={false}><sphereGeometry args={[.019, 8, 6]} /><meshBasicMaterial color="#00ffb2" toneMapped={false} /></mesh>
    <mesh ref={signal} visible={false}><sphereGeometry args={[.012, 6, 4]} /><meshBasicMaterial color="#00ffb2" toneMapped={false} /></mesh>
  </group>;
}
export default function NetworkCanvas(props: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const instance = useRef<ReturnType<typeof createRoot> | null>(null);
  const renderer = useRef<NetworkRenderer | null>(null);
  const latest = useRef(props);
  const update = useRef<() => void>(() => {});
  const lifetime = useRef({ generation: 0 });
  const { onFailure } = props;
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas?.parentElement) return;
    const lifecycle = lifetime.current;
    const generation = ++lifecycle.generation;
    let cancelled = false;
    if (!instance.current) {
      // Check the actual visible canvas, then reuse its one context in Three.
      const context = canvas.getContext("webgl2", { antialias: true, alpha: true, powerPreference: "low-power" });
      if (!context) { onFailure(); return; }
      try {
        renderer.current = new NetworkRenderer({ canvas, context, antialias: true, alpha: true, powerPreference: "low-power" });
        instance.current = createRoot(canvas);
      } catch { onFailure(); return; }
    }
    const root = instance.current;
    const gl = renderer.current!;
    const bounds = canvas.parentElement.getBoundingClientRect();
    let width = bounds.width, height = bounds.height;
    const configure = () => {
      const current = latest.current;
      void root.configure({ gl, orthographic: true,
        camera: { position: [0, 0, 4], near: .1, far: 10, left: -250 / 195, right: 250 / 195, top: 250 / 195, bottom: -250 / 195 },
        size: { width, height, top: 0, left: 0 }, dpr: [1, current.mobile ? 1 : 1.5],
        frameloop: !current.active ? "never" : current.paused ? "demand" : "always",
      }).then(() => { if (!cancelled) root.render(<NetworkScene {...latest.current} />); }).catch(() => { if (!cancelled) onFailure(); });
    };
    update.current = configure;
    const observer = new ResizeObserver(([entry]) => {
      if (!entry || cancelled) return;
      width = entry.contentRect.width; height = entry.contentRect.height; configure();
    });
    observer.observe(canvas.parentElement);
    return () => {
      cancelled = true; observer.disconnect(); update.current = () => {};
      // Strict Mode replays effects on the same canvas. Reuse that root; dispose
      // only when no replacement setup follows, without creating a second scene.
      queueMicrotask(() => { if (lifecycle.generation === generation) { root.unmount(); instance.current = null; renderer.current = null; } });
    };
  }, [onFailure]);
  useEffect(() => { latest.current = props; update.current(); }, [props]);
  return <div className="network-live"><canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} /></div>;
}
