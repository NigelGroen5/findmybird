"use client";

import { useState, useEffect, useCallback } from "react";

// Common bird names for the game (5 letters like Wordle, all uppercase)
const BIRD_NAMES = [
  "ROBIN",
  "EAGLE",
  "CROW",
  "FINCH",
  "HAWK",
  "DUCK",
  "GOOSE",
  "SWAN",
  "HERON",
  "CRANE",
  "STORK",
  "GULL",
  "TERN",
  "WREN",
  "STILT",
  "SHRIKE",
  "VIREO",
  "TANAGER",
  "BUNTING",
  "GROSBEAK",
  "ORIOLE",
  "THRUSH",
  "WARBLER",
  "CARDINAL",
  "BLUEBIRD",
  "MOCKINGBIRD",
  "CHICKADEE",
  "NUTHATCH",
  "WOODPECKER",
  "FLICKER",
  "KINGFISHER",
  "HUMMINGBIRD",
].filter(name => name.length === 5); // Only 5-letter birds for Wordle-style

type LetterState = "correct" | "present" | "absent" | "empty";

type Guess = {
  word: string;
  states: LetterState[];
};

type GameState = "playing" | "won" | "lost";

export function Birdle() {
  const [targetBird, setTargetBird] = useState<string>("");
  const [currentGuess, setCurrentGuess] = useState<string>("");
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [gameState, setGameState] = useState<GameState>("playing");
  const [letterStates, setLetterStates] = useState<Map<string, LetterState>>(new Map());
  const [isOpen, setIsOpen] = useState(false);

  // Initialize game
  useEffect(() => {
    if (!targetBird) {
      startNewGame();
    }
  }, [targetBird]);

  const startNewGame = () => {
    // Filter to only 5-letter birds for Wordle-like experience
    const fiveLetterBirds = BIRD_NAMES.filter(name => name.length === 5);
    const randomBird = fiveLetterBirds[Math.floor(Math.random() * fiveLetterBirds.length)];
    setTargetBird(randomBird);
    setCurrentGuess("");
    setGuesses([]);
    setGameState("playing");
    setLetterStates(new Map());
  };

  const evaluateGuess = (guess: string, target: string): LetterState[] => {
    const states: LetterState[] = new Array(guess.length).fill("absent");
    const targetLetters = target.split("");
    const guessLetters = guess.split("");
    const targetCounts = new Map<string, number>();

    // Count letters in target
    for (const letter of targetLetters) {
      targetCounts.set(letter, (targetCounts.get(letter) || 0) + 1);
    }

    // First pass: mark correct positions
    for (let i = 0; i < guessLetters.length; i++) {
      if (guessLetters[i] === targetLetters[i]) {
        states[i] = "correct";
        targetCounts.set(guessLetters[i], (targetCounts.get(guessLetters[i]) || 0) - 1);
      }
    }

    // Second pass: mark present letters
    for (let i = 0; i < guessLetters.length; i++) {
      if (states[i] === "absent" && targetCounts.get(guessLetters[i])! > 0) {
        states[i] = "present";
        targetCounts.set(guessLetters[i], (targetCounts.get(guessLetters[i]) || 0) - 1);
      }
    }

    return states;
  };

  const handleKeyPress = useCallback(
    (key: string) => {
      if (gameState !== "playing") return;

      if (key === "ENTER") {
        if (currentGuess.length === 5) {
          // Check if it's a valid 5-letter bird name
          const validBirds = BIRD_NAMES.filter(name => name.length === 5);
          if (validBirds.includes(currentGuess)) {
            const states = evaluateGuess(currentGuess, targetBird);
            const newGuess: Guess = { word: currentGuess, states };
            const newGuesses = [...guesses, newGuess];

            setGuesses(newGuesses);

            // Update letter states
            const newLetterStates = new Map(letterStates);
            for (let i = 0; i < currentGuess.length; i++) {
              const letter = currentGuess[i];
              const currentState = newLetterStates.get(letter);
              const newState = states[i];

              if (!currentState || newState === "correct" || (newState === "present" && currentState !== "correct")) {
                newLetterStates.set(letter, newState);
              }
            }
            setLetterStates(newLetterStates);

            // Check win/lose
            if (currentGuess === targetBird) {
              setGameState("won");
            } else if (newGuesses.length >= 6) {
              setGameState("lost");
            } else {
              setCurrentGuess("");
            }
          } else {
            // Invalid word - could show error message
            console.log("Invalid bird name:", currentGuess);
          }
        }
      } else if (key === "BACKSPACE") {
        setCurrentGuess(currentGuess.slice(0, -1));
      } else if (key.length === 1 && /[A-Z]/.test(key) && currentGuess.length < 5) {
        setCurrentGuess(currentGuess + key);
      }
    },
    [currentGuess, targetBird, guesses, gameState, letterStates]
  );

  // Keyboard event handler - only when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      if (e.key === "Enter") {
        handleKeyPress("ENTER");
      } else if (e.key === "Backspace") {
        handleKeyPress("BACKSPACE");
      } else if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
        handleKeyPress(e.key.toUpperCase());
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleKeyPress]);

  const getLetterColor = (state: LetterState) => {
    switch (state) {
      case "correct":
        return "bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-md";
      case "present":
        return "bg-gradient-to-br from-amber-400 to-yellow-500 text-white shadow-md";
      case "absent":
        return "bg-gray-400 text-white shadow-sm";
      default:
        return "bg-white text-gray-700 border-2 border-amber-200/60";
    }
  };

  const getKeyboardKeyColor = (letter: string) => {
    const state = letterStates.get(letter);
    if (!state) return "bg-amber-100 hover:bg-amber-200 text-amber-900";
    switch (state) {
      case "correct":
        return "bg-gradient-to-br from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700";
      case "present":
        return "bg-gradient-to-br from-amber-400 to-yellow-500 text-white hover:from-amber-500 hover:to-yellow-600";
      case "absent":
        return "bg-gray-400 text-white hover:bg-gray-500";
      default:
        return "bg-amber-100 hover:bg-amber-200 text-amber-900";
    }
  };

  const maxGuesses = 6;
  const wordLength = 5; // Wordle-style: always 5 letters
  const displayGuesses = [...guesses];
  if (gameState === "playing") {
    displayGuesses.push({ word: currentGuess, states: new Array(wordLength).fill("empty") });
  }
  while (displayGuesses.length < maxGuesses) {
    displayGuesses.push({ word: "", states: new Array(wordLength).fill("empty") });
  }

  const keyboardRows = [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
    ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACKSPACE"],
  ];

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-6 py-3 bg-gradient-to-br from-amber-500 to-orange-500 text-white font-bold rounded-2xl shadow-lg shadow-amber-900/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 text-sm"
      >
        BIRDLE
      </button>
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setIsOpen(false)}>
          <div className="bg-gradient-to-br from-white to-amber-50/30 rounded-3xl shadow-2xl max-w-md w-full p-6 border border-amber-200/50" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">BIRDLE</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                ×
              </button>
            </div>

            {gameState === "won" && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-center shadow-sm">
                <p className="text-emerald-800 font-semibold">🎉 You got it! The bird was {targetBird}</p>
              </div>
            )}

            {gameState === "lost" && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-2xl text-center shadow-sm">
                <p className="text-red-800 font-semibold">The bird was {targetBird}</p>
              </div>
            )}

                {/* Game Grid */}
                {targetBird && (
                  <div className="mb-6">
                    <div className="grid gap-2 justify-center">
                      {displayGuesses.map((guess, rowIndex) => (
                        <div key={rowIndex} className="flex gap-2 justify-center">
                          {guess.states.map((state, colIndex) => (
                            <div
                              key={colIndex}
                              className={`w-12 h-12 flex items-center justify-center font-bold text-lg rounded-lg ${getLetterColor(
                                state
                              )}`}
                            >
                              {guess.word[colIndex] || ""}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Keyboard */}
                <div className="mb-4">
                  {keyboardRows.map((row, rowIndex) => (
                    <div key={rowIndex} className="flex gap-1 justify-center mb-1">
                      {row.map((key) => {
                        const isSpecial = key === "ENTER" || key === "BACKSPACE";
                        return (
                          <button
                            key={key}
                            onClick={() => handleKeyPress(key)}
                            className={`px-2 py-3 font-semibold rounded-lg text-sm transition-all ${
                              isSpecial
                                ? "bg-gradient-to-br from-gray-300 to-gray-400 hover:from-gray-400 hover:to-gray-500 text-gray-900 min-w-[60px] shadow-sm"
                                : getKeyboardKeyColor(key)
                            }`}
                          >
                            {key === "BACKSPACE" ? "⌫" : key}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>

            {/* New Game Button */}
            {(gameState === "won" || gameState === "lost") && (
              <button
                onClick={startNewGame}
                className="w-full px-4 py-3 bg-gradient-to-br from-amber-600 to-orange-600 text-white font-bold rounded-2xl hover:from-amber-700 hover:to-orange-700 transition-all shadow-lg shadow-amber-900/20"
              >
                New Game
              </button>
            )}

            <p className="text-xs text-amber-700/70 text-center mt-4 font-medium">
              Guess the bird name in 6 tries. Green = correct letter & position, Yellow = correct letter wrong position.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
