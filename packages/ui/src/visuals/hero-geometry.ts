export type HeroShapePositions = {
  mobius: Float32Array;
  sphere: Float32Array;
  octahedron: Float32Array;
  seeds: Float32Array;
};

function hash(index: number, salt: number): number {
  const value = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

export function createHeroShapePositions(count: number): HeroShapePositions {
  const mobius = new Float32Array(count * 3);
  const sphere = new Float32Array(count * 3);
  const octahedron = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  const golden = Math.PI * (3 - Math.sqrt(5));
  const mobiusBands = 20;

  for (let index = 0; index < count; index += 1) {
    const offset = index * 3;
    const turn = Math.floor(index / mobiusBands);
    const u = ((turn + hash(index, 1)) / Math.ceil(count / mobiusBands)) * Math.PI * 2;
    const band = index % mobiusBands;
    const edgeSample = index % 9 === 0;
    const normalizedWidth = edgeSample
      ? (index % 18 === 0 ? -0.5 : 0.5)
      : (band + hash(index, 2)) / mobiusBands - 0.5;
    const v = normalizedWidth * 0.72;
    const radius = 1.15 + v * Math.cos(u / 2);
    mobius[offset] = radius * Math.cos(u);
    mobius[offset + 1] = v * Math.sin(u / 2);
    mobius[offset + 2] = radius * Math.sin(u);

    const sphereY = 1 - (index / Math.max(1, count - 1)) * 2;
    const sphereRadius = Math.sqrt(Math.max(0, 1 - sphereY * sphereY));
    const angle = index * golden;
    sphere[offset] = sphereRadius * Math.cos(angle) * 1.12;
    sphere[offset + 1] = sphereY * 1.12;
    sphere[offset + 2] = sphereRadius * Math.sin(angle) * 1.12;

    const face = index % 8;
    const signX = face & 1 ? -1 : 1;
    const signY = face & 2 ? -1 : 1;
    const signZ = face & 4 ? -1 : 1;
    const root = Math.sqrt(hash(index, 5));
    const a = 1 - root;
    const b = root * (1 - hash(index, 6));
    const c = root - b;
    octahedron[offset] = signX * a * 1.45;
    octahedron[offset + 1] = signY * b * 1.45;
    octahedron[offset + 2] = signZ * c * 1.45;
    seeds[index] = hash(index, 7);
  }
  return { mobius, sphere, octahedron, seeds };
}
