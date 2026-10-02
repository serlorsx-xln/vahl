"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { sceneProgress, story } from "@/lib/story";
import { damp, lerp, smoothstep } from "@/lib/math";
import { movementState } from "./Movement";

/**
 * Renders the scene, then the loupe: a second pass of the same scene through
 * a camera whose view offset is a small window around the cursor, so the
 * lens shows real extra detail (not an upscaled copy). Composited as a
 * steel-rimmed lens with a little barrel distortion and fringing at the rim.
 */

const ZOOM = 4;
const RT_SIZE = 768;

const vert = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const frag = /* glsl */ `
uniform sampler2D tMap;
uniform float uOpen;
uniform float uExposure;
uniform float uLens; // plane size / lens diameter
varying vec2 vUv;

// Khronos PBR Neutral, matching the renderer's tone mapping
vec3 neutralTM(vec3 color) {
  const float start = 0.76;
  const float desat = 0.15;
  float x = min(color.r, min(color.g, color.b));
  float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
  color -= offset;
  float peak = max(color.r, max(color.g, color.b));
  if (peak < start) return color;
  float d = 1.0 - start;
  float newPeak = 1.0 - d * d / (peak + d - start);
  color *= newPeak / peak;
  float g = 1.0 - 1.0 / (desat * (peak - newPeak) + 1.0);
  return mix(color, vec3(newPeak), g);
}

// straight-alpha "over"
vec4 over(vec4 top, vec4 bottom) {
  float a = top.a + bottom.a * (1.0 - top.a);
  vec3 c = (top.rgb * top.a + bottom.rgb * bottom.a * (1.0 - top.a)) / max(a, 1e-4);
  return vec4(c, a);
}

vec4 sampleLens(vec2 uv, float d) {
  // barrel distortion toward the rim, a little lateral colour
  vec2 c = uv - 0.5;
  float k = 1.0 - 0.10 * d * d;
  vec2 base = 0.5 + c * k;
  float ca = 0.006 * d * d;
  vec4 r = texture2D(tMap, 0.5 + (base - 0.5) * (1.0 + ca));
  vec4 g = texture2D(tMap, base);
  vec4 b = texture2D(tMap, 0.5 + (base - 0.5) * (1.0 - ca));
  return vec4(r.r, g.g, b.b, g.a);
}

void main() {
  vec2 p = (vUv - 0.5) * uLens;      // lens radius = 0.5
  float d = length(p) * 2.0;          // 0 center, 1 rim
  float rimIn = 0.93;

  // soft contact shadow outside the rim
  if (d > 1.0) {
    float sh = smoothstep(1.16, 1.0, d) * 0.26 * uOpen;
    gl_FragColor = vec4(0.0, 0.0, 0.0, sh);
    return;
  }

  vec2 luv = p + 0.5;
  vec4 lens = sampleLens(luv, d / rimIn);
  // the target holds premultiplied linear HDR; tone map the straight colour
  vec3 straight = lens.rgb / max(lens.a, 1e-4);
  vec4 col = vec4(neutralTM(straight * uExposure), lens.a);

  // glass: inner shading, a reflection band, a breath of tint so empty glass still reads
  col = over(vec4(vec3(0.0), 0.16 * smoothstep(0.5, rimIn, d)), col);
  col = over(vec4(vec3(1.0), 0.05), col);
  float band = smoothstep(0.38, 0.0, abs(p.x + p.y * 0.6 + 0.18)) * 0.07;
  col = over(vec4(vec3(1.0), band), col);

  // engraved reticle ticks on the inner edge
  float ang = atan(p.y, p.x);
  float ticks = step(0.985, cos(ang * 36.0)) * smoothstep(rimIn - 0.06, rimIn - 0.02, d);
  col = over(vec4(vec3(0.06), ticks * 0.7), col);

  // black-polished steel rim with a specular edge
  float rim = smoothstep(rimIn - 0.006, rimIn + 0.004, d);
  float spec = pow(max(0.0, cos(ang - 2.2)), 18.0) * 0.9 + pow(max(0.0, cos(ang + 0.9)), 30.0) * 0.35;
  col = over(vec4(vec3(0.07, 0.075, 0.085) + spec, rim), col);

  float edge = smoothstep(1.0, 0.985, d);
  gl_FragColor = vec4(col.rgb, col.a * edge * uOpen);
  #include <colorspace_fragment>
}`;

export function Pipeline() {
  const { gl, scene, camera, size } = useThree();
  const loupeCam = useMemo(() => new THREE.PerspectiveCamera(), []);
  const rt = useMemo(
    () =>
      new THREE.WebGLRenderTarget(RT_SIZE, RT_SIZE, {
        samples: 4,
        type: THREE.HalfFloatType,
        colorSpace: THREE.LinearSRGBColorSpace,
      }),
    [],
  );
  const hud = useMemo(() => {
    const s = new THREE.Scene();
    const cam = new THREE.OrthographicCamera(0, 1, 1, 0, -1, 1);
    const mat = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        tMap: { value: rt.texture },
        uOpen: { value: 0 },
        uExposure: { value: 1 },
        uLens: { value: 1.18 },
      },
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
    s.add(mesh);
    return { scene: s, cam, mesh, mat };
  }, [rt]);

  const state = useRef({ x: -9999, y: -9999, open: 0, radius: 120 });

  useEffect(() => () => rt.dispose(), [rt]);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 1 / 20);
    const cam = camera as THREE.PerspectiveCamera;
    gl.autoClear = true;
    gl.setRenderTarget(null);
    gl.render(scene, cam);

    const ptr = story.pointer;
    const pApart = sceneProgress("apart");
    const pOnce = sceneProgress("once");
    const pNight = sceneProgress("night");
    // the loupe belongs to inspection: the dial, the movement, the exploded stack
    const allowed = ptr.fine && ptr.inside && !story.mobile && pOnce < 0.04 && pNight < 0.5;
    // open over the object itself, close over text and empty bench
    const lx = story.lamp.x * size.width;
    const ly = story.lamp.y * size.height;
    const reach = story.lamp.r * size.height * (pApart > 0.15 ? 2.2 : 1.12);
    const near = Math.hypot(ptr.x - lx, ptr.y - ly) < reach || (pApart > 0.12 && Math.abs(ptr.x - lx) < size.width * 0.18);
    const want = allowed && near && story.canvasReady ? 1 : 0;
    const s = state.current;
    s.open = lerp(s.open, want, damp(want ? 9 : 14, dt));
    const follow = story.reduced ? 1 : damp(16, dt);
    s.x = s.x < -999 ? ptr.x : lerp(s.x, ptr.x, follow);
    s.y = s.y < -999 ? ptr.y : lerp(s.y, ptr.y, follow);
    s.radius = Math.min(150, Math.max(96, size.width * 0.075));

    if (story.cursor) story.cursor.style.setProperty("--loupe", s.open.toFixed(3));
    if (s.open < 0.01) {
      if (story.loupeReadout) story.loupeReadout.style.opacity = "0";
      return;
    }

    // the window of the full view under the lens
    const R = s.radius;
    const win = (R * 2) / ZOOM;
    loupeCam.copy(cam);
    loupeCam.setViewOffset(size.width, size.height, s.x - win / 2, s.y - win / 2, win, win);
    loupeCam.updateProjectionMatrix();
    gl.setRenderTarget(rt);
    gl.setClearColor(0x000000, 0);
    gl.clear();
    gl.render(scene, loupeCam);
    gl.setRenderTarget(null);
    loupeCam.clearViewOffset();

    // HUD pass in CSS pixels
    const lensScale = 1.18;
    hud.cam.left = 0;
    hud.cam.right = size.width;
    hud.cam.top = size.height;
    hud.cam.bottom = 0;
    hud.cam.updateProjectionMatrix();
    const scale = R * 2 * lensScale * (0.6 + 0.4 * s.open);
    hud.mesh.scale.set(scale, scale, 1);
    hud.mesh.position.set(s.x, size.height - s.y, 0);
    hud.mat.uniforms.uOpen.value = s.open;
    hud.mat.uniforms.uExposure.value = gl.toneMappingExposure;
    hud.mat.uniforms.uLens.value = lensScale;
    gl.autoClear = false;
    gl.render(hud.scene, hud.cam);
    gl.autoClear = true;

    // a true scale bar: 1 mm at the depth of what is being inspected
    const dist = cam.position.distanceTo(movementFocus(cam));
    const pxPerMm = (size.height / (2 * dist * Math.tan((cam.fov * Math.PI) / 360))) * ZOOM;
    const ro = story.loupeReadout;
    if (ro) {
      ro.style.opacity = String(smoothstep(0.5, 1, s.open));
      ro.style.transform = `translate3d(${s.x - R * 0.62}px, ${s.y + R * 0.98}px, 0)`;
    }
    const sc = story.loupeScale;
    if (sc) sc.style.width = `${Math.min(R * 1.1, pxPerMm).toFixed(1)}px`;
  }, 1);

  return null;
}

const focus = new THREE.Vector3();
function movementFocus(cam: THREE.PerspectiveCamera) {
  // distance to the plane through the watch center facing the camera
  const dir = new THREE.Vector3();
  cam.getWorldDirection(dir);
  const isolate = movementState.isolate;
  focus.set(0, 0, 0).lerp(movementState.displayPoint, isolate);
  const t = focus.clone().sub(cam.position).dot(dir);
  return cam.position.clone().add(dir.multiplyScalar(t));
}
