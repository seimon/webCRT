import { VERT, PREP_FRAG, CRT_FRAG } from './shaders.js';

// ---------------------------------------------------------------- parameters
const CONTROLS = [
  { key: 'lineSize', label: '스캔라인 간격 (px)', min: 1, max: 8, step: 0.25 },
  { key: 'scan', label: '스캔라인 강도', min: 0, max: 1, step: 0.01 },
  { key: 'maskType', label: '마스크', type: 'select', options: ['없음', '아퍼처 그릴 (트리니트론)', '슬롯 마스크 (가정용 TV)', '섀도 마스크 (아케이드)'] },
  { key: 'maskStr', label: '마스크 강도', min: 0, max: 1, step: 0.01 },
  { key: 'maskSize', label: '마스크 크기', min: 1, max: 4, step: 1 },
  { key: 'curv', label: '화면 곡률', min: 0, max: 0.25, step: 0.005 },
  { key: 'corner', label: '모서리 둥글기', min: 0, max: 0.12, step: 0.005 },
  { key: 'bloom', label: '블룸 / 번짐', min: 0, max: 1.5, step: 0.01 },
  { key: 'bright', label: '밝기', min: 0.5, max: 2, step: 0.01 },
  { key: 'vig', label: '비네팅', min: 0, max: 1, step: 0.01 },
  { key: 'soft', label: '가로 흐림', min: 0, max: 4, step: 0.05 },
  { key: 'conv', label: 'RGB 어긋남', min: 0, max: 4, step: 0.05 },
  { key: 'bleed', label: '색 번짐 (컴포지트)', min: 0, max: 1, step: 0.01 },
  { key: 'sat', label: '채도', min: 0, max: 2, step: 0.01 },
  { key: 'mono', label: '인광체 색', type: 'select', options: ['컬러', '그린 (P1)', '앰버 (P3)', '화이트 (P4)'] },
  { key: 'persist', label: '잔상', min: 0, max: 0.95, step: 0.01 },
  { key: 'noise', label: '노이즈', min: 0, max: 0.25, step: 0.005 },
  { key: 'flicker', label: '깜빡임', min: 0, max: 1, step: 0.01 },
  { key: 'roll', label: '롤링 바', min: 0, max: 1, step: 0.01 },
  { key: 'tape', label: '테이프 노이즈', min: 0, max: 1, step: 0.01 },
];

const BASE = {
  lineSize: 3, scan: 0.6, maskType: 0, maskStr: 0.3, maskSize: 1, curv: 0, corner: 0,
  bloom: 0, bright: 1, vig: 0, soft: 0.5, conv: 0, bleed: 0, sat: 1, mono: 0,
  persist: 0, noise: 0, flicker: 0, roll: 0, tape: 0,
};

const PRESETS = [
  { id: 'arcade', name: '아케이드 — 섀도 마스크', desc: '오락실 캐비닛 모니터. 굵은 스캔라인, 볼록한 화면, 진한 글로우.',
    p: { lineSize: 4, scan: 0.85, maskType: 3, maskStr: 0.55, curv: 0.05, corner: 0.07, bloom: 0.55, vig: 0.4, soft: 0.8, conv: 0.5, persist: 0.5, sat: 1.15, noise: 0.08, flicker: 0.2, roll: 0.4, tape: 0.2, bright: 1.25 } },
  { id: 'pvm', name: '소니 PVM — 아퍼처 그릴', desc: '방송용 모니터처럼 선명한 스캔라인과 세로 RGB 줄무늬. 글 읽기 좋음.',
    p: { lineSize: 3, scan: 0.8, maskType: 1, maskStr: 0.45, curv: 0.04, corner: 0.04, soft: 0.6, conv: 0.3, bloom: 0.2, vig: 0.15, bright: 1.1 } },
  { id: 'tv', name: '가정용 TV — 슬롯 마스크', desc: '90년대 브라운관 TV. 볼록한 화면, 번짐, 약한 노이즈.',
    p: { lineSize: 4, scan: 0.65, maskType: 2, maskStr: 0.45, curv: 0.04, corner: 0.06, bloom: 0.4, vig: 0.35, soft: 1.2, conv: 0.8, bleed: 0.3, noise: 0.025, flicker: 0.25, bright: 1.15 } },
  { id: 'lottes', name: 'Lottes 스타일', desc: 'crt-lottes 계열 느낌. 하드 스캔라인 + 섀도 마스크, 약한 곡률.',
    p: { lineSize: 3, scan: 0.9, maskType: 3, maskStr: 0.5, curv: 0.035, corner: 0.02, bloom: 0.3, vig: 0.2, soft: 0.7, bright: 1.2 } },
  { id: 'green', name: '그린 인광 터미널', desc: 'VT100/애플 II 녹색 모니터. 잔상이 남는 인광체.',
    p: { lineSize: 3, scan: 0.7, mono: 1, persist: 0.55, bloom: 0.6, curv: 0.04, corner: 0.06, vig: 0.4, soft: 0.6, noise: 0.02, flicker: 0.2, bright: 1.25 } },
  { id: 'amber', name: '앰버 모니터', desc: 'IBM 5151 류의 호박색 모노크롬.',
    p: { lineSize: 3, scan: 0.7, mono: 2, persist: 0.4, bloom: 0.5, curv: 0.04, corner: 0.06, vig: 0.35, soft: 0.6, flicker: 0.15, bright: 1.25 } },
  { id: 'vhs', name: 'VHS / 컴포지트', desc: '낡은 비디오테이프 느낌. 흐린 가로 해상도, 색 번짐, 지지직거리는 테이프 노이즈, 롤링 바.',
    p: { lineSize: 4, scan: 0.4, soft: 2.6, conv: 1.6, bleed: 0.85, noise: 0.07, roll: 0.5, sat: 1.15, persist: 0.7, curv: 0.04, corner: 0.08, bloom: 0.35, vig: 0.3, flicker: 0.3, tape: 0.45, bright: 1.05 } },
  { id: 'bw', name: '흑백 TV', desc: '오래된 흑백 브라운관. 둥근 모서리와 노이즈.',
    p: { lineSize: 4, scan: 0.6, mono: 3, curv: 0.04, corner: 0.12, bloom: 0.45, vig: 0.55, soft: 1.4, noise: 0.09, roll: 0.35, flicker: 0.4, tape: 0.1, bright: 1.2 } },
  { id: 'off', name: '패스스루 (효과 없음)', desc: '셰이더 없이 원본 그대로.',
    p: { lineSize: 1, scan: 0, soft: 0 } },
];
const PASSTHROUGH = { ...BASE, ...PRESETS.find(p => p.id === 'off').p };

// Sites known to refuse being framed (X-Frame-Options / CSP frame-ancestors).
const FRAME_BLOCKED = [
  'youtube.com', 'google.com', 'x.com', 'twitter.com', 'instagram.com', 'facebook.com', 'threads.net',
  'github.com', 'linkedin.com', 'reddit.com', 'twitch.tv', 'netflix.com', 'discord.com',
  'chatgpt.com', 'claude.ai', 'tiktok.com',
];

// ---------------------------------------------------------------- state
const STORE_KEY = 'crtglass.v1';
// default 창 edge crop: a Windows title bar at 150% scale on top, the 1px window border elsewhere
const CROP_DEFAULT = { l: 1, t: 46, r: 1, b: 1 };
const state = { mode: 'site', crtOn: true, presetId: PRESETS[0].id, params: null, url: 'https://info.cern.ch/hypertext/WWW/TheProject.html', custom: false, hintDismissed: false, shortcuts: false, screenSize: 'fit',
  cropPx: { ...CROP_DEFAULT },           // 창 mode edge crop, in the captured window's own pixels
  folded: {},                            // settings groups folded by the user, e.g. { reflect: true }
  margin: 20,                            // black margin around the CRT area (px)
  bezel: false,                          // beige PC monitor bezel around the CRT area
  reflect: { type: 1, strength: 0.3 },   // room reflection in the glass (independent of presets)
};
try {
  const saved = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
  if (saved) Object.assign(state, saved, { hintDismissed: false });
} catch {}
const qs = new URLSearchParams(location.search);
if (qs.get('url')) { state.url = qs.get('url'); state.mode = 'site'; }
if (qs.get('preset')) { state.presetId = qs.get('preset'); state.custom = false; }
if (!PRESETS.some(p => p.id === state.presetId)) { state.presetId = PRESETS[0].id; state.custom = false; }
if (!state.params || !state.custom) state.params = presetParams(state.presetId);
else state.params = { ...BASE, ...state.params }; // custom settings saved before a newer slider existed

function presetParams(id) {
  const pr = PRESETS.find(p => p.id === id) || PRESETS[0];
  return { ...BASE, ...pr.p };
}
function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify({ mode: state.mode, crtOn: state.crtOn, presetId: state.presetId, params: state.params, url: state.url, custom: state.custom, shortcuts: state.shortcuts, screenSize: state.screenSize, cropPx: state.cropPx, folded: state.folded, margin: state.margin, bezel: state.bezel, reflect: state.reflect })); } catch {}
}
function effectiveParams() { return state.crtOn ? state.params : PASSTHROUGH; }

// ---------------------------------------------------------------- dom
const $ = id => document.getElementById(id);
const stage = $('stage'), screenEl = $('screen'), frame = $('site'), canvas = $('crt'), lite = $('lite');
const siteHint = $('siteHint'), center = $('center'), blocked = $('blocked');

// ---------------------------------------------------------------- WebGL
const gl = canvas.getContext('webgl2', { alpha: false, antialias: false, premultipliedAlpha: false });
if (!gl) alert('이 브라우저는 WebGL2를 지원하지 않아요.');

function compile(type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src); gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
  return s;
}
function program(fs) {
  const p = gl.createProgram();
  gl.attachShader(p, compile(gl.VERTEX_SHADER, VERT));
  gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs));
  gl.bindAttribLocation(p, 0, 'aPos');
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  const u = {};
  const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < n; i++) { const name = gl.getActiveUniform(p, i).name; u[name] = gl.getUniformLocation(p, name); }
  return { p, u };
}
const prepProg = program(PREP_FRAG);
const crtProg = program(CRT_FRAG);

const vbo = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
gl.enableVertexAttribArray(0);
gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
// No UNPACK_FLIP_Y: flipping on upload can force a CPU copy. The prep shader flips instead.
gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);

function makeTex() {
  const t = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return t;
}
const srcTex = makeTex();
const prep = [0, 1].map(() => ({ tex: makeTex(), fbo: gl.createFramebuffer() }));
let prepW = 0, prepH = 0, cur = 0;

function ensurePrep(w, h) {
  if (w === prepW && h === prepH) return;
  prepW = w; prepH = h;
  for (const p of prep) {
    gl.bindTexture(gl.TEXTURE_2D, p.tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindFramebuffer(gl.FRAMEBUFFER, p.fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, p.tex, 0);
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

// ---------------------------------------------------------------- render scheduling
// Draw only when something changed: a new video frame, a param/size/mode change,
// or a time-based effect (noise, flicker, rolling bar, demo animation, persistence decay).
// Capped at 60fps even on high-refresh displays.
const FRAME_MS = 1000 / 60;
const HAS_RVFC = 'requestVideoFrameCallback' in HTMLVideoElement.prototype;
let dirty = true;          // redraw needed
let newVideoFrame = false; // video has a frame we haven't uploaded yet
let uploadedSource = null; // which source object srcTex currently holds
let animUntil = 0;         // keep drawing until this time (persistence decay)
let nextAt = 0;

function invalidate() { dirty = true; }

function isAnimated(P) {
  return state.mode === 'demo' || P.noise > 0 || P.flicker > 0 || P.roll > 0 || P.tape > 0;
}

// ---------------------------------------------------------------- sources
const video = document.createElement('video');
video.muted = true; video.playsInline = true;
let siteStream = null, capStream = null;

function onVideoFrame() {
  newVideoFrame = true;
  dirty = true;
  video.requestVideoFrameCallback(onVideoFrame);
}
if (HAS_RVFC) video.requestVideoFrameCallback(onVideoFrame);

const demo = document.createElement('canvas');
demo.width = 960; demo.height = 720; // 4:3
const dctx = demo.getContext('2d');

function drawDemo(t) {
  const W = demo.width, H = demo.height, c = dctx;
  c.fillStyle = '#10204a'; c.fillRect(0, 0, W, H);
  c.fillStyle = '#e8e8ff'; c.font = 'bold 44px Arial, sans-serif';
  c.fillText('webCRT', 40, 70);
  // current shader, right under the title
  const pr = PRESETS.find(p => p.id === state.presetId);
  const shaderName = !state.crtOn ? 'CRT OFF' : pr.name + (state.custom ? ' (사용자 지정)' : '');
  c.font = 'bold 24px Arial, sans-serif'; c.fillStyle = '#c8d4ff';
  c.fillText('셰이더: ' + shaderName, 40, 108);
  const bars = ['#c0c0c0', '#c0c000', '#00c0c0', '#00c000', '#c000c0', '#c00000', '#0000c0'];
  bars.forEach((b, i) => { c.fillStyle = b; c.fillRect(40 + i * 80, 140, 80, 190); });
  const g = c.createLinearGradient(40, 0, 600, 0);
  g.addColorStop(0, '#000'); g.addColorStop(1, '#fff');
  c.fillStyle = g; c.fillRect(40, 345, 560, 44);
  c.fillStyle = '#ffffff';
  for (let i = 0; i < 28; i++) c.fillRect(40 + i * 20, 404, i % 2 ? 1 : 2, 44);
  c.font = '16px Arial, sans-serif'; c.fillStyle = '#d8deff';
  const lines = [
    'URL 모드: 주소를 넣고 "풀 셰이더 켜기" → 공유 창에서 "이 탭" 선택.',
    '창 모드: 임베드가 막힌 사이트는 그 탭이나 창을 직접 캡처하세요.',
    'The quick brown fox jumps over the lazy dog. 0123456789',
    '다람쥐 헌 쳇바퀴에 타고파.',
  ];
  lines.forEach((l, i) => c.fillText(l, 40, 500 + i * 30));
  const x = 700 + Math.sin(t / 700) * 120, y = 330 + Math.cos(t / 500) * 150;
  c.fillStyle = '#ffdd33'; c.beginPath(); c.arc(x, y, 34, 0.25, Math.PI * 2 - 0.25); c.lineTo(x, y); c.fill();
  c.fillStyle = '#ff5577'; c.fillRect(800, 40, 120, 120);
  c.fillStyle = '#fff'; c.font = 'bold 22px monospace';
  c.fillText(new Date().toLocaleTimeString(), 690, 680);
  c.fillStyle = '#33ff88'; c.fillText('> READY_' + (Math.floor(t / 500) % 2 ? '█' : ''), 40, 680);
}

function activeStream() {
  return state.mode === 'site' ? siteStream : state.mode === 'capture' ? capStream : null;
}

function currentSource() {
  if (state.mode === 'demo') return demo;
  const s = activeStream();
  if (s && video.srcObject === s && video.readyState >= 2 && video.videoWidth) return video;
  return null;
}

function attachVideo(stream) {
  video.srcObject = stream;
  newVideoFrame = true;
  video.play().catch(() => {});
}

// Capture resolution: the shader squeezes the picture into `lines` scanlines anyway,
// so ~3 source pixels per scanline is enough. Never more than the screen's device pixels.
function captureSize() {
  const P = effectiveParams();
  const dpr = window.devicePixelRatio || 1;
  const cssW = Math.max(1, screenEl.clientWidth), cssH = Math.max(1, screenEl.clientHeight);
  const lines = cssH / P.lineSize;
  const h = Math.round(Math.min(cssH * dpr, Math.max(360, lines * 3)));
  // URL mode captures the iframe itself (same aspect as the screen); other surfaces
  // can be any shape, so let the height be the binding limit.
  const aspect = state.mode === 'site' ? cssW / cssH : Math.max(cssW / cssH, 2.4);
  return { width: Math.round(h * aspect), height: h };
}

function captureConstraints() {
  const { width, height } = captureSize();
  return { width: { max: width }, height: { max: height }, frameRate: { max: 60 } };
}

let constrainTimer = 0;
function updateCaptureConstraints() {
  clearTimeout(constrainTimer);
  constrainTimer = setTimeout(() => {
    for (const s of [siteStream, capStream]) {
      const t = s && s.getVideoTracks()[0];
      if (!t || t.readyState !== 'live') continue;
      // A captured window is kept at its real pixel size: windows get resized, and the edge crop
      // is in the window's own pixels, so it must know the true frame size at all times.
      const keepFull = s === capStream && capNative && capNative.surface === 'window';
      t.applyConstraints(keepFull ? { frameRate: { max: 60 } } : captureConstraints()).catch(() => {});
    }
  }, 300);
}

async function startElementCapture() {
  $('elemErr').textContent = '';
  if (!('RestrictionTarget' in window)) {
    $('elemErr').textContent = '이 브라우저는 Element Capture를 지원하지 않아요 (Chrome/Edge 132 이상 필요). 탭/창 모드를 써 주세요.';
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: { displaySurface: 'browser', cursor: 'never', ...captureConstraints() },
      audio: false, preferCurrentTab: true, selfBrowserSurface: 'include', surfaceSwitching: 'exclude', monitorTypeSurfaces: 'exclude',
    });
    const [track] = stream.getVideoTracks();
    try {
      const target = await RestrictionTarget.fromElement(frame);
      await track.restrictTo(target);
    } catch (e) {
      stream.getTracks().forEach(t => t.stop());
      $('elemErr').textContent = '"이 탭"을 선택해야 해요. 다시 시도해 주세요. (' + e.message + ')';
      return;
    }
    track.addEventListener('ended', () => { if (siteStream === stream) { siteStream = null; applyMode(); } });
    stopStream('cap');
    siteStream = stream;
    attachVideo(stream);
    applyMode();
    updateCaptureConstraints();
  } catch (e) {
    if (e.name !== 'NotAllowedError') $('elemErr').textContent = e.message;
  }
}

let capNative = null; // { w, h, surface } of the current 창 capture, as first delivered

// Edge crop in the source's own pixels -> fractions of the frame. A window is captured at full
// size, so the live frame size is its real size (follows resizes). Screens and tabs are
// downscaled, so their real size is the one recorded when the capture started.
function cropFractions(frameW, frameH) {
  const real = capNative && capNative.surface !== 'window' && capNative.w ? capNative : { w: frameW, h: frameH };
  const c = state.cropPx;
  let l = c.l / real.w, r = c.r / real.w, t = c.t / real.h, b = c.b / real.h;
  const sx = Math.min(1, 0.9 / (l + r || 1)), sy = Math.min(1, 0.9 / (t + b || 1)); // keep >=10% visible
  return [l * sx, t * sy, r * sx, b * sy];
}

async function startCapture() {
  $('capErr').textContent = '';
  try {
    // Start at full size so the captured window's real pixel size is known (used by the
    // title-bar crop estimate), then drop to the reduced size right after.
    const stream = await navigator.mediaDevices.getDisplayMedia({
      // displaySurface: 'window' makes Chrome's share picker open on its 창 (window) tab
      video: { displaySurface: 'window', cursor: 'always', frameRate: { max: 60 } },
      audio: false, selfBrowserSurface: 'exclude', surfaceSwitching: 'include',
    });
    const [track] = stream.getVideoTracks();
    const st = track.getSettings();
    capNative = { w: st.width || 0, h: st.height || 0, surface: st.displaySurface || '' };
    track.addEventListener('ended', () => { if (capStream === stream) { capStream = null; applyMode(); } });
    stopStream('site');
    stopStream('cap'); // replacing an existing capture (picker cancelled = never reaches here)
    capStream = stream;
    attachVideo(stream);
    applyMode();
    updateCaptureConstraints();
    syncCropUI(); // px hints now that the window size is known
  } catch (e) {
    if (e.name !== 'NotAllowedError') $('capErr').textContent = e.message;
  }
}

function stopStream(which) {
  const s = which === 'site' ? siteStream : capStream;
  if (!s) return;
  s.getTracks().forEach(t => t.stop());
  if (which === 'site') siteStream = null; else capStream = null;
}

// Pause while the tab is hidden: rAF stops by itself; also stop the capture producing frames.
// A capture only runs while its mode is showing and the tab is visible. Paused tracks keep the
// share permission, so returning to the mode resumes without picking a screen again.
function syncCaptureTracks() {
  const visible = !document.hidden;
  siteStream?.getVideoTracks().forEach(t => { t.enabled = visible && state.mode === 'site'; });
  capStream?.getVideoTracks().forEach(t => { t.enabled = visible && state.mode === 'capture'; });
}
document.addEventListener('visibilitychange', () => {
  syncCaptureTracks();
  if (!document.hidden) { newVideoFrame = true; invalidate(); }
});

// ---------------------------------------------------------------- render
function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const w = Math.max(1, Math.round(screenEl.clientWidth * dpr));
  const h = Math.max(1, Math.round(screenEl.clientHeight * dpr));
  if (canvas.width === w && canvas.height === h) return false;
  canvas.width = w; canvas.height = h;
  return true;
}
new ResizeObserver(() => { invalidate(); updateCaptureConstraints(); }).observe(screenEl);

function loop(t) {
  requestAnimationFrame(loop);
  if (canvas.style.display === 'none') return;
  if (resizeCanvas()) dirty = true;
  const P = effectiveParams();
  const src = currentSource();
  // No rVFC: we can't tell when a video frame is new, so treat video as always new.
  if (src === video && !HAS_RVFC) { newVideoFrame = true; dirty = true; }
  if (!dirty && !isAnimated(P) && t >= animUntil) return;
  if (t < nextAt - 1) return; // 60fps cap
  nextAt = Math.max(nextAt + FRAME_MS, t);
  dirty = false;
  draw(t, P, src);
}
requestAnimationFrame(loop);

function draw(t, P, src) {
  const W = canvas.width, H = canvas.height;
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.viewport(0, 0, W, H);
  if (!src) {
    if (capAspect && state.mode === 'capture') { capAspect = null; applyScreenSize(); } // capture ended
    gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT); return;
  }

  // upload only when the source actually has new content
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, srcTex);
  if (src === demo) {
    drawDemo(t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, demo);
    gl.generateMipmap(gl.TEXTURE_2D);
    uploadedSource = demo;
  } else if (newVideoFrame || uploadedSource !== video) {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
    gl.generateMipmap(gl.TEXTURE_2D);
    uploadedSource = video;
    newVideoFrame = false;
  }
  // 창 mode edge crop (e.g. a window's title bar); sw/sh become the visible part's size
  const fw = src.videoWidth || src.width, fh = src.videoHeight || src.height;
  const crop = state.mode === 'capture' ? cropFractions(fw, fh) : [0, 0, 0, 0];
  const sw = fw * (1 - crop[0] - crop[2]);
  const sh = fh * (1 - crop[1] - crop[3]);
  if (state.mode === 'capture' || state.mode === 'demo') {
    const a = sw / sh;
    if (!capAspect || Math.abs(a - capAspect) > 0.002) { capAspect = a; applyScreenSize(); }
  }

  const dpr = window.devicePixelRatio || 1;
  const lines = Math.max(16, Math.round(H / (P.lineSize * dpr)));

  // fit: URL mode maps 1:1 onto the iframe; others letterbox (contain)
  let fit = [0, 0, 1, 1];
  if (state.mode !== 'site') {
    const sa = sw / sh, ca = W / H;
    if (sa > ca) { const h = ca / sa; fit = [0, (1 - h) / 2, 1, h]; }
    else { const w = sa / ca; fit = [(1 - w) / 2, 0, w, 1]; }
  }

  // pass 1: prep
  ensurePrep(W, lines);
  const prev = prep[cur], next = prep[cur ^ 1];
  gl.bindFramebuffer(gl.FRAMEBUFFER, next.fbo);
  gl.viewport(0, 0, prepW, prepH);
  gl.useProgram(prepProg.p);
  let u = prepProg.u;
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, srcTex); gl.uniform1i(u.uSrc, 0);
  gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, prev.tex); gl.uniform1i(u.uPrev, 1);
  gl.uniform2f(u.uSrcRes, sw, sh);
  gl.uniform2f(u.uOutRes, W, H);
  gl.uniform1f(u.uLines, lines);
  gl.uniform4f(u.uFit, ...fit);
  gl.uniform4f(u.uCrop, ...crop);
  gl.uniform1f(u.uSoft, P.soft * dpr);
  gl.uniform1f(u.uConv, P.conv * dpr);
  gl.uniform1f(u.uBleed, P.bleed);
  gl.uniform1f(u.uSat, P.sat);
  gl.uniform1f(u.uPersist, P.persist);
  gl.uniform1i(u.uMono, P.mono | 0);
  gl.uniform1f(u.uTime, t / 1000);
  gl.uniform1f(u.uTape, P.tape || 0);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  gl.bindTexture(gl.TEXTURE_2D, null);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, next.tex);
  gl.generateMipmap(gl.TEXTURE_2D);
  cur ^= 1;
  // persistence needs a few more frames to fade out after the picture stops changing
  if (P.persist > 0) animUntil = t + 1000;

  // pass 2: crt
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.viewport(0, 0, W, H);
  gl.useProgram(crtProg.p);
  u = crtProg.u;
  gl.uniform1i(u.uPrep, 0);
  gl.uniform2f(u.uRes, W, H);
  gl.uniform1f(u.uLines, lines);
  gl.uniform1f(u.uTime, t / 1000);
  gl.uniform1f(u.uScan, P.scan);
  gl.uniform1f(u.uCurv, P.curv);
  gl.uniform1i(u.uMaskType, P.maskType | 0);
  gl.uniform1f(u.uMaskStr, P.maskStr);
  gl.uniform1f(u.uMaskSize, P.maskSize);
  gl.uniform1f(u.uBloom, P.bloom);
  gl.uniform1f(u.uBright, P.bright);
  gl.uniform1f(u.uVig, P.vig);
  gl.uniform1f(u.uNoise, P.noise);
  gl.uniform1f(u.uFlicker, P.flicker);
  gl.uniform1f(u.uCorner, P.corner);
  gl.uniform1f(u.uRoll, P.roll);
  const refl = state.crtOn && state.reflect.type > 0 ? state.reflect.strength : 0;
  gl.uniform1f(u.uRefl, refl);
  if (refl > 0) {
    ensureEnvTexture(state.reflect.type);
    gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, envTex); gl.uniform1i(u.uEnv, 2);
    gl.activeTexture(gl.TEXTURE0);
  }
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

// ---------------------------------------------------------------- room reflection
// A small blurred picture of the room behind the viewer, drawn once per type with canvas 2D.
// Light sources become highlights in the glass; the viewer's dark silhouette sits in the middle.
const REFLECT_TYPES = ['반사 없음', '오락실', '사무실', '거실 (밤)'];
const envTex = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, envTex);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
let envType = -1;

function ensureEnvTexture(type) {
  if (type === envType) return;
  envType = type;
  const cv = document.createElement('canvas');
  cv.width = 512; cv.height = 384;
  const c = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  const glow = (x, y, r, color) => {
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
  };
  // Lights and objects sit in the middle ~55% of the picture (x 115-400, y 85-300): the shader
  // magnifies the middle as curvature rises, so anything further out would leave the screen.
  c.filter = 'blur(6px)';
  if (type === 1) { // arcade: dim fluorescent ceiling, rows of cabinets, onlookers behind you
    c.fillStyle = '#07070b'; c.fillRect(0, 0, W, H);
    // faint ambient light in the hall, against which people are seen as silhouettes
    const amb = c.createLinearGradient(0, 100, 0, 300);
    amb.addColorStop(0, 'rgba(70,75,95,0.55)'); amb.addColorStop(1, 'rgba(20,20,30,0)');
    c.fillStyle = amb; c.fillRect(0, 100, W, 200);
    // ceiling fluorescent tubes in perspective rows (near rows wider, spread out and higher)
    c.fillStyle = 'rgba(225,235,255,0.75)';
    for (const [y, w, n, x0, x1] of [[92, 56, 3, 125, 390], [110, 40, 4, 150, 365], [124, 28, 5, 170, 345]]) {
      const gap = (x1 - x0 - n * w) / (n - 1);
      for (let i = 0; i < n; i++) c.fillRect(x0 + i * (w + gap), y, w, y < 100 ? 7 : 5);
    }
    // other cabinets on both sides: dark bodies, bright marquees, glowing screens
    for (const [x, w, scr, mq] of [
      [112, 52, 'rgba(70,120,255,0.6)', 'rgba(255,220,120,0.7)'],
      [168, 36, 'rgba(255,80,160,0.45)', 'rgba(120,255,200,0.5)'],
      [308, 36, 'rgba(90,255,140,0.4)', 'rgba(255,120,80,0.55)'],
      [348, 52, 'rgba(255,90,90,0.55)', 'rgba(150,180,255,0.7)'],
    ]) {
      c.fillStyle = '#0b0b10'; c.fillRect(x, 140, w, 150);
      c.fillStyle = mq; c.fillRect(x + 4, 146, w - 8, 9);
      c.fillStyle = scr; c.fillRect(x + 5, 168, w - 10, w * 0.7);
    }
    // onlookers standing behind you (soft dark silhouettes)
    c.filter = 'blur(8px)';
    c.fillStyle = 'rgba(0,0,0,0.75)';
    for (const [x, y, s] of [[176, 212, 0.6], [212, 200, 0.55], [300, 204, 0.55], [336, 214, 0.62]]) {
      c.beginPath(); c.ellipse(x, y, 26 * s, 32 * s, 0, 0, Math.PI * 2); c.fill();          // head
      c.beginPath(); c.ellipse(x, y + 95 * s, 70 * s, 70 * s, 0, 0, Math.PI * 2); c.fill(); // shoulders
    }
    // warm soft glare in the top-left of the glass, and a cool blue light in the bottom-right
    // at about half its brightness (outside the viewer's silhouette)
    c.filter = 'none';
    glow(170, 128, 120, 'rgba(255,222,185,0.75)');
    glow(394, 258, 100, 'rgba(110,150,255,0.38)');
  } else if (type === 2) { // office: bright top-left corner, rows of ceiling lights
    c.fillStyle = '#121417'; c.fillRect(0, 0, W, H);
    // the top-left corner of the room is bright (light from a window off to the side)
    c.filter = 'none';
    glow(150, 112, 175, 'rgba(255,255,255,0.75)');
    glow(118, 92, 105, 'rgba(255,255,255,0.55)');
    // ceiling lights in two perspective rows; their straight lines bend with the glass bulge
    c.filter = 'blur(4px)';
    c.fillStyle = 'rgba(240,245,255,0.6)';
    for (const [y, w, n, x0, x1] of [[100, 44, 3, 200, 380], [118, 30, 4, 205, 370]]) {
      const gap = (x1 - x0 - n * w) / (n - 1);
      for (let i = 0; i < n; i++) c.fillRect(x0 + i * (w + gap), y, w, y < 110 ? 6 : 4);
    }
    // a faint monitor glow on a desk to the right
    c.filter = 'none';
    glow(338, 255, 80, 'rgba(140,170,220,0.25)');
  } else if (type === 3) { // living room at night: warm lamp, faint TV-lit room
    c.fillStyle = '#0a0806'; c.fillRect(0, 0, W, H);
    glow(340, 150, 110, 'rgba(238,174,106,0.85)');                        // floor lamp (75% saturation)
    c.fillStyle = 'rgba(241,193,133,0.9)'; c.fillRect(322, 128, 36, 24);  // lamp shade
    glow(140, 150, 100, 'rgba(200,190,175,0.3)');                         // faint light from the left
    glow(170, 240, 120, 'rgba(60,80,130,0.35)');                          // TV glow on the wall
    c.fillStyle = 'rgba(90,70,50,0.6)'; c.fillRect(110, 255, 290, 45);    // sofa
  }
  if (type > 0) { // viewer's silhouette (head and shoulders) blocks the room behind
    c.filter = 'blur(10px)';
    c.fillStyle = 'rgba(0,0,0,0.85)';
    c.beginPath(); c.ellipse(W / 2, 215, 46, 58, 0, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.ellipse(W / 2, 330, 150, 95, 0, 0, Math.PI * 2); c.fill();
  }
  // Glass reflections are out of focus: blur the whole room heavily. Drawn slightly oversized so
  // the blur doesn't pull in dark edges.
  const out = document.createElement('canvas');
  out.width = W; out.height = H;
  const o = out.getContext('2d');
  o.filter = 'blur(30px)';
  o.drawImage(cv, -50, -50, W + 100, H + 100);
  gl.activeTexture(gl.TEXTURE2);
  gl.bindTexture(gl.TEXTURE_2D, envTex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, out);
  gl.activeTexture(gl.TEXTURE0);
}

// ---------------------------------------------------------------- URL handling
function normalizeUrl(s) {
  s = s.trim();
  if (!s) return '';
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(s)) s = 'https://' + s;
  try { return new URL(s).href; } catch { return ''; }
}

function hostMatches(host, domain) {
  return host === domain || host.endsWith('.' + domain);
}

// "90", "90s", "1m30s", "1h2m3s" -> seconds
function parseYouTubeTime(s) {
  if (/^\d+s?$/.test(s)) return parseInt(s, 10);
  const m = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/.exec(s);
  return m ? (+m[1] || 0) * 3600 + (+m[2] || 0) * 60 + (+m[3] || 0) : 0;
}

// YouTube pages refuse framing, but /embed/ URLs are made for it.
function toYouTubeEmbed(href) {
  let u;
  try { u = new URL(href); } catch { return null; }
  const host = u.hostname.replace(/^www\.|^m\.|^music\./, '');
  let id = null;
  if (host === 'youtu.be') id = u.pathname.slice(1).split('/')[0];
  else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    const parts = u.pathname.split('/').filter(Boolean);
    if (parts[0] === 'embed') return null; // already an embed URL
    if (parts[0] === 'watch') id = u.searchParams.get('v');
    else if (['shorts', 'live', 'v'].includes(parts[0])) id = parts[1];
    else if (parts[0] === 'playlist' && u.searchParams.get('list')) {
      return 'https://www.youtube.com/embed/videoseries?list=' + encodeURIComponent(u.searchParams.get('list'));
    }
  }
  if (!id || !/^[\w-]{6,}$/.test(id)) return null;
  const q = new URLSearchParams();
  const list = u.searchParams.get('list');
  if (list) q.set('list', list);
  const start = parseYouTubeTime(u.searchParams.get('t') || u.searchParams.get('start') || '');
  if (start > 0) q.set('start', String(start));
  const qsStr = q.toString();
  return 'https://www.youtube.com/embed/' + id + (qsStr ? '?' + qsStr : '');
}

function blockedHost(href) {
  let host;
  try { host = new URL(href).hostname; } catch { return null; }
  if (/\/embed\//.test(href) && hostMatches(host, 'youtube.com')) return null;
  return FRAME_BLOCKED.some(d => hostMatches(host, d) || (d === 'google.com' && /(^|\.)google\.[a-z.]+$/.test(host))) ? host : null;
}

let originalUrl = state.url; // what the user typed (before the embed conversion)
let reloadPending = false;   // openUrl() is between about:blank and the real URL

function openUrl(input) {
  const u = normalizeUrl(input);
  if (!u) return;
  originalUrl = u;
  state.url = toYouTubeEmbed(u) || u;
  // Always (re)load, even if it's the URL already showing: assigning the same src can be a
  // no-op in some cases (e.g. #fragment URLs), so go through about:blank first.
  const target = state.url;
  reloadPending = true;
  frame.src = 'about:blank';
  setTimeout(() => { reloadPending = false; if (state.url === target) frame.src = target; }, 30);
  const q = new URLSearchParams(location.search); q.set('url', u);
  history.replaceState(null, '', '?' + q.toString());
  state.blockedDismissed = false;
  applyMode();
}

// ---------------------------------------------------------------- UI
const presetSel = $('preset');
for (const p of PRESETS) presetSel.add(new Option(p.name, p.id));
presetSel.add(new Option('사용자 지정', 'custom'));

const controlsEl = $('controls');
const inputs = {};
for (const c of CONTROLS) {
  const wrap = document.createElement('div');
  wrap.className = 'ctl';
  const label = document.createElement('label');
  const name = document.createElement('span'); name.textContent = c.label;
  const val = document.createElement('span');
  label.append(name, val);
  let input;
  if (c.type === 'select') {
    input = document.createElement('select');
    c.options.forEach((o, i) => input.add(new Option(o, i)));
  } else {
    input = document.createElement('input');
    input.type = 'range'; input.min = c.min; input.max = c.max; input.step = c.step;
  }
  input.addEventListener('input', () => {
    state.params[c.key] = parseFloat(input.value);
    state.custom = true;
    syncUI();
    save();
    if (c.key === 'lineSize') updateCaptureConstraints();
  });
  wrap.append(label, input);
  controlsEl.append(wrap);
  inputs[c.key] = { input, val, c };
}

function fmt(v, step) { return step >= 1 ? String(v) : (+v).toFixed(step < 0.01 ? 3 : 2); }

function syncUI() {
  for (const k in inputs) {
    const { input, val, c } = inputs[k];
    input.value = state.params[k];
    if (c.type !== 'select') val.textContent = fmt(state.params[k], c.step);
  }
  presetSel.value = state.custom ? 'custom' : state.presetId;
  const pr = PRESETS.find(p => p.id === state.presetId);
  $('presetDesc').textContent = state.custom ? `${pr.name} 기반으로 수정됨` : pr.desc;
  $('toggleCrt').textContent = state.crtOn ? 'ON' : 'OFF';
  $('toggleCrt').classList.toggle('on', state.crtOn);
  invalidate();
}

function setPreset(id) {
  state.presetId = id; state.custom = false; state.params = presetParams(id);
  syncUI(); save();
  updateCaptureConstraints();
}
presetSel.addEventListener('change', () => {
  if (presetSel.value !== 'custom') setPreset(presetSel.value);
});
// Mouse wheel over the select steps through presets (down = next). Deltas are accumulated
// so one wheel notch = one step, and a trackpad swipe doesn't skip through the whole list.
let wheelAcc = 0;
presetSel.addEventListener('wheel', e => {
  e.preventDefault();
  wheelAcc += e.deltaMode === 1 ? e.deltaY * 33 : e.deltaY; // Firefox reports lines
  if (Math.abs(wheelAcc) < 50) return;
  const dir = Math.sign(wheelAcc);
  wheelAcc = 0;
  const i = PRESETS.findIndex(p => p.id === state.presetId);
  const next = Math.min(PRESETS.length - 1, Math.max(0, i + dir));
  if (next !== i || state.custom) setPreset(PRESETS[next].id);
}, { passive: false });
$('resetPreset').addEventListener('click', () => setPreset(state.presetId));

function applyMode() {
  for (const b of document.querySelectorAll('#modes button')) b.classList.toggle('on', b.dataset.mode === state.mode);
  $('urlForm').classList.toggle('hidden', state.mode !== 'site');
  const site = state.mode === 'site';
  frame.style.display = site ? '' : 'none';
  if (site && !reloadPending && frame.getAttribute('src') !== state.url && state.url) frame.src = state.url;
  // Outside URL mode the site is unloaded, so it can't keep running (music, video, scripts) in
  // the background; coming back to URL mode opens the address again.
  if (!site && frame.getAttribute('src') && frame.getAttribute('src') !== 'about:blank') frame.src = 'about:blank';
  syncCaptureTracks();
  const host = site && !state.blockedDismissed ? blockedHost(state.url) : null;
  blocked.classList.toggle('hidden', !host);
  if (host) $('blockedHost').textContent = host;

  if (site) {
    if (siteStream && video.srcObject !== siteStream) attachVideo(siteStream);
    canvas.style.display = siteStream && state.crtOn ? 'block' : 'none';
    lite.style.display = !siteStream && state.crtOn ? 'block' : 'none';
    siteHint.classList.toggle('hidden', !!siteStream || !state.crtOn || state.hintDismissed);
    center.classList.add('hidden');
  } else if (state.mode === 'capture') {
    if (capStream && video.srcObject !== capStream) attachVideo(capStream);
    canvas.style.display = 'block';
    lite.style.display = 'none';
    siteHint.classList.add('hidden');
    center.classList.toggle('hidden', !!capStream);
  } else {
    canvas.style.display = 'block';
    lite.style.display = 'none';
    siteHint.classList.add('hidden');
    center.classList.add('hidden');
  }
  $('cropGroup').classList.toggle('hidden', state.mode !== 'capture');
  applyScreenSize(); // 창에 맞춤 follows the captured window's shape only in 창 mode
  $('url').value = originalUrl;
  syncUI();
  save();
  layoutHeader();
}

// ---------------------------------------------------------------- header layout
// The header is one row that never wraps. When space runs out, in order:
// URL field shrinks to ~8 chars -> logo folds -> shader select shrinks to ~3 chars -> select shows only its arrow.
const bar = $('bar'), urlInput = $('url'), urlForm = $('urlForm');
const measureCtx = document.createElement('canvas').getContext('2d');
function textWidth(text, el) {
  const cs = getComputedStyle(el);
  measureCtx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  return measureCtx.measureText(text).width;
}

function layoutHeader() {
  if (bar.classList.contains('hidden') || bar.classList.contains('url-focus')) return;
  bar.classList.remove('fold', 'sel-v');
  presetSel.style.width = '';

  const site = state.mode === 'site';
  const cs = getComputedStyle(bar);
  const inner = bar.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  const gap = parseFloat(cs.columnGap) || 8;
  const outer = el => el.getBoundingClientRect().width + parseFloat(getComputedStyle(el).marginRight || 0);

  // horizontal padding+border of the field / select, measured once per call
  const urlChrome = 22, selChrome = 10 + 28 + 2;
  const urlMin = Math.ceil(textWidth('abcdefgh', urlInput) + urlChrome); // ~8 URL characters
  urlInput.style.minWidth = urlMin + 'px';

  const logo = bar.querySelector('.logo');
  const fixed = outer($('modes')) + outer($('toggleCrt')) + outer($('toggleSettings'))
    + (site ? outer(urlForm.querySelector('button')) : 0)
    + gap * (site ? 4 : 3);
  const urlNeed = site ? urlMin : 0;
  const selFull = presetSel.getBoundingClientRect().width;

  let tight = inner - fixed - outer(logo) - selFull < urlNeed;
  if (tight) {
    bar.classList.add('fold');
    const room = inner - fixed - outer(logo) - urlNeed; // what's left for the select
    if (room < selFull) {
      const selMin = Math.ceil(textWidth('가나다', presetSel) + selChrome); // ~3 characters
      if (room >= selMin) presetSel.style.width = Math.floor(room) + 'px';
      else bar.classList.add('sel-v');
    }
  }
  bar.dataset.tight = tight ? '1' : '';
}
window.addEventListener('resize', layoutHeader);
document.fonts?.ready.then(layoutHeader);

// A minimum-size URL field takes over the whole row while it's being edited.
urlForm.addEventListener('focusin', () => {
  if (bar.dataset.tight) bar.classList.add('url-focus');
});
urlForm.addEventListener('focusout', e => {
  if (urlForm.contains(e.relatedTarget)) return;
  bar.classList.remove('url-focus');
  layoutHeader();
});
// Like a browser address bar: focusing the field selects all of it. The mouseup that ends the
// focusing click would collapse the selection, so swallow that one mouseup.
let urlJustFocused = false;
urlInput.addEventListener('focus', () => { urlInput.select(); urlJustFocused = true; });
urlInput.addEventListener('mouseup', e => { if (urlJustFocused) { e.preventDefault(); urlJustFocused = false; } });
urlInput.addEventListener('blur', () => { urlJustFocused = false; });

// keep focus in the field when pressing 열기, so the layout doesn't jump mid-click
urlForm.querySelector('button').addEventListener('mousedown', e => e.preventDefault());

for (const b of document.querySelectorAll('#modes button')) {
  b.addEventListener('click', () => {
    // 창 again while already in 창 mode: pick a (different) screen to capture
    if (b.dataset.mode === 'capture' && state.mode === 'capture') { startCapture(); return; }
    state.mode = b.dataset.mode;
    // dismissed notices come back on mode change; applyMode shows them only if still relevant
    state.hintDismissed = false;
    state.blockedDismissed = false;
    applyMode();
  });
}

$('urlForm').addEventListener('submit', e => { e.preventDefault(); openUrl($('url').value); $('url').blur(); });
$('startElem').addEventListener('click', startElementCapture);
$('startCap').addEventListener('click', startCapture);
$('dismissHint').addEventListener('click', () => { state.hintDismissed = true; applyMode(); });
$('dismissBlocked').addEventListener('click', () => { state.blockedDismissed = true; applyMode(); });
$('openInTab').addEventListener('click', () => {
  // window.open uses up the click's user activation, so the capture picker is a second click
  window.open(originalUrl, '_blank', 'noopener');
  state.mode = 'capture';
  applyMode();
});

function toggleCrt() { state.crtOn = !state.crtOn; applyMode(); updateCaptureConstraints(); }
function setSettingsOpen(open) {
  $('settings').classList.toggle('hidden', !open);
  $('toggleSettings').classList.toggle('on', open); // * button filled while the panel is open
}
function toggleSettings() { setSettingsOpen($('settings').classList.contains('hidden')); }

// Close the panel when clicking anywhere in the area left of it (below the header).
document.querySelector('main').addEventListener('pointerdown', e => {
  if (!$('settings').classList.contains('hidden') && !$('settings').contains(e.target)) setSettingsOpen(false);
});
// Clicks inside the site iframe never reach this page; they show up as the iframe taking focus.
window.addEventListener('blur', () => {
  setTimeout(() => { if (document.activeElement === frame) setSettingsOpen(false); }, 0);
});
function toggleFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen();
  else stage.requestFullscreen().catch(() => {});
}
$('toggleCrt').addEventListener('click', toggleCrt);
$('toggleSettings').addEventListener('click', toggleSettings);

const shortcutsBox = $('shortcutsOn');
shortcutsBox.checked = !!state.shortcuts;
shortcutsBox.addEventListener('change', () => { state.shortcuts = shortcutsBox.checked; save(); });

// ---------------------------------------------------------------- CRT area size
// A page can't resize the browser window itself, so these pin the CRT area (#screen) to a
// fixed CSS-pixel size centered in the stage. If the window is too small, it's scaled down
// keeping the aspect ratio.
const SCREEN_SIZES = ['fit', '800x600', '1024x768', '1280x960'];
const sizesEl = $('sizes');
for (const s of SCREEN_SIZES) {
  const b = document.createElement('button');
  b.dataset.size = s;
  b.textContent = s === 'fit' ? '창에 맞춤' : s.replace('x', ' × ');
  b.addEventListener('click', () => { state.screenSize = s; applyScreenSize(); save(); });
  sizesEl.append(b);
}

let screenScaled = false;
// Aspect ratio (w/h) of the source picture: the captured window after the edge crop in 창 mode,
// the 4:3 demo picture in 데모 mode; null while 창 mode has no capture. Set by draw() when it
// changes (capture started, window resized, crop changed, mode switched).
let capAspect = null;

function applyScreenSize() {
  if (!SCREEN_SIZES.includes(state.screenSize)) state.screenSize = 'fit'; // e.g. a removed size saved earlier
  const fixed = state.screenSize && state.screenSize !== 'fit';
  // 창에 맞춤 in 창/데모 mode: shape the CRT area like the source picture, so there are no
  // empty bars inside the CRT
  const matchCapture = !fixed && (state.mode === 'capture' || state.mode === 'demo') && capAspect;
  stage.classList.toggle('fixed', !!(fixed || matchCapture));
  screenScaled = false;
  const cs = getComputedStyle(stage);
  const aw = stage.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  const ah = stage.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  if (matchCapture) {
    const w = Math.min(aw, ah * capAspect);
    screenEl.style.width = Math.floor(w) + 'px';
    screenEl.style.height = Math.floor(w / capAspect) + 'px';
  } else if (!fixed) {
    screenEl.style.width = screenEl.style.height = '';
  } else {
    const [w, h] = state.screenSize.split('x').map(Number);
    const s = Math.min(1, aw / w, ah / h);
    screenScaled = s < 1;
    screenEl.style.width = Math.floor(w * s) + 'px';
    screenEl.style.height = Math.floor(h * s) + 'px';
  }
  for (const b of sizesEl.children) b.classList.toggle('on', b.dataset.size === (state.screenSize || 'fit'));
  updateSizeReadout();
}

function updateSizeReadout() {
  $('winSize').textContent = `${innerWidth} × ${innerHeight}`;
  $('crtSize').textContent = `${screenEl.clientWidth} × ${screenEl.clientHeight}` + (screenScaled ? ' (축소됨)' : '');
}

// ---------------------------------------------------------------- room reflection controls
const reflType = $('reflType'), reflStr = $('reflStr');
REFLECT_TYPES.forEach((name, i) => {
  const b = document.createElement('button');
  b.textContent = name;
  b.addEventListener('click', () => { state.reflect.type = i; syncReflectUI(); invalidate(); save(); });
  reflType.append(b);
});
function syncReflectUI() {
  [...reflType.children].forEach((b, i) => b.classList.toggle('on', i === state.reflect.type));
  reflStr.value = state.reflect.strength;
  $('reflStrVal').textContent = (+state.reflect.strength).toFixed(2);
  $('reflStrWrap').style.display = state.reflect.type > 0 ? '' : 'none';
}
reflStr.addEventListener('input', () => { state.reflect.strength = +reflStr.value; syncReflectUI(); invalidate(); save(); });
syncReflectUI();

// ---------------------------------------------------------------- 창 mode edge crop
const CROP_SIDES = [['t', '위'], ['b', '아래'], ['l', '왼쪽'], ['r', '오른쪽']];
const cropInputs = {};
for (const [k, label] of CROP_SIDES) {
  const wrap = document.createElement('div');
  wrap.className = 'ctl';
  const lab = document.createElement('label');
  const name = document.createElement('span'); name.textContent = label;
  const val = document.createElement('span');
  lab.append(name, val);
  const input = document.createElement('input');
  input.type = 'range'; input.min = 0; input.max = 200; input.step = 1;
  input.addEventListener('input', () => { state.cropPx[k] = +input.value; syncCropUI(); invalidate(); save(); });
  wrap.append(lab, input);
  $('cropControls').append(wrap);
  cropInputs[k] = { input, val };
}
function syncCropUI() {
  for (const [k] of CROP_SIDES) {
    const v = Math.round(+state.cropPx[k] || 0);
    cropInputs[k].input.value = v;
    cropInputs[k].val.textContent = v + 'px';
  }
}
// 제목 표시줄 빼기 always sets the fixed title-bar crop (46/1/1/1); 초기화 clears every side.
$('cropTitle').addEventListener('click', () => {
  state.cropPx = { ...CROP_DEFAULT };
  syncCropUI(); invalidate(); save();
});
$('cropReset').addEventListener('click', () => {
  state.cropPx = { l: 0, t: 0, r: 0, b: 0 };
  syncCropUI(); invalidate(); save();
});

// ---------------------------------------------------------------- foldable settings groups
// Click a group title to fold/unfold it. The folded set is saved, so it survives closing the
// panel and reloading the page.
// "[ 셰이더 v ]" folded / "[ 셰이더 ^ ]" open; the v/^ is a 1px-line SVG like the dropdown arrow
function renderGroupTitle(g) {
  const h = g.querySelector('.gh');
  const d = g.classList.contains('folded') ? 'M.5 .5L4.5 4.5L8.5 .5' : 'M.5 4.5L4.5 .5L8.5 4.5';
  h.innerHTML = `[ ${h.dataset.title} <svg class="chev" viewBox="0 0 9 5" aria-hidden="true">`
    + `<path d="${d}" fill="none" stroke="currentColor" stroke-width="1"/></svg> ]`;
}
for (const g of document.querySelectorAll('aside .group')) {
  g.classList.toggle('folded', !!state.folded[g.dataset.group]);
  renderGroupTitle(g);
  g.querySelector('.gh').addEventListener('click', () => {
    const folded = g.classList.toggle('folded');
    state.folded = { ...state.folded, [g.dataset.group]: folded };
    renderGroupTitle(g);
    save();
  });
}
syncCropUI();

// ---------------------------------------------------------------- monitor bezel
// An aged beige 80s/90s PC monitor drawn around the CRT area on a 2D canvas over the stage, made
// to look like an old photo of a real monitor: yellowed plastic lit from the top-left, bevels,
// a recessed screen opening, grime, then a slight blur, film grain and a vignette.
// The CRT area keeps its size; the frame extends outward and may be cut off at the window edge.
// It is redrawn only when sizes change (no per-frame cost) and lets clicks through.
// The opening follows the picture's outline as the CRT shader draws it. For now the outline
// is computed with the 아케이드 preset's values; using state.params here instead would make it
// follow the current settings.
const BEZEL_SHAPE = { curv: 0.05, corner: 0.07, bloom: 0.55 };
const bezelCanvas = $('bezel');

// Frame thickness (CSS px) from the CRT area size; the bottom "chin" is thicker.
function bezelWidths(S) {
  const b = Math.round(Math.min(110, Math.max(26, Math.min(S.w, S.h) * 0.09)));
  return { b, bottom: Math.round(b * 1.8) };
}

// Is a point inside the picture? p: screen position, -1..1 on both axes (y up). Mirrors the
// curvature / border / squircle-corner math in CRT_FRAG.
function insidePicture(px, py, sh) {
  let cx = px * (1 + 0.06 * sh.bloom), cy = py * (1 + 0.06 * sh.bloom);
  const k = (1 + sh.curv * (cx * cx + cy * cy)) / (1 + sh.curv);
  cx *= k; cy *= k;
  const rc = sh.corner * 1.5;
  const qx = Math.abs(cx) - (1 - rc), qy = Math.abs(cy) - (1 - rc);
  const mx = Math.max(qx, 0), my = Math.max(qy, 0);
  return Math.sqrt(Math.sqrt(mx ** 4 + my ** 4)) + Math.min(Math.max(qx, qy), 0) - rc < 0;
}

// Picture outline as a polygon in stage pixels (binary search along rays from the center).
function pictureOutline(S, sh) {
  const pts = [];
  for (let i = 0; i < 360; i++) {
    const a = i / 360 * Math.PI * 2, dx = Math.cos(a), dy = Math.sin(a);
    let lo = 0, hi = 1.6;
    for (let j = 0; j < 22; j++) { const mid = (lo + hi) / 2; if (insidePicture(dx * mid, dy * mid, sh)) lo = mid; else hi = mid; }
    pts.push([S.x + (dx * lo * 0.5 + 0.5) * S.w, S.y + (0.5 - dy * lo * 0.5) * S.h]);
  }
  return pts;
}

// small seeded random, so grime spots stay put between redraws
function seeded(seed) {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}

let bezelQueued = false;
function drawBezel() {           // coalesce bursts (e.g. while the window is being resized)
  if (bezelQueued) return;
  bezelQueued = true;
  requestAnimationFrame(() => { bezelQueued = false; paintBezel(); });
}

function paintBezel() {
  bezelCanvas.style.display = state.bezel ? 'block' : 'none';
  if (!state.bezel) return;
  const dpr = window.devicePixelRatio || 1;
  const W = stage.clientWidth, H = stage.clientHeight;
  const PW = Math.round(W * dpr), PH = Math.round(H * dpr);
  const off = document.createElement('canvas');
  off.width = PW; off.height = PH;
  const c = off.getContext('2d');
  c.setTransform(dpr, 0, 0, dpr, 0, 0);

  const sr = screenEl.getBoundingClientRect(), st = stage.getBoundingClientRect();
  const S = { x: sr.left - st.left, y: sr.top - st.top, w: sr.width, h: sr.height };
  const { b, bottom } = bezelWidths(S);
  const cx = S.x + S.w / 2, cy = S.y + S.h / 2;
  const L = S.x - b, T = S.y - b, R = S.x + S.w + b, B = S.y + S.h + bottom;
  const rnd = seeded(1987);
  const lin = (x0, y0, x1, y1, stops) => {
    const g = c.createLinearGradient(x0, y0, x1, y1);
    stops.forEach(([o, col]) => g.addColorStop(o, col));
    return g;
  };
  const roomLight = (x, y, r, a) => {          // warm light falling from the top-left
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(255,236,200,${a})`); g.addColorStop(1, 'rgba(255,236,200,0)');
    return g;
  };
  const caseRect = () => { c.beginPath(); c.roundRect(L, T, R - L, B - T, b * 0.5); };
  const fi = b * 0.38;                          // front bezel inset from the case edge
  const frontRect = () => { c.beginPath(); c.roundRect(L + fi, T + fi, R - L - 2 * fi, B - T - 2 * fi, b * 0.32); };
  const outline = pictureOutline(S, BEZEL_SHAPE);
  const ringPath = grow => {
    c.beginPath();
    outline.forEach(([x, y], i) => {
      const vx = x - cx, vy = y - cy, len = Math.hypot(vx, vy) || 1;
      const gx = x + vx / len * grow, gy = y + vy / len * grow;
      i ? c.lineTo(gx, gy) : c.moveTo(gx, gy);
    });
    c.closePath();
  };

  // 1. case shell: yellowed beige, darker toward the bottom and right, lit from the top-left
  caseRect();
  c.fillStyle = lin(0, T, 0, B, [[0, '#d6cbab'], [0.45, '#c8bb97'], [1, '#a2957a']]); c.fill();
  c.fillStyle = lin(L, 0, R, 0, [[0, 'rgba(0,0,0,0)'], [0.65, 'rgba(0,0,0,0)'], [1, 'rgba(50,38,15,0.22)']]); c.fill();
  c.fillStyle = roomLight(L + (R - L) * 0.18, T, Math.max(R - L, B - T) * 0.9, 0.35); c.fill();
  // rounded outer edge: light on top/left, shadow on bottom/right
  c.lineWidth = Math.max(1.5, b * 0.06);
  c.strokeStyle = lin(L, T, R, B, [[0, 'rgba(255,250,235,0.6)'], [0.5, 'rgba(255,250,235,0.1)'], [1, 'rgba(45,35,15,0.55)']]);
  caseRect(); c.stroke();

  // 2. front bezel: separate plastic part with a parting seam around it
  frontRect();
  c.fillStyle = lin(0, T, 0, B, [[0, '#ddd3b6'], [0.5, '#cfc3a1'], [1, '#b2a585']]); c.fill();
  c.fillStyle = roomLight(L + (R - L) * 0.2, T + fi, Math.max(R - L, B - T) * 0.8, 0.3); c.fill();
  c.lineWidth = 1.4; c.strokeStyle = 'rgba(60,48,25,0.6)'; frontRect(); c.stroke();
  c.save(); c.translate(0.8, 1); c.lineWidth = 1; c.strokeStyle = 'rgba(255,248,228,0.35)'; frontRect(); c.stroke(); c.restore();

  // 3. aging: sun-yellowed top, grime spots (mostly low down), all clipped to the case
  c.save(); caseRect(); c.clip();
  c.fillStyle = lin(0, T, 0, T + (B - T) * 0.5, [[0, 'rgba(190,150,60,0.16)'], [1, 'rgba(190,150,60,0)']]);
  c.fillRect(L, T, R - L, B - T);
  for (let i = 0; i < 70; i++) {
    const x = L + rnd() * (R - L), y = T + Math.pow(rnd(), 0.6) * (B - T);
    const r = b * (0.05 + rnd() * 0.35);
    c.beginPath(); c.ellipse(x, y, r * (1 + rnd()), r, rnd() * Math.PI, 0, Math.PI * 2);
    c.fillStyle = `rgba(${70 + rnd() * 40 | 0},${55 + rnd() * 30 | 0},25,${0.02 + rnd() * 0.05})`; c.fill();
  }
  c.restore();

  // 4. screen opening: a recess that slopes into the case (shadowed at the top, catching light
  //    at the bottom), the dark glass gap, then the hole the picture shows through
  const recess = b * 0.55, steps = 10;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    ringPath(recess * (1 - t));
    const v = Math.round(200 - t * 95);
    c.fillStyle = `rgb(${v},${v - 9},${v - 32})`; c.fill();
  }
  c.save(); ringPath(recess); c.clip();
  c.fillStyle = lin(0, S.y - recess, 0, S.y + S.h + recess, [[0, 'rgba(20,14,5,0.45)'], [0.5, 'rgba(0,0,0,0)'], [1, 'rgba(255,240,210,0.28)']]);
  c.fillRect(L, T, R - L, B - T);
  c.restore();
  ringPath(b * 0.12);
  c.fillStyle = lin(0, S.y, 0, S.y + S.h, [[0, '#101012'], [1, '#1d1c1b']]); c.fill();
  // faint reflection on the glass gap at the top-left
  c.save(); ringPath(b * 0.12); c.clip();
  const gl = c.createRadialGradient(S.x + S.w * 0.15, S.y, 0, S.x + S.w * 0.15, S.y, S.w * 0.35);
  gl.addColorStop(0, 'rgba(255,245,225,0.18)'); gl.addColorStop(1, 'rgba(255,245,225,0)');
  c.fillStyle = gl; c.fillRect(L, T, R - L, B - T);
  c.restore();
  c.globalCompositeOperation = 'destination-out';
  ringPath(0); c.fillStyle = '#000'; c.fill();
  c.globalCompositeOperation = 'source-over';

  // 5. chin: "webCRT" engraved into the plastic on the left (no plate; "CRT" painted red, green
  //    and blue inside the engraving), engraved speaker grille on the right
  const chinY = S.y + S.h + (bottom - fi) * 0.5 + fi * 0.2;
  const u = bottom / 30;
  const fs = Math.max(7, 4.6 * u);
  c.font = `bold ${fs}px Arial, sans-serif`; c.textBaseline = 'middle';
  let lx = S.x + 6 * u;
  for (const [t, paint] of [['web', '#9d906f'], ['C', '#d8322e'], ['R', '#2e9e45'], ['T', '#2f5fd0']]) {
    c.fillStyle = 'rgba(255,248,226,0.75)'; c.fillText(t, lx, chinY + fs * 0.036);  // lit lower lip
    c.fillStyle = 'rgba(55,44,24,0.85)'; c.fillText(t, lx, chinY - fs * 0.014);     // shadowed upper wall
    c.fillStyle = paint; c.fillText(t, lx, chinY + fs * 0.009);                      // floor of the cut
    lx += c.measureText(t).width;
  }
  // speaker grille: rows of short slots cut into the plastic. Each slot: a dark hole whose
  // upper inner wall is in shadow, with light catching its lower lip.
  const rows = 3, cols = 9;
  const sw = 4.2 * u, sh = 1.3 * u, gx = 2.2 * u, gy = 1.9 * u;
  const gw = cols * sw + (cols - 1) * gx, gh = rows * sh + (rows - 1) * gy;
  const gx0 = S.x + S.w - 6 * u - gw, gy0 = chinY - gh / 2;
  for (let r = 0; r < rows; r++) {
    for (let k = 0; k < cols; k++) {
      const x = gx0 + k * (sw + gx), y = gy0 + r * (sh + gy);
      c.beginPath(); c.roundRect(x, y + sh * 0.35, sw, sh, sh / 2);       // lit lower lip
      c.fillStyle = 'rgba(255,246,222,0.45)'; c.fill();
      c.beginPath(); c.roundRect(x, y, sw, sh, sh / 2);                    // the hole
      c.fillStyle = lin(0, y, 0, y + sh, [[0, '#2a2216'], [1, '#5a4d36']]); c.fill();
    }
  }

  // 6. photo look: slight blur, warm cast, vignette and film grain
  bezelCanvas.width = PW; bezelCanvas.height = PH;
  const m = bezelCanvas.getContext('2d');
  m.filter = `blur(${0.7 * dpr}px)`;
  m.drawImage(off, 0, 0);
  m.filter = 'none';
  const img = m.getImageData(0, 0, PW, PH), d = img.data;
  const vx0 = (L + R) / 2 * dpr, vy0 = (T + B) / 2 * dpr;
  const vmax = Math.hypot((R - L) / 2, (B - T) / 2) * dpr;
  for (let y = 0; y < PH; y++) {
    for (let x = 0, i = y * PW * 4; x < PW; x++, i += 4) {
      if (d[i + 3] === 0) continue;
      const rr = Math.hypot(x - vx0, y - vy0) / vmax;
      const v = 1 - 0.3 * rr * rr;
      const n = (Math.random() - 0.5) * 16;
      d[i] = d[i] * 1.03 * v + n;
      d[i + 1] = d[i + 1] * v + n;
      d[i + 2] = d[i + 2] * 0.93 * v + n;
    }
  }
  m.putImageData(img, 0, 0);
}

// CRT 바깥 여백: the stage padding around the CRT area (20-100 px). Changing it resizes the
// stage's content box, which the observer below picks up to refit the CRT area. The bezel
// doesn't take any of this space: it is drawn over it and beyond.
const marginInput = $('stageMargin');
function applyMargin() {
  const m = Math.min(100, Math.max(20, Math.round(+state.margin || 20)));
  stage.style.padding = m + 'px';
  marginInput.value = m;
  $('marginVal').textContent = m + 'px';
}
marginInput.addEventListener('input', () => { state.margin = +marginInput.value; applyMargin(); save(); });
applyMargin();

const bezelBox = $('bezelOn');
bezelBox.checked = !!state.bezel;
bezelBox.addEventListener('change', () => { state.bezel = bezelBox.checked; drawBezel(); save(); });

new ResizeObserver(applyScreenSize).observe(stage);   // window resized -> refit
new ResizeObserver(() => { updateSizeReadout(); drawBezel(); }).observe(screenEl);
window.addEventListener('resize', () => { updateSizeReadout(); drawBezel(); });
applyScreenSize();
drawBezel();

document.addEventListener('keydown', e => {
  // Esc always brings a hidden header back, even with shortcuts off
  if (e.key === 'Escape' && bar.classList.contains('hidden')) { bar.classList.remove('hidden'); layoutHeader(); return; }
  if (!state.shortcuts) return;
  if (e.target.matches('input[type=text], select') || e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key.toLowerCase();
  if (k === 'c') toggleCrt();
  else if (k === 's') toggleSettings();
  else if (k === 'f') toggleFullscreen();
  else if (k === 'h') { bar.classList.toggle('hidden'); layoutHeader(); }
  else if (k === '[' || k === ']') {
    const i = PRESETS.findIndex(p => p.id === state.presetId);
    setPreset(PRESETS[(i + (k === ']' ? 1 : PRESETS.length - 1)) % PRESETS.length].id);
  }
});

// a URL in the address bar (?url=) may need the YouTube conversion too
if (state.mode === 'site' && state.url) {
  originalUrl = qs.get('url') || state.url;
  state.url = toYouTubeEmbed(originalUrl) || originalUrl;
}
applyMode();
