// CSS remains the source of duration values; GSAP uses the corresponding
// non-overshooting editorial ease. Read only when an enhancement actually runs.
export function motionTiming() {
  const style = getComputedStyle(document.documentElement);
  const seconds = (token: string) => {
    const value = style.getPropertyValue(token).trim();
    return parseFloat(value) / (value.endsWith("ms") ? 1000 : 1);
  };
  return {
    fast: seconds("--duration-fast"),
    normal: seconds("--duration-medium"),
    editorial: seconds("--duration-slow"),
    reveal: seconds("--duration-reveal"),
    initialization: seconds("--duration-initialization"),
    stagger: seconds("--duration-stagger"),
    ease: "power3.out",
  } as const;
}
