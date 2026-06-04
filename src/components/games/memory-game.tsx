'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { RotateCcw } from 'lucide-react'

type Card = {
  id: number
  value: number
  flipped: boolean
  matched: boolean
}

const EMOJIS = ['🎮', '🎯', '🎨', '🎭', '🎪', '🎬', '🎤', '🎧', '🎸', '🎺', '🎻', '🥁']

export function MemoryGame() {
  const [cards, setCards] = useState<Card[]>([])
  const [flippedCards, setFlippedCards] = useState<number[]>([])
  const [moves, setMoves] = useState(0)
  const [matches, setMatches] = useState(0)
  const [gameWon, setGameWon] = useState(false)

  const initializeGame = () => {
    const pairs = 8 // 16 cards total (8 pairs)
    const values = Array.from({ length: pairs }, (_, i) => i)
    const cardPairs = [...values, ...values]
    
    // Shuffle
    for (let i = cardPairs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cardPairs[i], cardPairs[j]] = [cardPairs[j], cardPairs[i]]
    }

    const newCards: Card[] = cardPairs.map((value, index) => ({
      id: index,
      value,
      flipped: false,
      matched: false,
    }))

    setCards(newCards)
    setFlippedCards([])
    setMoves(0)
    setMatches(0)
    setGameWon(false)
  }

  useEffect(() => {
    initializeGame()
  }, [])

  const handleCardClick = (cardId: number) => {
    const card = cards[cardId]
    
    // Don't flip if already flipped, matched, or two cards are already flipped
    if (card.flipped || card.matched || flippedCards.length >= 2) return

    const newCards = [...cards]
    newCards[cardId].flipped = true
    setCards(newCards)
    setFlippedCards([...flippedCards, cardId])

    // Check for match when two cards are flipped
    if (flippedCards.length === 1) {
      const firstCard = cards[flippedCards[0]]
      const secondCard = card

      setMoves(prev => prev + 1)

      if (firstCard.value === secondCard.value) {
        // Match found!
        setTimeout(() => {
          setCards(prev => prev.map(c => 
            c.id === firstCard.id || c.id === secondCard.id
              ? { ...c, matched: true, flipped: true }
              : c
          ))
          setFlippedCards([])
          setMatches(prev => {
            const newMatches = prev + 1
            if (newMatches === 8) {
              setGameWon(true)
            }
            return newMatches
          })
        }, 500)
      } else {
        // No match, flip back
        setTimeout(() => {
          setCards(prev => prev.map(c => 
            c.id === firstCard.id || c.id === secondCard.id
              ? { ...c, flipped: false }
              : c
          ))
          setFlippedCards([])
        }, 1000)
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Memory Card Game</h2>
        <div className="flex justify-center gap-6 text-lg">
          <div>Moves: <span className="font-bold">{moves}</span></div>
          <div>Matches: <span className="font-bold">{matches}/8</span></div>
        </div>
        {gameWon && (
          <p className="text-green-600 font-bold text-xl mt-2">
            🎉 Congratulations! You won in {moves} moves!
          </p>
        )}
      </div>

      <div className="flex justify-center">
        <div className="grid grid-cols-4 gap-3 max-w-md">
          {cards.map((card) => (
            <button
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              disabled={card.matched || flippedCards.length >= 2}
              className={`
                w-20 h-20 sm:w-24 sm:h-24
                border-2 rounded-lg
                flex items-center justify-center
                text-3xl font-bold
                transition-all duration-300
                ${card.flipped || card.matched
                  ? 'bg-blue-100 dark:bg-blue-950/40 border-blue-400'
                  : 'bg-muted border-border hover:bg-accent'
                }
                ${card.matched ? 'opacity-50' : ''}
                disabled:cursor-not-allowed
                ${card.flipped || card.matched ? 'scale-[1.02]' : ''}
              `}
            >
              {card.flipped || card.matched ? EMOJIS[card.value] : '?'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-center">
        <Button onClick={initializeGame} variant="outline" className="gap-2">
          <RotateCcw className="h-4 w-4" />
          New Game
        </Button>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p>Click cards to flip them. Find matching pairs!</p>
      </div>
    </div>
  )
}

