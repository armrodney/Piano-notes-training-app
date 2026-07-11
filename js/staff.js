// SVG staff rendering + hit-testing. Works for either clef; the caller
// supplies which clef and which notes are active.
(function (global) {
  const SVG_NS = 'http://www.w3.org/2000/svg';

  const VIEW_W = 320;
  const VIEW_H = 240;
  const HALF_STEP = 12; // px per diatonic step
  const BOTTOM_LINE_Y = 190; // y for pos=2 (bottom staff line)
  const NOTE_X = 190; // x center for the rendered note / guides
  const REGION_X = 90; // left edge of clickable regions (right of clef)
  const REGION_W = 190;
  const STAFF_LEFT_X = 40;
  const STAFF_RIGHT_X = 280;

  function positionToY(pos) {
    return BOTTOM_LINE_Y - (pos - 2) * HALF_STEP;
  }

  function isLinePosition(pos) {
    return pos % 2 === 0;
  }

  // Ledger positions strictly needed to "reach" a note at the given pos.
  function ledgerPositionsFor(pos) {
    const result = [];
    if (pos < 2) {
      for (let p = 0; p >= pos; p -= 2) {
        if (p < 2) result.push(p);
      }
    } else if (pos > 10) {
      for (let p = 12; p <= pos; p += 2) {
        if (p > 10) result.push(p);
      }
    }
    return result;
  }

  function el(tag, attrs) {
    const node = document.createElementNS(SVG_NS, tag);
    for (const k in attrs) node.setAttribute(k, attrs[k]);
    return node;
  }

  class StaffView {
    constructor(container) {
      this.container = container;
      this.svg = el('svg', {
        viewBox: `0 0 ${VIEW_W} ${VIEW_H}`,
        class: 'staff-svg',
        'aria-label': 'Musical staff',
      });
      this.container.appendChild(this.svg);
      this.baseLayer = el('g', { class: 'staff-base' });
      this.noteLayer = el('g', { class: 'staff-notes' });
      this.regionLayer = el('g', { class: 'staff-regions' });
      this.svg.appendChild(this.baseLayer);
      this.svg.appendChild(this.noteLayer);
      this.svg.appendChild(this.regionLayer);
    }

    // Draws the 5 staff lines, clef, and (optionally) faint ledger guides
    // for the extended-range positions so they're clickable even with no
    // note displayed.
    drawBase(extendedRange, clefInfo) {
      this.baseLayer.innerHTML = '';
      for (let pos = 2; pos <= 10; pos += 2) {
        const y = positionToY(pos);
        this.baseLayer.appendChild(
          el('line', {
            x1: STAFF_LEFT_X,
            y1: y,
            x2: STAFF_RIGHT_X,
            y2: y,
            class: 'staff-line',
          })
        );
      }

      if (clefInfo) {
        const clef = el('text', {
          x: 48,
          y: positionToY(clefInfo.glyphAnchorPos) + clefInfo.glyphYOffset,
          class: 'clef-symbol',
          style: `font-size:${clefInfo.glyphFontSize}px`,
        });
        clef.textContent = clefInfo.glyph;
        this.baseLayer.appendChild(clef);
      }

      if (extendedRange) {
        [0, 12].forEach((pos) => {
          const y = positionToY(pos);
          this.baseLayer.appendChild(
            el('line', {
              x1: NOTE_X - 20,
              y1: y,
              x2: NOTE_X + 20,
              y2: y,
              class: 'ledger-guide',
            })
          );
        });
      }
    }

    clearNotes() {
      this.noteLayer.innerHTML = '';
    }

    // Draws a notehead (+ any needed ledger lines) at the given position.
    // `className` controls color/state via CSS (e.g. 'note-default',
    // 'note-correct', 'note-incorrect', 'note-reveal').
    drawNoteAtPos(pos, className) {
      const y = positionToY(pos);
      ledgerPositionsFor(pos).forEach((lp) => {
        const ly = positionToY(lp);
        this.noteLayer.appendChild(
          el('line', {
            x1: NOTE_X - 20,
            y1: ly,
            x2: NOTE_X + 20,
            y2: ly,
            class: 'ledger-line',
          })
        );
      });
      const note = el('ellipse', {
        cx: NOTE_X,
        cy: y,
        rx: 10,
        ry: 7.5,
        transform: `rotate(-18 ${NOTE_X} ${y})`,
        class: `notehead ${className || ''}`.trim(),
      });
      this.noteLayer.appendChild(note);
      return note;
    }

    // Creates invisible, clickable rects for every note in the active pool.
    // Calls onClick(note) when one is clicked.
    drawClickRegions(notePool, onClick) {
      this.regionLayer.innerHTML = '';
      notePool.forEach((note) => {
        const y = positionToY(note.pos) - HALF_STEP / 2;
        const rect = el('rect', {
          x: REGION_X,
          y,
          width: REGION_W,
          height: HALF_STEP,
          class: 'click-region',
          'data-note': note.name,
        });
        rect.addEventListener('click', () => onClick(note));
        this.regionLayer.appendChild(rect);
      });
    }

    clearClickRegions() {
      this.regionLayer.innerHTML = '';
    }

    // Draws/marks a note's visual: a background highlight band across its
    // line/space (so the position reads clearly even when a notehead was
    // already sitting there, e.g. revealing the answer in Staff->Letter)
    // plus the notehead itself. `kind` is one of 'target' | 'correct' |
    // 'incorrect' | 'reveal'.
    markAnswer(note, kind) {
      if (kind === 'correct' || kind === 'incorrect' || kind === 'reveal') {
        const y = positionToY(note.pos) - HALF_STEP / 2;
        this.noteLayer.appendChild(
          el('rect', {
            x: REGION_X,
            y,
            width: REGION_W,
            height: HALF_STEP,
            class: `note-band ${kind === 'incorrect' ? 'band-incorrect' : 'band-correct'}`,
          })
        );
      }
      const noteClass = { target: 'note-default', correct: 'note-correct', incorrect: 'note-incorrect', reveal: 'note-reveal' }[kind];
      this.drawNoteAtPos(note.pos, noteClass);
    }

    // Draws a small text label to the right of a position — used to show
    // which letter the user's (wrong) click actually landed on.
    labelNote(note, text) {
      const label = el('text', {
        x: NOTE_X + 22,
        y: positionToY(note.pos) + 5,
        class: 'note-label',
      });
      label.textContent = text;
      this.noteLayer.appendChild(label);
    }
  }

  global.ST = global.ST || {};
  global.ST.staff = { StaffView, positionToY, isLinePosition, ledgerPositionsFor };
})(window);
