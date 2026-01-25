"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type Pipe = {
  x: number;
  topHeight: number;
  gap: number;
  passed: boolean;
};

export function FlappyBird() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const birdRef = useRef({
    x: 100,
    y: 250,
    velocity: 0,
    radius: 15,
  });

  const pipesRef = useRef<Pipe[]>([]);
  const animationFrameRef = useRef<number>();
  const lastPipeTimeRef = useRef(0);

  const GRAVITY = 0.5;
  const JUMP_STRENGTH = -8;
  const PIPE_SPEED = 2;
  const PIPE_SPACING = 200;
  const PIPE_GAP = 150;
  const CANVAS_WIDTH = 400;
  const CANVAS_HEIGHT = 500;

  const startGame = useCallback(() => {
    birdRef.current = {
      x: 100,
      y: 250,
      velocity: 0,
      radius: 15,
    };
    pipesRef.current = [];
    lastPipeTimeRef.current = 0;
    setScore(0);
    setGameOver(false);
    setIsPlaying(true);
  }, []);

  const jump = useCallback(() => {
    if (!isPlaying || gameOver) {
      if (gameOver) {
        startGame();
      } else {
        startGame();
      }
      return;
    }
    birdRef.current.velocity = JUMP_STRENGTH;
  }, [isPlaying, gameOver, startGame]);

  const gameLoop = useCallback(() => {
    if (!canvasRef.current || !isPlaying) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bird = birdRef.current;

    // Update bird physics
    bird.velocity += GRAVITY;
    bird.y += bird.velocity;

    // Generate pipes
    const now = Date.now();
    if (now - lastPipeTimeRef.current > PIPE_SPACING) {
      // Ensure gap is always visible and playable
      const minTopHeight = 50;
      const maxTopHeight = CANVAS_HEIGHT - PIPE_GAP - 50 - 50; // -50 for ground, -50 for margin
      const topHeight = Math.random() * (maxTopHeight - minTopHeight) + minTopHeight;
      pipesRef.current.push({
        x: CANVAS_WIDTH,
        topHeight,
        gap: PIPE_GAP,
        passed: false,
      });
      lastPipeTimeRef.current = now;
    }

    // Update pipes
    pipesRef.current = pipesRef.current
      .map((pipe) => ({
        ...pipe,
        x: pipe.x - PIPE_SPEED,
      }))
      .filter((pipe) => {
        // Check if bird passed pipe
        if (!pipe.passed && pipe.x + 50 < bird.x) {
          pipe.passed = true;
          setScore((prev) => prev + 1);
        }
        return pipe.x > -50;
      });

    // Check collisions
    const groundLevel = CANVAS_HEIGHT - 50;
    const hitTop = bird.y - bird.radius <= 0;
    const hitBottom = bird.y + bird.radius >= groundLevel;
    const hitPipe = pipesRef.current.some((pipe) => {
      const pipeLeft = pipe.x;
      const pipeRight = pipe.x + 50;
      const birdLeft = bird.x - bird.radius;
      const birdRight = bird.x + bird.radius;

      // Check if bird is horizontally aligned with pipe
      if (birdRight < pipeLeft || birdLeft > pipeRight) return false;

      // Check if bird hits top or bottom pipe
      const hitTopPipe = bird.y - bird.radius < pipe.topHeight;
      const hitBottomPipe = bird.y + bird.radius > pipe.topHeight + pipe.gap && bird.y + bird.radius < groundLevel;

      return hitTopPipe || hitBottomPipe;
    });

    if (hitTop || hitBottom || hitPipe) {
      setIsPlaying(false);
      setGameOver(true);
      return;
    }

    // Draw background
    ctx.fillStyle = "#87CEEB";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw ground
    ctx.fillStyle = "#8B4513";
    ctx.fillRect(0, CANVAS_HEIGHT - 50, CANVAS_WIDTH, 50);
    ctx.fillStyle = "#90EE90";
    ctx.fillRect(0, CANVAS_HEIGHT - 50, CANVAS_WIDTH, 10);

    // Draw pipes
    ctx.fillStyle = "#228B22";
    pipesRef.current.forEach((pipe) => {
      const pipeWidth = 50;
      // Top pipe
      ctx.fillRect(pipe.x, 0, pipeWidth, pipe.topHeight);
      // Top pipe cap
      ctx.fillRect(pipe.x - 5, pipe.topHeight - 20, pipeWidth + 10, 20);
      
      // Bottom pipe (stops at ground level)
      const bottomPipeTop = pipe.topHeight + pipe.gap;
      const groundLevel = CANVAS_HEIGHT - 50;
      const bottomPipeHeight = groundLevel - bottomPipeTop;
      if (bottomPipeHeight > 0) {
        ctx.fillRect(pipe.x, bottomPipeTop, pipeWidth, bottomPipeHeight);
        // Bottom pipe cap
        ctx.fillRect(pipe.x - 5, bottomPipeTop, pipeWidth + 10, 20);
      }
    });

    // Draw bird (more bird-like)
    const birdX = bird.x;
    const birdY = bird.y;
    
    // Bird body (ellipse)
    ctx.fillStyle = "#FFD700";
    ctx.beginPath();
    ctx.ellipse(birdX, birdY, bird.radius, bird.radius * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Bird head
    ctx.fillStyle = "#FFD700";
    ctx.beginPath();
    ctx.arc(birdX + 8, birdY - 8, bird.radius * 0.7, 0, Math.PI * 2);
    ctx.fill();
    
    // Beak
    ctx.fillStyle = "#FF8C00";
    ctx.beginPath();
    ctx.moveTo(birdX + 18, birdY - 8);
    ctx.lineTo(birdX + 25, birdY - 5);
    ctx.lineTo(birdX + 18, birdY - 2);
    ctx.closePath();
    ctx.fill();
    
    // Eye
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(birdX + 12, birdY - 10, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#FFF";
    ctx.beginPath();
    ctx.arc(birdX + 13, birdY - 10, 1, 0, Math.PI * 2);
    ctx.fill();
    
    // Wing (animated based on velocity)
    const wingOffset = Math.sin(Date.now() / 100) * 3;
    ctx.fillStyle = "#FFA500";
    ctx.beginPath();
    ctx.ellipse(birdX - 5, birdY + wingOffset, 8, 12, -0.3, 0, Math.PI * 2);
    ctx.fill();
    
    // Tail
    ctx.fillStyle = "#FFA500";
    ctx.beginPath();
    ctx.moveTo(birdX - bird.radius, birdY);
    ctx.lineTo(birdX - bird.radius - 8, birdY - 5);
    ctx.lineTo(birdX - bird.radius - 8, birdY + 5);
    ctx.closePath();
    ctx.fill();

    // Draw score
    ctx.fillStyle = "#000";
    ctx.font = "bold 24px Arial";
    ctx.textAlign = "center";
    ctx.fillText(score.toString(), CANVAS_WIDTH / 2, 40);

    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [isPlaying, score]);

  useEffect(() => {
    if (isPlaying && !gameOver) {
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, gameOver, gameLoop]);

  // Keyboard controls
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "ArrowUp") {
        e.preventDefault();
        jump();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, jump]);

  return (
    <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-sm font-semibold text-gray-900 hover:text-gray-700 transition-colors"
          >
            Flappy Bird
          </button>
          {isOpen && (
            <div
              className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
              onClick={() => setIsOpen(false)}
            >
              <div
                className="bg-white rounded-2xl shadow-2xl p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Flappy Bird</h2>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                  >
                    ×
                  </button>
                </div>

                {gameOver && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-center">
                    <p className="text-red-800 font-semibold">Game Over! Score: {score}</p>
                  </div>
                )}

                {!isPlaying && !gameOver && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
                    <p className="text-blue-800 font-semibold">Press Space or Click to Start</p>
                  </div>
                )}

                <div className="mb-4">
                  <canvas
                    ref={canvasRef}
                    width={CANVAS_WIDTH}
                    height={CANVAS_HEIGHT}
                    className="border-2 border-gray-300 rounded-lg cursor-pointer"
                    onClick={jump}
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={jump}
                    className="flex-1 px-4 py-2 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    {gameOver ? "Play Again" : isPlaying ? "Jump (Space)" : "Start Game"}
                  </button>
                  {gameOver && (
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        setGameOver(false);
                        setIsPlaying(false);
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Close
                    </button>
                  )}
                </div>

                <p className="text-xs text-gray-500 text-center mt-4">
                  Press Space or click to make the bird jump. Avoid the pipes!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
