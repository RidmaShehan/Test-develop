'use client'

import { useState, Suspense } from 'react'
import dynamic from 'next/dynamic'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent } from '@/components/ui/card'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { Gamepad2, Zap, Brain, Calculator, Scissors, Timer, Play, TreePine } from 'lucide-react'
import { cn } from '@/lib/utils'

// Dynamically import game components to prevent loading all at once
const SnakeGame = dynamic(() => import('@/components/games/snake-game').then(mod => ({ default: mod.SnakeGame })), {
  loading: () => <div className="text-center p-8">Loading Snake Game...</div>,
  ssr: false
})

const MemoryGame = dynamic(() => import('@/components/games/memory-game').then(mod => ({ default: mod.MemoryGame })), {
  loading: () => <div className="text-center p-8">Loading Memory Game...</div>,
  ssr: false
})

const MathQuizGame = dynamic(() => import('@/components/games/math-quiz').then(mod => ({ default: mod.MathQuizGame })), {
  loading: () => <div className="text-center p-8">Loading Math Quiz...</div>,
  ssr: false
})

const WordScrambleGame = dynamic(() => import('@/components/games/word-scramble').then(mod => ({ default: mod.WordScrambleGame })), {
  loading: () => <div className="text-center p-8">Loading Word Scramble...</div>,
  ssr: false
})

const ReactionGame = dynamic(() => import('@/components/games/reaction-game').then(mod => ({ default: mod.ReactionGame })), {
  loading: () => <div className="text-center p-8">Loading Reaction Game...</div>,
  ssr: false
})

const SuperMarioRun = dynamic(() => import('@/components/games/super-mario-run').then(mod => ({ default: mod.SuperMarioRun })), {
  loading: () => <div className="text-center p-8">Loading Super Mario Run...</div>,
  ssr: false
})

const DinosaurGame = dynamic(() => import('@/components/games/dinosaur-game').then(mod => ({ default: mod.DinosaurGame })), {
  loading: () => <div className="text-center p-8">Loading Dinosaur Game...</div>,
  ssr: false
})

type GameType = 'snake' | 'memory' | 'math-quiz' | 'word-scramble' | 'reaction' | 'super-mario' | 'dinosaur'

const games = [
  {
    id: 'snake' as GameType,
    name: 'Snake Game',
    description: 'Control the snake, eat food, and grow longer!',
    icon: Zap,
    color: 'text-green-600',
    bgColor: 'bg-green-50 hover:bg-green-100',
  },
  {
    id: 'memory' as GameType,
    name: 'Memory Cards',
    description: 'Match pairs of cards to test your memory!',
    icon: Brain,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 hover:bg-purple-100',
  },
  {
    id: 'math-quiz' as GameType,
    name: 'Math Quiz',
    description: 'Solve math problems quickly to improve your brain!',
    icon: Calculator,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 hover:bg-blue-100',
  },
  {
    id: 'word-scramble' as GameType,
    name: 'Word Scramble',
    description: 'Unscramble words to test your vocabulary!',
    icon: Scissors,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 hover:bg-orange-100',
  },
  {
    id: 'reaction' as GameType,
    name: 'Reaction Time',
    description: 'Test your reaction speed and reflexes!',
    icon: Timer,
    color: 'text-red-600',
    bgColor: 'bg-red-50 hover:bg-red-100',
  },
  {
    id: 'super-mario' as GameType,
    name: 'Super Mario Run',
    description: 'Jump over obstacles like Mario!',
    icon: Play,
    color: 'text-red-600',
    bgColor: 'bg-red-50 hover:bg-red-100',
  },
  {
    id: 'dinosaur' as GameType,
    name: 'Dinosaur Game',
    description: 'Jump over cacti in this endless runner!',
    icon: TreePine,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 hover:bg-yellow-100',
  },
]

export default function GamesPage() {
  const [currentGame, setCurrentGame] = useState<GameType | null>(null)

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-4rem)] flex-col lg:flex-row">
        {/* Sidebar Menu */}
        <div className="w-full lg:w-64 border-b lg:border-b-0 lg:border-r border-border/60 bg-muted/20 p-4 flex-shrink-0 overflow-y-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
              <Gamepad2 className="h-6 w-6" />
              Mini Games
            </h1>
            <p className="text-sm text-muted-foreground">Brain training games</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
            {games.map((game) => {
              const Icon = game.icon
              const isActive = currentGame === game.id
              return (
                <button
                  key={game.id}
                  onClick={() => setCurrentGame(game.id)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg transition-all flex items-center gap-3 border-2",
                    isActive
                      ? `${game.bgColor} ${game.color} border-current font-semibold`
                      : "bg-card hover:bg-accent text-foreground border-transparent"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-sm font-medium leading-tight">{game.name}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Game Content Area */}
        <div className="flex-1 overflow-y-auto">
          {currentGame === null ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Gamepad2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h2 className="text-2xl font-bold text-foreground mb-2">Select a Game</h2>
                <p className="text-muted-foreground">Choose a game from the sidebar to start playing!</p>
              </div>
            </div>
          ) : (
            <div className="p-4 sm:p-6">
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <ErrorBoundary>
                    <Suspense fallback={<div className="text-center p-8">Loading game...</div>}>
                      {currentGame === 'snake' && <SnakeGame />}
                      {currentGame === 'memory' && <MemoryGame />}
                      {currentGame === 'math-quiz' && <MathQuizGame />}
                      {currentGame === 'word-scramble' && <WordScrambleGame />}
                      {currentGame === 'reaction' && <ReactionGame />}
                      {currentGame === 'super-mario' && <SuperMarioRun />}
                      {currentGame === 'dinosaur' && <DinosaurGame />}
                    </Suspense>
                  </ErrorBoundary>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

