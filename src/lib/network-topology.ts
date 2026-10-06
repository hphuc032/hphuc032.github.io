export type NetworkPoint = readonly [number, number, number];
export type NetworkEdge = readonly [number, number];

/** Fixed seed, local neighbors, no globe/map data. Shared by SVG and WebGL. */
function createNetwork(count = 112, seed = 2026, edgeLimit = 220) {
  let state = seed;
  const random = () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
  const nodes: NetworkPoint[] = [];
  for (let i = 0; i < count; i++) {
    const y = 1 - 2 * (i + 0.5) / count;
    const angle = i * Math.PI * (3 - Math.sqrt(5)) + (random() - .5) * .15;
    const radius = .95 + random() * .08;
    const x = Math.cos(angle) * Math.sqrt(1 - y * y) * radius;
    const z = Math.sin(angle) * Math.sqrt(1 - y * y) * radius;
    // Baked orientation is identical in the initial live and static representations.
    const xx = x * Math.cos(.38) + z * Math.sin(.38);
    const zz = -x * Math.sin(.38) + z * Math.cos(.38);
    nodes.push([xx, y * Math.cos(.18) - zz * Math.sin(.18), y * Math.sin(.18) + zz * Math.cos(.18)]);
  }
  const edges: NetworkEdge[] = [];
  const keys = new Set<string>();
  nodes.forEach((point, i) => {
    const nearest = nodes.map((other, j) => ({ j, distance: Math.hypot(point[0] - other[0], point[1] - other[1], point[2] - other[2]) }))
      .filter(({ j }) => j !== i).sort((a, b) => a.distance - b.distance).slice(0, i % 3 === 0 ? 3 : 2);
    for (const { j } of nearest) {
      const a = Math.min(i, j), b = Math.max(i, j), key = `${a}:${b}`;
      if (!keys.has(key) && edges.length < edgeLimit) { keys.add(key); edges.push([a, b]); }
    }
  });
  return { nodes, edges };
}
export const network = createNetwork();
export const mobileNetwork = createNetwork(48, 2026, 80);
export function nodeColor(index: number) { return index % 37 === 0 ? "#00ffb2" : index % 47 === 0 ? "#00c8ff" : "#b6bdc3"; }
export function projectPoint(point: NetworkPoint) { return [250 + point[0] * 195, 250 - point[1] * 195] as const; }
