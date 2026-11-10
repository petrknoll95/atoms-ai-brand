// Geometry and export invariants for the interactive illustration gallery.
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import sharp from 'sharp';

const temp = await mkdtemp(join(tmpdir(), 'atomsai-illustrations-'));
try {
  await writeFile(join(temp, 'colors.mjs'), ts.transpileModule(await readFile('src/data/colors.ts', 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText);
  await writeFile(join(temp, 'slitLogo.mjs'), ts.transpileModule(await readFile('src/data/slitLogo.ts', 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText);
  for (const name of ['geometry', 'primitives', 'models', 'render', 'motion']) {
    let source = await readFile(`src/scripts/illustration-3d/${name}.ts`, 'utf8');
    source = source.replace("import metrics from './data/reference-metrics.json';", `const metrics = ${await readFile('src/scripts/illustration-3d/data/reference-metrics.json', 'utf8')};`);
    const code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText.replace(/from '\.\/(geometry|primitives|render)'/g, "from './$1.mjs'").replace("from '../../data/colors'", "from './colors.mjs'").replace("from '../../data/slitLogo'", "from './slitLogo.mjs'");
    await writeFile(join(temp, `${name}.mjs`), code);
  }
  const load = (name) => import(pathToFileURL(join(temp, `${name}.mjs`)));
  const { scene, fromView, project, rotate, sub, dot, add, mul, cross, unit } = await load('geometry');
  const { box, ring, X, Z } = await load('primitives');
  const { makeScene, SLUGS } = await load('models');
  const { renderScene, projectScene, frameToSvg, sceneExtent, viewTransform } = await load('render');
  const { createAnimator } = await load('motion');
  const { colors } = await load('colors');
  const base = { yaw: 0, pitch: 0, white: false };

  const cube = scene();
  const solid = box(cube, [0, 0, 0], [80, 80, 80]);
  assert.equal(solid.vertices.length, 8);
  assert.equal(cube.faces.length, 6);
  assert.equal(cube.lines.length, 12);
  for (const edge of cube.lines) {
    assert.equal(edge.normals.length, 2, 'Every box edge joins two faces');
    assert.ok(Math.abs(Math.hypot(...sub(...edge.points)) - 80) < 1e-8);
  }
  const circle = ring(scene(), [0, 0, 0], 90, X, Z);
  for (const p of circle) assert.ok(Math.abs(Math.hypot(...p) - 90) < 1e-8, 'Circle stays circular in world space');
  for (const p of solid.vertices) assert.ok(Math.abs(Math.hypot(...rotate(p, 1.2, -.8)) - Math.hypot(...p)) < 1e-8, 'Rotation preserves the solid');
  for (const f of solid.faces) assert.ok(dot(f.normal, f.points[0]) > 0, 'Box normals face outward');

  const obscured = scene();
  obscured.lines.push({ points: [fromView(-10, 0, -10), fromView(10, 0, -10)] });
  const face = { points: [[-20,-20],[20,-20],[20,20],[-20,20]].map(([x,y]) => fromView(x,y)) };
  obscured.faces.push(face);
  const once = renderScene(obscured, base);
  obscured.faces.push(face, face);
  assert.equal(renderScene(obscured, base), once, 'Overlapping occluders never compound hidden opacity');
  assert.ok(once.includes('data-hidden-runs="1"'));
  assert.ok(once.includes('<g opacity="0.35">'));

  const crossing = scene();
  crossing.lines.push({ points: [fromView(-100, 0, -10), fromView(100, 0, -10)] });
  crossing.faces.push(face);
  const commands = projectScene(crossing, base);
  assert.equal(commands.front.length, 2, 'A partly obscured line keeps both visible ends');
  assert.equal(commands.rear.length, 1, 'The covered middle remains one hidden run');
  assert.ok([...commands.front, ...commands.rear].every(l => l.points.length === 2), 'Straight runs discard redundant depth samples');
  assert.ok(Math.abs(commands.rear[0].points[0][0] + 20) < .6);
  assert.ok(Math.abs(commands.rear[0].points[1][0] - 20) < .6);

  // Opaque examples suppress occluded geometry in the shared canvas/export frame.
  obscured.hiddenLines = 'omit';
  obscured.lines[0].highlight = true;
  obscured.dots.push({ point: fromView(0, 0, -10), r: 2 });
  const opaque = projectScene(obscured, base);
  assert.equal(opaque.rear.length + opaque.rearDots.length + opaque.front.length + opaque.frontDots.length + opaque.accent.length, 0, 'Even highlighted outlines and nodes disappear behind opaque faces');
  const translucent = projectScene({ ...obscured, hiddenLines: undefined }, base);
  assert.equal(translucent.accent.length, 1, 'Other examples retain their highlighted overlay');
  assert.equal(translucent.rearDots.length, 1, 'Other examples retain translucent hidden nodes');
  const visibleOnly = projectScene({ ...crossing, hiddenLines: 'omit' }, base);
  assert.deepEqual(visibleOnly.front, commands.front, 'Opaque mode preserves the exposed ends of a partly hidden line');
  assert.equal(visibleOnly.rear.length, 0);

  const alwaysOn = makeScene('always-on');
  const lineLength = lines => lines.reduce((sum, line) => sum + line.points.slice(1).reduce((n, p, i) => n + Math.hypot(...sub(p, line.points[i])), 0), 0);
  for (const white of [false, true]) for (const [yaw, pitch] of [[0, 0], [.55, .25], [-.8, -.4], [Math.PI, .65]]) {
    const view = { yaw, pitch, white }, frame = projectScene(alwaysOn, view);
    const prior = projectScene({ ...alwaysOn, hiddenLines: undefined }, view);
    assert.equal(frame.rear.length + frame.rearDots.length, 0, 'Always on has no translucent linework at any tested angle');
    assert.deepEqual(frame.front, prior.front, 'Visible structural edges remain intact');
    assert.deepEqual(frame.highlights, prior.highlights, 'Opaque linework retains the Iris gradient');
    assert.ok(lineLength(frame.accent) < lineLength(prior.accent), 'Hidden highlighted tube edges are removed too');
    assert.ok(frameToSvg(frame).includes('data-hidden-runs="0"'), 'SVG export omits the same hidden edges as the canvas');
  }
  for (const slug of SLUGS.filter(slug => !['always-on', 'versatility', 'one-user', 'two-users', 'three-users'].includes(slug))) assert.equal(makeScene(slug).hiddenLines, undefined, `${slug} retains default translucency`);

  // Versatility is an opaque cube with quadrant divisions on all six faces.
  const versatility = makeScene('versatility');
  assert.equal(versatility.faces.length, 6, 'The cube has six occluding faces');
  assert.equal(versatility.arrows.length, 7, 'Existing directional arrows are retained');
  assert.equal(versatility.dots.length, 8, 'Existing nodes are retained');
  const grids = versatility.lines.filter(line => line.normals?.length === 1);
  assert.equal(grids.length, 12, 'Every face has two quadrant dividers');
  for (const face of versatility.faces) {
    const center = mul(face.points.reduce(add, [0, 0, 0]), .25);
    const dividers = grids.filter(line => Math.hypot(...sub(mul(add(...line.points), .5), center)) < 1e-7);
    assert.equal(dividers.length, 2, 'Quadrant dividers cross at each face center');
    assert.ok(Math.abs(dot(sub(...dividers[0].points), sub(...dividers[1].points))) < 1e-7, 'Quadrants have perpendicular dividers');
  }
  for (const white of [false, true]) for (const [yaw, pitch] of [[0, 0], [.7, .3], [Math.PI, 0], [Math.PI, -1]]) {
    const view = { yaw, pitch, white }, frame = projectScene(versatility, view);
    assert.equal(frame.rear.length + frame.rearDots.length, 0, 'The opaque cube never exposes translucent rear lines or nodes');
    const gridFrame = projectScene({ ...versatility, lines: grids, arrows: [], dots: [], highlights: [] }, view);
    assert.equal(gridFrame.front.length, 6, 'All three exposed faces show both quadrant dividers after rotation');
    const highlightFacing = project(rotate(versatility.highlights[0].normal, yaw, pitch))[2] > 1e-5;
    assert.equal(frame.highlights.length, Number(highlightFacing), 'The Iris face does not shine through the opaque cube from behind');
  }

  // Compounding Outcomes is one planar diagram, including its arrowhead.
  // Inspect projected commands too: a camera-facing head would pass a shaft-only test.
  const compounding = makeScene('compounding-outcomes');
  assert.equal(compounding.primitiveCounts.circle, 5);
  assert.equal(compounding.primitiveCounts.arrow, 1);
  const coplanar = (points, plane) => {
    const origin = plane[0], normal = unit(cross(sub(plane[32], origin), sub(plane[64], origin)));
    for (const point of points) assert.ok(Math.abs(dot(sub(point, origin), normal)) < 1e-7, 'Circles, shaft and head share one plane');
  };
  coplanar([...compounding.lines.flatMap(l => l.points), ...compounding.arrows.flatMap(a => [a.a, a.b])], compounding.faces[0].points);
  for (const [yaw, pitch] of [[0, 0], [.55, .25], [-.8, -.4], [Math.PI / 2, .6]]) {
    const frame = projectScene(compounding, { yaw, pitch, white: false });
    coplanar([...frame.front, ...frame.rear, ...frame.accent].flatMap(l => l.points), frame.highlights[0].points);
    assert.equal(frame.rear.length, 0, 'Coplanar circles and arrow do not hide behind one another');
  }

  // Filtering is a volumetric cloud on each side, reflected across its real plane.
  const filtering = makeScene('filtering');
  assert.equal(filtering.dots.length, 32);
  assert.deepEqual(filtering.dots, makeScene('filtering').dots, 'Particle positions are stable across reloads and exports');
  for (const [yaw, pitch] of [[0, 0], [.6, -.4], [Math.PI / 2, .3]]) {
    const surface = filtering.faces[0].points.map(p => rotate(p, yaw, pitch));
    const origin = surface[0], normal = unit(cross(sub(surface[1], origin), sub(surface[3], origin)));
    const particles = filtering.dots.map(d => ({ ...d, point: rotate(d.point, yaw, pitch) }));
    const halves = [-1, 1].map(sign => particles.filter(d => sign * dot(sub(d.point, origin), normal) > 0));
    for (const half of halves) {
      assert.equal(half.length, 16, 'Both sides retain the same particle count');
      const center = mul(half.reduce((sum, d) => add(sum, d.point), [0, 0, 0]), 1 / half.length);
      const offsets = half.map(d => sub(d.point, center));
      const cov = [0, 1, 2].map(i => [0, 1, 2].map(j => offsets.reduce((sum, p) => sum + p[i] * p[j], 0) / offsets.length));
      const [[a, b, c], [, d, e], [, , f]] = cov;
      const determinant = a * (d * f - e * e) - b * (b * f - c * e) + c * (b * e - c * d);
      assert.ok(determinant / ((a + d + f) / 3) ** 3 > .05, 'Each half-cloud has substantial volume, not a flat or nearly flat arrangement');
    }
    for (const particle of halves[0]) {
      const reflected = sub(particle.point, mul(normal, 2 * dot(sub(particle.point, origin), normal)));
      assert.ok(halves[1].some(other => Math.hypot(...sub(other.point, reflected)) < 1e-7 && other.r === particle.r), 'Particles mirror across the surface with matching sizes');
    }
  }

  // Handoff defaults to a face-on view without flattening its physical layers.
  const handoff = makeScene('handoff'), plates = handoff.faces.map(face => face.points.map(project));
  assert.equal(plates.length, 2);
  for (const [i, plate] of plates.entries()) {
    assert.ok(Math.max(...plate.map(p => p[2])) - Math.min(...plate.map(p => p[2])) < 1e-7, 'Plate normals align with the default camera');
    for (let j = 0; j < 4; j++) {
      const edge = sub(plate[(j + 1) % 4], plate[j]);
      assert.ok(Math.abs(edge[j % 2 === 0 ? 1 : 0]) < 1e-7, 'Plate edges appear horizontal and vertical, not isometric');
    }
    for (const p of handoff.faces[i].hole.map(project)) assert.ok(Math.abs(p[2] - plate[0][2]) < 1e-7, 'Slots stay in their plate surfaces');
  }
  const baseWidth = Math.hypot(...sub(plates[0][1], plates[0][0]));
  const topWidth = Math.hypot(...sub(plates[1][1], plates[1][0]));
  assert.ok(Math.abs(topWidth / baseWidth - 74 / 112) < 1e-7, 'The new view preserves relative plate sizes');
  assert.ok(Math.abs((plates[1][0][2] - plates[0][0][2]) / baseWidth - 62 / 112) < 1e-7, 'The plates retain their original 3D separation');
  const connector = handoff.lines.find(line => line.points.length === 81);
  for (const [point, face] of [[connector.points[0], handoff.faces[1]], [connector.points.at(-1), handoff.faces[0]]]) {
    const slotEdge = mul(add(face.hole[0], face.hole[1]), .5);
    assert.ok(Math.hypot(...sub(point, slotEdge)) < 1e-7, 'Connector endpoints remain attached to the slots');
  }

  // The book has four mirrored page pairs, one upright center page and one spine.
  const book = makeScene('unfolding');
  assert.equal(book.faces.length, 9);
  assert.equal(book.highlights.length, 1);
  assert.deepEqual(book.highlights[0].points, book.faces[4].points, 'The central page carries the single Iris highlight');
  const pointsEqual = (a, b) => Math.hypot(...sub(a, b)) < 1e-7;
  for (const [yaw, pitch] of [[0, 0], [.7, -.4]]) {
    const pages = book.faces.map(face => face.points.map(p => rotate(p, yaw, pitch)));
    const center = pages[4], origin = center[0], spine = sub(center[1], origin);
    const normal = unit(cross(spine, sub(center[3], origin))), size = Math.hypot(...spine);
    pages.forEach((page, i) => {
      assert.ok(pointsEqual(page[0], center[0]) && pointsEqual(page[1], center[1]), 'Every page shares both spine endpoints');
      for (let j = 0; j < 4; j++) {
        const edge = sub(page[(j + 1) % 4], page[j]), next = sub(page[(j + 2) % 4], page[(j + 1) % 4]);
        assert.ok(Math.abs(Math.hypot(...edge) - size) < 1e-7, 'All book pages have equal square dimensions');
        assert.ok(Math.abs(dot(edge, next)) < 1e-7, 'Page corners remain rectangular');
        const mirror = sub(page[j], mul(normal, 2 * dot(sub(page[j], origin), normal)));
        assert.ok(pointsEqual(mirror, pages[8 - i][j]), 'Opposing pages mirror across the central page in 3D');
      }
      if (i > 0) {
        const direction = unit(sub(page[3], page[0])), previous = unit(sub(pages[i - 1][3], pages[i - 1][0]));
        assert.ok(Math.abs(dot(direction, previous) - Math.cos(Math.PI / 8)) < 1e-7, 'The page fan has even angular spacing');
      }
    });
  }

  // Precision is a circular lens with two connected, opposing axial ray fans.
  // Checking only its default projection misses disconnected screen-space traces.
  const precision = makeScene('precision'), focus = precision.dots[0].point;
  const rim = precision.faces[0].points;
  const normal = unit(cross(sub(rim[32], rim[0]), sub(rim[64], rim[0])));
  const near = (a, b) => Math.hypot(...sub(a, b)) < 1e-7;
  const incoming = precision.lines.filter(l => l.points.length === 2 && near(l.points[1], focus));
  const outgoing = [
    ...precision.lines.filter(l => l.points.length === 2 && near(l.points[0], focus)).map(l => l.points[1]),
    ...precision.arrows.map(a => { assert.ok(near(a.a, focus), 'Arrow starts at the lens center'); return a.b; }),
  ];
  assert.equal(incoming.length, 7, 'Only seven main incoming rays reach the shared focus');
  assert.equal(precision.arrows.length, 7, 'Every outgoing ray has an arrowhead');
  assert.equal(precision.lines.filter(l => l.points.length === 2 && near(l.points[0], focus)).length, 0, 'No intermediate outgoing rays remain');
  assert.equal(outgoing.length, incoming.length, 'Ray fans retain matching densities');
  const radius = Math.hypot(...sub(rim[0], focus));
  for (const point of rim) {
    assert.ok(Math.abs(Math.hypot(...sub(point, focus)) - radius) < 1e-7, 'Lens is circular around the focus');
    assert.ok(Math.abs(dot(sub(point, focus), normal)) < 1e-7, 'Lens lies in one physical plane');
  }
  const axis = unit(outgoing.reduce((sum, point) => add(sum, sub(point, focus)), [0, 0, 0]));
  assert.ok(Math.abs(dot(axis, normal)) > 1 - 1e-7, 'Ray axis is perpendicular to the lens');
  const sectionNormal = unit(cross(axis, sub(outgoing[0], focus)));
  for (const line of incoming) {
    const point = line.points[0];
    const reflected = sub(point, mul(normal, 2 * dot(sub(point, focus), normal)));
    assert.ok(outgoing.some(end => near(reflected, end)), 'Rays mirror across the lens in 3D');
    assert.ok(Math.abs(dot(sub(point, focus), sectionNormal)) < 1e-7, 'Both fans share one axial section');
  }

  // Users: a sphere head resting on the apex of a half-ellipsoid of shoulders, in the user icon's
  // proportions, standing as one, two or three equal figures on one ground plane.
  for (const [slug, count] of [['one-user', 1], ['two-users', 2], ['three-users', 3]]) {
    const s = makeScene(slug), domes = s.contours.filter(c => c.half), heads = s.contours.filter(c => !c.half);
    assert.equal(s.hiddenLines, 'omit', `${slug} draws opaque solids`);
    assert.deepEqual(s.primitiveCounts, { hemisphere: count, sphere: count });
    assert.equal(s.lines.length, count, 'Each user has one stroke, its base rim; contours are computed per view');
    const shoulder = Math.hypot(...domes[0].axes[0]), close = (a, b) => Math.abs(a - b) < 1e-7 * shoulder;
    domes.forEach((dome, i) => {
      const [a, b, c] = dome.axes.map(v => Math.hypot(...v)), head = heads[i];
      assert.ok(close(a, shoulder) && close(b, shoulder) && close(c, shoulder * 6 / 7), 'Shoulders keep the icon’s 14 × 6 proportion');
      assert.ok(head.axes.every(v => close(Math.hypot(...v), shoulder / 2)), 'Heads are true spheres, half the shoulder radius');
      assert.ok(close(dome.center[1], domes[0].center[1]), 'Every user stands on one ground plane');
      const apex = sub(dome.center, dome.axes[2]), lowest = sub(head.center, [0, shoulder / 2, 0]);
      assert.ok(Math.hypot(...sub(apex, lowest)) < 1e-7 * shoulder, 'Each head rests on its shoulders at one point');
      assert.equal(s.faces.filter(f => f.points.length === 96 && f.owner === dome.owner).length, 1, 'A base disk closes each figure');
    });
    for (let i = 0; i < count; i++) for (let j = i + 1; j < count; j++)
      assert.ok(close(Math.hypot(...sub(domes[i].center, domes[j].center)), shoulder * 16 / 7), 'Users stand 160 apart, clear of each other');
    const depth = c => dot(c.center, [1, 0, 1]), lit = heads.filter(h => h.highlight);
    assert.equal(lit.length, 1, 'One Iris head');
    assert.equal(depth(lit[0]), Math.max(...heads.map(depth)), 'The Iris head belongs to the nearest user');
    // The loop lifts heads straight up by at most the icon's head clearance; shoulders never move.
    const loop = createAnimator(slug, s);
    for (let i = 1; i < 24; i++) {
      const frame = loop.scene(i / 24);
      assert.deepEqual(frame.contours.filter(c => c.half), domes, 'Shoulders stay planted');
      frame.contours.filter(c => !c.half).forEach((head, k) => {
        const moved = sub(head.center, heads[k].center);
        assert.ok(Math.abs(moved[0]) + Math.abs(moved[2]) < 1e-7 && moved[1] > -1e-9 && moved[1] < shoulder * 3 / 7 + 1e-7, 'Heads lift straight up, at most the icon clearance');
      });
    }
  }

  let renders = 0;
  for (const slug of SLUGS) {
    const s = makeScene(slug);
    assert.ok(Object.keys(s.primitiveCounts).length, `${slug} has real primitives`);
    for (const p of [...s.lines.flatMap(l => l.points), ...s.faces.flatMap(f => f.points)]) assert.ok(p.every(Number.isFinite), `${slug} has finite geometry`);
    const original = renderScene(s, base);
    assert.ok(original.includes('#A77BCA'), `${slug} uses current Iris`);
    for (const [yaw,pitch] of [[0,0],[.55,.25],[-.8,-.4],[Math.PI/2,0],[Math.PI,.65],[0,Math.PI/2]]) {
      const view = { yaw, pitch, white: false };
      const svg = frameToSvg(projectScene(s, view));
      assert.equal(svg, renderScene(s, view), `${slug} shares the preview projection with SVG export`);
      assert.ok(!/NaN|Infinity|<image\b|data:image/.test(svg), `${slug} exports finite vector artwork`);
      assert.ok(svg.includes('viewBox="0 0 384 384"'));
      renders++;
    }
    assert.notEqual(renderScene(s, { yaw: .55, pitch: .25, white: false }), original, `${slug} changes with rotation`);
    assert.equal(renderScene(s, base), original, `${slug} resets exactly`);
    assert.ok(original.includes(`stroke="${colors.paper.hex}"`), `${slug} uses Paper linework in Dark mode`);
    assert.ok(renderScene(s, { ...base, white: true }).includes(`stroke="${colors.forestShade.hex}"`), `${slug} uses Forest shade linework in Light mode`);
  }
  assert.equal(SLUGS.length, 23);

  // Motion loops move each example's own geometry, start on the still and return to it seamlessly.
  const page = await readFile('src/pages/illustration.astro', 'utf8');
  const gallery = [...page.matchAll(/\{ slug: '([^']+)', title:/g)].map(match => match[1]);
  const raster = svg => sharp(Buffer.from(svg)).resize(384, 384).flatten({ background: colors.forestShade.hex }).raw().toBuffer();
  let loopFrames = 0;
  for (const slug of gallery) {
    const s = makeScene(slug), loop = createAnimator(slug, s);
    assert.ok(loop, `${slug} has a motion loop`);
    assert.ok(loop.seconds >= 2 && loop.seconds <= 12, `${slug} loops at the gallery pace`);
    for (const white of [false, true]) {
      const view = { ...base, white };
      assert.equal(frameToSvg(projectScene(loop.scene(0), view, { extent: loop.extent(view) })), renderScene(s, view), `${slug} starts on the still`);
    }
    for (const [yaw, pitch] of [[0, 0], [.65, -.35], [Math.PI, .4]]) {
      const view = { yaw, pitch, white: false }, extent = loop.extent(view);
      const [start, end] = await Promise.all([0, 1].map(t => raster(frameToSvg(projectScene(loop.scene(t), view, { extent })))));
      let difference = 0;
      for (let i = 0; i < start.length; i++) difference += Math.abs(start[i] - end[i]);
      assert.ok(difference / start.length < .01, `${slug} loops without a seam`);
      for (let i = 0; i < 48; i++) {
        const frame = loop.scene(i / 48);
        // Extreme points of moving parts approximate their hulls, so allow 1% for the curve between.
        assert.ok(sceneExtent(frame, viewTransform(view)) <= extent * 1.01, `${slug} stays inside its loop fit`);
        const projected = projectScene(frame, view, { extent });
        if (s.hiddenLines === 'omit') assert.equal(projected.rear.length + projected.rearDots.length, 0, `${slug} stays opaque in motion`);
        for (const line of [...projected.front, ...projected.rear, ...projected.accent]) {
          assert.equal(line.width, 1.28, `${slug} keeps one stroke weight in motion`);
          for (const p of line.points) assert.ok(Math.abs(p[0]) < 184 && Math.abs(p[1]) < 184, `${slug} stays inside the viewport`);
        }
        loopFrames++;
      }
    }
  }
  console.log(`Passed: complete solids, circular rings, rigid rotations, single hidden opacity, and ${renders} vector projections across ${SLUGS.length} scenes.`);
  console.log(`Passed: ${gallery.length} motion loops start on the still, close without a seam and keep the visual contract across ${loopFrames} frames.`);
} finally {
  await rm(temp, { recursive: true, force: true });
}
