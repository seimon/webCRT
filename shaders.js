// CRT Glass — GLSL shaders (WebGL2)
// Pass 1 "prep": source -> W x L texture (L = virtual scanline count).
//   Vertical band integration, horizontal softness, RGB misconvergence,
//   composite chroma bleed, saturation / monochrome phosphor, persistence.
// Pass 2 "crt": prep texture -> screen. Curvature, gaussian scanline beam,
//   phosphor mask, halation, vignette, noise, flicker, rolling bar, rounded corners.

export const VERT = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

export const PREP_FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;

uniform sampler2D uSrc;
uniform sampler2D uPrev;
uniform vec2  uSrcRes;   // visible (cropped) source size (px)
uniform vec2  uOutRes;   // final canvas size (device px)
uniform float uLines;    // virtual scanline count
uniform vec4  uFit;      // canvas uv -> source uv: (uv - fit.xy) / fit.zw
uniform vec4  uCrop;     // edge crop as fractions of the frame: left, top, right, bottom
uniform float uSoft;     // horizontal softness (device px)
uniform float uConv;     // RGB misconvergence (device px)
uniform float uBleed;    // chroma bleed 0..1
uniform float uSat;      // saturation
uniform float uPersist;  // phosphor persistence 0..0.95
uniform int   uMono;     // 0 color, 1 green, 2 amber, 3 white
uniform float uTime;
uniform float uTape;     // worn video tape noise 0..1

float gLod;
float gBand;

float thash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

// smooth 1D value noise in -0.5..0.5 (seed picks an independent curve)
float vnoise(float t, float seed) {
  float i = floor(t), f = fract(t);
  return mix(thash(vec2(i, seed)), thash(vec2(i + 1.0, seed)), f * f * (3.0 - 2.0 * f)) - 0.5;
}

vec3 tap(vec2 uv) {
  vec2 s = (uv - uFit.xy) / uFit.zw;
  if (s.x < 0.0 || s.y < 0.0 || s.x > 1.0 || s.y > 1.0) return vec3(0.0);
  // s.y runs bottom-up; map into the uncropped part of the frame
  s.x = uCrop.x + s.x * (1.0 - uCrop.x - uCrop.z);
  s.y = uCrop.w + s.y * (1.0 - uCrop.y - uCrop.w);
  // source is uploaded without UNPACK_FLIP_Y (keeps the GPU fast path), so flip here
  return textureLod(uSrc, vec2(s.x, 1.0 - s.y), gLod).rgb;
}

float gY;  // source row to read for this scanline (vUv.y, shifted when the tape jolts)

// average of the scanline band (3 vertical taps)
vec3 band(float x) {
  return (tap(vec2(x, gY - gBand)) + tap(vec2(x, gY)) + tap(vec2(x, gY + gBand))) / 3.0;
}

// 5-tap horizontal gaussian
vec3 hblur(float x, float dx) {
  return band(x) * 0.4026
       + (band(x - dx) + band(x + dx)) * 0.2442
       + (band(x - 2.0 * dx) + band(x + 2.0 * dx)) * 0.0545;
}

const mat3 RGB2YIQ = mat3(0.299, 0.596, 0.211, 0.587, -0.274, -0.523, 0.114, -0.322, 0.312);
const mat3 YIQ2RGB = mat3(1.0, 1.0, 1.0, 0.956, -0.272, -1.106, 0.621, -0.647, 1.703);

void main() {
  float bandSrcPx = uSrcRes.y / (uFit.w * uLines);
  gLod  = max(0.0, log2(bandSrcPx / 3.0));
  gBand = 1.0 / (3.0 * uLines);

  float px = 1.0 / uOutRes.x;
  float dx = max(uSoft, 0.001) * px * 0.6;

  // Worn video tape. This pass draws one texel row per scanline, so all of it lines up with
  // the scanlines:
  //  - every line wobbles sideways a little
  //  - chewed tape: now and then, for 3 frames (~0.1 s), the picture bends sideways in an
  //    irregular way (a different random shape every frame), jolts vertically and loses color
  gY = vUv.y;
  float x = vUv.x;
  float row = floor(vUv.y * uLines);
  float tick = mod(floor(uTime * 30.0), 1000.0);   // re-rolled 30x/s; wrapped for precision
  float chew = 0.0;                                // 1 during a chewed-tape moment
  if (uTape > 0.0) {
    float tm = mod(uTime, 1000.0);
    x += (thash(vec2(row, tick)) - 0.5) * uTape * 6.0 * px;

    float cslot = floor(tm * 0.4);                   // a chewed-tape chance every 2.5 s
    float cOn = step(1.0 - 0.6 * uTape, thash(vec2(cslot, 21.0)));
    chew = cOn * step(fract(tm * 0.4), 0.04);        // first 4% of the slot = 0.1 s = 3 frames
    if (chew > 0.0) {
      // irregular sideways bend: three noise curves of different scales, new shape each frame
      float seed = tick * 3.0;
      x += (vnoise(vUv.y * 4.0, seed) * 0.06
          + vnoise(vUv.y * 13.0, seed + 1.0) * 0.03
          + vnoise(vUv.y * 41.0, seed + 2.0) * 0.012) * chew;
      gY += (thash(vec2(tick, 11.0)) - 0.5) * 0.05 * chew;  // vertical jolt
    }
  }

  vec3 c;
  if (uConv > 0.01) {
    float o = uConv * px;
    c = vec3(hblur(x - o, dx).r, hblur(x, dx).g, hblur(x + o, dx).b);
  } else {
    c = hblur(x, dx);
  }

  if (uBleed > 0.01) {
    vec3 wide = hblur(x + uBleed * 3.0 * px, dx + uBleed * 4.0 * px);
    vec3 yiq = RGB2YIQ * c;
    vec3 wyiq = RGB2YIQ * wide;
    yiq.yz = mix(yiq.yz, wyiq.yz, uBleed);
    c = clamp(YIQ2RGB * yiq, 0.0, 1.0);
  }

  float lum = dot(c, vec3(0.299, 0.587, 0.114));
  c = clamp(mix(vec3(lum), c, uSat), 0.0, 1.0);

  if (uMono == 1) c = lum * vec3(0.25, 1.0, 0.4);
  else if (uMono == 2) c = lum * vec3(1.0, 0.66, 0.12);
  else if (uMono == 3) c = lum * vec3(0.93, 0.96, 1.0);

  if (uPersist > 0.0) {
    vec3 prev = texture(uPrev, vUv).rgb;
    c = max(c, prev * uPersist);
  }

  if (chew > 0.0) {
    // chewed tape: color drains and the picture dims
    float cl = dot(c, vec3(0.299, 0.587, 0.114));
    c = mix(c, vec3(cl) * 0.8, chew * 0.7);
  }
  outColor = vec4(c, 1.0);
}`;

export const CRT_FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;

uniform sampler2D uPrep;
uniform vec2  uRes;       // canvas size (device px)
uniform float uLines;
uniform float uTime;
uniform float uScan;      // scanline strength 0..1
uniform float uCurv;      // curvature 0..0.25
uniform int   uMaskType;  // 0 none, 1 aperture grille, 2 slot, 3 shadow mask
uniform float uMaskStr;
uniform float uMaskSize;
uniform float uBloom;
uniform float uBright;
uniform float uVig;
uniform float uNoise;
uniform float uFlicker;
uniform float uCorner;
uniform float uRoll;
uniform sampler2D uEnv;   // room seen in the glass (procedural image, see app.js)
uniform float uRefl;      // reflection strength, 0 = off

vec3 lin(vec3 c) { return pow(c, vec3(2.2)); }

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

vec3 mask(vec2 fc) {
  vec2 p = floor(fc / uMaskSize);
  float dark = 1.0 - uMaskStr;
  vec3 m = vec3(dark);
  if (uMaskType == 1) {
    float i = mod(p.x, 3.0);
    if (i < 0.5) m.r = 1.0; else if (i < 1.5) m.g = 1.0; else m.b = 1.0;
  } else if (uMaskType == 2) {
    float i = mod(p.x, 3.0);
    if (i < 0.5) m.r = 1.0; else if (i < 1.5) m.g = 1.0; else m.b = 1.0;
    float triad = floor(p.x / 3.0);
    if (mod(p.y + mod(triad, 2.0) * 2.0, 4.0) < 1.0) m *= dark;
  } else if (uMaskType == 3) {
    vec2 q = floor(p * vec2(1.0, 0.5));
    q.x += q.y * 3.0;
    float f = fract(q.x / 6.0);
    if (f < 0.333) m.r = 1.0; else if (f < 0.666) m.g = 1.0; else m.b = 1.0;
  } else {
    return vec3(1.0);
  }
  return m;
}

// Glass reflection of the room (linear light). A CRT faceplate is a small slice of a very large
// sphere: the screen shows only the middle of a reflected room that is much bigger than the
// screen. As the curvature rises, the room is magnified about the center, so lights slide
// outward and can leave the screen entirely. Curvature counts at half strength, and the effect
// levels off for large values instead of turning into a fisheye. One texture read.
vec3 roomReflection() {
  vec2 p = vUv * 2.0 - 1.0;
  float r2 = dot(p, p);
  float kr = 0.4 * (1.0 - exp(-uCurv * 15.0));        // 0.04 -> 0.18, 0.1 -> 0.31, max ~0.4
  // magnification about the center: 1 + 3*kr (0.04 -> x1.54, max ~x2.2); slight barrel on top
  vec2 e = p * 0.9 * (1.0 + 0.15 * kr * r2) / (1.0 + 3.0 * kr);
  vec3 env = lin(texture(uEnv, vec2(0.5 + e.x * 0.5, 0.5 - e.y * 0.5)).rgb);
  float fres = 0.55 + 0.45 * r2;                       // glass reflects more toward the edges
  return env * uRefl * fres;
}

void main() {
  // curvature: radial (spherical) bulge, scaled so the middle of each edge stays put.
  // Same cost as before, but no wavy edges at high values: every edge bends as one smooth arc.
  vec2 c = vUv * 2.0 - 1.0;
  // a thin dark border around the picture, growing with bloom, so its light has room to spill
  // past the edge (without it the middle of each edge touches the canvas edge)
  float pad = 0.06 * uBloom;               // border width, in the same units as sdf below
  c *= 1.0 + pad;
  c *= (1.0 + uCurv * dot(c, c)) / (1.0 + uCurv);
  vec2 uv = c * 0.5 + 0.5;

  // smooth (squircle) screen corners: a superellipse (exponent 4) instead of a circular arc, so
  // the edge eases into the curve with no visible kink where the straight part ends. It starts
  // 1.5x further from the corner than a circle would, to keep about the same visual roundness.
  float rc = uCorner * 1.5;
  vec2 q = abs(c) - (1.0 - rc);
  vec2 m2 = max(q, 0.0) * max(q, 0.0);
  float sdf = sqrt(sqrt(m2.x * m2.x + m2.y * m2.y)) + min(max(q.x, q.y), 0.0) - rc;
  // Soft edge: the fade-out band widens with bloom (free: same math as the sharp edge).
  float soft = 2.0 / uRes.y + 0.015 * uBloom;
  float edge = 1.0 - smoothstep(-soft, 0.0, sdf);
  // Light spill: the picture's light leaks past the edge and fades out, using the blurred mip
  // levels the bloom already reads. Only pixels near or outside the edge pay for it (2 reads).
  vec3 spill = vec3(0.0);
  if (uBloom > 0.0 && sdf > -soft) {
    float d = max(sdf, 0.0);
    // fades out within the border, reaching zero before the canvas edge (no hard outer line)
    float fade = exp(-d / (pad * 0.3)) * (1.0 - smoothstep(pad * 0.6, pad, d));
    if (fade > 0.001) {
      vec2 suv = clamp(uv, 0.0, 1.0);       // nearest point on the picture
      vec3 g = lin(textureLod(uPrep, suv, 3.5).rgb) * 0.6 + lin(textureLod(uPrep, suv, 5.0).rgb) * 0.4;
      spill = pow(clamp(g * uBloom * 0.35 * uBright * fade, 0.0, 1.0), vec3(1.0 / 2.2));
    }
  }
  if (edge <= 0.0) { outColor = vec4(spill, 1.0); return; }

  // scanline beam
  float y = uv.y * uLines - 0.5;
  float r0 = floor(y);
  float f = y - r0;
  float wDark = mix(0.5, 0.17, uScan);
  float wBright = mix(0.5, 0.36, uScan);
  vec3 col = vec3(0.0);
  for (int i = -1; i <= 2; i++) {
    float row = r0 + float(i);
    vec3 s = lin(texture(uPrep, vec2(uv.x, (row + 0.5) / uLines)).rgb);
    vec3 w = mix(vec3(wDark), vec3(wBright), sqrt(s));
    float d = f - float(i);
    col += s * exp(-0.5 * d * d / (w * w)) / (w * 2.5066);
  }

  // halation / bloom
  if (uBloom > 0.0) {
    vec3 g = lin(textureLod(uPrep, uv, 2.5).rgb) * 0.5 + lin(textureLod(uPrep, uv, 4.5).rgb) * 0.5;
    col += g * uBloom * 0.6;
  }

  // phosphor mask (+ brightness compensation)
  if (uMaskType > 0) {
    float dark = 1.0 - uMaskStr;
    col *= mask(gl_FragCoord.xy) * mix(1.0, 3.0 / (1.0 + 2.0 * dark), 0.85);
  }

  // rolling bar (hum bar): a soft dark band about 1/5 of the screen tall that rolls upward,
  // one pass every ~4.5 s. col is linear light: -55% here shows as about -30% on screen.
  if (uRoll > 0.0) {
    float pos = fract(mod(uTime, 1000.0) * 0.22);
    float d = uv.y - pos;
    d -= floor(d + 0.5);                       // wrap so the band re-enters from the bottom
    col *= 1.0 - uRoll * 0.55 * exp(-d * d / (2.0 * 0.08 * 0.08));
  }

  // flicker: brightness wavers smoothly at ~17 changes/s (a per-frame random dip at 60 fps
  // averages out and can't be seen). col is linear light: -40% shows as about -20% on screen.
  if (uFlicker > 0.0) {
    float ft = mod(uTime, 1000.0) * 16.8, fi = floor(ft), ff = fract(ft);
    float fl = mix(hash(vec2(fi, 7.0)), hash(vec2(fi + 1.0, 7.0)), ff * ff * (3.0 - 2.0 * ff));
    col *= 1.0 - uFlicker * 0.4 * fl;
  }

  // vignette
  float v = 16.0 * uv.x * uv.y * (1.0 - uv.x) * (1.0 - uv.y);
  col *= mix(1.0, pow(clamp(v, 0.0, 1.0), 0.35), uVig);

  col *= uBright;

  // room reflection on the glass; shows most on dark parts of the picture
  if (uRefl > 0.0) {
    float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
    col += roomReflection() * (1.0 - 0.7 * clamp(lum, 0.0, 1.0));
  }

  vec3 outc = pow(clamp(col, 0.0, 1.0), vec3(1.0 / 2.2));

  // noise (in display space)
  if (uNoise > 0.0) outc += (hash(gl_FragCoord.xy + fract(uTime * 13.7) * 811.0) - 0.5) * uNoise;

  outColor = vec4(mix(spill, outc, edge), 1.0); // picture fades into its own spilled light
}`;
