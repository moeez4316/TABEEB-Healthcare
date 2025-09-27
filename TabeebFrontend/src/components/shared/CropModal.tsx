'use client'

import React, { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import { X, RotateCcw, Check, Loader2 } from 'lucide-react'

interface Point {
  x: number
  y: number
}

interface Area {
  x: number
  y: number
  width: number
  height: number
}

interface CropModalProps {
  isOpen: boolean
  imageSrc: string
  onComplete: (croppedImageUrl: string) => void
  onCancel: () => void
}

// Utility function to create image from canvas
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', error => reject(error))
    image.setAttribute('crossOrigin', 'anonymous')
    image.src = url
  })

// Get cropped image from canvas
const getCroppedImg = async (imageSrc: string, pixelCrop: Area): Promise<string> => {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) throw new Error('Canvas context not available')

  const { width, height } = pixelCrop

  // Set canvas size to cropped area
  canvas.width = width
  canvas.height = height

  // Draw cropped image
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    width,
    height,
    0,
    0,
    width,
    height
  )

  return canvas.toDataURL('image/jpeg', 0.9)
}

export default function CropModal({ isOpen, imageSrc, onComplete, onCancel }: CropModalProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleSave = useCallback(async () => {
    if (!croppedAreaPixels) {
      setError('Please adjust the crop area')
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels)
      onComplete(croppedImage)
    } catch (err) {
      console.error('Crop failed:', err)
      setError('Failed to crop image. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }, [croppedAreaPixels, imageSrc, onComplete])

  const handleReset = useCallback(() => {
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setError(null)
  }, [])

  const handleCancel = useCallback(() => {
    setError(null)
    onCancel()
  }, [onCancel])

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="crop-modal-title"
    >
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
          <h2 id="crop-modal-title" className="text-lg font-semibold text-gray-900 dark:text-white">
            Crop Profile Picture
          </h2>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Close crop modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Crop Area */}
        <div className="relative h-80 bg-gray-100 dark:bg-slate-700">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
            classes={{
              containerClassName: 'h-full',
              cropAreaClassName: 'border-2 border-teal-500'
            }}
          />
        </div>

        {/* Controls */}
        <div className="p-4 space-y-4">
          {/* Zoom Control */}
          <div className="space-y-2">
            <label htmlFor="zoom-slider" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Zoom: {Math.round(zoom * 100)}%
            </label>
            <input
              id="zoom-slider"
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              aria-label="Zoom level"
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Instructions */}
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              • Drag to reposition • Pinch or use slider to zoom • Crop will be circular
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-750">
          <button
            onClick={handleReset}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            disabled={isProcessing}
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reset</span>
          </button>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleCancel}
              disabled={isProcessing}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isProcessing || !croppedAreaPixels}
              className="flex items-center space-x-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-colors"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              <span>{isProcessing ? 'Processing...' : 'Apply Crop'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}