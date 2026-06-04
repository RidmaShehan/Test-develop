'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { RotateCcw, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react'

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'
type Position = { x: number; y: number }

const GRID_SIZE = 20
const CELL_SIZE = 20
const INITIAL_SNAKE: Position[] = [{ x: 10, y: 10 }]
const INITIAL_FOOD: Position = { x: 15, y: 15 }
const GAME_SPEED = 150

export function SnakeGame() {
  const [snake, setSnake] = useState<Position[]>(INITIAL_SNAKE)
  const [food, setFood] = useState<Position>(INITIAL_FOOD)
  const [direction, setDirection] = useState<Direction>('RIGHT')
  const [gameOver, setGameOver] = useState(false)
  const [score, setScore] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const directionRef = useRef<Direction>('RIGHT')

  const generateFood = useCallback((): Position => {
    return {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    }
  }, [])

  const checkCollision = (head: Position, body: Position[]): boolean => {
    // Check wall collision
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      return true
    }
    // Check self collision
    return body.some(segment => segment.x === head.x && segment.y === head.y)
  }

  const moveSnake = useCallback(() => {
    if (gameOver || isPaused) return

    setSnake(prevSnake => {
      const head = { ...prevSnake[0] }
      const dir = directionRef.current

      switch (dir) {
        case 'UP':
          head.y -= 1
          break
        case 'DOWN':
          head.y += 1
          break
        case 'LEFT':
          head.x -= 1
          break
        case 'RIGHT':
          head.x += 1
          break
      }

      const newSnake = [head, ...prevSnake]

      // Check collision
      if (checkCollision(head, prevSnake)) {
        setGameOver(true)
        return prevSnake
      }

      // Check food collision
      if (head.x === food.x && head.y === food.y) {
        setScore(prev => prev + 10)
        setFood(generateFood())
        return newSnake
      }

      // Remove tail
      return newSnake.slice(0, -1)
    })
  }, [food, gameOver, isPaused, generateFood])

  useEffect(() => {
    directionRef.current = direction
  }, [direction])

  useEffect(() => {
    if (gameOver || isPaused) return

    const interval = setInterval(moveSnake, GAME_SPEED)
    return () => clearInterval(interval)
  }, [moveSnake, gameOver, isPaused])

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (gameOver) return

    const key = e.key
    const currentDir = directionRef.current

    if (key === 'ArrowUp' && currentDir !== 'DOWN') {
      setDirection('UP')
    } else if (key === 'ArrowDown' && currentDir !== 'UP') {
      setDirection('DOWN')
    } else if (key === 'ArrowLeft' && currentDir !== 'RIGHT') {
      setDirection('LEFT')
    } else if (key === 'ArrowRight' && currentDir !== 'LEFT') {
      setDirection('RIGHT')
    } else if (key === ' ') {
      e.preventDefault()
      setIsPaused(prev => !prev)
    }
  }, [gameOver])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [handleKeyPress])

  const resetGame = () => {
    setSnake(INITIAL_SNAKE)
    setFood(INITIAL_FOOD)
    setDirection('RIGHT')
    directionRef.current = 'RIGHT'
    setGameOver(false)
    setScore(0)
    setIsPaused(false)
  }

  const changeDirection = (newDirection: Direction) => {
    const currentDir = directionRef.current
    if (
      (newDirection === 'UP' && currentDir !== 'DOWN') ||
      (newDirection === 'DOWN' && currentDir !== 'UP') ||
      (newDirection === 'LEFT' && currentDir !== 'RIGHT') ||
      (newDirection === 'RIGHT' && currentDir !== 'LEFT')
    ) {
      setDirection(newDirection)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Snake Game</h2>
        <div className="flex justify-center gap-6 text-lg">
          <div>Score: <span className="font-bold">{score}</span></div>
          <div>Length: <span className="font-bold">{snake.length}</span></div>
        </div>
        {gameOver && (
          <p className="text-red-600 font-bold text-xl mt-2">Game Over! Final Score: {score}</p>
        )}
        {isPaused && !gameOver && (
          <p className="text-yellow-600 font-bold text-xl mt-2">Paused - Press Space to Resume</p>
        )}
      </div>

      <div className="flex justify-center overflow-x-auto">
        <div
          className="relative border-4 border-gray-800 dark:border-gray-600 bg-gray-100 dark:bg-gray-900 rounded-lg min-w-[320px]"
          style={{ width: GRID_SIZE * CELL_SIZE, height: GRID_SIZE * CELL_SIZE }}
        >
          {/* Food */}
          <div
            className="absolute bg-red-500 rounded-full"
            style={{
              left: food.x * CELL_SIZE,
              top: food.y * CELL_SIZE,
              width: CELL_SIZE - 2,
              height: CELL_SIZE - 2,
            }}
          />

          {/* Snake */}
          {snake.map((segment, index) => (
            <div
              key={index}
              className={`absolute ${
                index === 0 ? 'bg-green-600' : 'bg-green-400'
              } rounded-sm`}
              style={{
                left: segment.x * CELL_SIZE,
                top: segment.y * CELL_SIZE,
                width: CELL_SIZE - 2,
                height: CELL_SIZE - 2,
              }}
            />
          ))}
        </div>
      </div>

      {/* Mobile Controls */}
      <div className="flex flex-col items-center gap-2">
        <Button
          onClick={() => changeDirection('UP')}
          variant="outline"
          size="sm"
          disabled={gameOver || isPaused}
          className="w-16"
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
        <div className="flex gap-2">
          <Button
            onClick={() => changeDirection('LEFT')}
            variant="outline"
            size="sm"
            disabled={gameOver || isPaused}
            className="w-16"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => setIsPaused(prev => !prev)}
            variant="outline"
            size="sm"
            disabled={gameOver}
            className="w-16"
          >
            {isPaused ? 'Resume' : 'Pause'}
          </Button>
          <Button
            onClick={() => changeDirection('RIGHT')}
            variant="outline"
            size="sm"
            disabled={gameOver || isPaused}
            className="w-16"
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
        <Button
          onClick={() => changeDirection('DOWN')}
          variant="outline"
          size="sm"
          disabled={gameOver || isPaused}
          className="w-16"
        >
          <ArrowDown className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex justify-center">
        <Button onClick={resetGame} variant="outline" className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Reset Game
        </Button>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p>Use arrow keys or buttons to control the snake. Eat the red food to grow!</p>
        <p>Press Space to pause/resume</p>
      </div>
    </div>
  )
}

