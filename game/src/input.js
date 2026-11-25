// Arcane Kitchen — input.js
// One job: turn mouse clicks and keys into world actions. No drawing, no rules.

import { INGREDIENTS, ZONES } from './config.js';
import { addIngredient, chopBoard, cookCauldron, plateWaitingDish, servePlate, startGame, trashPlate } from './world.js';

function inside(x, y, zone) {
  return x >= zone.x && x <= zone.x + zone.w && y >= zone.y && y <= zone.y + zone.h;
}

export function ingredientAt(x, y) {
  if (!inside(x, y, ZONES.counter)) return null;
  const slot = Math.floor((x - ZONES.counter.x) / (ZONES.counter.w / INGREDIENTS.length));
  return INGREDIENTS[Math.max(0, Math.min(INGREDIENTS.length - 1, slot))];
}

export function handleClick(state, x, y) {
  if (state.screen === 'title' || state.screen === 'win' || state.screen === 'over') {
    return startGame(state);
  }
  if (inside(x, y, ZONES.boardPanel)) return chopBoard(state);
  if (inside(x, y, ZONES.cauldron)) {
    if (state.waitingDish) return plateWaitingDish(state);
    return cookCauldron(state);
  }
  if (inside(x, y, ZONES.plate)) {
    if (state.plate && state.plate.recipeId === 'stew' && y > ZONES.plate.y + 250) return trashPlate(state);
    return servePlate(state);
  }
  const ingredient = ingredientAt(x, y);
  if (ingredient) return addIngredient(state, ingredient.id);
  return false;
}

export function handleKey(state, key) {
  const lower = key.toLowerCase();
  if (state.screen === 'title' || state.screen === 'win' || state.screen === 'over') {
    if (lower === 'enter' || lower === ' ') return startGame(state);
    return false;
  }
  if (lower === ' ') return chopBoard(state);
  if (lower === 'c') {
    if (state.waitingDish) return plateWaitingDish(state);
    return cookCauldron(state);
  }
  if (lower === 'enter') return servePlate(state);
  if (lower === 'x') return trashPlate(state);
  const ingredient = INGREDIENTS.find((item) => item.key === key);
  if (ingredient) return addIngredient(state, ingredient.id);
  return false;
}
