// Arcane Kitchen — main.js
// One job: wire the canvas, the loop and the input together, and stage a
// screenshot scene when the URL asks for one (?shot=play&seed=1).

import { VIEW } from './config.js';
import { handleClick, handleKey } from './input.js';
import { drawGame } from './render.js';
import { stageShot } from './shots.js';
import { createWorld, stepWorld } from './world.js';
import { sfx, toggleMute } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW.width;
canvas.height = VIEW.height;

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seed = Number(params.get('seed') || '1');

let state = createWorld(20261125);
let shotMode = false;
if (shotName) {
  state = stageShot(shotName, seed);
  shotMode = true;
}

function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * VIEW.width,
    y: ((event.clientY - rect.top) / rect.height) * VIEW.height,
  };
}

canvas.addEventListener('click', (event) => {
  if (shotMode) return;
  const point = canvasPoint(event);
  const before = state.served;
  const next = handleClick(state, point.x, point.y);
  if (next && typeof next === 'object' && next.screen) state = next;
  if (state.served > before) sfx.serve();
  else if (state.plate) sfx.ready();
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'm' || event.key === 'M') {
    toggleMute();
    return;
  }
  if (shotMode) return;
  const before = state.served;
  const next = handleKey(state, event.key);
  if (next && typeof next === 'object' && next.screen) state = next;
  if (state.served > before) sfx.serve();
  if (event.key === ' ') event.preventDefault();
});

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!shotMode) {
    const events = stepWorld(state, dt);
    if (events & 2) sfx.district();
    if (events & 4) sfx.ready();
    if (events & 8) sfx.bad();
  }
  drawGame(ctx, state);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
