'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { RotateCcw } from 'lucide-react'

type Obstacle = { x: number; width: number; height: number; type: 'cactus' | 'bird' }

const GRAVITY = 0.8
const JUMP_STRENGTH = -15
const INITIAL_SPEED = 5
const GROUND_Y = 200
const DINO_X = 50
const DINO_SIZE = 40
const CACTUS_WIDTH = 20
const CACTUS_HEIGHT = 50
const BIRD_WIDTH = 30
const BIRD_HEIGHT = 25
const GAME_WIDTH = 600
const GAME_HEIGHT = 250

export function DinosaurGame() {
  const [dinoY, setDinoY] = useState(GROUND_Y)
  const [obstacles, setObstacles] = useState<Obstacle[]>([])
  const [velocity, setVelocity] = useState(0)
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [isJumping, setIsJumping] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameSpeed, setGameSpeed] = useState(INITIAL_SPEED)
  const [groundOffset, setGroundOffset] = useState(0)
  const [isNightMode, setIsNightMode] = useState(false)
  const gameLoopRef = useRef<number | null>(null)
  const obstacleTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastObstacleTimeRef = useRef<number>(0)
  const dinoYRef = useRef<number>(GROUND_Y)

  const checkCollision = (dinoY: number, obstacle: Obstacle): boolean => {
    const dinoBottom = GAME_HEIGHT - dinoY
    const dinoTop = dinoBottom - DINO_SIZE
    const obstacleBottom = obstacle.type === 'cactus' ? GROUND_Y : GROUND_Y - 30
    const obstacleTop = obstacleBottom - obstacle.height

    return (
      DINO_X < obstacle.x + obstacle.width &&
      DINO_X + DINO_SIZE > obstacle.x &&
      dinoTop < obstacleBottom &&
      dinoBottom > obstacleTop
    )
  }

  const jump = useCallback(() => {
    if (!isJumping && !gameOver && gameStarted && dinoY >= GROUND_Y) {
      setIsJumping(true)
      setVelocity(JUMP_STRENGTH)
    }
  }, [isJumping, gameOver, gameStarted, dinoY])

  const startGame = useCallback(() => {
    setDinoY(GROUND_Y)
    dinoYRef.current = GROUND_Y
    setObstacles([])
    setVelocity(0)
    setScore(0)
    setGameOver(false)
    setIsJumping(false)
    setGameStarted(true)
    setGameSpeed(INITIAL_SPEED)
    setGroundOffset(0)
    setIsNightMode(false)
    lastObstacleTimeRef.current = Date.now()
  }, [])

  useEffect(() => {
    if (!gameStarted || gameOver) return

    const createObstacle = () => {
      const now = Date.now()
      // Random interval between 1.5-3 seconds, decreases with score
      const baseInterval = 2500 - Math.floor(score / 50) * 50
      const interval = Math.max(1500, baseInterval)
      
      if (now - lastObstacleTimeRef.current >= interval) {
        lastObstacleTimeRef.current = now
        
        // After score 100, introduce birds (flying obstacles)
        const useBird = score > 100 && Math.random() > 0.6
        
        setObstacles(prev => [...prev, {
          x: GAME_WIDTH,
          width: useBird ? BIRD_WIDTH : CACTUS_WIDTH,
          height: useBird ? BIRD_HEIGHT : CACTUS_HEIGHT,
          type: useBird ? 'bird' : 'cactus'
        }])
      }
    }

    const interval = setInterval(createObstacle, 100)
    obstacleTimerRef.current = interval as any

    return () => {
      clearInterval(interval)
    }
  }, [gameStarted, gameOver, score])

  useEffect(() => {
    if (!gameStarted || gameOver) return

    // Increase game speed gradually
    const newSpeed = INITIAL_SPEED + Math.floor(score / 100) * 0.5
    setGameSpeed(newSpeed)

    // Enable night mode after score 100
    if (score > 100 && !isNightMode) {
      setIsNightMode(true)
    }

    const gameLoop = () => {
      // Update dinosaur position
      setDinoY(prev => {
        let newY = prev + velocity
        let newVelocity = velocity + GRAVITY

        // Ground collision
        if (newY >= GROUND_Y) {
          newY = GROUND_Y
          newVelocity = 0
          setIsJumping(false)
        }

        setVelocity(newVelocity)
        dinoYRef.current = newY
        return newY
      })

      // Move obstacles and check collisions
      setObstacles(prev => {
        const updated = prev.map(obstacle => ({
          ...obstacle,
          x: obstacle.x - gameSpeed
        })).filter(obstacle => obstacle.x > -obstacle.width)

        // Check collisions using ref to get current value
        for (const obstacle of updated) {
          if (checkCollision(dinoYRef.current, obstacle)) {
            setGameOver(true)
            return updated
          }
        }

        // Increase score when obstacle passes
        const passedObstacles = prev.filter(obstacle => 
          obstacle.x < DINO_X && obstacle.x + obstacle.width >= DINO_X - gameSpeed
        )
        if (passedObstacles.length > 0) {
          setScore(prev => prev + 1)
        }

        return updated
      })

      // Animate ground
      setGroundOffset(prev => (prev - gameSpeed) % 20)

      gameLoopRef.current = requestAnimationFrame(gameLoop)
    }

    gameLoopRef.current = requestAnimationFrame(gameLoop)

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current)
      }
    }
  }, [gameStarted, gameOver, velocity, gameSpeed, isNightMode, score])

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.code === 'Space' || e.key === ' ' || e.key === 'ArrowUp') && !gameOver) {
        e.preventDefault()
        if (!gameStarted) {
          startGame()
        } else {
          jump()
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [jump, gameStarted, gameOver, startGame])

  const resetGame = () => {
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current)
    }
    if (obstacleTimerRef.current) {
      clearInterval(obstacleTimerRef.current)
    }
    startGame()
  }

  const dinoBottom = GAME_HEIGHT - dinoY
  const dinoTop = dinoBottom - DINO_SIZE

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Dinosaur Game</h2>
        <div className="flex justify-center gap-6 text-lg">
          <div>Score: <span className="font-bold">{score}</span></div>
          {gameOver && (
            <div className="text-red-600 font-bold">Game Over!</div>
          )}
        </div>
      </div>

      <div className="flex justify-center">
        <div
          className={`relative border-2 border-gray-300 rounded-lg overflow-hidden ${
            isNightMode ? 'bg-gray-900' : 'bg-white'
          }`}
          style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
        >
          {/* Sky/Background */}
          <div className={`absolute inset-0 ${
            isNightMode 
              ? 'bg-gradient-to-b from-gray-800 to-gray-900' 
              : 'bg-gradient-to-b from-blue-100 to-white'
          }`} />

          {/* Clouds (only in day mode) */}
          {!isNightMode && (
            <>
              <div className="absolute top-10 left-20 w-16 h-8 bg-white bg-opacity-50 rounded-full" />
              <div className="absolute top-14 left-40 w-12 h-6 bg-white bg-opacity-50 rounded-full" />
            </>
          )}

          {/* Stars (only in night mode) */}
          {isNightMode && (
            <>
              <div className="absolute top-10 left-20 w-1 h-1 bg-white rounded-full" />
              <div className="absolute top-14 left-40 w-1 h-1 bg-white rounded-full" />
              <div className="absolute top-20 left-60 w-1 h-1 bg-white rounded-full" />
              <div className="absolute top-12 left-80 w-1 h-1 bg-white rounded-full" />
            </>
          )}

          {/* Ground line (animated) */}
          <div
            className={`absolute bottom-0 w-full border-t-2 ${
              isNightMode ? 'border-gray-600' : 'border-gray-400'
            }`}
            style={{
              bottom: GROUND_Y,
              backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 19px, currentColor 19px, currentColor 20px)',
              backgroundPositionX: `${groundOffset}px`,
              height: '2px',
            }}
          />

          {/* Dinosaur (stationary on left, only moves up/down) */}
          {gameStarted && (
            <div
              className={`absolute ${isNightMode ? 'bg-gray-700' : 'bg-gray-800'}`}
              style={{
                left: DINO_X,
                bottom: dinoTop,
                width: DINO_SIZE,
                height: DINO_SIZE,
              }}
            >
              {/* Simple dinosaur shape */}
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-2xl">🦖</div>
              </div>
            </div>
          )}

          {/* Obstacles */}
          {obstacles.map((obstacle, index) => {
            const obstacleBottom = obstacle.type === 'cactus' ? GROUND_Y : GROUND_Y - 30
            const obstacleTop = obstacleBottom - obstacle.height
            return (
              <div
                key={index}
                className={`absolute ${
                  obstacle.type === 'cactus' 
                    ? isNightMode ? 'bg-gray-600' : 'bg-green-700'
                    : isNightMode ? 'bg-gray-500' : 'bg-gray-600'
                }`}
                style={{
                  left: obstacle.x,
                  bottom: obstacleTop,
                  width: obstacle.width,
                  height: obstacle.height,
                }}
              >
                {obstacle.type === 'cactus' ? (
                  // Cactus shape
                  <div className="w-full h-full relative">
                    <div className="absolute inset-0 bg-inherit" />
                    <div className="absolute -left-2 top-1/3 w-2 h-4 bg-inherit" />
                    <div className="absolute -right-2 top-1/2 w-2 h-4 bg-inherit" />
                  </div>
                ) : (
                  // Bird shape
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-lg">🦅</div>
                  </div>
                )}
              </div>
            )
          })}

          {/* Start message */}
          {!gameStarted && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90">
              <div className="text-center">
                <p className="text-lg font-semibold mb-2">Press Space to start</p>
                <p className="text-sm text-gray-600">Jump over the obstacles!</p>
              </div>
            </div>
          )}

          {/* Game Over Overlay */}
          {gameOver && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="bg-white rounded-lg p-6 text-center">
                <h3 className="text-2xl font-bold mb-2">Game Over!</h3>
                <p className="text-lg mb-4">Final Score: {score}</p>
                <Button onClick={resetGame}>Play Again</Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {gameStarted && !gameOver && (
        <div className="flex justify-center">
          <Button onClick={jump} size="lg" className="gap-2">
            Jump (Space/↑)
          </Button>
        </div>
      )}

      {gameOver && (
        <div className="flex justify-center">
          <Button onClick={resetGame} variant="outline" className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Play Again
          </Button>
        </div>
      )}

      <div className="text-center text-sm text-muted-foreground">
        <p>Press Space or Arrow Up to jump! Game speed increases with score.</p>
        {score > 100 && (
          <p className="text-yellow-600 mt-1">Night mode activated! Watch out for birds!</p>
        )}
      </div>
    </div>
  )
}
