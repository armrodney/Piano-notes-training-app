// Note data for treble & bass clef practice, plus a clef-independent
// piano-keyboard note range.
//
// `pos` is a diatonic step index where each unit = one line-or-space step,
// used identically by both clefs since the staff is drawn the same way
// (5 lines) regardless of which clef occupies it:
//   pos 2..10 (even=line, odd=space) = the 9 in-staff positions
//   pos 0,1 and 11,12               = the extended ledger-line positions
(function (global) {
  const LETTERS_FROM_C = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

  // Absolute pitch order for naturals, increasing left-to-right on a piano
  // (each octave starts at C). Used to build a contiguous keyboard range.
  function absoluteOrder(name) {
    const letter = name[0];
    const octave = Number(name.slice(1));
    return octave * 7 + LETTERS_FROM_C.indexOf(letter);
  }

  function nameFromOrder(order) {
    const octave = Math.floor(order / 7);
    const letter = LETTERS_FROM_C[((order % 7) + 7) % 7];
    return letter + octave;
  }

  const CLEFS = {
    treble: {
      label: 'Treble',
      glyph: '\u{1D11E}',
      glyphFontSize: 90,
      glyphAnchorPos: 4, // clef curls around G4
      glyphYOffset: 32,
      standard: [
        { name: 'E4', pos: 2 },
        { name: 'F4', pos: 3 },
        { name: 'G4', pos: 4 },
        { name: 'A4', pos: 5 },
        { name: 'B4', pos: 6 },
        { name: 'C5', pos: 7 },
        { name: 'D5', pos: 8 },
        { name: 'E5', pos: 9 },
        { name: 'F5', pos: 10 },
      ],
      extendedExtra: [
        { name: 'C4', pos: 0 },
        { name: 'D4', pos: 1 },
        { name: 'G5', pos: 11 },
        { name: 'A5', pos: 12 },
      ],
    },
    bass: {
      label: 'Bass',
      glyph: '\u{1D122}',
      glyphFontSize: 60,
      glyphAnchorPos: 8, // clef dots straddle F3
      glyphYOffset: 4,
      standard: [
        { name: 'G2', pos: 2 },
        { name: 'A2', pos: 3 },
        { name: 'B2', pos: 4 },
        { name: 'C3', pos: 5 },
        { name: 'D3', pos: 6 },
        { name: 'E3', pos: 7 },
        { name: 'F3', pos: 8 },
        { name: 'G3', pos: 9 },
        { name: 'A3', pos: 10 },
      ],
      extendedExtra: [
        { name: 'E2', pos: 0 },
        { name: 'F2', pos: 1 },
        { name: 'B3', pos: 11 },
        { name: 'C4', pos: 12 },
      ],
    },
  };

  function getActiveNotes(clefKey, extended) {
    const clef = CLEFS[clefKey];
    const notes = clef.standard.concat(extended ? clef.extendedExtra : []);
    return notes.slice().sort((a, b) => a.pos - b.pos);
  }

  function letterOf(noteName) {
    return noteName[0];
  }

  function randomNote(clefKey, extended) {
    const pool = getActiveNotes(clefKey, extended);
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // A letter can map to more than one position in the active range (e.g.
  // "C" -> C4 and C5). Pick a random letter, and return every matching
  // position so any of them counts as a correct click.
  function randomLetterPrompt(clefKey, extended) {
    const pool = getActiveNotes(clefKey, extended);
    const letters = Array.from(new Set(pool.map((n) => letterOf(n.name))));
    const letter = letters[Math.floor(Math.random() * letters.length)];
    const validNotes = pool.filter((n) => letterOf(n.name) === letter);
    return { letter, validNotes };
  }

  // Clef-independent range for the piano keyboard: the contiguous span of
  // natural notes from the lowest to the highest active note across every
  // enabled clef. A real keyboard has no gaps, so this fills in between
  // even if e.g. treble and bass ranges don't touch.
  function getKeyboardRange(clefKeys, extended) {
    const keys = clefKeys && clefKeys.length ? clefKeys : ['treble'];
    let notes = [];
    keys.forEach((clefKey) => {
      notes = notes.concat(getActiveNotes(clefKey, extended));
    });
    const orders = notes.map((n) => absoluteOrder(n.name));
    const min = Math.min(...orders);
    const max = Math.max(...orders);
    const range = [];
    for (let o = min; o <= max; o++) {
      range.push({ name: nameFromOrder(o), order: o });
    }
    return range;
  }

  function randomFromPool(pool) {
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // A same-size (or larger), randomly-shifted slice of the keyboard range
  // that still contains `anchorOrder`. Always spans at least two full
  // letter cycles (14 white keys = 2 octaves) so there's a real 2-3-2-3
  // black-key pattern to read the note's position from, even when the
  // settings-implied range (e.g. one clef, standard) is narrower than
  // that. Randomizing the start stops any single note from always landing
  // at the same spot on screen, so it has to be found relative to the
  // black-key groups rather than memorized by screen position.
  const MIN_KEYBOARD_WINDOW = 14;
  function windowedKeyboardRange(clefKeys, extended, anchorOrder) {
    const fullRange = getKeyboardRange(clefKeys, extended);
    const length = Math.max(fullRange.length, MIN_KEYBOARD_WINDOW);
    const base = fullRange[0].order;
    const maxShift = Math.max(2, Math.floor(length / 3));
    const lo = Math.max(-maxShift, anchorOrder - length + 1 - base);
    const hi = Math.min(maxShift, anchorOrder - base);
    const shift = lo + Math.floor(Math.random() * (hi - lo + 1));
    const newBase = base + shift;
    const window = [];
    for (let o = newBase; o < newBase + length; o++) {
      window.push({ name: nameFromOrder(o), order: o });
    }
    return window;
  }

  function randomLetterPromptFromPool(pool) {
    const letters = Array.from(new Set(pool.map((n) => letterOf(n.name))));
    const letter = letters[Math.floor(Math.random() * letters.length)];
    const validNotes = pool.filter((n) => letterOf(n.name) === letter);
    return { letter, validNotes };
  }

  global.ST = global.ST || {};
  global.ST.notes = {
    CLEFS,
    getActiveNotes,
    letterOf,
    randomNote,
    randomLetterPrompt,
    getKeyboardRange,
    windowedKeyboardRange,
    randomFromPool,
    randomLetterPromptFromPool,
    absoluteOrder,
    nameFromOrder,
  };
})(window);
