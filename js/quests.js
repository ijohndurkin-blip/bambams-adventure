import { randInt, pick, shuffle } from './util.js';

// Every question: { prompt, say, options: [{ label } | { shape, color }], answer }
// "prompt" is shown on screen, "say" is read aloud (no emoji), answer = index of the right option.

function build(prompt, say, correct, wrongs) {
  const opts = shuffle([{ ...correct, ok: true }, ...wrongs]);
  return { prompt, say, options: opts.map(({ ok, ...o }) => o), answer: opts.findIndex((o) => o.ok) };
}
const T = (label) => ({ label: String(label) });
const textQ = (prompt, say, correct, wrongs) => build(prompt, say, T(correct), wrongs.map(T));

function numberDistractors(ans, count, min = 0, max = 999) {
  const pool = new Set();
  [1, -1, 2, -2, 3, -3, 10, -10, 5].forEach((d) => {
    const v = ans + d;
    if (v >= min && v <= max && v !== ans) pool.add(v);
  });
  return shuffle([...pool].slice(0, Math.max(count + 2, 4))).slice(0, count);
}

// =====================================================================
// NUMBERS
// =====================================================================
const COUNTABLES = [['🍎', 'apples'], ['⭐', 'stars'], ['🐟', 'fish'], ['🎈', 'balloons'], ['🐞', 'ladybirds'], ['🍓', 'strawberries'], ['🦋', 'butterflies'], ['🚗', 'cars']];

const math = {
  1: [
    () => {
      const n = randInt(1, 9); const [e, name] = pick(COUNTABLES);
      return textQ(`${e.repeat(n)}\nHow many ${name}?`, `How many ${name} can you count?`, n, numberDistractors(n, 2, 1, 10));
    },
    () => {
      const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).slice(0, 3);
      const big = Math.max(...nums);
      return textQ('Which number is the biggest?', 'Which number is the biggest?', big, nums.filter((n) => n !== big));
    },
    () => {
      const n = randInt(1, 9);
      return textQ(`What comes after ${n}?`, `What number comes after ${n}?`, n + 1, numberDistractors(n + 1, 2, 1, 11).filter((v) => v !== n).concat(n).slice(0, 2));
    },
    () => {
      const a = randInt(1, 4), b = randInt(1, 3);
      return textQ(`${'🍎'.repeat(a)} + ${'🍎'.repeat(b)}\n${a} + ${b} = ?`, `What is ${a} add ${b}?`, a + b, numberDistractors(a + b, 2, 1, 10));
    },
  ],
  2: [
    () => {
      const a = randInt(1, 8), b = randInt(1, 10 - a);
      return textQ(`${a} + ${b} = ?`, `What is ${a} add ${b}?`, a + b, numberDistractors(a + b, 3, 0, 12));
    },
    () => {
      const a = randInt(3, 10), b = randInt(1, a - 1);
      return textQ(`${a} − ${b} = ?`, `What is ${a} take away ${b}?`, a - b, numberDistractors(a - b, 3, 0, 12));
    },
    () => {
      const step = pick([2, 5, 10]); const start = step * randInt(1, 4);
      const seq = [start, start + step, start + step * 2];
      const ans = start + step * 3;
      return textQ(`${seq.join(', ')}, ?\nWhat comes next?`, `Count in ${step}s. ${seq.join(', ')}. What comes next?`, ans, [ans + 1, ans - 1, ans + step]);
    },
    () => {
      const nums = shuffle(Array.from({ length: 20 }, (_, i) => i + 1)).slice(0, 4);
      const small = Math.min(...nums);
      return textQ('Which number is the smallest?', 'Which number is the smallest?', small, nums.filter((n) => n !== small));
    },
  ],
  3: [
    () => {
      const a = randInt(5, 14), b = randInt(3, 20 - a);
      return textQ(`${a} + ${b} = ?`, `What is ${a} add ${b}?`, a + b, numberDistractors(a + b, 3, 0, 30));
    },
    () => {
      const a = randInt(10, 20), b = randInt(2, 9);
      return textQ(`${a} − ${b} = ?`, `What is ${a} take away ${b}?`, a - b, numberDistractors(a - b, 3, 0, 30));
    },
    () => {
      const n = randInt(2, 10);
      return textQ(`Double ${n} = ?`, `What is double ${n}?`, n * 2, numberDistractors(n * 2, 3, 0, 30));
    },
    () => {
      const m = pick([2, 5, 10]); const n = randInt(2, 10);
      return textQ(`${n} × ${m} = ?`, `What is ${n} times ${m}?`, n * m, [n * m + m, Math.max(1, n * m - m), n * m + 1]);
    },
    () => {
      const b = randInt(2, 9), ans = randInt(2, 10);
      return textQ(`? + ${b} = ${ans + b}`, `What number add ${b} makes ${ans + b}?`, ans, numberDistractors(ans, 3, 0, 20));
    },
    () => {
      const n = randInt(2, 10) * 2;
      return textQ(`Half of ${n} = ?`, `What is half of ${n}?`, n / 2, numberDistractors(n / 2, 3, 0, 20));
    },
  ],
};

// =====================================================================
// LETTERS
// =====================================================================
const WORDS = [
  ['cat', '🐱'], ['dog', '🐶'], ['sun', '☀️'], ['fish', '🐟'], ['bee', '🐝'], ['apple', '🍎'], ['ball', '⚽'],
  ['hat', '🎩'], ['egg', '🥚'], ['tree', '🌳'], ['moon', '🌙'], ['star', '⭐'], ['frog', '🐸'], ['duck', '🦆'],
  ['pig', '🐷'], ['cow', '🐮'], ['bus', '🚌'], ['car', '🚗'], ['cake', '🍰'], ['boat', '⛵'], ['ant', '🐜'],
  ['lion', '🦁'], ['key', '🔑'], ['ring', '💍'], ['fox', '🦊'], ['owl', '🦉'], ['bat', '🦇'], ['rain', '🌧️'],
  ['goat', '🐐'], ['horse', '🐴'], ['mouse', '🐭'], ['nose', '👃'], ['tent', '⛺'], ['violin', '🎻'], ['zebra', '🦓'],
  ['whale', '🐳'], ['web', '🕸️'],
];
const SHORT = WORDS.filter(([w]) => w.length <= 4);
const ALPHA = 'abcdefghijklmnopqrstuvwxyz'.split('');
const VOWELS = ['a', 'e', 'i', 'o', 'u'];
// letters that sound too alike to be fair wrong answers
const SOUND_ALIKE = { c: 'ksq', k: 'cq', q: 'ck', s: 'cz', z: 's', f: 'v', v: 'f' };

function otherLetters(letter, count, pool = ALPHA) {
  const avoid = letter + (SOUND_ALIKE[letter] || '');
  return shuffle(pool.filter((l) => !avoid.includes(l))).slice(0, count);
}

const RHYMES = [
  ['cat', 'hat', 'bat', 'mat'], ['dog', 'frog', 'log', 'fog'], ['sun', 'bun', 'run', 'fun'], ['bee', 'tree', 'sea', 'key'],
  ['cake', 'lake', 'snake', 'rake'], ['star', 'car', 'jar', 'far'], ['moon', 'spoon', 'soon'],
  ['king', 'ring', 'sing', 'wing'], ['fish', 'dish', 'wish'], ['bed', 'red', 'head'], ['boat', 'coat', 'goat'],
  ['light', 'night', 'kite'], ['bear', 'chair', 'pear', 'hair'], ['mouse', 'house'], ['clock', 'sock', 'rock', 'lock'],
];

function misspell(word) {
  const out = new Set();
  let guard = 0;
  while (out.size < 3 && guard++ < 60) {
    const chars = word.split('');
    const kind = randInt(0, 3);
    const i = randInt(0, chars.length - 1);
    if (kind === 0 && chars.length > 2) { // swap neighbours
      const j = Math.min(i, chars.length - 2);
      [chars[j], chars[j + 1]] = [chars[j + 1], chars[j]];
    } else if (kind === 1) { // change a vowel
      const vi = chars.findIndex((c) => VOWELS.includes(c));
      if (vi >= 0) chars[vi] = pick(VOWELS.filter((v) => v !== chars[vi]));
    } else if (kind === 2) { // double a letter
      chars.splice(i, 0, chars[i]);
    } else { // swap a consonant
      const map = { c: 'k', k: 'c', f: 'v', g: 'j', s: 'z', t: 'd', d: 't', b: 'p', p: 'b', m: 'n', n: 'm' };
      const ci = chars.findIndex((c) => map[c]);
      if (ci >= 0) chars[ci] = map[chars[ci]];
    }
    const w = chars.join('');
    if (w !== word) out.add(w);
  }
  return [...out];
}

const letters = {
  1: [
    () => {
      const [w, e] = pick(WORDS);
      return textQ(`${e}\nWhat letter does “${w}” start with?`, `What letter does ${w} start with?`, w[0], otherLetters(w[0], 2));
    },
    () => {
      const l = pick(ALPHA.filter((c) => !'cosvwxz'.includes(c))); // skip letters whose capitals look the same
      return textQ(`${l.toUpperCase()}\nFind the little letter!`, `Can you find the little letter ${l}?`, l, otherLetters(l, 2));
    },
    () => {
      const i = randInt(0, 23);
      return textQ(`${ALPHA[i]}, ${ALPHA[i + 1]}, ?\nWhat comes next?`, `${ALPHA[i]}, ${ALPHA[i + 1]}. What letter comes next in the alphabet?`, ALPHA[i + 2], otherLetters(ALPHA[i + 2], 2));
    },
  ],
  2: [
    () => {
      const [w, e] = pick(SHORT);
      const vi = w.split('').findIndex((c) => VOWELS.includes(c));
      const i = vi >= 0 ? vi : 0;
      const gap = w.slice(0, i) + '_' + w.slice(i + 1);
      const pool = VOWELS.includes(w[i]) ? VOWELS : ALPHA;
      // only keep wrong letters that do not make another real word
      const real = new Set(['cat', 'cot', 'cut', 'hat', 'hit', 'hot', 'hut', 'bat', 'bet', 'bit', 'but', 'pig', 'peg', 'pug', 'bus', 'dog', 'dig', 'dug', 'sun', 'sin', 'son', 'fox', 'fix', 'bee', 'cow', 'car', 'cur', 'ant', 'owl', 'egg', 'key', 'web', 'ball', 'bell', 'bill', 'bull', 'fish', 'ring', 'rang', 'rung', 'duck', 'deck', 'dock', 'tent', 'tint', 'cake', 'coke', 'star', 'stir', 'moon', 'boat', 'beat', 'bout', 'goat', 'gout', 'lion', 'rain', 'ruin', 'nose', 'tree', 'true', 'frog', 'frag', 'frig', 'dick', 'caw', 'bot', 'fax', 'loon', 'rein', 'boll']);
      const wrong = shuffle(pool.filter((l) => l !== w[i] && !real.has(w.slice(0, i) + l + w.slice(i + 1)))).slice(0, 3);
      const safe = 'jqvxz'.split('');
      while (wrong.length < 3) { const l = safe[wrong.length]; if (l !== w[i] && !wrong.includes(l)) wrong.push(l); else wrong.push('k'); }
      return textQ(`${e}  ${gap}\nWhich letter is missing?`, `Which letter is missing from the word ${w}?`, w[i], wrong);
    },
    () => {
      const [w, e] = pick(SHORT.filter(([x]) => !/[e]$/.test(x)));
      const last = w[w.length - 1];
      return textQ(`${e}\nWhat letter does “${w}” end with?`, `What letter does ${w} end with?`, last, otherLetters(last, 3));
    },
    () => {
      const v = pick(VOWELS);
      return textQ('Which one is a vowel?', 'Which one of these letters is a vowel?', v, shuffle(ALPHA.filter((l) => !VOWELS.includes(l) && l !== 'y')).slice(0, 3));
    },
  ],
  3: [
    () => {
      const [w, e] = pick(WORDS.filter(([x]) => x.length >= 4));
      return textQ(`${e}\nWhich spelling is right?`, `Which is the right way to spell ${w}?`, w, misspell(w));
    },
    () => {
      const fam = pick(RHYMES);
      const [a, b] = shuffle(fam);
      const wrongs = shuffle(RHYMES.filter((f) => f !== fam)).slice(0, 3).map((f) => pick(f));
      return textQ(`Which word rhymes with “${a}”?`, `Which word rhymes with ${a}?`, b, wrongs);
    },
    () => {
      const [w, e] = pick(WORDS.filter(([x]) => x.length >= 4));
      const scrambled = shuffle(WORDS.filter(([x]) => x !== w && x.length >= 3)).slice(0, 3).map(([x]) => x);
      return textQ(`${e}\nFind the word!`, `Can you find the word ${w}?`, w, scrambled);
    },
  ],
};

// =====================================================================
// SHAPES & COLOURS
// =====================================================================
const COLORS = { red: '#e5484d', blue: '#2f7de0', yellow: '#ffcc2f', green: '#3fae5a', orange: '#f08a24', purple: '#8e5bd6', pink: '#f472b6' };
const COLOR_NAMES = Object.keys(COLORS);
const FLAT = ['circle', 'square', 'triangle', 'star', 'heart', 'rectangle'];
const SIDES = { triangle: 3, square: 4, pentagon: 5, hexagon: 6, octagon: 8 };
const SOLID = ['cube', 'sphere', 'cone', 'cylinder', 'pyramid'];
const S = (shape, colorName) => ({ shape, color: COLORS[colorName] });
const DOTS = { red: '🔴', blue: '🔵', green: '🟢', yellow: '🟡', orange: '🟠', purple: '🟣' };

const shapes = {
  1: [
    () => {
      const [c, ...rest] = shuffle(COLOR_NAMES);
      const sh = pick(['sphere', 'circle', 'star', 'heart']);
      return build(`Find the ${c} one!`, `Can you find the ${c} one?`, S(sh, c), rest.slice(0, 2).map((r) => S(sh, r)));
    },
    () => {
      const [sh, ...rest] = shuffle(FLAT);
      const cols = shuffle(COLOR_NAMES);
      return build(`Find the ${sh}!`, `Can you find the ${sh}?`, S(sh, cols[0]), rest.slice(0, 2).map((r, i) => S(r, cols[i + 1])));
    },
  ],
  2: [
    () => {
      const [c1, c2] = shuffle(COLOR_NAMES); const [s1, s2] = shuffle(FLAT);
      return build(`Find the ${c1} ${s1}!`, `Can you find the ${c1} ${s1}?`, S(s1, c1), [S(s2, c1), S(s1, c2), S(s2, c2)]);
    },
    () => {
      const [sh, ...rest] = shuffle(['triangle', 'square', 'pentagon', 'hexagon']);
      const cols = shuffle(COLOR_NAMES);
      return build(`Which shape has ${SIDES[sh]} sides?`, `Which shape has ${SIDES[sh]} sides?`, S(sh, cols[0]), rest.map((r, i) => S(r, cols[i + 1])));
    },
    () => {
      const [a, b, c, d] = shuffle(Object.keys(DOTS));
      return textQ(`${DOTS[a]} ${DOTS[b]} ${DOTS[a]} ${DOTS[b]} ${DOTS[a]} ❓\nWhat comes next?`, `Look at the pattern. ${a}, ${b}, ${a}, ${b}, ${a}. What comes next?`, DOTS[b], [DOTS[a], DOTS[c], DOTS[d]]);
    },
  ],
  3: [
    () => {
      const [sh, ...rest] = shuffle(SOLID);
      const cols = shuffle(COLOR_NAMES);
      return build(`Find the ${sh}!`, `Can you find the ${sh}?`, S(sh, cols[0]), rest.slice(0, 3).map((r, i) => S(r, cols[i + 1])));
    },
    () => {
      const things = { sphere: 'a football', cube: 'a dice', cone: 'a party hat', cylinder: 'a tin of beans' };
      const [sh, ...rest] = shuffle(Object.keys(things));
      const cols = shuffle(COLOR_NAMES);
      return build(`Which shape is like ${things[sh]}?`, `Which shape is like ${things[sh]}?`, S(sh, cols[0]), rest.map((r, i) => S(r, cols[i + 1])));
    },
    () => {
      const [sh, ...rest] = shuffle(Object.keys(SIDES));
      const cols = shuffle(COLOR_NAMES);
      return build(`Which shape has ${SIDES[sh]} corners?`, `Which shape has ${SIDES[sh]} corners?`, S(sh, cols[0]), rest.slice(0, 3).map((r, i) => S(r, cols[i + 1])));
    },
    () => {
      const [a, b, c, d] = shuffle(Object.keys(DOTS));
      return textQ(`${DOTS[a]} ${DOTS[b]} ${DOTS[b]} ${DOTS[a]} ${DOTS[b]} ${DOTS[b]} ${DOTS[a]} ❓\nWhat comes next?`, `Look at the pattern. ${a}, ${b}, ${b}. ${a}, ${b}, ${b}. ${a}. What comes next?`, DOTS[b], [DOTS[a], DOTS[c], DOTS[d]]);
    },
  ],
};

// =====================================================================
// OUR WORLD
// =====================================================================
const BANK = {
  1: [
    ['Which animal says “moo”?', '🐮', ['🐶', '🐱']],
    ['Which animal says “woof”?', '🐶', ['🐮', '🐔']],
    ['Which animal says “quack”?', '🦆', ['🐴', '🐑']],
    ['Which animal says “meow”?', '🐱', ['🐷', '🐸']],
    ['Which one is a fruit?', '🍌', ['🥕', '🧀']],
    ['Which one can fly?', '🦋', ['🐢', '🐟']],
    ['Which one lives in the sea?', '🐳', ['🦁', '🐔']],
    ['Which one do we wear on our feet?', '👟', ['🎩', '🧤']],
    ['Which one is hot?', '☀️', ['❄️', '⛄']],
    ['Which animal is the biggest?', '🐘', ['🐭', '🐱']],
    ['Which animal is the smallest?', '🐜', ['🐴', '🐻']],
    ['What do we use when it rains?', '☂️', ['🕶️', '🍦']],
    ['Which one has wheels?', '🚲', ['⛵', '🎈']],
    ['Which one is a vegetable?', '🥕', ['🍎', '🍰']],
    ['Where do we sleep?', '🛏️', ['🚗', '🛁']],
    ['What do bees make?', '🍯', ['🥚', '🧀']],
    ['Which one comes out at night?', '🌙', ['☀️', '🌈']],
    ['Which one gives us milk?', '🐄', ['🐔', '🐟']],
  ],
  2: [
    ['Which day comes after Monday?', 'Tuesday', ['Sunday', 'Friday', 'Thursday']],
    ['Which day comes after Friday?', 'Saturday', ['Monday', 'Thursday', 'Tuesday']],
    ['Which season is the coldest?', 'Winter', ['Summer', 'Spring', 'Autumn']],
    ['When do leaves fall off the trees?', 'Autumn', ['Summer', 'Spring', 'Winter']],
    ['What is the opposite of hot?', 'Cold', ['Big', 'Fast', 'Wet']],
    ['What is the opposite of up?', 'Down', ['Left', 'Tall', 'Near']],
    ['What is the opposite of big?', 'Small', ['Tall', 'Loud', 'Wide']],
    ['What is the opposite of day?', 'Night', ['Sun', 'Noon', 'Week']],
    ['What does a caterpillar turn into?', '🦋', ['🐝', '🐞', '🕷️']],
    ['What does a tadpole grow into?', '🐸', ['🐟', '🐍', '🐢']],
    ['Which animal lives in a hive?', '🐝', ['🐜', '🐦', '🐭']],
    ['How many legs does a spider have?', '8', ['4', '6', '10']],
    ['How many days are in a week?', '7', ['5', '6', '10']],
    ['Which food is the healthiest?', '🥦', ['🍩', '🍬', '🍟']],
    ['Which one helps plants grow?', '☀️', ['🌙', '❄️', '🔥']],
    ['Red and yellow mixed make…', 'Orange', ['Green', 'Purple', 'Blue']],
    ['Blue and yellow mixed make…', 'Green', ['Orange', 'Purple', 'Pink']],
    ['Which animal lives where it is icy?', '🐧', ['🐫', '🦁', '🐒']],
    ['Which animal has a very long neck?', '🦒', ['🐘', '🐊', '🐻']],
    ['How many wheels does a bicycle have?', '2', ['1', '3', '4']],
  ],
  3: [
    ['Which planet do we live on?', 'Earth', ['Mars', 'Venus', 'Jupiter']],
    ['Which star is closest to Earth?', 'The Sun', ['The Moon', 'Mars', 'Venus']],
    ['How many months are in a year?', '12', ['10', '7', '24']],
    ['Which month comes after March?', 'April', ['May', 'June', 'February']],
    ['Which is the first month of the year?', 'January', ['December', 'March', 'June']],
    ['What do you get when water freezes?', 'Ice', ['Steam', 'Rain', 'Sand']],
    ['Which one is a mammal?', '🐬', ['🦈', '🐙', '🦀']],
    ['Which one is an insect?', '🐜', ['🕷️', '🐌', '🐸']],
    ['How many legs does an insect have?', '6', ['4', '8', '10']],
    ['How many minutes are in an hour?', '60', ['30', '100', '24']],
    ['How many hours are in a day?', '24', ['12', '60', '10']],
    ['Which animal only eats plants?', '🐰', ['🦁', '🦈', '🦅']],
    ['Red and blue mixed make…', 'Purple', ['Green', 'Orange', 'Brown']],
    ['What is a baby dog called?', 'Puppy', ['Kitten', 'Cub', 'Calf']],
    ['What is a baby cow called?', 'Calf', ['Foal', 'Lamb', 'Chick']],
    ['What is a baby sheep called?', 'Lamb', ['Puppy', 'Foal', 'Cub']],
    ['Which part of a plant is under the ground?', 'Roots', ['Leaves', 'Flower', 'Stem']],
    ['What is the capital city of England?', 'London', ['Paris', 'Liverpool', 'Rome']],
    ['Which sense do we use our ears for?', 'Hearing', ['Seeing', 'Tasting', 'Smelling']],
    ['Which is the biggest animal in the sea?', '🐳', ['🦈', '🐙', '🐢']],
  ],
};
const speakable = (s) => s.replace(/[“”…]/g, '').trim();
const world = {};
[1, 2, 3].forEach((lvl) => {
  world[lvl] = [() => {
    const [q, right, wrong] = pick(BANK[lvl]);
    return textQ(q, speakable(q), right, wrong);
  }];
});

const GENERATORS = { math, letters, shapes, world };

/** Make `count` different questions for a zone at a level (1–3). */
export function makeQuestions(zoneId, level, count = 5) {
  const gens = GENERATORS[zoneId][level];
  const out = [];
  const seen = new Set();
  let guard = 0;
  while (out.length < count && guard++ < 200) {
    // rotate through question types so each quest has variety
    const q = gens[(out.length + guard) % gens.length]();
    const labels = q.options.map((o) => o.label ?? `${o.color}${o.shape}`);
    if (new Set(labels).size !== labels.length) continue; // duplicate answers
    if (seen.has(q.prompt)) continue;
    seen.add(q.prompt);
    out.push(q);
  }
  return out;
}
