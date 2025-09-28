'use client'

import React, { useState, useEffect } from 'react'
import { Ruler } from 'lucide-react'
import { cmToFeetInches, feetInchesToCm } from '@/lib/height-utils'

interface HeightInputProps {
  value?: string // Height in cm (stored in database)
  onChange: (heightInCm: string) => void
  error?: string
  className?: string
  placeholder?: string
  required?: boolean
}

const HeightInput: React.FC<HeightInputProps> = ({
  value = '',
  onChange,
  error,
  className = '',
  placeholder = 'Enter your height',
  required = false
}) => {
  const [unit, setUnit] = useState<'feet' | 'cm'>('feet') // Default to feet
  const [feet, setFeet] = useState('')
  const [inches, setInches] = useState('')
  const [cm, setCm] = useState('')



  // Initialize values when component mounts or value prop changes
  useEffect(() => {
    if (value && !isNaN(Number(value))) {
      const cmValue = Number(value)
      setCm(value)
      
      const { feet: feetValue, inches: inchesValue } = cmToFeetInches(cmValue)
      setFeet(feetValue.toString())
      setInches(inchesValue.toString())
    }
  }, [value])

  // Handle unit change
  const handleUnitChange = (newUnit: 'feet' | 'cm') => {
    setUnit(newUnit)
  }

  // Handle feet input change
  const handleFeetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFeet = e.target.value
    setFeet(newFeet)
    
    if (newFeet && inches) {
      const cmValue = feetInchesToCm(Number(newFeet) || 0, Number(inches) || 0)
      const cmString = cmValue.toString()
      setCm(cmString)
      onChange(cmString)
    } else if (!newFeet && !inches) {
      setCm('')
      onChange('')
    }
  }

  // Handle inches input change
  const handleInchesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newInches = e.target.value
    setInches(newInches)
    
    if (feet && newInches) {
      const cmValue = feetInchesToCm(Number(feet) || 0, Number(newInches) || 0)
      const cmString = cmValue.toString()
      setCm(cmString)
      onChange(cmString)
    } else if (!feet && !newInches) {
      setCm('')
      onChange('')
    }
  }

  // Handle cm input change
  const handleCmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCm = e.target.value
    setCm(newCm)
    onChange(newCm)
    
    if (newCm && !isNaN(Number(newCm))) {
      const { feet: feetValue, inches: inchesValue } = cmToFeetInches(Number(newCm))
      setFeet(feetValue.toString())
      setInches(inchesValue.toString())
    } else {
      setFeet('')
      setInches('')
    }
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Unit Selection */}
      <div className="flex space-x-2 mb-2">
        <button
          type="button"
          onClick={() => handleUnitChange('feet')}
          className={`px-3 py-1 text-xs rounded-md transition-colors ${
            unit === 'feet'
              ? 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200'
              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          Feet & Inches
        </button>
        <button
          type="button"
          onClick={() => handleUnitChange('cm')}
          className={`px-3 py-1 text-xs rounded-md transition-colors ${
            unit === 'cm'
              ? 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200'
              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          Centimeters
        </button>
      </div>

      {/* Input Fields */}
      {unit === 'feet' ? (
        <div className="flex space-x-3">
          <div className="flex-1 min-w-0">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Ruler className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                type="number"
                value={feet}
                onChange={handleFeetChange}
                min="0"
                max="8"
                placeholder="5"
                required={required}
                className={`block w-full pl-10 pr-10 py-3 border rounded-lg placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 text-center ${
                  error 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 dark:border-slate-600 focus:ring-teal-500'
                }`}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">ft</span>
              </div>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="relative">
              <input
                type="number"
                value={inches}
                onChange={handleInchesChange}
                min="0"
                max="11"
                placeholder="8"
                className={`block w-full pl-4 pr-10 py-3 border rounded-lg placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 text-center ${
                  error 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 dark:border-slate-600 focus:ring-teal-500'
                }`}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">in</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Ruler className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </div>
          <input
            type="number"
            value={cm}
            onChange={handleCmChange}
            min="0"
            max="300"
            placeholder="170"
            required={required}
            className={`block w-full pl-10 pr-12 py-3 border rounded-lg placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 text-center ${
              error 
                ? 'border-red-500 focus:ring-red-500' 
                : 'border-gray-300 dark:border-slate-600 focus:ring-teal-500'
            }`}
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">cm</span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {/* Conversion Display */}
      {(feet || inches || cm) && (
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {unit === 'feet' && cm ? (
            <span>≈ {Math.round(Number(cm))} cm</span>
          ) : unit === 'cm' && (feet || inches) ? (
            <span>≈ {feet || 0}' {inches || 0}"</span>
          ) : null}
        </div>
      )}
    </div>
  )
}

export default HeightInput