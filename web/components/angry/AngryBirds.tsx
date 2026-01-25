"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type Block = {
  x: number;
  y: number;
  width: number;
  height: number;
  health: number;
  color: string;
};

type Pig = {
  x: number;
  y: number;
  radius: number;
  health: number;
};

type Bird = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  launched: boolean;
};

export function AngryBirds() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const birdRef = useRef<Bird>({
    x: 100,
    y: 400,
    vx: 0,
    vy: 0,
    radius: 15,
    launched: false,
  });

  const blocksRef = useRef<Block[]>([]);
  const pigsRef = useRef<Pig[]>([]);
  const animationFrameRef = useRef<number>();

  const CANVAS_WIDTH = 600;
  const CANVAS_HEIGHT = 500;
  const GRAVITY = 0.3;
  const FRICTION = 0.98;
  const GROUND_Y = CANVAS_HEIGHT - 50;

  const initializeLevel = useCallback(() => {
    // Reset bird
    birdRef.current = {
      x: 100,
      y: 400,
      vx: 0,
      vy: 0,
      radius: 15,
      launched: false,
    };

    // Create blocks (structures)
    blocksRef.current = [
      { x: 450, y: GROUND_Y - 20, width: 30, height: 20, health: 2, color: "#8B4513" },
      { x: 480, y: GROUND_Y - 20, width: 30, height: 20, health: 2, color: "#8B4513" },
      { x: 510, y: GROUND_Y - 20, width: 30, height: 20, health: 2, color: "#8B4513" },
      { x: 465, y: GROUND_Y - 40, width: 30, height: 20, health: 2, color: "#8B4513" },
      { x: 495, y: GROUND_Y - 40, width: 30, height: 20, health: 2, color: "#8B4513" },
      { x: 480, y: GROUND_Y - 60, width: 30, height: 20, health: 2, color: "#8B4513" },
    ];

    // Create pigs (targets)
    pigsRef.current = [
      { x: 480, y: GROUND_Y - 30, radius: 18, health: 1 },
      { x: 510, y: GROUND_Y - 30, radius: 18, health: 1 },
      { x: 495, y: GROUND_Y - 50, radius: 18, health: 1 },
    ];

    setScore(0);
    setGameOver(false);
  }, []);

  const startGame = useCallback(() => {
    initializeLevel();
    setIsPlaying(true);
  }, [initializeLevel]);

  const launchBird = useCallback((powerX: number, powerY: number) => {
    if (birdRef.current.launched) return;

    const bird = birdRef.current;
    const slingshotX = 100;
    const slingshotY = 400;

    // Calculate velocity based on drag distance
    const dragDistance = Math.sqrt(powerX * powerX + powerY * powerY);
    const maxDistance = 100;
    const normalizedDistance = Math.min(dragDistance / maxDistance, 1);

    bird.vx = (powerX / dragDistance) * normalizedDistance * 12;
    bird.vy = (powerY / dragDistance) * normalizedDistance * 12;
    bird.launched = true;
  }, []);

  const checkCollisions = useCallback(() => {
    const bird = birdRef.current;

    // Check collision with blocks
    blocksRef.current = blocksRef.current.filter((block) => {
      const birdLeft = bird.x - bird.radius;
      const birdRight = bird.x + bird.radius;
      const birdTop = bird.y - bird.radius;
      const birdBottom = bird.y + bird.radius;

      const blockLeft = block.x;
      const blockRight = block.x + block.width;
      const blockTop = block.y;
      const blockBottom = block.y + block.height;

      if (
        birdRight > blockLeft &&
        birdLeft < blockRight &&
        birdBottom > blockTop &&
        birdTop < blockBottom
      ) {
        block.health--;
        if (block.health <= 0) {
          setScore((prev) => prev + 10);
          return false; // Remove block
        }
        // Bounce bird
        bird.vx *= -0.5;
        bird.vy *= -0.5;
        return true;
      }
      return true;
    });

    // Check collision with pigs
    pigsRef.current = pigsRef.current.filter((pig) => {
      const dx = bird.x - pig.x;
      const dy = bird.y - pig.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < bird.radius + pig.radius) {
        setScore((prev) => prev + 50);
        return false; // Remove pig
      }
      return true;
    });

    // Check if all pigs are destroyed
    if (pigsRef.current.length === 0 && bird.launched) {
      setGameOver(true);
      setIsPlaying(false);
    }
  }, []);

  const gameLoop = useCallback(() => {
    if (!canvasRef.current || !isPlaying) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bird = birdRef.current;

    // Update bird physics if launched
    if (bird.launched) {
      bird.vy += GRAVITY;
      bird.x += bird.vx;
      bird.y += bird.vy;
      bird.vx *= FRICTION;
      bird.vy *= FRICTION;

      // Check ground collision
      if (bird.y + bird.radius >= GROUND_Y) {
        bird.y = GROUND_Y - bird.radius;
        bird.vy *= -0.5;
        bird.vx *= 0.8;
        if (Math.abs(bird.vy) < 0.5 && Math.abs(bird.vx) < 0.5) {
          // Bird stopped, check win condition
          if (pigsRef.current.length === 0) {
            setGameOver(true);
            setIsPlaying(false);
          } else {
            // Reset for next bird (in a real game, you'd have multiple birds)
            setTimeout(() => {
              if (pigsRef.current.length > 0) {
                initializeLevel();
              }
            }, 2000);
          }
        }
      }

      // Check wall collisions
      if (bird.x - bird.radius < 0 || bird.x + bird.radius > CANVAS_WIDTH) {
        bird.vx *= -0.7;
        bird.x = Math.max(bird.radius, Math.min(CANVAS_WIDTH - bird.radius, bird.x));
      }

      if (bird.y - bird.radius < 0) {
        bird.vy *= -0.7;
        bird.y = bird.radius;
      }

      checkCollisions();
    }

    // Draw background
    ctx.fillStyle = "#87CEEB";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw ground
    ctx.fillStyle = "#8B4513";
    ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, 50);
    ctx.fillStyle = "#90EE90";
    ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, 10);

    // Draw slingshot
    if (!bird.launched) {
      ctx.strokeStyle = "#654321";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(80, GROUND_Y);
      ctx.lineTo(80, GROUND_Y - 60);
      ctx.moveTo(120, GROUND_Y);
      ctx.lineTo(120, GROUND_Y - 60);
      ctx.stroke();

      // Draw slingshot base
      ctx.fillStyle = "#654321";
      ctx.fillRect(75, GROUND_Y, 50, 10);
    }

    // Draw blocks
    blocksRef.current.forEach((block) => {
      ctx.fillStyle = block.color;
      ctx.fillRect(block.x, block.y, block.width, block.height);
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 2;
      ctx.strokeRect(block.x, block.y, block.width, block.height);
    });

    // Draw pigs
    pigsRef.current.forEach((pig) => {
      // Pig body
      ctx.fillStyle = "#90EE90";
      ctx.beginPath();
      ctx.arc(pig.x, pig.y, pig.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Pig face
      ctx.fillStyle = "#000";
      // Eyes
      ctx.beginPath();
      ctx.arc(pig.x - 5, pig.y - 3, 2, 0, Math.PI * 2);
      ctx.arc(pig.x + 5, pig.y - 3, 2, 0, Math.PI * 2);
      ctx.fill();
      // Nose
      ctx.beginPath();
      ctx.arc(pig.x, pig.y + 2, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw bird
    const birdX = bird.x;
    const birdY = bird.y;

    // Draw trajectory line when dragging
    if (isDragging && dragStart && !bird.launched) {
      ctx.strokeStyle = "rgba(255, 0, 0, 0.5)";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(birdX, birdY);
      ctx.lineTo(dragStart.x, dragStart.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Bird body
    ctx.fillStyle = "#FF0000";
    ctx.beginPath();
    ctx.arc(birdX, birdY, bird.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Bird eye
    ctx.fillStyle = "#FFF";
    ctx.beginPath();
    ctx.arc(birdX + 3, birdY - 3, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(birdX + 4, birdY - 3, 2, 0, Math.PI * 2);
    ctx.fill();

    // Bird beak
    ctx.fillStyle = "#FFA500";
    ctx.beginPath();
    ctx.moveTo(birdX + bird.radius, birdY);
    ctx.lineTo(birdX + bird.radius + 8, birdY - 3);
    ctx.lineTo(birdX + bird.radius + 8, birdY + 3);
    ctx.closePath();
    ctx.fill();

    // Draw score
    ctx.fillStyle = "#000";
    ctx.font = "bold 20px Arial";
    ctx.textAlign = "left";
    ctx.fillText(`Score: ${score}`, 10, 30);
    ctx.fillText(`Pigs: ${pigsRef.current.length}`, 10, 55);

    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [isPlaying, isDragging, dragStart, score, checkCollisions, initializeLevel]);

  useEffect(() => {
    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, gameLoop]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (birdRef.current.launched) return;

      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const birdX = birdRef.current.x;
      const birdY = birdRef.current.y;
      const distance = Math.sqrt((x - birdX) ** 2 + (y - birdY) ** 2);

      if (distance < 50) {
        setIsDragging(true);
        setDragStart({ x, y });
      }
    },
    []
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDragging || birdRef.current.launched) return;

      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setDragStart({ x, y });
    },
    [isDragging]
  );

  const handleMouseUp = useCallback(() => {
    if (!isDragging || !dragStart || birdRef.current.launched) {
      setIsDragging(false);
      setDragStart(null);
      return;
    }

    const birdX = birdRef.current.x;
    const birdY = birdRef.current.y;
    const powerX = birdX - dragStart.x;
    const powerY = birdY - dragStart.y;

    launchBird(powerX, powerY);
    setIsDragging(false);
    setDragStart(null);
  }, [isDragging, dragStart, launchBird]);

  return (
    <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-sm font-semibold text-gray-900 hover:text-gray-700 transition-colors"
          >
            Angry Birds
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
                  <h2 className="text-2xl font-bold text-gray-900">Angry Birds</h2>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                  >
                    ×
                  </button>
                </div>

                {gameOver && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-center">
                    <p className="text-green-800 font-semibold">
                      🎉 Victory! All pigs destroyed! Score: {score}
                    </p>
                  </div>
                )}

                {!isPlaying && !gameOver && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
                    <p className="text-blue-800 font-semibold">
                      Drag the bird back and release to launch!
                    </p>
                  </div>
                )}

                <div className="mb-4">
                  <canvas
                    ref={canvasRef}
                    width={CANVAS_WIDTH}
                    height={CANVAS_HEIGHT}
                    className="border-2 border-gray-300 rounded-lg cursor-crosshair"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={startGame}
                    className="flex-1 px-4 py-2 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    {gameOver ? "Play Again" : isPlaying ? "Restart" : "Start Game"}
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
                  Drag the red bird back and release to launch. Destroy all green pigs to win!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
