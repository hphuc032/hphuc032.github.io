import { sphereSkills } from "@/data/sphere-skills";
import type { NetworkPoint } from "./network-topology";

export const skillPoints: readonly NetworkPoint[] = sphereSkills.map((_, i) => {
  const y = 1 - 2 * (i + .5) / sphereSkills.length;
  const angle = i * Math.PI * (3 - Math.sqrt(5)) + .7;
  const radius = Math.sqrt(1 - y * y);
  return [Math.cos(angle) * radius * 1.02, y * 1.02, Math.sin(angle) * radius * 1.02];
});

// Mutable renderer/controller bridge: no React state or layout reads per frame.
export type SphereController = {
  pitch: number; yaw: number; dragging: boolean; releasedAt: number; activeSkill: number;
  invalidate: () => void;
  project: (index: number, x: number, y: number, depth: number, width: number) => void;
};
export function createSphereController(): SphereController {
  return { pitch: 0, yaw: 0, dragging: false, releasedAt: -Infinity, activeSkill: -1, invalidate: () => {}, project: () => {} };
}
