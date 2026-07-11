(function () {
  const {
    getActiveNotes,
    getKeyboardRange,
    windowedKeyboardRange,
    randomFromPool,
    randomLetterPromptFromPool,
    letterOf,
    CLEFS,
  } = ST.notes;
  const { StaffView } = ST.staff;
  const { PianoView } = ST.keyboard;
  const { StatsTracker } = ST.stats;

  const CORRECT_DELAY_MS = 700;
  const INCORRECT_DELAY_MS = 1800;
  const SETTINGS_KEY = 'staffTrainer.settings.v2';

  const TYPE_INFO = {
    'letter-to-staff': { target: 'staff', direction: 'letterToX' },
    'staff-to-letter': { target: 'staff', direction: 'xToLetter' },
    'letter-to-keyboard': { target: 'keyboard', direction: 'letterToX' },
    'keyboard-to-letter': { target: 'keyboard', direction: 'xToLetter' },
  };

  const els = {
    prompt: document.getElementById('prompt'),
    staffContainer: document.getElementById('staffContainer'),
    keyboardContainer: document.getElementById('keyboardContainer'),
    letterButtons: document.getElementById('letterButtons'),
    feedback: document.getElementById('feedback'),
    extendedRangeToggle: document.getElementById('extendedRangeToggle'),
    clefCheckboxes: Array.from(document.querySelectorAll('.clef-checkbox')),
    questionTypeCheckboxes: Array.from(document.querySelectorAll('.question-type-checkbox')),
    settingsWarning: document.getElementById('settingsWarning'),
    overallStats: document.getElementById('overallStats'),
    perNoteStats: document.getElementById('perNoteStatsBody'),
    resetStatsBtn: document.getElementById('resetStatsBtn'),
  };

  const staffView = new StaffView(els.staffContainer);
  const pianoView = new PianoView(els.keyboardContainer);
  const stats = new StatsTracker();

  function defaultSettings() {
    return {
      extendedRange: false,
      clefs: { treble: true, bass: false },
      questionTypes: {
        'letter-to-staff': true,
        'staff-to-letter': true,
        'letter-to-keyboard': false,
        'keyboard-to-letter': false,
      },
    };
  }

  function loadSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return defaultSettings();
      const parsed = JSON.parse(raw);
      const defaults = defaultSettings();
      return {
        extendedRange: !!parsed.extendedRange,
        clefs: Object.assign(defaults.clefs, parsed.clefs),
        questionTypes: Object.assign(defaults.questionTypes, parsed.questionTypes),
      };
    } catch (e) {
      return defaultSettings();
    }
  }

  function saveSettings() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
  }

  const state = {
    settings: loadSettings(),
    current: null,
    awaitingNext: false,
  };

  // ---------- Settings checkbox wiring (each group needs >=1 checked) ----------

  function checkedValues(checkboxEls) {
    return checkboxEls.filter((cb) => cb.checked).map((cb) => cb.dataset.value);
  }

  function wireCheckboxGroup(checkboxEls, applySelection) {
    checkboxEls.forEach((cb) => {
      cb.addEventListener('change', () => {
        if (checkedValues(checkboxEls).length === 0) {
          cb.checked = true;
          flashSettingsWarning('At least one option must stay selected.');
          return;
        }
        applySelection(checkedValues(checkboxEls));
        saveSettings();
        newQuestion();
      });
    });
  }

  let warningTimeout = null;
  function flashSettingsWarning(message) {
    els.settingsWarning.textContent = message;
    clearTimeout(warningTimeout);
    warningTimeout = setTimeout(() => {
      els.settingsWarning.textContent = '';
    }, 2000);
  }

  function initSettingsUI() {
    els.clefCheckboxes.forEach((cb) => {
      cb.checked = !!state.settings.clefs[cb.dataset.value];
    });
    els.questionTypeCheckboxes.forEach((cb) => {
      cb.checked = !!state.settings.questionTypes[cb.dataset.value];
    });
    els.extendedRangeToggle.checked = state.settings.extendedRange;

    wireCheckboxGroup(els.clefCheckboxes, (values) => {
      Object.keys(state.settings.clefs).forEach((k) => (state.settings.clefs[k] = values.includes(k)));
    });
    wireCheckboxGroup(els.questionTypeCheckboxes, (values) => {
      Object.keys(state.settings.questionTypes).forEach((k) => (state.settings.questionTypes[k] = values.includes(k)));
    });
    els.extendedRangeToggle.addEventListener('change', () => {
      state.settings.extendedRange = els.extendedRangeToggle.checked;
      saveSettings();
      newQuestion();
    });
  }

  function activeClefs() {
    const keys = Object.keys(state.settings.clefs).filter((k) => state.settings.clefs[k]);
    return keys.length ? keys : ['treble'];
  }

  function activeQuestionTypes() {
    const keys = Object.keys(state.settings.questionTypes).filter((k) => state.settings.questionTypes[k]);
    return keys.length ? keys : ['letter-to-staff'];
  }

  // A randomly-shifted slice of the keyboard, so the same note doesn't
  // always land in the same screen position across questions (see
  // windowedKeyboardRange). Anchored on a random note from the full
  // settings-implied range, then the usual random-letter/random-note
  // pickers run against this window.
  function keyboardWindowPool() {
    const clefs = activeClefs();
    const extended = state.settings.extendedRange;
    const anchor = randomFromPool(getKeyboardRange(clefs, extended));
    return windowedKeyboardRange(clefs, extended, anchor.order);
  }

  function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // ---------- Question generation ----------

  function newQuestion() {
    els.feedback.textContent = '';
    els.feedback.className = 'feedback';
    state.awaitingNext = false;
    resetLetterButtonStates();

    const type = pickRandom(activeQuestionTypes());
    const info = TYPE_INFO[type];
    const clef = info.target === 'staff' ? pickRandom(activeClefs()) : null;
    const pool = info.target === 'staff' ? getActiveNotes(clef, state.settings.extendedRange) : keyboardWindowPool();

    if (info.target === 'staff') {
      els.staffContainer.classList.remove('hidden');
      els.keyboardContainer.classList.add('hidden');
      staffView.drawBase(state.settings.extendedRange, CLEFS[clef]);
      staffView.clearNotes();
      if (info.direction === 'letterToX') {
        staffView.drawClickRegions(pool, onRegionClick);
      } else {
        staffView.clearClickRegions();
      }
    } else {
      els.keyboardContainer.classList.remove('hidden');
      els.staffContainer.classList.add('hidden');
      pianoView.draw(pool, info.direction === 'letterToX' ? onRegionClick : null);
    }

    if (info.direction === 'letterToX') {
      const { letter, validNotes } = randomLetterPromptFromPool(pool);
      state.current = { type, clef, letter, validNotes, pool };
      els.prompt.textContent = letter;
      els.prompt.classList.remove('hidden');
      els.letterButtons.classList.add('hidden');
    } else {
      const note = randomFromPool(pool);
      state.current = { type, clef, note, pool };
      els.prompt.classList.add('hidden');
      els.letterButtons.classList.remove('hidden');
      markAnswerForCurrent(note, 'target');
    }
  }

  function markAnswerForCurrent(note, kind) {
    const view = TYPE_INFO[state.current.type].target === 'staff' ? staffView : pianoView;
    view.markAnswer(note, kind);
  }

  function labelAnswerForCurrent(note, text) {
    const view = TYPE_INFO[state.current.type].target === 'staff' ? staffView : pianoView;
    view.labelNote(note, text);
  }

  // ---------- Answering (letter -> staff/keyboard) ----------

  function onRegionClick(clickedNote) {
    if (state.awaitingNext) return;
    const { validNotes, letter } = state.current;
    const isCorrect = validNotes.some((n) => n.name === clickedNote.name);

    stats.record(clickedNote.name, isCorrect);
    refreshStatsPanel();
    state.awaitingNext = true;

    if (isCorrect) {
      markAnswerForCurrent(clickedNote, 'correct');
      validNotes.filter((n) => n.name !== clickedNote.name).forEach((n) => markAnswerForCurrent(n, 'reveal'));
      showFeedback('Correct!', true);
      setTimeout(newQuestion, CORRECT_DELAY_MS);
    } else {
      markAnswerForCurrent(clickedNote, 'incorrect');
      labelAnswerForCurrent(clickedNote, letterOf(clickedNote.name));
      validNotes.forEach((n) => markAnswerForCurrent(n, 'reveal'));
      showFeedback(`Not quite — that's the ${letter} you were looking for.`, false);
      setTimeout(newQuestion, INCORRECT_DELAY_MS);
    }
  }

  // ---------- Answering (staff/keyboard -> letter) ----------

  function onLetterButtonClick(letter) {
    if (state.awaitingNext) return;
    const { note, pool } = state.current;
    const isCorrect = letterOf(note.name) === letter;

    stats.record(note.name, isCorrect);
    refreshStatsPanel();
    state.awaitingNext = true;

    const btn = els.letterButtons.querySelector(`[data-letter="${letter}"]`);

    if (isCorrect) {
      btn.classList.add('btn-correct');
      markAnswerForCurrent(note, 'correct');
      showFeedback('Correct!', true);
      setTimeout(newQuestion, CORRECT_DELAY_MS);
    } else {
      btn.classList.add('btn-incorrect');
      const correctBtn = els.letterButtons.querySelector(`[data-letter="${letterOf(note.name)}"]`);
      if (correctBtn) correctBtn.classList.add('btn-correct');
      // Show every position where the guessed letter actually occurs (red)
      // — there can be more than one, e.g. E/F appear twice in the
      // standard treble range — alongside the real answer (green).
      pool.filter((n) => letterOf(n.name) === letter).forEach((n) => markAnswerForCurrent(n, 'incorrect'));
      markAnswerForCurrent(note, 'reveal');
      showFeedback(`Not quite — that note is ${note.name[0]}.`, false);
      setTimeout(newQuestion, INCORRECT_DELAY_MS);
    }
  }

  function buildLetterButtons() {
    els.letterButtons.innerHTML = '';
    ['A', 'B', 'C', 'D', 'E', 'F', 'G'].forEach((letter) => {
      const btn = document.createElement('button');
      btn.textContent = letter;
      btn.className = 'letter-btn';
      btn.dataset.letter = letter;
      btn.addEventListener('click', () => onLetterButtonClick(letter));
      els.letterButtons.appendChild(btn);
    });
  }

  function resetLetterButtonStates() {
    els.letterButtons.querySelectorAll('.letter-btn').forEach((btn) => {
      btn.classList.remove('btn-correct', 'btn-incorrect');
    });
  }

  // ---------- Feedback / stats UI ----------

  function showFeedback(message, isCorrect) {
    els.feedback.textContent = message;
    els.feedback.className = 'feedback ' + (isCorrect ? 'feedback-correct' : 'feedback-incorrect');
  }

  function refreshStatsPanel() {
    const overall = stats.getOverall();
    els.overallStats.textContent = `${overall.correct} / ${overall.attempts} correct (${overall.accuracy}%)`;

    const perNote = stats.getPerNote();
    const names = Object.keys(perNote).sort((a, b) => ST.notes.absoluteOrder(a) - ST.notes.absoluteOrder(b));

    els.perNoteStats.innerHTML = '';
    names.forEach((name) => {
      const row = document.createElement('tr');
      const s = perNote[name];
      row.innerHTML = `<td>${name}</td><td>${s.correct}/${s.attempts}</td><td>${s.accuracy}%</td>`;
      els.perNoteStats.appendChild(row);
    });
  }

  // ---------- Keyboard shortcuts (A-G answer letter-guess questions) ----------

  document.addEventListener('keydown', (e) => {
    if (!state.current || state.awaitingNext) return;
    if (TYPE_INFO[state.current.type].direction !== 'xToLetter') return;
    const letter = e.key.toUpperCase();
    if (['A', 'B', 'C', 'D', 'E', 'F', 'G'].includes(letter)) {
      onLetterButtonClick(letter);
    }
  });

  // ---------- Reset stats ----------

  els.resetStatsBtn.addEventListener('click', () => {
    if (confirm('Reset all saved stats? This cannot be undone.')) {
      stats.reset();
      refreshStatsPanel();
    }
  });

  // ---------- Init ----------

  buildLetterButtons();
  initSettingsUI();
  refreshStatsPanel();
  newQuestion();
})();
