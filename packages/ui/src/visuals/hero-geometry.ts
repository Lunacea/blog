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

  for (let index = 0; index < count; index += 1) {
    const offset = index * 3;
    const u = (index / count) * Math.PI * 2;
    const v = (hash(index, 1) - 0.5) * 0.72;
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

    let x = hash(index, 2) * 2 - 1;
    let y = hash(index, 3) * 2 - 1;
    let z = hash(index, 4) * 2 - 1;
    const length = Math.abs(x) + Math.abs(y) + Math.abs(z) || 1;
    x /= length;
    y /= length;
    z /= length;
    octahedron[offset] = x * 1.45;
    octahedron[offset + 1] = y * 1.45;
    octahedron[offset + 2] = z * 1.45;
    seeds[index] = hash(index, 5);
  }
  return { mobius, sphere, octahedron, seeds };
}
