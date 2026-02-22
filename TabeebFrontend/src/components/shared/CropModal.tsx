'use client'

import React, { useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
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

// Get cropped image from canvas — resized to max 500x500 for profile pics
const MAX_PROFILE_SIZE = 500

const getCroppedImg = async (imageSrc: string, pixelCrop: Area): Promise<string> => {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) throw new Error('Canvas context not available')

  const { width, height } = pixelCrop

  // Determine output size — scale down if larger than MAX_PROFILE_SIZE
  let outputWidth = width
  let outputHeight = height
  if (width > MAX_PROFILE_SIZE || height > MAX_PROFILE_SIZE) {
    const scale = Math.min(MAX_PROFILE_SIZE / width, MAX_PROFILE_SIZE / height)
    outputWidth = Math.round(width * scale)
    outputHeight = Math.round(height * scale)
  }

  canvas.width = outputWidth
  canvas.height = outputHeight

  // Draw cropped + resized image
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    width,
    height,
    0,
    0,
    outputWidth,
    outputHeight
  )

  return canvas.toDataURL('image/jpeg', 0.85)
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

  // Ensure we're on the client side
  if (typeof document === 'undefined') return null

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black z-[100] flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-labelledby="crop-modal-title"
    >
      {/* Fullscreen layout - same on mobile and desktop */}
      <div className="bg-slate-900 dark:bg-slate-950 w-full h-full flex flex-col">
        {/* Header - Fixed at top */}
        <div className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4 border-b border-slate-700 flex-shrink-0">
          <h2 id="crop-modal-title" className="text-lg md:text-xl font-semibold text-white">
            Crop Profile Picture
          </h2>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-800"
            aria-label="Close crop modal"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Crop Area - Takes remaining space, no scrolling needed */}
        <div className="relative flex-1 bg-black">
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
              containerClassName: 'w-full h-full',
              cropAreaClassName: 'border-2 border-teal-500'
            }}
          />
        </div>

        {/* Controls - Fixed at bottom, always visible */}
        <div className="px-4 py-3 md:px-6 md:py-4 space-y-3 flex-shrink-0 bg-slate-900 border-t border-slate-700">
          {/* Zoom Control */}
          <div className="space-y-2">
            <label htmlFor="zoom-slider" className="block text-sm font-medium text-gray-300">
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
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
              aria-label="Zoom level"
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-900/30 border border-red-700 rounded-lg">
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {/* Instructions */}
          <div className="hidden md:block p-3 bg-slate-800/50 border border-slate-700 rounded-lg">
            <p className="text-sm text-gray-300">
              💡 Drag to reposition • Pinch or scroll to zoom • Crop will be circular
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handleReset}
              className="flex items-center space-x-2 px-4 py-2.5 text-gray-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              disabled={isProcessing}
            >
              <RotateCcw className="h-4 w-4" />
              <span className="text-sm md:text-base">Reset</span>
            </button>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleCancel}
                disabled={isProcessing}
                className="px-4 md:px-5 py-2.5 text-sm md:text-base text-gray-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isProcessing || !croppedAreaPixels}
                className="flex items-center space-x-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-800 disabled:cursor-not-allowed text-white px-6 md:px-8 py-2.5 rounded-lg transition-colors text-sm md:text-base font-medium shadow-lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Apply Crop</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // Render modal via portal to document.body to escape any parent container constraints
  return createPortal(modalContent, document.body)
}