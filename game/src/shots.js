// Arcane Kitchen — shots.js
// One job: stage the four screenshot scenes. Each one plays the real rules
// forward from a fresh world with a fixed seed, so the frame is what a real
// game looks like at that moment and the same seed always gives the same frame.

import { addIngredient, addParticles, chopBoard, cookCauldron, createWorld, SCREEN_WIN, servePlate, startGame } from './world.js';

const STEP = 1 / 30;

import { stepWorld } from './world.js';

function simulate(state, seconds) {
  for (let elapsed = 0; elapsed < seconds; elapsed += STEP) {
    tick(state, STEP);
  }
}

function tick(state, dt) {
  const keepLeft = state.timeLeft;
  const keepSpawn = state.spawnIn;
  stepWorld(state, dt);
  state.timeLeft = keepLeft;
  state.spawnIn = keepSpawn;
  // Orders in a staged scene must not expire mid-frame.
  for (const order of state.orders) order.patience = Math.max(order.patience, 4);
}

function setOrders(state, specs) {
  state.orders = specs.map((spec, index) => ({
    id: 100 + index,
    recipeId: spec.recipe,
    patience: spec.patience,
    maxPatience: 45,
  }));
}

function cookRecipe(state, ids, seconds) {
  for (const id of ids) addIngredient(state, id);
  chopBoard(state);
  simulate(state, 0.7);
  cookCauldron(state);
  simulate(state, seconds);
}

/**
 * Set `world` to the named scene and return the screen to draw.
 * Scenes: play (cover), ritual, rush, end. Anything else is play.
 */
export function stageShot(name, seed) {
  let world = startGame(createWorld(seed || 20261125));
  if (name === 'ritual') {
    world.upgrades.egg = true;
    world.upgrades.chop = true;
    world.upgrades.slot = true;
    world.served = 6;
    world.coins = 1240;
    world.score = 1490;
    world.combo = 4;
    world.bestCombo = 4;
    world.districtsLit = 3;
    world.rushLeft = 18;
    world.timeLeft = 96;
    setOrders(world, [
      { recipe: 'grand-feast', patience: 34 },
      { recipe: 'dragon-omelette', patience: 26 },
      { recipe: 'frost-melt', patience: 18 },
      { recipe: 'star-salad', patience: 40 },
    ]);
    cookRecipe(world, ['egg', 'cheese', 'herb'], 2.6);
    simulate(world, 0.15);
    // Serve the omelette for real (+640 in the rush), then plate the next
    // dish — and freeze the serve's own +coins popup mid-flight, the way the
    // burst particles are frozen: it is the game's real serve feedback.
    servePlate(world);
    cookRecipe(world, ['cheese', 'tomato', 'salt'], 2.6);
    simulate(world, 0.15);
    world.floats.push({ x: 1114, y: 252, text: '+640', color: '#ffd43b', left: 1.1 });
    world.floats.push({ x: 1114, y: 282, text: 'COMBO x5!', color: '#ff922b', left: 1.1 });
    return world;
  }
  if (name === 'rush') {
    world.upgrades.egg = true;
    world.upgrades.chop = true;
    world.upgrades.slot = true;
    world.upgrades.patience = true;
    world.served = 8;
    world.coins = 2100;
    world.score = 2450;
    world.combo = 5;
    world.bestCombo = 5;
    world.districtsLit = 4;
    world.rushLeft = 24;
    world.timeLeft = 24;
    setOrders(world, [
      { recipe: 'ember-soup', patience: 6 },
      { recipe: 'grand-feast', patience: 28 },
      { recipe: 'dragon-omelette', patience: 36 },
      { recipe: 'frost-melt', patience: 14 },
    ]);
    // A Grand Feast already plated, an Ember Soup brewing at ~90% beside it,
    // and the next dish already chopped: the full parallel-prep loop, played
    // for real (cooking while the plate is full is legal now).
    cookRecipe(world, ['tomato', 'egg', 'mushroom', 'salt'], 2.6);
    for (const id of ['tomato', 'mushroom', 'herb']) addIngredient(world, id);
    chopBoard(world);
    simulate(world, 0.4);
    cookCauldron(world);
    simulate(world, 2.0);
    for (const id of ['tomato', 'mushroom']) addIngredient(world, id);
    chopBoard(world);
    simulate(world, 0.3);
    addParticles(world, 640, 300, '#ffd43b', 18, 200);
    return world;
  }
  if (name === 'end') {
    world.served = 10;
    world.coins = 2680;
    world.score = 3100;
    world.combo = 0;
    world.bestCombo = 5;
    world.districtsLit = 5;
    world.timeLeft = 61;
    world.stats.cooked = 11;
    world.stats.expired = 1;
    world.screen = SCREEN_WIN;
    addParticles(world, 640, 360, '#ffd43b', 50, 260);
    addParticles(world, 300, 300, '#ff922b', 30, 200);
    addParticles(world, 980, 300, '#9775fa', 30, 200);
    return world;
  }
  // play — the cover: a rich mid-game frame. Dish 1 (Ember Soup) is plated,
  // dish 2 (Frost Melt) is brewing at ~60% beside it, dish 3 is chopped on
  // the board: the whole loop in one frame, played for real.
  world.upgrades.egg = true;
  world.upgrades.chop = true;
  world.served = 4;
  world.coins = 820;
  world.score = 980;
  world.combo = 3;
  world.bestCombo = 3;
  world.districtsLit = 2;
  world.timeLeft = 125;
  setOrders(world, [
    { recipe: 'ember-soup', patience: 24 },
    { recipe: 'frost-melt', patience: 32 },
    { recipe: 'dragon-omelette', patience: 38 },
  ]);
  cookRecipe(world, ['tomato', 'mushroom', 'herb'], 2.6);
  for (const id of ['cheese', 'tomato', 'salt']) addIngredient(world, id);
  chopBoard(world);
  simulate(world, 0.4);
  cookCauldron(world);
  simulate(world, 1.5);
  for (const id of ['tomato', 'mushroom']) addIngredient(world, id);
  chopBoard(world);
  simulate(world, 0.4);
  addParticles(world, 640, 300, '#ff9a3d', 10, 140);
  // Re-raise the banner after the simulation, so it is visible in the frame.
  world.banner = { text: '✦ Frost Lane LIGHTS UP!', sub: 'Chopping 2x faster!', left: 2.5 };
  return world;
}
