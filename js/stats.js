// Session/persistent stats tracking backed by localStorage.
(function (global) {
  const STORAGE_KEY = 'staffTrainer.stats.v1';

  function loadRaw() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function emptyStats() {
    return { overall: { attempts: 0, correct: 0 }, perNote: {} };
  }

  class StatsTracker {
    constructor() {
      this.data = loadRaw() || emptyStats();
    }

    save() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    }

    record(noteName, isCorrect) {
      this.data.overall.attempts += 1;
      if (isCorrect) this.data.overall.correct += 1;

      if (!this.data.perNote[noteName]) {
        this.data.perNote[noteName] = { attempts: 0, correct: 0 };
      }
      this.data.perNote[noteName].attempts += 1;
      if (isCorrect) this.data.perNote[noteName].correct += 1;

      this.save();
    }

    getOverall() {
      const { attempts, correct } = this.data.overall;
      const accuracy = attempts ? Math.round((correct / attempts) * 100) : 0;
      return { attempts, correct, accuracy };
    }

    getPerNote() {
      const result = {};
      for (const name in this.data.perNote) {
        const { attempts, correct } = this.data.perNote[name];
        result[name] = {
          attempts,
          correct,
          accuracy: attempts ? Math.round((correct / attempts) * 100) : 0,
        };
      }
      return result;
    }

    reset() {
      this.data = emptyStats();
      this.save();
    }
  }

  global.ST = global.ST || {};
  global.ST.stats = { StatsTracker };
})(window);
