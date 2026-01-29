import { useState, useCallback, useRef, useEffect } from "react";
import "./App.css";

// Notes in order (using sharps for display, but we'll accept flats too)
const NOTES = ["A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#"];

// Base frequencies for open strings (in Hz)
// Standard tuning: E2, A2, D3, G3, B3, E4
const OPEN_STRING_FREQUENCIES = [
  82.41, // E2 - 6th string (low E)
  110.0, // A2 - 5th string
  146.83, // D3 - 4th string
  196.0, // G3 - 3rd string
  246.94, // B3 - 2nd string
  329.63, // E4 - 1st string (high E)
];

// Semitone ratio (12th root of 2)
const SEMITONE_RATIO = Math.pow(2, 1 / 12);

// Get frequency for a specific string and fret
function getFrequency(stringIndex: number, fret: number): number {
  const openFreq = OPEN_STRING_FREQUENCIES[stringIndex];
  return openFreq * Math.pow(SEMITONE_RATIO, fret);
}

// Audio context singleton
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

// Play a guitar-like plucked sound
function playNote(stringIndex: number, fret: number): void {
  const ctx = getAudioContext();
  const frequency = getFrequency(stringIndex, fret);
  const now = ctx.currentTime;

  // Create master gain for overall volume
  const masterGain = ctx.createGain();
  masterGain.connect(ctx.destination);
  masterGain.gain.value = 0.4;

  // Create multiple oscillators for richer sound (harmonics)
  const oscillators: OscillatorNode[] = [];
  const gains: GainNode[] = [];

  // Fundamental + harmonics with decreasing amplitude
  const harmonics = [1, 2, 3, 4, 5];
  const harmonicGains = [1, 0.5, 0.25, 0.125, 0.0625];

  harmonics.forEach((harmonic, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Use triangle wave for warmer sound
    osc.type = i === 0 ? "triangle" : "sine";
    osc.frequency.value = frequency * harmonic;

    // Slight detune for more natural sound
    osc.detune.value = (Math.random() - 0.5) * 5;

    gain.gain.value = harmonicGains[i];
    gain.connect(masterGain);
    osc.connect(gain);

    oscillators.push(osc);
    gains.push(gain);
  });

  // Apply pluck envelope (quick attack, gradual decay)
  const attackTime = 0.005;
  const decayTime = 1.5;

  gains.forEach((gain, i) => {
    const startGain = harmonicGains[i];
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(startGain, now + attackTime);
    gain.gain.exponentialRampToValueAtTime(0.001, now + decayTime);
  });

  // Start and stop oscillators
  oscillators.forEach((osc) => {
    osc.start(now);
    osc.stop(now + decayTime);
  });
}

// Flat equivalents for display purposes
const FLAT_EQUIVALENTS: Record<string, string> = {
  "A#": "Bb",
  "C#": "Db",
  "D#": "Eb",
  "F#": "Gb",
  "G#": "Ab",
};

// Standard guitar tuning (string 6 to string 1, low E to high E)
const STRING_TUNING = ["E", "A", "D", "G", "B", "E"];
const STRING_NAMES = [
  "6 (Low E)",
  "5 (A)",
  "4 (D)",
  "3 (G)",
  "2 (B)",
  "1 (High E)",
];

// Number of frets to display (0 = open string)
const NUM_FRETS = 12;

// Get note at a specific string and fret
function getNoteAt(stringIndex: number, fret: number): string {
  const openNote = STRING_TUNING[stringIndex];
  const openNoteIndex = NOTES.indexOf(openNote);
  const noteIndex = (openNoteIndex + fret) % 12;
  return NOTES[noteIndex];
}

// Check if answer is correct (accepting both sharp and flat names)
function isCorrectAnswer(answer: string, correctNote: string): boolean {
  if (answer === correctNote) return true;
  if (FLAT_EQUIVALENTS[correctNote] === answer) return true;
  // Check reverse (if user typed sharp equivalent of a flat)
  for (const [sharp, flat] of Object.entries(FLAT_EQUIVALENTS)) {
    if (flat === correctNote && sharp === answer) return true;
  }
  return false;
}

// Get display name for a note (showing both sharp and flat)
function getNoteDisplay(note: string): string {
  if (FLAT_EQUIVALENTS[note]) {
    return `${note} / ${FLAT_EQUIVALENTS[note]}`;
  }
  return note;
}

interface Position {
  string: number;
  fret: number;
}

function getRandomPosition(): Position {
  return {
    string: Math.floor(Math.random() * 6),
    fret: Math.floor(Math.random() * (NUM_FRETS + 1)), // 0 to NUM_FRETS inclusive
  };
}

const SWEAT_MODE_TIME = 5; // seconds

// Fun melody - a happy, bouncy tune across the fretboard
const FUN_MELODY: { string: number; fret: number; duration: number }[] = [
  // Happy opening - G major vibes
  { string: 2, fret: 0, duration: 250 }, // D
  { string: 3, fret: 0, duration: 250 }, // G
  { string: 4, fret: 0, duration: 250 }, // B
  { string: 3, fret: 0, duration: 250 }, // G
  // Climb up!
  { string: 5, fret: 0, duration: 200 }, // E
  { string: 5, fret: 3, duration: 200 }, // G
  { string: 5, fret: 5, duration: 300 }, // A
  // Bounce around
  { string: 4, fret: 3, duration: 200 }, // D
  { string: 5, fret: 5, duration: 200 }, // A
  { string: 4, fret: 3, duration: 200 }, // D
  { string: 5, fret: 3, duration: 300 }, // G
  // Fun descending run
  { string: 3, fret: 4, duration: 180 }, // B
  { string: 3, fret: 2, duration: 180 }, // A
  { string: 3, fret: 0, duration: 180 }, // G
  { string: 2, fret: 2, duration: 180 }, // E
  { string: 2, fret: 0, duration: 300 }, // D
  // Big finish!
  { string: 1, fret: 2, duration: 250 }, // B
  { string: 2, fret: 2, duration: 250 }, // E
  { string: 3, fret: 0, duration: 400 }, // G (hold)
];

function App() {
  const [currentPosition, setCurrentPosition] =
    useState<Position>(getRandomPosition);
  const [feedback, setFeedback] = useState<{
    message: string;
    correct: boolean;
  } | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [showAnswer, setShowAnswer] = useState(false);
  const [sweatMode, setSweatMode] = useState(false);
  const [studyMode, setStudyMode] = useState(false);
  const [timeLeft, setTimeLeft] = useState(SWEAT_MODE_TIME);
  const [easterEggPlaying, setEasterEggPlaying] = useState(false);
  const [easterEggNote, setEasterEggNote] = useState<Position | null>(null);
  const isFirstRender = useRef(true);
  const timerRef = useRef<number | null>(null);
  const easterEggRef = useRef<boolean>(false);

  const correctNote = getNoteAt(currentPosition.string, currentPosition.fret);

  // Clear timer helper
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Handle time running out
  const handleTimeUp = useCallback(() => {
    clearTimer();
    setScore((prev) => ({
      correct: prev.correct,
      total: prev.total + 1,
    }));
    setFeedback({
      message: `Time's up! That was ${getNoteDisplay(correctNote)}`,
      correct: false,
    });
    setShowAnswer(true);
    playNote(currentPosition.string, currentPosition.fret);
  }, [correctNote, currentPosition, clearTimer]);

  // Start/reset timer when position changes in sweat mode
  useEffect(() => {
    if (!sweatMode || showAnswer) {
      clearTimer();
      return;
    }

    setTimeLeft(SWEAT_MODE_TIME);

    timerRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0.1) {
          return 0;
        }
        return prev - 0.1;
      });
    }, 100);

    return () => clearTimer();
  }, [currentPosition, sweatMode, showAnswer, clearTimer]);

  // Check if time is up
  useEffect(() => {
    if (sweatMode && timeLeft <= 0 && !showAnswer) {
      handleTimeUp();
    }
  }, [timeLeft, sweatMode, showAnswer, handleTimeUp]);

  // Play the note when position changes (but not on first render to avoid autoplay issues)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    playNote(currentPosition.string, currentPosition.fret);
  }, [currentPosition]);

  const handlePlayNote = useCallback(() => {
    playNote(currentPosition.string, currentPosition.fret);
  }, [currentPosition]);

  const handleGuess = useCallback(
    (guess: string) => {
      clearTimer();
      const isCorrect = isCorrectAnswer(guess, correctNote);

      setScore((prev) => ({
        correct: prev.correct + (isCorrect ? 1 : 0),
        total: prev.total + 1,
      }));

      if (isCorrect) {
        setFeedback({ message: "Correct! 🎸", correct: true });
        setShowAnswer(false);
        // Play the note on correct answer
        playNote(currentPosition.string, currentPosition.fret);
        // Move to next note after a short delay
        setTimeout(
          () => {
            setCurrentPosition(getRandomPosition());
            setFeedback(null);
          },
          sweatMode ? 800 : 1200,
        );
      } else {
        setFeedback({
          message: `Incorrect. That was ${getNoteDisplay(correctNote)}`,
          correct: false,
        });
        setShowAnswer(true);
        // Play the note on incorrect answer so they can hear it
        playNote(currentPosition.string, currentPosition.fret);
      }
    },
    [correctNote, currentPosition, clearTimer, sweatMode],
  );

  const handleNextNote = useCallback(() => {
    setTimeLeft(SWEAT_MODE_TIME);
    setCurrentPosition(getRandomPosition());
    setFeedback(null);
    setShowAnswer(false);
  }, []);

  const handleReset = useCallback(() => {
    clearTimer();
    setTimeLeft(SWEAT_MODE_TIME);
    setScore({ correct: 0, total: 0 });
    setCurrentPosition(getRandomPosition());
    setFeedback(null);
    setShowAnswer(false);
  }, [clearTimer]);

  const toggleSweatMode = useCallback(() => {
    setSweatMode((prev) => !prev);
    setStudyMode(false); // Disable study mode when enabling sweat mode
    setTimeLeft(SWEAT_MODE_TIME);
  }, []);

  const toggleStudyMode = useCallback(() => {
    setStudyMode((prev) => !prev);
    if (!studyMode) {
      // Turning on study mode - disable sweat mode and clear timer
      setSweatMode(false);
      clearTimer();
    }
  }, [studyMode, clearTimer]);

  // Easter egg - play fun melody
  const playEasterEgg = useCallback(async () => {
    if (easterEggRef.current) return; // Already playing

    easterEggRef.current = true;
    setEasterEggPlaying(true);
    // Pause sweat mode timer during easter egg
    clearTimer();

    for (let i = 0; i < FUN_MELODY.length; i++) {
      if (!easterEggRef.current) break; // Stop if cancelled

      const note = FUN_MELODY[i];
      setEasterEggNote({ string: note.string, fret: note.fret });
      playNote(note.string, note.fret);

      await new Promise((resolve) => setTimeout(resolve, note.duration));
    }

    setEasterEggNote(null);
    setEasterEggPlaying(false);
    easterEggRef.current = false;
  }, [clearTimer]);

  // Fret markers (dots on frets 3, 5, 7, 9, 12)
  const fretMarkers = [3, 5, 7, 9, 12];
  const doubleFretMarkers = [12];

  return (
    <div className="app">
      {/* Rotate prompt for mobile portrait */}
      <div className="rotate-prompt">
        <div className="rotate-content">
          <div className="rotate-icon">📱</div>
          <p>Rotate your phone for the best experience</p>
          <div className="rotate-arrow">↻</div>
        </div>
      </div>

      <header>
        <h1>
          <span
            className={`guitar-emoji ${easterEggPlaying ? "playing" : ""}`}
            onClick={playEasterEgg}
            title="🎵"
          >
            🎸
          </span>{" "}
          Fretboard Trainer
        </h1>
        <p className="subtitle">Learn the notes on your guitar fretboard</p>
        <div className="mode-buttons">
          <button
            className={`mode-btn study-btn ${studyMode ? "active" : ""}`}
            onClick={toggleStudyMode}
          >
            📖 Study Mode
          </button>
          <button
            className={`mode-btn sweat-btn ${sweatMode ? "active" : ""}`}
            onClick={toggleSweatMode}
          >
            🔥 Sweat Mode
          </button>
        </div>
      </header>

      {sweatMode && !showAnswer && (
        <div className="timer-container">
          <div className="timer-bar">
            <div
              className={`timer-fill ${timeLeft <= 2 ? "danger" : timeLeft <= 3 ? "warning" : ""}`}
              style={{ width: `${(timeLeft / SWEAT_MODE_TIME) * 100}%` }}
            />
          </div>
          <div className="timer-text">{timeLeft.toFixed(1)}s</div>
        </div>
      )}

      <div className="score-container">
        <div className="score">
          <span className="score-correct">{score.correct}</span>
          <span className="score-divider">/</span>
          <span className="score-total">{score.total}</span>
        </div>
        <div className="score-label">
          {score.total > 0
            ? `${Math.round((score.correct / score.total) * 100)}% accuracy`
            : "Start guessing!"}
        </div>
        {score.total > 0 && (
          <button className="reset-btn" onClick={handleReset}>
            Reset Score
          </button>
        )}
      </div>

      <div className="fretboard-container">
        <div className="string-labels">
          {STRING_NAMES.map((name, i) => (
            <div key={i} className="string-label">
              {name}
            </div>
          ))}
        </div>

        <div className="fretboard">
          {/* Fret numbers */}
          <div className="fret-numbers">
            {Array.from({ length: NUM_FRETS + 1 }, (_, fret) => (
              <div key={fret} className="fret-number">
                {fret === 0 ? "Open" : fret}
              </div>
            ))}
          </div>

          {/* Strings and frets */}
          <div className="strings">
            {STRING_TUNING.map((_, stringIndex) => (
              <div key={stringIndex} className="string-row">
                {Array.from({ length: NUM_FRETS + 1 }, (_, fret) => {
                  const isTarget =
                    currentPosition.string === stringIndex &&
                    currentPosition.fret === fret;
                  const note = getNoteAt(stringIndex, fret);

                  const isNatural = !note.includes("#");

                  return (
                    <div
                      key={fret}
                      className={`fret ${fret === 0 ? "open-string" : ""} ${
                        isTarget && !studyMode ? "target" : ""
                      } ${showAnswer && isTarget ? "show-answer" : ""}`}
                    >
                      <div className="string-line" />
                      {fret > 0 && <div className="fret-wire" />}
                      {studyMode ? (
                        <div
                          className={`study-note ${isNatural ? "natural" : "sharp"} ${
                            easterEggNote?.string === stringIndex &&
                            easterEggNote?.fret === fret
                              ? "spooky-active"
                              : ""
                          }`}
                          onClick={() => playNote(stringIndex, fret)}
                          title={`${note}${FLAT_EQUIVALENTS[note] ? ` / ${FLAT_EQUIVALENTS[note]}` : ""}`}
                        >
                          {note}
                        </div>
                      ) : easterEggNote?.string === stringIndex &&
                        easterEggNote?.fret === fret ? (
                        <div className="spooky-note">{note}</div>
                      ) : (
                        isTarget && (
                          <div
                            className="note-marker"
                            onClick={handlePlayNote}
                            title="Click to play note"
                          >
                            {showAnswer ? getNoteDisplay(note) : "?"}
                          </div>
                        )
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Fret markers (dots) */}
          <div className="fret-markers">
            {Array.from({ length: NUM_FRETS + 1 }, (_, fret) => (
              <div key={fret} className="marker-cell">
                {fretMarkers.includes(fret) && (
                  <>
                    <div className="marker-dot" />
                    {doubleFretMarkers.includes(fret) && (
                      <div className="marker-dot" />
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {studyMode ? (
        <div className="study-info">
          <p>Click any note on the fretboard to hear it</p>
          <div className="study-legend">
            <span className="legend-item">
              <span className="legend-dot natural"></span> Natural notes (A, B,
              C, D, E, F, G)
            </span>
            <span className="legend-item">
              <span className="legend-dot sharp"></span> Sharps/Flats
            </span>
          </div>
        </div>
      ) : (
        <>
          <div className="question">
            <p>
              What note is at{" "}
              <strong>String {STRING_NAMES[currentPosition.string]}</strong>,{" "}
              <strong>
                {currentPosition.fret === 0
                  ? "Open"
                  : `Fret ${currentPosition.fret}`}
              </strong>
              ?
            </p>
          </div>

          {feedback && (
            <div
              className={`feedback ${feedback.correct ? "correct" : "incorrect"}`}
            >
              {feedback.message}
            </div>
          )}

          <div className="note-buttons">
            {NOTES.map((note) => (
              <button
                key={note}
                className="note-btn"
                onClick={() => handleGuess(note)}
                disabled={showAnswer}
              >
                {FLAT_EQUIVALENTS[note] ? (
                  <>
                    {note}
                    <span className="flat-label">{FLAT_EQUIVALENTS[note]}</span>
                  </>
                ) : (
                  note
                )}
              </button>
            ))}
          </div>

          {showAnswer && (
            <button className="next-btn" onClick={handleNextNote}>
              Next Note →
            </button>
          )}
        </>
      )}

      <footer>
        <p>
          Tip: Learn the natural notes (no sharps/flats) first, then fill in the
          gaps!
        </p>
      </footer>
    </div>
  );
}

export default App;
