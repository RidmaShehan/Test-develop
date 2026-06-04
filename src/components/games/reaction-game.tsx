'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { RotateCcw } from 'lucide-react'

type GameState = 'waiting' | 'ready' | 'click' | 'too-early' | 'result'

export function ReactionGame() {
  const [gameState, setGameState] = useState<GameState>('waiting')
  const [reactionTime, setReactionTime] = useState<number | null>(null)
  const [times, setTimes] = useState<number[]>([])
  const startTimeRef = useRef<number>(0)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const startRound = () => {
    setGameState('waiting')
    setReactionTime(null)
    
    // Random delay between 1-5 seconds
    const delay = Math.random() * 4000 + 1000
    
    timeoutRef.current = setTimeout(() => {
      setGameState('ready')
      startTimeRef.current = Date.now()
    }, delay)
  }

  const handleClick = () => {
    if (gameState === 'waiting') {
      setGameState('too-early')
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      setTimeout(() => {
        setGameState('waiting')
        startRound()
      }, 2000)
      return
    }

    if (gameState === 'ready') {
      const time = Date.now() - startTimeRef.current
      setReactionTime(time)
      setTimes(prev => [...prev, time])
      setGameState('result')
      return
    }

    if (gameState === 'result' || gameState === 'too-early') {
      startRound()
    }
  }

  const reset = () => {
    setGameState('waiting')
    setReactionTime(null)
    setTimes([])
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }

  const averageTime = times.length > 0
    ? Math.round(times.reduce((a, b) => a + b, 0) / times.length)
    : 0

  const getColor = () => {
    if (gameState === 'ready') return 'bg-green-500 hover:bg-green-600'
    if (gameState === 'too-early') return 'bg-red-500'
    if (gameState === 'result') return 'bg-blue-500'
    return 'bg-gray-500 hover:bg-gray-600'
  }

  const getText = () => {
    if (gameState === 'waiting') return 'Wait for green...'
    if (gameState === 'ready') return 'CLICK NOW!'
    if (gameState === 'too-early') return 'Too Early! Wait for green.'
    if (gameState === 'result') return 'Click to try again'
    return 'Click to start'
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Reaction Time Test</h2>
        <div className="flex justify-center gap-6 text-lg">
          <div>Attempts: <span className="font-bold">{times.length}</span></div>
          <div>Average: <span className="font-bold">{averageTime}ms</span></div>
          {reactionTime !== null && (
            <div>Last: <span className="font-bold">{reactionTime}ms</span></div>
          )}
        </div>
      </div>

      <div className="flex justify-center">
        <div className="w-full max-w-md">
          <button
            onClick={gameState === 'waiting' ? startRound : handleClick}
            className={`w-full h-72 sm:h-96 rounded-lg text-white text-2xl sm:text-3xl font-bold transition-all ${getColor()}`}
          >
            {getText()}
          </button>
        </div>
      </div>

      {gameState === 'result' && reactionTime !== null && (
        <div className="text-center">
          <div className={`text-4xl font-bold mb-2 ${
            reactionTime < 200 ? 'text-green-600' :
            reactionTime < 300 ? 'text-yellow-600' :
            'text-orange-600'
          }`}>
            {reactionTime}ms
          </div>
          <p className="text-sm text-muted-foreground">
            {reactionTime < 200 ? 'Excellent!' :
             reactionTime < 300 ? 'Good!' :
             reactionTime < 400 ? 'Average' :
             'Keep practicing!'}
          </p>
        </div>
      )}

      {times.length > 0 && (
        <div className="text-center">
          <h3 className="font-semibold mb-2">Your Times:</h3>
          <div className="flex flex-wrap justify-center gap-2">
            {times.map((time, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-muted rounded-full text-sm"
              >
                {time}ms
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-center">
        <Button onClick={reset} variant="outline" className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Reset
        </Button>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p>Click when the box turns green! Test your reaction speed.</p>
      </div>
    </div>
  )
}

