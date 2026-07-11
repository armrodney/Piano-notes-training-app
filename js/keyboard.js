// SVG piano keyboard rendering + hit-testing (white keys only are
// interactive/testable; black keys are drawn for visual realism so white
// keys can be located the way they would be on a real keyboard).
//
// The rendered keyboard is always the same overall size regardless of how
// many keys are in the current pool — key width shrinks to fit more keys
// into the same fixed-width canvas, rather than the whole component
// growing (which would change its on-screen dimensions question to
// question and look inconsistent).
(function (global) {
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const TOTAL_WIDTH = 620; // fixed keyboard width, independent of key count
  const WHITE_H = 150;
  const BLACK_H = 92;
  const MARGIN = 10;
  const LABEL_SPACE = 40; // room below the keys for a wrong-click letter label
  const BLACK_W_RATIO = 0.6; // black key width as a fraction of white key width
  const NO_BLACK_AFTER = ['E', 'B']; // no black key between E-F or B-C

  function el(tag, attrs) {
    const node = document.createElementNS(SVG_NS, tag);
    for (const k in attrs) node.setAttribute(k, attrs[k]);
    return node;
  }

  class PianoView {
    constructor(container) {
      this.container = container;
      this.svg = el('svg', {
        viewBox: `0 0 ${TOTAL_WIDTH} ${WHITE_H + MARGIN * 2 + LABEL_SPACE}`,
        class: 'piano-svg',
        'aria-label': 'Piano keyboard',
      });
      this.container.appendChild(this.svg);
      this.whiteLayer = el('g', { class: 'piano-white-keys' });
      this.blackLayer = el('g', { class: 'piano-black-keys' });
      this.markerLayer = el('g', { class: 'piano-markers' });
      this.svg.appendChild(this.whiteLayer);
      this.svg.appendChild(this.blackLayer);
      this.svg.appendChild(this.markerLayer);
      this.keyEls = new Map();
      this.notePool = [];
      this.whiteW = TOTAL_WIDTH; // recomputed on every draw()
    }

    // Draws the keyboard for the given contiguous note pool
    // ([{name, order}, ...]). If onClick is provided, white keys become
    // clickable and call onClick(note).
    draw(notePool, onClick) {
      this.notePool = notePool;
      // A black key follows every white key except E and B, matching a
      // real keyboard's 2-3-2-3... grouping. That's true even for the
      // last rendered key: draw its trailing black key (with no white key
      // after it) so the group it belongs to isn't cut short.
      const trailingBlack = !NO_BLACK_AFTER.includes(notePool[notePool.length - 1].name[0]);
      const innerWidth = TOTAL_WIDTH - MARGIN * 2;
      // Solves whiteW * (N + ratio/2) = innerWidth so the trailing black
      // key's right edge lands exactly at the same margin as everything
      // else, whether or not a trailing black key is drawn.
      const whiteW = innerWidth / (notePool.length + (trailingBlack ? BLACK_W_RATIO / 2 : 0));
      const blackW = whiteW * BLACK_W_RATIO;
      this.whiteW = whiteW;

      this.whiteLayer.innerHTML = '';
      this.blackLayer.innerHTML = '';
      this.markerLayer.innerHTML = '';
      this.keyEls.clear();

      notePool.forEach((note, i) => {
        const x = MARGIN + i * whiteW;
        const rect = el('rect', {
          x,
          y: MARGIN,
          width: whiteW,
          height: WHITE_H,
          class: 'piano-key piano-key-white',
          'data-note': note.name,
        });
        if (onClick) {
          rect.classList.add('clickable');
          rect.addEventListener('click', () => onClick(note));
        }
        this.whiteLayer.appendChild(rect);
        this.keyEls.set(note.name, rect);

        const letter = note.name[0];
        if (!NO_BLACK_AFTER.includes(letter)) {
          const bx = MARGIN + (i + 1) * whiteW - blackW / 2;
          const black = el('rect', {
            x: bx,
            y: MARGIN,
            width: blackW,
            height: BLACK_H,
            class: 'piano-key piano-key-black',
          });
          this.blackLayer.appendChild(black);
        }
      });
    }

    // Marks a specific note's key. `kind` is one of 'target' (neutral
    // "this is the note" marker, used by Keyboard->Letter before an
    // answer), 'correct', 'incorrect', or 'reveal'.
    markAnswer(note, kind) {
      const rect = this.keyEls.get(note.name);
      if (!rect) return;
      rect.classList.add('key-' + kind);
      const cx = parseFloat(rect.getAttribute('x')) + this.whiteW / 2;
      const cy = MARGIN + WHITE_H - 24;
      const marker = el('circle', { cx, cy, r: 8, class: `key-marker key-marker-${kind}` });
      this.markerLayer.appendChild(marker);
    }

    // Draws a small text label under a key — used to show which letter
    // the user's (wrong) click actually landed on.
    labelNote(note, text) {
      const rect = this.keyEls.get(note.name);
      if (!rect) return;
      const cx = parseFloat(rect.getAttribute('x')) + this.whiteW / 2;
      const label = el('text', {
        x: cx,
        y: MARGIN + WHITE_H + 30,
        class: 'key-label',
        'text-anchor': 'middle',
      });
      label.textContent = text;
      this.markerLayer.appendChild(label);
    }
  }

  global.ST = global.ST || {};
  global.ST.keyboard = { PianoView };
})(window);
