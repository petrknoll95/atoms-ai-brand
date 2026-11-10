// One user: a sphere head resting on the apex of a half-ellipsoid of shoulders.
// Proportions follow the AtomsAI user icon at 10×: shoulders 14 wide × 6 tall, head r 3.5.
export const title = 'One user';
export const reference = 'input'; // Sphere resting on a hemisphere: the closest construction family.

export const R = 70, H = 60, r = 35;

export default function (api) {
  const { scene } = api;
  const s = scene();
  s.hiddenLines = 'omit'; // Opaque solids: occluded edges disappear.
  user(s, api, [0, 0, 0], true);
  return s;
}

export function user(s, { ellipsoid, circlePoints, add, mul, X, Y, Z }, base, highlight) {
  // Shoulders rise along +Y (a half-ellipsoid grows along −axes[2]).
  const shoulders = ellipsoid(s, base, [mul(X, R), mul(Z, R), mul(Y, -H)], { half: true });
  // Close the solid with its base disk: the rim's own 96 points and owner, no second stroke.
  s.faces.push({ points: circlePoints(base, R, X, Z, 96), owner: shoulders });
  // The head touches the apex at one point on the shared vertical axis.
  ellipsoid(s, add(base, mul(Y, H + r)), [mul(X, r), mul(Z, r), mul(Y, r)], { highlight });
}

/** Shared geometry checks for 1–3 users standing on the ground plane. */
export function checkUsers(s, { sub, dot, add, mul, X, Y, Z }, assert, count) {
  const near = (a, b, label) => assert(Math.hypot(...sub(a, b)) < 1e-9, label);
  assert.equal(s.hiddenLines, 'omit');
  const domes = s.contours.filter(c => c.half), heads = s.contours.filter(c => !c.half);
  assert.equal(domes.length, count);
  assert.equal(heads.length, count);
  assert.equal(s.lines.length, count, 'Only each base rim is a stroke; contours are computed per view');
  assert.equal(s.faces.filter(f => f.points.length === 96).length, count, 'Every set of shoulders has a base disk');
  domes.forEach((dome, i) => {
    const head = heads[i], base = dome.center;
    assert.equal(base[1], 0, 'Shoulders stand on the ground plane');
    const [a, b, c] = dome.axes;
    assert.deepEqual([a, b, c].map(v => Math.hypot(...v)), [R, R, H]);
    assert(Math.abs(dot(a, b)) + Math.abs(dot(b, c)) + Math.abs(dot(a, c)) < 1e-9, 'Orthogonal dome axes');
    assert.deepEqual(head.axes.map(v => Math.hypot(...v)), [r, r, r], 'Head is a true sphere');
    // Contact: the apex of the shoulders is the lowest point of the head.
    near(add(base, mul(Y, H)), sub(head.center, mul(Y, r)), 'Head rests on the apex');
  });
  // One Iris head: the user nearest the viewer (the camera looks along −(X + Z)).
  const lit = heads.filter(h => h.highlight);
  assert.equal(lit.length, 1);
  const depth = c => dot(c.center, add(X, Z));
  assert.equal(depth(lit[0]), Math.max(...heads.map(depth)));
  // Solids never intersect: bases at least a shoulder diameter + 20 apart.
  for (let i = 0; i < count; i++) for (let j = i + 1; j < count; j++)
    assert(Math.hypot(...sub(domes[i].center, domes[j].center)) >= 2 * R + 20 - 1e-9, 'Users overlap in 3D');
}

export function verify(s, api, assert) {
  checkUsers(s, api, assert, 1);
  assert.deepEqual(s.contours[0].center, [0, 0, 0]);
}
