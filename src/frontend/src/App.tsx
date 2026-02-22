import { useEffect, useRef, useState } from 'react';

interface Pipe {
  x: number;
  gapY: number;
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [speedMultiplier, setSpeedMultiplier] = useState(1.0);
  const [showSpeedUp, setShowSpeedUp] = useState(false);

  // Game state refs for animation loop
  const birdYRef = useRef(250);
  const birdVelocityRef = useRef(0);
  const pipesRef = useRef<Pipe[]>([]);
  const frameCountRef = useRef(0);
  const scoreRef = useRef(0);
  const speedMultiplierRef = useRef(1.0);
  const gameStartTimeRef = useRef(0);
  const lastSpeedIncreaseRef = useRef(0);

  // Game constants
  const BIRD_X = 80;
  const BIRD_SIZE = 30;
  const PIPE_WIDTH = 60;
  const PIPE_GAP = 180;
  const GRAVITY = 0.5;
  const JUMP_STRENGTH = -9;
  const PIPE_SPEED = 3;
  const SPEED_INCREASE_INTERVAL = 10000; // Increase speed every 10 seconds
  const SPEED_INCREMENT = 0.2;
  const MAX_SPEED_MULTIPLIER = 2.5;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const resetGame = () => {
      birdYRef.current = 250;
      birdVelocityRef.current = 0;
      pipesRef.current = [];
      frameCountRef.current = 0;
      scoreRef.current = 0;
      speedMultiplierRef.current = 1.0;
      gameStartTimeRef.current = Date.now();
      lastSpeedIncreaseRef.current = Date.now();
      setScore(0);
      setSpeedMultiplier(1.0);
      setGameOver(false);
    };

    const checkCollision = (): boolean => {
      const birdY = birdYRef.current;

      // Check ground and ceiling collision
      if (birdY + BIRD_SIZE > canvas.height || birdY < 0) {
        return true;
      }

      // Check pipe collision
      for (const pipe of pipesRef.current) {
        if (
          BIRD_X + BIRD_SIZE > pipe.x &&
          BIRD_X < pipe.x + PIPE_WIDTH
        ) {
          if (
            birdY < pipe.gapY ||
            birdY + BIRD_SIZE > pipe.gapY + PIPE_GAP
          ) {
            return true;
          }
        }
      }

      return false;
    };

    const gameLoop = () => {
      if (!ctx || !canvas) return;

      // Clear canvas
      ctx.fillStyle = '#87CEEB';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (gameStarted && !gameOver) {
        // Update speed multiplier based on time
        const currentTime = Date.now();
        const timeSinceLastIncrease = currentTime - lastSpeedIncreaseRef.current;
        
        if (timeSinceLastIncrease >= SPEED_INCREASE_INTERVAL && 
            speedMultiplierRef.current < MAX_SPEED_MULTIPLIER) {
          speedMultiplierRef.current = Math.min(
            speedMultiplierRef.current + SPEED_INCREMENT,
            MAX_SPEED_MULTIPLIER
          );
          setSpeedMultiplier(speedMultiplierRef.current);
          lastSpeedIncreaseRef.current = currentTime;
          
          // Show speed up notification
          setShowSpeedUp(true);
          setTimeout(() => setShowSpeedUp(false), 1000);
        }

        // Apply gravity with speed multiplier
        birdVelocityRef.current += GRAVITY * speedMultiplierRef.current;
        birdYRef.current += birdVelocityRef.current;

        // Generate pipes
        if (frameCountRef.current % 90 === 0) {
          const gapY = Math.random() * (canvas.height - PIPE_GAP - 100) + 50;
          pipesRef.current.push({ x: canvas.width, gapY });
        }

        // Update and draw pipes
        const currentPipeSpeed = PIPE_SPEED * speedMultiplierRef.current;
        pipesRef.current = pipesRef.current.filter(pipe => {
          pipe.x -= currentPipeSpeed;

          // Draw top pipe
          ctx.fillStyle = '#228B22';
          ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.gapY);

          // Draw bottom pipe
          ctx.fillRect(
            pipe.x,
            pipe.gapY + PIPE_GAP,
            PIPE_WIDTH,
            canvas.height - pipe.gapY - PIPE_GAP
          );

          // Score when passing pipe
          if (pipe.x + PIPE_WIDTH < BIRD_X && pipe.x + PIPE_WIDTH > BIRD_X - currentPipeSpeed) {
            scoreRef.current += 1;
            setScore(scoreRef.current);
          }

          return pipe.x > -PIPE_WIDTH;
        });

        // Check collision
        if (checkCollision()) {
          setGameOver(true);
        }

        frameCountRef.current++;
      }

      // Draw bird
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(BIRD_X + BIRD_SIZE / 2, birdYRef.current + BIRD_SIZE / 2, BIRD_SIZE / 2, 0, Math.PI * 2);
      ctx.fill();

      // Draw bird eye
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(BIRD_X + BIRD_SIZE / 2 + 8, birdYRef.current + BIRD_SIZE / 2 - 5, 3, 0, Math.PI * 2);
      ctx.fill();

      // Draw bird beak
      ctx.fillStyle = '#FF6347';
      ctx.beginPath();
      ctx.moveTo(BIRD_X + BIRD_SIZE, birdYRef.current + BIRD_SIZE / 2);
      ctx.lineTo(BIRD_X + BIRD_SIZE + 10, birdYRef.current + BIRD_SIZE / 2 - 5);
      ctx.lineTo(BIRD_X + BIRD_SIZE + 10, birdYRef.current + BIRD_SIZE / 2 + 5);
      ctx.closePath();
      ctx.fill();

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    const handleJump = (e: KeyboardEvent | MouseEvent) => {
      if (e instanceof KeyboardEvent && e.code !== 'Space') return;

      if (!gameStarted) {
        setGameStarted(true);
        gameStartTimeRef.current = Date.now();
        lastSpeedIncreaseRef.current = Date.now();
      }

      if (gameOver) {
        resetGame();
        setGameStarted(true);
      } else if (gameStarted) {
        birdVelocityRef.current = JUMP_STRENGTH;
      }
    };

    window.addEventListener('keydown', handleJump);
    canvas.addEventListener('click', handleJump);

    gameLoop();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('keydown', handleJump);
      canvas.removeEventListener('click', handleJump);
    };
  }, [gameStarted, gameOver]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-sky-400 to-sky-300">
      <header className="bg-yellow-500 shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-3xl font-bold text-yellow-900">🐦 Flappy Bird</h1>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={600}
            height={500}
            className="border-4 border-yellow-600 rounded-lg shadow-2xl bg-sky-200"
            tabIndex={0}
          />
          
          {/* Speed Multiplier Indicator */}
          <div className="absolute top-4 right-4 bg-black/70 text-white px-4 py-2 rounded-lg font-bold text-lg speed-indicator">
            <div className="flex items-center gap-2">
              <span className="text-yellow-400">⚡</span>
              <span>{speedMultiplier.toFixed(1)}x</span>
            </div>
          </div>

          {/* Speed Up Notification */}
          {showSpeedUp && (
            <div className="absolute top-20 right-4 bg-yellow-500 text-yellow-900 px-4 py-2 rounded-lg font-bold text-lg speed-up-notification">
              SPEED UP! 🚀
            </div>
          )}

          {/* Score Display */}
          <div className="absolute top-4 left-4 bg-black/70 text-white px-4 py-2 rounded-lg font-bold text-2xl">
            {score}
          </div>

          {/* Start Screen */}
          {!gameStarted && !gameOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
              <div className="text-center text-white space-y-4">
                <h2 className="text-4xl font-bold">Flappy Bird</h2>
                <p className="text-xl">Press SPACE or Click to Start</p>
                <p className="text-sm text-yellow-300">Speed increases every 10 seconds!</p>
              </div>
            </div>
          )}

          {/* Game Over Screen */}
          {gameOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
              <div className="text-center text-white space-y-4">
                <h2 className="text-4xl font-bold text-red-500">Game Over!</h2>
                <p className="text-2xl">Score: {score}</p>
                <p className="text-lg">Max Speed: {speedMultiplier.toFixed(1)}x</p>
                <p className="text-xl">Press SPACE or Click to Restart</p>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-4 text-center text-gray-700">
            <p className="font-semibold">Controls: Press SPACE or Click to jump</p>
            <p className="text-sm">Avoid the pipes and survive as long as you can!</p>
          </div>
        </div>
      </main>

      <footer className="bg-yellow-500 py-6 mt-auto shadow-lg">
        <div className="container mx-auto px-4 text-center text-sm text-yellow-900">
          <p>
            © {new Date().getFullYear()} · Built with love using{' '}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
                typeof window !== 'undefined' ? window.location.hostname : 'unknown-app'
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-yellow-950 transition-colors font-semibold"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
