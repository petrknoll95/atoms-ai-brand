// Three users: equal figures at 120° increments on one circle, every pair 160 apart.
// The front user carries the Iris head and stands before the other two's shoulders.
import { user, checkUsers } from './one-user.mjs';
export const title = 'Three users';
export const reference = 'input';

export const spacing = 160, radius = spacing / Math.sqrt(3);

export default function (api) {
  const { scene, around, unit, add, mul, X, Y, Z } = api;
  const s = scene();
  s.hiddenLines = 'omit';
  const front = unit(add(X, Z)); // Horizontal direction toward the viewer.
  [0, 1, 2].map(k => around(mul(front, radius), Y, k * 2 * Math.PI / 3)).forEach((base, k) => user(s, api, base, k === 0));
  return s;
}

export function verify(s, api, assert) {
  checkUsers(s, api, assert, 3);
  const bases = s.contours.filter(c => c.half).map(c => c.center);
  for (let i = 0; i < 3; i++) {
    assert(Math.abs(Math.hypot(...bases[i]) - radius) < 1e-9, 'All users on one circle');
    assert(Math.abs(Math.hypot(...api.sub(bases[i], bases[(i + 1) % 3])) - spacing) < 1e-9, 'Equal spacing');
  }
  const centroid = bases.reduce(api.add).map(v => v / 3);
  assert(Math.hypot(...centroid) < 1e-9);
  // Mirror symmetry across the vertical plane through the front user.
  const side = api.unit(api.sub(api.X, api.Z));
  assert(Math.abs(api.dot(bases[1], side) + api.dot(bases[2], side)) < 1e-9);
}
