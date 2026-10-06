import { network, mobileNetwork, nodeColor, projectPoint } from "@/lib/network-topology";

export function StaticNetwork() {
  return <><NetworkGraphic topology={network} className="network-static-desktop" /><NetworkGraphic topology={mobileNetwork} className="network-static-mobile" /></>;
}
function NetworkGraphic({ topology, className }: { topology: typeof network; className: string }) {
  return <svg className={`network-static ${className}`} viewBox="0 0 500 500" aria-hidden="true" focusable="false">
    {topology.edges.map(([a, b]) => {
      const p = topology.nodes[a]!, q = topology.nodes[b]!;
      const [x1, y1] = projectPoint(p), [x2, y2] = projectPoint(q);
      return <line key={`${a}-${b}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#88939b" strokeWidth=".8" opacity={.14 + (p[2] + q[2] + 2) * .105} />;
    })}
    {topology.nodes.map((point, index) => {
      const [cx, cy] = projectPoint(point);
      return <circle key={index} cx={cx} cy={cy} r={index % 37 === 0 ? 2.7 : 1.55} fill={nodeColor(index)} opacity={.35 + (point[2] + 1) * .3} />;
    })}
  </svg>;
}
