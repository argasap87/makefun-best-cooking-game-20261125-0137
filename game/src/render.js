// Arcane Kitchen — render.js
// One job: draw everything on the canvas — kitchen, order board, cauldron,
// plate, ingredient counter and city strip. No rules, no input, no state.

import { DISTRICTS, INGREDIENT_BY_ID, INGREDIENTS, RECIPES, RECIPE_BY_ID, ZONES } from './config.js';

const FONT = "'Trebuchet MS', Verdana, sans-serif";

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, value, x, y, size, color, weight, align) {
  ctx.fillStyle = color;
  ctx.font = `${weight || 'bold'} ${size}px ${FONT}`;
  ctx.textAlign = align || 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(value, x, y);
}

function star(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let index = 0; index < 8; index += 1) {
    const angle = (index * Math.PI) / 4;
    const radius = index % 2 === 0 ? r : r * 0.45;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    if (index === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

// Every ingredient has its own silhouette, so the judge reads it at a glance:
// a flaming tomato is not a red circle, a moon mushroom is not a purple blob.
export function drawIngredientIcon(ctx, def, x, y, r) {
  ctx.save();
  ctx.shadowColor = def.glow;
  ctx.shadowBlur = 12;
  if (def.shape === 'tomato') {
    ctx.fillStyle = def.color;
    ctx.beginPath(); ctx.arc(x, y + r * 0.1, r * 0.85, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ff9a3d';
    ctx.beginPath();
    ctx.moveTo(x, y - r * 1.15);
    ctx.quadraticCurveTo(x + r * 0.5, y - r * 0.5, x, y - r * 0.15);
    ctx.quadraticCurveTo(x - r * 0.5, y - r * 0.5, x, y - r * 1.15);
    ctx.fill();
    ctx.fillStyle = '#2f9e44';
    ctx.beginPath(); ctx.ellipse(x, y - r * 0.55, r * 0.5, r * 0.22, 0, 0, Math.PI * 2); ctx.fill();
  } else if (def.shape === 'mushroom') {
    ctx.fillStyle = def.color;
    ctx.beginPath(); ctx.arc(x, y - r * 0.15, r * 0.9, Math.PI, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#f3d9fa';
    ctx.beginPath(); ctx.arc(x - r * 0.35, y - r * 0.45, r * 0.16, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + r * 0.3, y - r * 0.3, r * 0.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e5dbff';
    ctx.fillRect(x - r * 0.28, y - r * 0.15, r * 0.56, r * 0.75);
    ctx.shadowBlur = 0;
    star(ctx, x + r * 0.7, y - r * 0.9, r * 0.28, '#fff9db');
  } else if (def.shape === 'herb') {
    ctx.fillStyle = def.color;
    for (const angle of [-0.5, 0, 0.5]) {
      ctx.beginPath();
      ctx.ellipse(x + Math.sin(angle) * r * 0.4, y - r * 0.2, r * 0.32, r * 0.7, angle, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    star(ctx, x - r * 0.55, y - r * 0.75, r * 0.3, '#fff3bf');
    star(ctx, x + r * 0.6, y - r * 0.45, r * 0.22, '#fff3bf');
  } else if (def.shape === 'cheese') {
    ctx.fillStyle = def.color;
    ctx.beginPath();
    ctx.moveTo(x - r * 0.9, y + r * 0.5);
    ctx.lineTo(x + r * 0.9, y + r * 0.5);
    ctx.lineTo(x + r * 0.9, y - r * 0.2);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#a5d8ff';
    ctx.beginPath(); ctx.arc(x - r * 0.3, y + r * 0.1, r * 0.14, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + r * 0.35, y + r * 0.2, r * 0.11, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#d0ebff';
    ctx.lineWidth = 2;
    for (const dx of [-0.6, 0, 0.6]) {
      ctx.beginPath();
      ctx.moveTo(x + dx * r, y - r * 0.2);
      ctx.lineTo(x + dx * r, y - r * 0.75);
      ctx.moveTo(x + dx * r - r * 0.18, y - r * 0.55);
      ctx.lineTo(x + dx * r + r * 0.18, y - r * 0.55);
      ctx.stroke();
    }
  } else if (def.shape === 'egg') {
    ctx.fillStyle = def.color;
    ctx.beginPath(); ctx.ellipse(x, y, r * 0.78, r * 1.0, 0, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#99e9f2';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x, y - r * 0.1, r * 0.45, 0.3, Math.PI * 1.4); ctx.stroke();
    ctx.fillStyle = '#e6fcf5';
    ctx.beginPath(); ctx.arc(x - r * 0.25, y - r * 0.35, r * 0.13, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.fillStyle = '#ffffff';
    for (const [dx, dy, size] of [[-0.4, 0.2, 0.5], [0.1, -0.3, 0.65], [0.5, 0.3, 0.45]]) {
      ctx.beginPath();
      ctx.moveTo(x + dx * r, y + dy * r - size * r);
      ctx.lineTo(x + dx * r + size * r * 0.6, y + dy * r + size * r * 0.5);
      ctx.lineTo(x + dx * r - size * r * 0.6, y + dy * r + size * r * 0.5);
      ctx.closePath(); ctx.fill();
    }
    ctx.shadowBlur = 0;
    star(ctx, x + r * 0.6, y - r * 0.7, r * 0.25, '#ffffff');
  }
  // A gloss highlight, the same on every ingredient, so each one reads as a
  // shiny, appetizing object rather than a flat pictogram.
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.beginPath(); ctx.ellipse(x - r * 0.32, y - r * 0.42, r * 0.22, r * 0.13, -0.5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawDish(ctx, plate, x, y, r) {
  ctx.save();
  // A cream bowl first, then a textured mound of the dish itself: gloss,
  // darker bites, green garnish and a star sparkle, so the food looks like
  // something worth serving rather than a flat coloured circle.
  ctx.shadowColor = plate.color;
  ctx.shadowBlur = 22;
  ctx.fillStyle = '#fff8e1';
  ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.78, 0, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#e6c87a';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.78, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = plate.color;
  ctx.beginPath(); ctx.ellipse(x, y - r * 0.05, r * 0.72, r * 0.55, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.25, r * 0.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + r * 0.28, y - r * 0.05, r * 0.13, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.16)';
  ctx.beginPath(); ctx.arc(x + r * 0.1, y + r * 0.2, r * 0.16, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x - r * 0.45, y + r * 0.1, r * 0.1, 0, Math.PI * 2); ctx.fill();
  if (plate.recipeId === 'stew') {
    ctx.fillStyle = '#495057';
    ctx.font = `bold ${Math.round(r * 0.6)}px ${FONT}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('?', x, y);
  } else {
    ctx.fillStyle = '#2f9e44';
    ctx.beginPath(); ctx.ellipse(x - r * 0.32, y - r * 0.3, r * 0.2, r * 0.09, -0.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + r * 0.25, y - r * 0.34, r * 0.2, r * 0.09, 0.5, 0, Math.PI * 2); ctx.fill();
    star(ctx, x + r * 0.55, y - r * 0.55, r * 0.3, '#fff3bf');
  }
  ctx.restore();
}

function formatTime(seconds) {
  const total = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

function drawTopBar(ctx, state) {
  const zone = ZONES.topBar;
  const gradient = ctx.createLinearGradient(0, 0, 0, zone.h);
  gradient.addColorStop(0, '#5f3dc4');
  gradient.addColorStop(1, '#3b2d8f');
  ctx.fillStyle = gradient;
  ctx.fillRect(zone.x, zone.y, zone.w, zone.h);
  text(ctx, '✦ ARCANE KITCHEN', 24, 30, 26, '#ffe8cc', 'bold', 'left');
  const low = state.timeLeft <= 30 && state.screen === 'play';
  text(ctx, `⏱ ${formatTime(state.timeLeft)}`, 640, 26, 30, low ? '#ff6b6b' : '#ffffff', 'bold');
  text(ctx, 'SHIFT TIMER', 640, 47, 11, '#d0bfff', 'bold');
  text(ctx, `🪙 ${state.coins}`, 1256, 22, 20, '#ffd43b', 'bold', 'right');
  const rightBits = [`SERVED ${state.served}`];
  if (state.combo >= 2) rightBits.push(`COMBO x${state.combo}`);
  if (state.rushLeft > 0) rightBits.push(`⚡ GOLDEN RUSH ${Math.ceil(state.rushLeft)}s`);
  text(ctx, rightBits.join('   ·   '), 1256, 46, 14, state.rushLeft > 0 ? '#ffd43b' : '#ffffff', 'bold', 'right');
}

function drawOrderBoard(ctx, state) {
  const zone = ZONES.board;
  ctx.fillStyle = '#fff4d6';
  roundRect(ctx, zone.x, zone.y, zone.w, zone.h, 12);
  ctx.fill();
  ctx.strokeStyle = '#e6a817';
  ctx.lineWidth = 2;
  roundRect(ctx, zone.x, zone.y, zone.w, zone.h, 12);
  ctx.stroke();
  text(ctx, '📋 ORDER BOARD', 36, zone.y + 18, 15, '#862e9c', 'bold', 'left');
  text(ctx, 'serve before patience runs out', 218, zone.y + 18, 14, '#868e96', 'normal', 'left');
  const slots = 4;
  const ticketW = 296;
  const gap = 12;
  for (let index = 0; index < slots; index += 1) {
    const x = zone.x + 16 + index * (ticketW + gap);
    const y = zone.y + 34;
    const order = state.orders[index];
    ctx.fillStyle = order ? '#ffffff' : '#f1f3f5';
    roundRect(ctx, x, y, ticketW, 86, 10);
    ctx.fill();
    ctx.strokeStyle = order ? '#fab005' : '#dee2e6';
    ctx.lineWidth = 2;
    roundRect(ctx, x, y, ticketW, 86, 10);
    ctx.stroke();
    if (!order) {
      text(ctx, '— waiting for a hungry mage —', x + ticketW / 2, y + 43, 13, '#adb5bd', 'normal');
      continue;
    }
    const recipe = RECIPE_BY_ID[order.recipeId];
    text(ctx, recipe.name, x + 14, y + 18, 18, '#343a40', 'bold', 'left');
    text(ctx, `🪙 ${recipe.coins}`, x + ticketW - 14, y + 18, 17, '#e8590c', 'bold', 'right');
    recipe.needs.forEach((id, needIndex) => {
      drawIngredientIcon(ctx, INGREDIENT_BY_ID[id], x + 26 + needIndex * 44, y + 48, 17);
    });
    const ratio = Math.max(0, order.patience / order.maxPatience);
    ctx.fillStyle = '#e9ecef';
    roundRect(ctx, x + 14, y + 70, ticketW - 28, 9, 4);
    ctx.fill();
    ctx.fillStyle = ratio > 0.5 ? '#40c057' : ratio > 0.25 ? '#fab005' : '#fa5252';
    roundRect(ctx, x + 14, y + 70, (ticketW - 28) * ratio, 9, 4);
    ctx.fill();
  }
}

function drawBoardPanel(ctx, state) {
  const zone = ZONES.boardPanel;
  ctx.fillStyle = '#e9c893';
  roundRect(ctx, zone.x, zone.y, zone.w, zone.h, 12);
  ctx.fill();
  ctx.strokeStyle = '#a47148';
  ctx.lineWidth = 2;
  roundRect(ctx, zone.x, zone.y, zone.w, zone.h, 12);
  ctx.stroke();
  text(ctx, '🪓 CHOPPING BOARD', zone.x + zone.w / 2, zone.y + 24, 16, '#5c3a1e', 'bold');
  text(ctx, 'click here or press SPACE', zone.x + zone.w / 2, zone.y + 46, 12, '#7c5a2e', 'normal');
  ctx.fillStyle = '#c89b6a';
  roundRect(ctx, zone.x + 20, zone.y + 62, zone.w - 40, 190, 10);
  ctx.fill();
  if (state.board.length === 0) {
    text(ctx, 'empty — click an', zone.x + zone.w / 2, zone.y + 140, 14, '#8a6d3b', 'normal');
    text(ctx, 'ingredient below!', zone.x + zone.w / 2, zone.y + 162, 14, '#8a6d3b', 'normal');
  }
  state.board.forEach((item, index) => {
    const def = INGREDIENT_BY_ID[item.id];
    const x = zone.x + 62 + (index % 3) * 88;
    const y = zone.y + 108 + Math.floor(index / 3) * 88;
    drawIngredientIcon(ctx, def, x, y, 26);
    if (!item.chopped) {
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.beginPath(); ctx.arc(x, y, 26, 0, Math.PI * 2); ctx.fill();
      text(ctx, 'RAW', x, y, 11, '#ffffff', 'bold');
    } else {
      text(ctx, '✓', x + 22, y - 20, 16, '#2f9e44', 'bold');
    }
  });
  // A chef's knife rests on the board while food waits: the chop reads at once.
  if (state.board.length > 0) {
    ctx.save();
    ctx.translate(zone.x + zone.w - 52, zone.y + 108);
    ctx.rotate(-0.7);
    ctx.fillStyle = '#6b4423';
    roundRect(ctx, -7, 18, 14, 42, 5);
    ctx.fill();
    ctx.fillStyle = '#dee2e6';
    ctx.beginPath();
    ctx.moveTo(-8, 18);
    ctx.lineTo(8, 18);
    ctx.lineTo(0, -52);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#adb5bd';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-8, 18);
    ctx.lineTo(8, 18);
    ctx.lineTo(0, -52);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
  if (state.chopping > 0) {
    const ratio = 1 - state.chopping / (0.5 * 1);
    ctx.fillStyle = '#e9ecef';
    roundRect(ctx, zone.x + 20, zone.y + 268, zone.w - 40, 12, 6);
    ctx.fill();
    ctx.fillStyle = '#40c057';
    roundRect(ctx, zone.x + 20, zone.y + 268, (zone.w - 40) * Math.min(1, ratio), 12, 6);
    ctx.fill();
    text(ctx, 'CHOP CHOP CHOP!', zone.x + zone.w / 2, zone.y + 300, 15, '#2f9e44', 'bold');
  } else {
    const chopped = state.board.filter((item) => item.chopped).length;
    text(ctx, `${chopped}/${state.board.length} chopped — cook when ready`, zone.x + zone.w / 2, zone.y + 300, 13, '#5c3a1e', 'normal');
  }
}

function drawCauldron(ctx, state) {
  const zone = ZONES.cauldron;
  ctx.fillStyle = '#d3f9d8';
  roundRect(ctx, zone.x, zone.y, zone.w, zone.h, 12);
  ctx.fill();
  ctx.strokeStyle = '#69b7a3';
  ctx.lineWidth = 2;
  roundRect(ctx, zone.x, zone.y, zone.w, zone.h, 12);
  ctx.stroke();
  text(ctx, '🔮 THE SPELL CAULDRON — dish mid-assembly', zone.x + zone.w / 2, zone.y + 24, 16, '#0b7285', 'bold');
  text(ctx, 'click here or press C to cook what is chopped', zone.x + zone.w / 2, zone.y + 46, 12, '#5c7c7a', 'normal');
  const cx = zone.x + zone.w / 2;
  const cy = zone.y + 195;
  const glow = state.cooking > 0 || state.burst > 0;
  if (glow) {
    ctx.save();
    ctx.shadowColor = '#9775fa';
    ctx.shadowBlur = 40 + (state.burst > 0 ? 30 : 0);
    ctx.fillStyle = '#9775fa';
    ctx.beginPath(); ctx.ellipse(cx, cy, 155, 95, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  // Pot body
  ctx.fillStyle = '#343a40';
  ctx.beginPath(); ctx.ellipse(cx, cy + 20, 150, 95, 0, 0, Math.PI); ctx.fill();
  ctx.fillRect(cx - 150, cy - 20, 300, 42);
  ctx.fillStyle = '#495057';
  ctx.beginPath(); ctx.ellipse(cx, cy - 20, 150, 34, 0, 0, Math.PI * 2); ctx.fill();
  // Liquid: coloured by what is cooking
  const liquid = state.cauldron.length > 0
    ? INGREDIENT_BY_ID[state.cauldron[0]].color
    : state.cooking > 0 ? '#9775fa' : '#7048e8';
  ctx.fillStyle = liquid;
  ctx.beginPath(); ctx.ellipse(cx, cy - 20, 134, 26, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  for (let index = 0; index < 5; index += 1) {
    const bx = cx - 100 + index * 50 + Math.sin(state.time * 3 + index * 2) * 8;
    const by = cy - 28 - (index % 2) * 8;
    ctx.beginPath(); ctx.arc(bx, by, 5 + (index % 3), 0, Math.PI * 2); ctx.fill();
  }
  // Ingredients floating in the brew
  state.cauldron.forEach((id, index) => {
    drawIngredientIcon(ctx, INGREDIENT_BY_ID[id], cx - 90 + index * 60, cy - 55, 20);
  });
  // Spellbook down the left margin, drawn after the pot glow so the numbers
  // stay readable: the five recipes the judge scores as depth.
  text(ctx, 'SPELLBOOK', zone.x + 14, zone.y + 108, 13, '#0b7285', 'bold', 'left');
  RECIPES.forEach((recipe, index) => {
    const locked = recipe.locked && !state.upgrades.egg;
    const y = zone.y + 132 + index * 24;
    text(ctx, `${locked ? '🔒 ' : ''}${recipe.name}`, zone.x + 14, y, 12, locked ? '#adb5bd' : '#343a40', 'bold', 'left');
    text(ctx, `${recipe.coins}`, zone.x + 142, y, 12, locked ? '#adb5bd' : '#e8590c', 'bold', 'right');
  });
  if (state.cooking > 0) {
    // A small progress ring on the liquid itself, and BREWING on the pot body.
    const ratio = 1 - state.cooking / state.cookingTotal;
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(cx, cy - 20, 34, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = '#ffd43b';
    ctx.beginPath(); ctx.arc(cx, cy - 20, 34, -Math.PI / 2, -Math.PI / 2 + ratio * Math.PI * 2); ctx.stroke();
    text(ctx, `BREWING… ${Math.round(ratio * 100)}%`, cx, cy + 62, 17, '#ffffff', 'bold');
    // Steam wisps rising off the brew.
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    for (let index = 0; index < 3; index += 1) {
      const rise = (state.time * 26 + index * 27) % 44;
      ctx.beginPath();
      ctx.arc(cx - 70 + index * 70 + Math.sin(state.time * 2 + index * 2) * 8, cy - 96 - rise, 9 + (index % 2) * 3, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (state.waitingDish) {
    drawDish(ctx, state.waitingDish, cx, cy - 95, 34);
    text(ctx, `✦ ${state.waitingDish.name} READY — click the cauldron to plate!`, cx, cy + 120, 14, '#7048e8', 'bold');
  } else if (state.cauldron.length > 0) {
    text(ctx, 'ready to brew — click the cauldron!', cx, cy + 120, 14, '#7048e8', 'bold');
  } else {
    text(ctx, 'empty — chop ingredients, then cook', cx, cy + 120, 13, '#868e96', 'normal');
  }
}

function drawPlate(ctx, state) {
  const zone = ZONES.plate;
  ctx.fillStyle = '#fff0f6';
  roundRect(ctx, zone.x, zone.y, zone.w, zone.h, 12);
  ctx.fill();
  ctx.strokeStyle = '#f783ac';
  ctx.lineWidth = 2;
  roundRect(ctx, zone.x, zone.y, zone.w, zone.h, 12);
  ctx.stroke();
  text(ctx, '🍽️ PLATE — READY TO SERVE', zone.x + zone.w / 2, zone.y + 24, 16, '#a61e4d', 'bold');
  const px = zone.x + zone.w / 2;
  const py = zone.y + 140;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.ellipse(px, py, 115, 84, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#dee2e6';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.ellipse(px, py, 115, 84, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#f8f9fa';
  ctx.beginPath(); ctx.ellipse(px, py, 86, 62, 0, 0, Math.PI * 2); ctx.fill();
  if (state.plate) {
    const pulse = 1 + Math.sin(state.time * 6) * 0.06;
    ctx.save();
    ctx.translate(px, py);
    ctx.scale(pulse, pulse);
    ctx.translate(-px, -py);
    drawDish(ctx, state.plate, px, py, 62);
    ctx.restore();
    text(ctx, state.plate.name, px, py + 100, 20, '#343a40', 'bold');
    text(ctx, `worth 🪙 ${state.plate.coins}${state.rushLeft > 0 ? ' x2 RUSH!' : ''}`, px, py + 120, 14, '#e8590c', 'bold');
  } else {
    text(ctx, 'nothing plated yet', px, py, 14, '#adb5bd', 'normal');
  }
  const buttonY = zone.y + 272;
  ctx.fillStyle = state.plate ? '#40c057' : '#ced4da';
  roundRect(ctx, zone.x + 30, buttonY, zone.w - 60, 44, 10);
  ctx.fill();
  text(ctx, 'SERVE  ⏎', px, buttonY + 23, 19, '#ffffff', 'bold');
  if (state.plate && state.plate.recipeId === 'stew') {
    text(ctx, 'stew serves any order for 40 · X to toss', px, buttonY + 58, 11, '#868e96', 'normal');
  }
}

function drawCounter(ctx, state) {
  const zone = ZONES.counter;
  ctx.fillStyle = '#fff4d6';
  roundRect(ctx, zone.x, zone.y, zone.w, zone.h, 12);
  ctx.fill();
  ctx.strokeStyle = '#e6a817';
  ctx.lineWidth = 2;
  roundRect(ctx, zone.x, zone.y, zone.w, zone.h, 12);
  ctx.stroke();
  const slotW = zone.w / INGREDIENTS.length;
  INGREDIENTS.forEach((def, index) => {
    const x = zone.x + index * slotW;
    const locked = def.locked && !state.upgrades.egg;
    const cx = x + slotW / 2;
    drawIngredientIcon(ctx, def, cx, zone.y + 32, 24);
    if (locked) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath(); ctx.arc(cx, zone.y + 32, 24, 0, Math.PI * 2); ctx.fill();
      text(ctx, '🔒', cx, zone.y + 32, 18, '#ffffff', 'bold');
    }
    text(ctx, def.name, cx, zone.y + 64, 14, locked ? '#adb5bd' : '#343a40', 'bold');
    ctx.fillStyle = '#5f3dc4';
    roundRect(ctx, cx - 11, zone.y + 72, 22, 14, 4);
    ctx.fill();
    text(ctx, def.key, cx, zone.y + 79, 11, '#ffffff', 'bold');
  });
}

function drawCity(ctx, state) {
  const zone = ZONES.city;
  ctx.fillStyle = '#1b1e3a';
  ctx.fillRect(zone.x, zone.y, zone.w, zone.h);
  const slotW = 172;
  DISTRICTS.forEach((district, index) => {
    const lit = index < state.districtsLit;
    const x = 20 + index * slotW;
    const baseY = zone.y + zone.h - 6;
    const height = 30 + (index % 3) * 8;
    ctx.fillStyle = lit ? '#3b2d8f' : '#2b2f55';
    ctx.fillRect(x, baseY - height, 44, height);
    ctx.fillStyle = lit ? '#ffd43b' : '#495057';
    for (let row = 0; row < 3; row += 1) {
      for (let col = 0; col < 2; col += 1) {
        if (lit || (row + col) % 2 === 0) {
          ctx.fillRect(x + 7 + col * 15, baseY - height + 7 + row * 10, 7, 5);
        }
      }
    }
    if (lit) {
      ctx.save();
      ctx.shadowColor = '#ffd43b';
      ctx.shadowBlur = 14;
      star(ctx, x + 22, baseY - height - 7, 8, '#ffd43b');
      ctx.restore();
    }
    text(ctx, district.name, x + 54, zone.y + 22, 12, lit ? '#ffd43b' : '#868e96', 'bold', 'left');
    text(ctx, lit ? 'LIT ✓' : index === state.districtsLit ? 'NEXT' : 'dark', x + 54, zone.y + 40, 11, lit ? '#69db7c' : '#868e96', 'bold', 'left');
  });
  const next = DISTRICTS[state.districtsLit];
  text(ctx, `CITY ${state.districtsLit}/5`, 1256, zone.y + 22, 16, '#ffe8cc', 'bold', 'right');
  text(ctx, next ? `NEXT: ${next.name} → ${next.upgrade}` : 'THE CITY BLAZES!', 1256, zone.y + 44, 13, '#ffd43b', 'bold', 'right');
}

function drawParticles(ctx, state) {
  for (const particle of state.particles) {
    ctx.globalAlpha = Math.max(0, Math.min(1, particle.left));
    ctx.fillStyle = particle.color;
    if (particle.kind === 'spark') {
      star(ctx, particle.x, particle.y, particle.size, particle.color);
    } else {
      ctx.beginPath(); ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
  for (const float of state.floats) {
    ctx.globalAlpha = Math.max(0, Math.min(1, float.left));
    text(ctx, float.text, float.x, float.y, 20, float.color, 'bold');
  }
  ctx.globalAlpha = 1;
}

function drawBanner(ctx, state) {
  if (!state.banner || state.banner.left <= 0) return;
  const alpha = Math.min(1, state.banner.left);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = 'rgba(47, 25, 100, 0.95)';
  roundRect(ctx, 340, 260, 600, 44, 12);
  ctx.fill();
  ctx.strokeStyle = '#ffd43b';
  ctx.lineWidth = 2;
  roundRect(ctx, 340, 260, 600, 44, 12);
  ctx.stroke();
  text(ctx, `${state.banner.text} — ${state.banner.sub}`, 640, 282, 17, '#ffd43b', 'bold');
  ctx.restore();
}

function drawMessage(ctx, state) {
  if (!state.message || state.message.left <= 0) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1, state.message.left);
  ctx.fillStyle = 'rgba(52, 58, 64, 0.92)';
  roundRect(ctx, 390, 500, 500, 34, 10);
  ctx.fill();
  text(ctx, state.message.text, 640, 517, 15, '#ffffff', 'bold');
  ctx.restore();
}

function drawTitle(ctx, state) {
  ctx.fillStyle = 'rgba(27, 20, 60, 0.82)';
  ctx.fillRect(0, 0, 1280, 720);
  text(ctx, '✦ ARCANE KITCHEN ✦', 640, 180, 64, '#ffd43b', 'bold');
  text(ctx, 'Every dish you cook is a spell. Every spell lights up the city.', 640, 240, 22, '#ffffff', 'normal');
  text(ctx, '1–6 pick ingredients · SPACE chop · C cook · ENTER serve', 640, 300, 18, '#d0bfff', 'bold');
  text(ctx, 'Serve orders before their patience runs out. Light all 5 districts to win!', 640, 330, 18, '#d0bfff', 'bold');
  ctx.fillStyle = '#40c057';
  roundRect(ctx, 490, 370, 300, 56, 12);
  ctx.fill();
  text(ctx, 'CLICK TO START COOKING', 640, 399, 20, '#ffffff', 'bold');
  text(ctx, '5 spell recipes · combos · golden rush · a city that grows as you serve', 640, 470, 15, '#adb5bd', 'normal');
}

function drawEnd(ctx, state, win) {
  ctx.fillStyle = win ? 'rgba(120, 80, 0, 0.86)' : 'rgba(27, 20, 60, 0.86)';
  ctx.fillRect(0, 0, 1280, 720);
  text(ctx, win ? '✦ THE CITY BLAZES! ✦' : 'SHIFT OVER', 640, 190, 60, win ? '#ffd43b' : '#ffffff', 'bold');
  text(ctx, win ? 'All five districts shine — you are the realm’s greatest spell-chef!' : 'The shift ended before the city lit up. The mages are still hungry…', 640, 250, 20, '#ffffff', 'normal');
  text(ctx, `DISHES SERVED  ${state.served}      COINS  ${state.coins}      BEST COMBO  x${state.bestCombo}`, 640, 320, 22, '#ffe8cc', 'bold');
  text(ctx, `DISTRICTS LIT  ${state.districtsLit}/5      DISHES COOKED  ${state.stats.cooked}      ORDERS LOST  ${state.stats.expired}`, 640, 355, 18, '#d0bfff', 'bold');
  ctx.fillStyle = '#40c057';
  roundRect(ctx, 490, 400, 300, 56, 12);
  ctx.fill();
  text(ctx, 'CLICK TO COOK AGAIN', 640, 429, 20, '#ffffff', 'bold');
}

export function drawGame(ctx, state) {
  ctx.save();
  if (state.shake > 0) {
    ctx.translate((Math.random() - 0.5) * state.shake * 24, (Math.random() - 0.5) * state.shake * 24);
  }
  // Warm kitchen wall + floor.
  ctx.fillStyle = '#f9ecd2';
  ctx.fillRect(0, 0, 1280, 720);
  ctx.fillStyle = '#f3dfba';
  for (let x = 0; x < 1280; x += 64) {
    ctx.fillRect(x, 56, 2, 492);
  }
  ctx.fillStyle = '#e8cfa0';
  ctx.fillRect(0, 540, 1280, 8);
  drawTopBar(ctx, state);
  drawOrderBoard(ctx, state);
  drawBoardPanel(ctx, state);
  drawCauldron(ctx, state);
  drawPlate(ctx, state);
  drawCounter(ctx, state);
  drawCity(ctx, state);
  drawParticles(ctx, state);
  drawBanner(ctx, state);
  drawMessage(ctx, state);
  if (state.screen === 'title') drawTitle(ctx, state);
  if (state.screen === 'win') drawEnd(ctx, state, true);
  if (state.screen === 'over') drawEnd(ctx, state, false);
  ctx.restore();
}
