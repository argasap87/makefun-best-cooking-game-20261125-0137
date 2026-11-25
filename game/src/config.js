// Arcane Kitchen — config.js
// One job: every tunable number, ingredient, recipe and district upgrade.
// No drawing, no input, no state changes live here.

export const VIEW = { width: 1280, height: 720 };

export const SHIFT_SECONDS = 180;
export const ORDER_SLOTS_START = 3;
export const ORDER_PATIENCE_SECONDS = 45;
export const ORDER_SPAWN_SECONDS = 11;
export const COOK_SECONDS = 2.5;
export const CHOP_SECONDS = 0.5;
export const BOARD_MAX = 5;
export const SERVED_PER_DISTRICT = 2;
export const STEW_COINS = 40;

export const INGREDIENTS = [
  { id: 'tomato', name: 'Ember Tomato', key: '1', color: '#e8442e', glow: '#ff9a3d', shape: 'tomato' },
  { id: 'mushroom', name: 'Moon Mushroom', key: '2', color: '#b388eb', glow: '#d9b8ff', shape: 'mushroom' },
  { id: 'herb', name: 'Star Herb', key: '3', color: '#37b24d', glow: '#8ce99a', shape: 'herb' },
  { id: 'cheese', name: 'Frost Cheese', key: '4', color: '#ffd43b', glow: '#a5d8ff', shape: 'cheese' },
  { id: 'egg', name: 'Dragon Egg', key: '5', color: '#2ec4b6', glow: '#99e9f2', shape: 'egg', locked: true },
  { id: 'salt', name: 'Crystal Salt', key: '6', color: '#f1f3f5', glow: '#ffffff', shape: 'salt' },
];

export const INGREDIENT_BY_ID = Object.fromEntries(INGREDIENTS.map((item) => [item.id, item]));

export const RECIPES = [
  { id: 'ember-soup', name: 'Ember Soup', needs: ['tomato', 'mushroom', 'herb'], coins: 200, color: '#ff6b35', locked: false },
  { id: 'frost-melt', name: 'Frost Melt', needs: ['cheese', 'tomato', 'salt'], coins: 220, color: '#74c0fc', locked: false },
  { id: 'star-salad', name: 'Star Salad', needs: ['herb', 'mushroom', 'cheese'], coins: 240, color: '#69db7c', locked: false },
  { id: 'dragon-omelette', name: 'Dragon Omelette', needs: ['egg', 'cheese', 'herb'], coins: 320, color: '#3bc9db', locked: true },
  { id: 'grand-feast', name: 'Grand Feast', needs: ['tomato', 'egg', 'mushroom', 'salt'], coins: 450, color: '#f783ac', locked: true },
];

export const RECIPE_BY_ID = Object.fromEntries(RECIPES.map((recipe) => [recipe.id, recipe]));

// Districts light up two served dishes at a time. Each one grants a REAL
// upgrade that changes play — the city is a progression system, not wallpaper.
export const DISTRICTS = [
  { name: 'Ember Row', upgrade: 'Dragon Egg unlocked!', apply: 'egg' },
  { name: 'Frost Lane', upgrade: 'Chopping 2x faster!', apply: 'chop' },
  { name: 'Star Market', upgrade: '+1 order slot!', apply: 'slot' },
  { name: 'Moon Docks', upgrade: 'Orders stay patient +50%!', apply: 'patience' },
  { name: 'The Spire', upgrade: 'GOLDEN RUSH: 2x coins 30s!', apply: 'rush' },
];

export const ZONES = {
  topBar: { x: 0, y: 0, w: 1280, h: 56 },
  board: { x: 16, y: 64, w: 1248, h: 128 },
  boardPanel: { x: 16, y: 204, w: 300, h: 336 },
  cauldron: { x: 332, y: 204, w: 616, h: 336 },
  plate: { x: 964, y: 204, w: 300, h: 336 },
  counter: { x: 16, y: 548, w: 1248, h: 88 },
  city: { x: 0, y: 644, w: 1280, h: 76 },
};
