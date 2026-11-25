// Arcane Kitchen — world.js
// One job: the whole game state and every rule — orders, chopping, cooking,
// serving, combos, districts and their upgrades, win and loss. No drawing.

import {
  BOARD_MAX, CHOP_SECONDS, COOK_SECONDS, DISTRICTS, INGREDIENTS,
  ORDER_PATIENCE_SECONDS, ORDER_SLOTS_START, ORDER_SPAWN_SECONDS,
  RECIPES, RECIPE_BY_ID, SERVED_PER_DISTRICT, SHIFT_SECONDS, STEW_COINS,
} from './config.js';
import { makeRng, pick } from './random.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_WIN = 'win';
export const SCREEN_OVER = 'over';

export const EVENT_SERVED = 1;
export const EVENT_DISTRICT = 2;
export const EVENT_WIN = 4;
export const EVENT_OVER = 8;
export const EVENT_EXPIRED = 16;

let orderSerial = 0;

export function unlockedRecipes(state) {
  return RECIPES.filter((recipe) => !recipe.locked || state.upgrades.egg);
}

function newOrder(state) {
  const recipe = pick(state.rng, unlockedRecipes(state));
  const patience = ORDER_PATIENCE_SECONDS * (state.upgrades.patience ? 1.5 : 1);
  orderSerial += 1;
  return { id: orderSerial, recipeId: recipe.id, patience, maxPatience: patience };
}

export function createWorld(seed) {
  return {
    rng: makeRng(seed || 20261125),
    screen: SCREEN_TITLE,
    time: 0,
    timeLeft: SHIFT_SECONDS,
    score: 0,
    coins: 0,
    served: 0,
    combo: 0,
    bestCombo: 0,
    districtsLit: 0,
    upgrades: { egg: false, chop: false, slot: false, patience: false, rush: false },
    rushLeft: 0,
    orders: [],
    spawnIn: 2,
    board: [], // { id, chopped, chopLeft }
    chopping: 0,
    cauldron: [], // ingredient ids
    cooking: 0, // seconds left; 0 means idle
    cookingTotal: COOK_SECONDS,
    waitingDish: null, // a finished dish held in the cauldron while the plate is full
    plate: null, // { recipeId | 'stew', name, coins, color }
    burst: 0, // seconds of serve/cook burst left, for the render
    banner: null, // { text, sub, left }
    floats: [], // { x, y, text, color, left }
    particles: [], // { x, y, vx, vy, color, size, left, kind }
    shake: 0,
    message: null, // { text, left }
    stats: { chopped: 0, cooked: 0, expired: 0 },
    started: false,
  };
}

export function startGame(state) {
  const fresh = createWorld(20261125 + Math.floor(state.time * 1000));
  fresh.screen = SCREEN_PLAY;
  fresh.started = true;
  fresh.orders = [newOrder(fresh), newOrder(fresh), newOrder(fresh)];
  return fresh;
}

function orderSlots(state) {
  return ORDER_SLOTS_START + (state.upgrades.slot ? 1 : 0);
}

function addFloat(state, x, y, text, color) {
  state.floats.push({ x, y, text, color, left: 1.2 });
}

export function addParticles(state, x, y, color, count, speed) {
  for (let index = 0; index < count; index += 1) {
    const angle = state.rng() * Math.PI * 2;
    const power = (0.3 + state.rng() * 0.7) * (speed || 160);
    state.particles.push({
      x, y,
      vx: Math.cos(angle) * power,
      vy: Math.sin(angle) * power - 60,
      color, size: 2 + state.rng() * 4,
      left: 0.6 + state.rng() * 0.6,
      kind: state.rng() < 0.5 ? 'spark' : 'dot',
    });
  }
}

function showBanner(state, text, sub) {
  state.banner = { text, sub, left: 3.2 };
}

function lightDistrict(state) {
  const district = DISTRICTS[state.districtsLit];
  if (!district) return EVENT_WIN;
  state.districtsLit += 1;
  if (district.apply === 'egg') state.upgrades.egg = true;
  if (district.apply === 'chop') state.upgrades.chop = true;
  if (district.apply === 'slot') state.upgrades.slot = true;
  if (district.apply === 'patience') state.upgrades.patience = true;
  if (district.apply === 'rush') {
    state.upgrades.rush = true;
    state.rushLeft = 30;
  }
  showBanner(state, `✦ ${district.name} LIGHTS UP!`, district.upgrade);
  addParticles(state, 640, 680, '#ffd43b', 60, 260);
  if (state.districtsLit >= DISTRICTS.length) {
    state.screen = SCREEN_WIN;
    return EVENT_DISTRICT | EVENT_WIN;
  }
  return EVENT_DISTRICT;
}

function matchRecipe(ids) {
  const sorted = ids.slice().sort().join(',');
  for (const recipe of RECIPES) {
    if (recipe.needs.slice().sort().join(',') === sorted) return recipe;
  }
  return null;
}

export function addIngredient(state, id) {
  if (state.screen !== SCREEN_PLAY) return false;
  const def = INGREDIENTS.find((item) => item.id === id);
  if (!def) return false;
  if (def.locked && !state.upgrades.egg) {
    state.message = { text: '🔒 Dragon Egg unlocks when Ember Row lights up!', left: 2 };
    return false;
  }
  if (state.board.length >= BOARD_MAX) {
    state.message = { text: 'Board is full — chop first!', left: 1.5 };
    return false;
  }
  state.board.push({ id, chopped: false, chopLeft: CHOP_SECONDS });
  state.combo = state.combo; // adding never breaks a combo
  return true;
}

export function chopBoard(state) {
  if (state.screen !== SCREEN_PLAY) return false;
  const raw = state.board.filter((item) => !item.chopped);
  if (raw.length === 0 || state.chopping > 0) return false;
  state.chopping = CHOP_SECONDS * (state.upgrades.chop ? 0.5 : 1);
  return true;
}

export function cookCauldron(state) {
  if (state.screen !== SCREEN_PLAY) return false;
  if (state.cooking > 0) return false;
  const ready = state.board.filter((item) => item.chopped);
  if (ready.length === 0) {
    state.message = { text: 'Chop ingredients first, then cook!', left: 1.5 };
    return false;
  }
  // Cooking while a dish waits on the plate is allowed: parallel prep is the
  // skill of this kitchen. A finished dish waits in the cauldron until the
  // plate is free (see plateWaitingDish).
  state.cauldron = ready.map((item) => item.id);
  state.board = state.board.filter((item) => !item.chopped);
  state.cookingTotal = COOK_SECONDS;
  state.cooking = COOK_SECONDS;
  return true;
}

export function plateWaitingDish(state) {
  if (state.screen !== SCREEN_PLAY) return false;
  if (!state.waitingDish || state.plate) return false;
  state.plate = state.waitingDish;
  state.waitingDish = null;
  state.burst = 0.7;
  addParticles(state, 640, 300, state.plate.color, 24, 180);
  return true;
}

function finishCooking(state) {
  state.cooking = 0;
  const recipe = matchRecipe(state.cauldron);
  const cx = 640;
  const cy = 330;
  let dish;
  if (recipe) {
    dish = { recipeId: recipe.id, name: recipe.name, coins: recipe.coins, color: recipe.color };
    addParticles(state, cx, cy, recipe.color, 46, 240);
    addParticles(state, cx, cy, '#ffd43b', 26, 180);
  } else {
    dish = { recipeId: 'stew', name: 'Muddled Stew', coins: STEW_COINS, color: '#868e96' };
    addParticles(state, cx, cy, '#adb5bd', 20, 120);
  }
  if (state.plate) {
    // The plate is busy: the dish waits in the cauldron, glowing, until the
    // player clicks the cauldron to plate it.
    state.waitingDish = dish;
    addFloat(state, cx, cy - 70, `${dish.name} waits in the pot!`, '#fff3bf');
  } else {
    state.plate = dish;
    addFloat(state, cx, cy - 70, `${dish.name} ready!`, '#fff3bf');
  }
  state.stats.cooked += 1;
  state.cauldron = [];
  state.burst = 0.9;
}

export function servePlate(state) {
  if (state.screen !== SCREEN_PLAY) return 0;
  if (!state.plate) {
    state.message = { text: 'Nothing on the plate yet!', left: 1.2 };
    return 0;
  }
  let orderIndex = -1;
  if (state.plate.recipeId === 'stew') {
    orderIndex = state.orders.length > 0 ? 0 : -1;
  } else {
    orderIndex = state.orders.findIndex((order) => order.recipeId === state.plate.recipeId);
  }
  if (orderIndex < 0) {
    state.message = { text: `No order wants ${state.plate.name} right now!`, left: 1.8 };
    state.shake = 0.35;
    return 0;
  }
  const order = state.orders[orderIndex];
  state.orders.splice(orderIndex, 1);
  const isStew = state.plate.recipeId === 'stew';
  const multiplier = state.rushLeft > 0 ? 2 : 1;
  const earned = state.plate.coins * multiplier;
  state.coins += earned;
  state.score += earned + (isStew ? 0 : 25);
  state.served += 1;
  let events = EVENT_SERVED;
  if (isStew) {
    state.combo = 0;
    addFloat(state, 1114, 300, `+${earned} (stew)`, '#ced4da');
  } else {
    state.combo += 1;
    state.bestCombo = Math.max(state.bestCombo, state.combo);
    const bonus = state.combo >= 3 ? (state.combo - 2) * 20 : 0;
    if (bonus > 0) {
      state.coins += bonus;
      state.score += bonus;
    }
    addFloat(state, 1114, 300, `+${earned}${bonus ? ` +${bonus} combo` : ''}`, '#ffd43b');
    if (state.combo === 3) addFloat(state, 1114, 330, 'COMBO x3!', '#ff922b');
    if (state.combo === 5) addFloat(state, 1114, 330, 'COMBO x5 — ON FIRE!', '#ff6b35');
  }
  addParticles(state, 1114, 330, '#ffd43b', 34, 220);
  state.plate = null;
  state.burst = 0.7;
  if (state.served % SERVED_PER_DISTRICT === 0) {
    events |= lightDistrict(state);
  }
  return events;
}

export function trashPlate(state) {
  if (state.screen !== SCREEN_PLAY || !state.plate) return false;
  state.plate = null;
  state.message = { text: 'Tossed. Cook something the orders want!', left: 1.5 };
  return true;
}

function expireOrders(state, dt) {
  let expired = false;
  for (let index = state.orders.length - 1; index >= 0; index -= 1) {
    state.orders[index].patience -= dt;
    if (state.orders[index].patience <= 0) {
      state.orders.splice(index, 1);
      state.combo = 0;
      state.stats.expired += 1;
      expired = true;
    }
  }
  if (expired) {
    state.message = { text: 'An order walked out — combo lost!', left: 2 };
    state.shake = 0.3;
    return EVENT_EXPIRED;
  }
  return 0;
}

export function stepWorld(state, dt) {
  if (state.screen !== SCREEN_PLAY) {
    updateFx(state, dt);
    return 0;
  }
  let events = 0;
  state.time += dt;
  state.timeLeft -= dt;
  if (state.rushLeft > 0) state.rushLeft -= dt;
  if (state.timeLeft <= 0) {
    state.timeLeft = 0;
    state.screen = SCREEN_OVER;
    updateFx(state, dt);
    return EVENT_OVER;
  }
  if (state.chopping > 0) {
    state.chopping -= dt;
    if (state.chopping <= 0) {
      state.chopping = 0;
      for (const item of state.board) {
        if (!item.chopped) {
          item.chopped = true;
          state.stats.chopped += 1;
        }
      }
      addParticles(state, 166, 360, '#8ce99a', 14, 110);
    }
  }
  if (state.cooking > 0) {
    state.cooking -= dt;
    if (state.rng() < dt * 14) {
      const color = state.cauldron.length > 0
        ? (INGREDIENTS.find((item) => item.id === state.cauldron[Math.floor(state.rng() * state.cauldron.length)]) || {}).glow || '#ff9a3d'
        : '#ff9a3d';
      state.particles.push({
        x: 560 + state.rng() * 160, y: 300 + state.rng() * 30,
        vx: (state.rng() - 0.5) * 30, vy: -50 - state.rng() * 60,
        color, size: 2 + state.rng() * 3, left: 0.7, kind: 'dot',
      });
    }
    if (state.cooking <= 0) finishCooking(state);
  }
  events |= expireOrders(state, dt);
  state.spawnIn -= dt;
  if (state.spawnIn <= 0 && state.orders.length < orderSlots(state)) {
    state.orders.push(newOrder(state));
    state.spawnIn = ORDER_SPAWN_SECONDS;
  }
  if (state.banner && state.banner.left > 0) state.banner.left -= dt;
  if (state.message && state.message.left > 0) state.message.left -= dt;
  updateFx(state, dt);
  return events;
}

export function updateFx(state, dt) {
  if (state.burst > 0) state.burst -= dt;
  if (state.shake > 0) state.shake -= dt;
  for (let index = state.particles.length - 1; index >= 0; index -= 1) {
    const particle = state.particles[index];
    particle.left -= dt;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vy += 160 * dt;
    if (particle.left <= 0) state.particles.splice(index, 1);
  }
  for (let index = state.floats.length - 1; index >= 0; index -= 1) {
    const float = state.floats[index];
    float.left -= dt;
    float.y -= 34 * dt;
    if (float.left <= 0) state.floats.splice(index, 1);
  }
}
