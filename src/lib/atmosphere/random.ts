/** Small deterministic generator; randomness never runs in a drawing loop. */
export function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

let seed: number | undefined;
export function sessionSeed() {
  if (seed !== undefined) return seed;
  const key = "carwyn:atmosphere-seed";
  try {
    const stored = sessionStorage.getItem(key);
    if (stored && /^\d+$/.test(stored) && Number(stored) <= 0xffffffff) {
      seed = Number(stored);
      return seed;
    }
  } catch { /* Storage restrictions leave an in-memory session seed. */ }
  const entropy = new Uint32Array(1);
  crypto.getRandomValues(entropy);
  seed = entropy[0] ?? 1;
  try { sessionStorage.setItem(key, String(seed)); } catch { /* Decoration does not depend on storage. */ }
  return seed;
}
