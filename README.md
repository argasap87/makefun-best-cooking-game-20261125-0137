# Arcane Kitchen — cook spells, light the city

[![make.fun](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/argasap87/makefun-best-cooking-game-20261125-0137/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/argasap87/makefun-best-cooking-game-20261125-0137/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)

A complete, original cooking game for the [make.fun best cooking game bounty](https://make.fun/bounty/best-cooking-game-20261125-0137). It runs offline in a desktop browser from static files, played with keyboard and mouse.

## The game

You are the spell-chef of a night city. Cook dishes from magical ingredients — Ember Tomato, Moon Mushroom, Star Herb, Frost Cheese, Dragon Egg, Crystal Salt — and serve them before the orders' patience runs out. **Every dish you serve is a spell that lights up one more district of the city, and every lit district grants a real upgrade**: the Dragon Egg ingredient, 2x faster chopping, an extra order slot, +50% order patience, and finally a Golden Rush that doubles your coins.

- **5 spell recipes** in the spellbook, from Ember Soup to the Grand Feast
- **Orders with patience timers** on the order board — serve the right dish in time
- **Chop → cook → plate → serve** loop with a bubbling spell cauldron, combos, and a 3-minute shift timer
- **Win condition:** light all 5 districts before the shift ends

## How to play

- Click an ingredient (or press `1`–`6`) to put it on the chopping board
- Click the board (or `SPACE`) to chop, click the cauldron (or `C`) to cook
- When the dish lands on the plate, click it (or `ENTER`) to serve the matching order
- You can cook the next dish while one waits on the plate — if a dish finishes while the plate is full, it waits glowing in the cauldron; click the cauldron to plate it
- `X` tosses a Muddled Stew off the plate (it still serves any order for 40 coins, but breaks your combo) · `M` mutes the sound

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no network requests: `game/index.html` and its ES modules only.

## Entry

Built for the make.fun competition `best-cooking-game-20261125-0137`. `main.ts` hands the game in (copies `game/` and `screenshots/` to `/output` and writes `dossier.json`).
