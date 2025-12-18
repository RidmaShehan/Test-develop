'use client'

import { Keyboard } from 'lucide-react'
import { useState } from 'react'

interface KeyboardHintProps {
  className?: string
}

export function KeyboardHint({ className = '' }: KeyboardHintProps) {
  const [show, setShow] = useState(true)

  if (!show) return null

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 shadow-lg max-w-xs">
        <div className="flex items-start justify-between space-x-2">
          <div className="flex items-start space-x-2">
            <Keyboard className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm space-y-1">
              <p className="font-medium text-blue-900">Keyboard Shortcuts</p>
              <div className="text-blue-700 space-y-0.5 text-xs">
                <p><kbd className="px-1 bg-white border rounded">Tab</kbd> / <kbd className="px-1 bg-white border rounded">Enter</kbd> Next field</p>
                <p><kbd className="px-1 bg-white border rounded">↑</kbd><kbd className="px-1 bg-white border rounded">↓</kbd> Navigate options</p>
                <p><kbd className="px-1 bg-white border rounded">Space</kbd> Toggle checkbox</p>
                <p><kbd className="px-1 bg-white border rounded">⌘</kbd>/<kbd className="px-1 bg-white border rounded">Ctrl</kbd> + <kbd className="px-1 bg-white border rounded">Enter</kbd> Submit</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShow(false)}
            className="text-blue-400 hover:text-blue-600 flex-shrink-0"
            aria-label="Close hint"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export function KeyboardShortcutsOverlay() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 left-4 z-50 bg-gray-800 text-white p-2 rounded-full shadow-lg hover:bg-gray-700 transition-colors"
        title="Show keyboard shortcuts (press ?)"
        aria-label="Show keyboard shortcuts"
      >
        <Keyboard className="h-5 w-5" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setIsOpen(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full m-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                  <Keyboard className="h-6 w-6" />
                  <span>Keyboard Shortcuts</span>
                </h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Close"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Navigation</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <ShortcutRow keys={['Tab']} description="Move to next field" />
                    <ShortcutRow keys={['Shift', 'Tab']} description="Move to previous field" />
                    <ShortcutRow keys={['Enter']} description="Move to next field" />
                    <ShortcutRow keys={['↑', '↓']} description="Navigate dropdown options" />
                    <ShortcutRow keys={['←', '→']} description="Navigate radio buttons" />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Actions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <ShortcutRow keys={['Space']} description="Toggle checkbox" />
                    <ShortcutRow keys={['Enter']} description="Select/Confirm" />
                    <ShortcutRow keys={['⌘/Ctrl', 'Enter']} description="Submit form" />
                    <ShortcutRow keys={['Esc']} description="Close dialog" />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    Press <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs">?</kbd> anytime to show this help
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function ShortcutRow({ keys, description }: { keys: string[]; description: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-1">
        {keys.map((key, index) => (
          <span key={index} className="inline-flex items-center">
            {index > 0 && <span className="mx-1 text-gray-400">+</span>}
            <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">
              {key}
            </kbd>
          </span>
        ))}
      </div>
      <span className="text-gray-600 ml-2">{description}</span>
    </div>
  )
}

