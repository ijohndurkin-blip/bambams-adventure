# Bam Bam's Adventures

A 3D learning game for 5 to 8 year olds from **Animates**. Children guide Bam Bam the panda around his island and play short learning quests by walking into the right answer bubble.

## What's in the game

| Zone | Subject | Level 1 | Level 2 | Level 3 |
|---|---|---|---|---|
| Number Meadow | Maths | counting, biggest number, what comes next | add and take away to 10, counting in 2s/5s/10s | to 20, doubles, halves, ×2 ×5 ×10, missing numbers |
| Letter Forest | Literacy | first sounds, capital/little letters, alphabet order | missing letters, end sounds, vowels | spelling, rhymes, reading words |
| Shape Shore | Shapes & colours | colours, basic shapes | colour + shape, counting sides, AB patterns | 3D shapes, corners, ABB patterns |
| Wonder Cove | Our world | animals, food, everyday things | days, seasons, opposites, life cycles | space, months, time, animal groups |

- Every question is read aloud (browser voice), so early readers can play alone.
- A wrong answer just pops that bubble: no timers, no lives, no losing.
- 5 questions per quest. 4 or more right first time moves that zone up a level.
- Stars unlock hats for Bam Bam (10, 30, 60, 100 stars). Medals go in the sticker book.
- A "wiggle break" reminder appears after 20 minutes of play.
- No adverts, accounts, chat, tracking or external requests. Progress is stored in the browser's localStorage only.

## Controls

- Tap / click (or drag) where Bam Bam should walk, or use arrow keys / WASD.
- Space or the orange button to jump.

## Run locally

It is a plain static site with no build step:

```
npx serve .
```

(or `python3 -m http.server`). Opening `index.html` straight from disk will not work because browsers block ES modules on `file://`.

## Deploy to Vercel

Import this repo in Vercel and deploy. Framework preset: **Other**. Build command: none. Output directory: leave as the repo root.

## Project layout

```
index.html          page, title screen, HUD
css/style.css       all styling
js/main.js          game loop, quests, rewards, input, saving
js/bambam.js        the 3D Bam Bam character and his animations
js/world.js         the island and the four zones
js/quests.js        every question and question generator (edit here to add content)
js/orbs.js          answer bubbles and 3D shapes
js/audio.js         theme tune, sound effects, read-aloud voice
assets/             theme tune, Animates logo, icons
vendor/             three.js r187 (MIT), bundled locally
```
