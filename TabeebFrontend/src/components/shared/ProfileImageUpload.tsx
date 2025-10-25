'use client'

import React, { useState, useRef } from 'react'
import Image from 'next/image'
import { Camera, Upload, X } from 'lucide-react'
import CropModal from './CropModal'

interface ProfileImageUploadProps {
  currentImage?: string
  onImageChange: (imageUrl: string) => void
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const ProfileImageUpload: React.FC<ProfileImageUploadProps> = ({
  currentImage,
  onImageChange,
  size = 'md',
  className = ''
}) => {
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [showCropModal, setShowCropModal] = useState(false)
  const [selectedImageSrc, setSelectedImageSrc] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setError(null)

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPG, PNG, GIF, etc.)')
      return
    }

    // Validate file size (max 5MB to match backend limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB')
      return
    }

    // Create preview and show crop modal
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setSelectedImageSrc(result)
      setShowCropModal(true)
    }
    reader.onerror = () => {
      setError('Failed to read the selected file')
    }
    reader.readAsDataURL(file)
  }

  const handleCropComplete = async (croppedImageUrl: string) => {
    setShowCropModal(false)
    setIsUploading(true)
    setPreview(croppedImageUrl)
    
    try {
      // For now, just pass the cropped image to parent
      // The parent (PatientProfileEditModal) will handle the actual upload
      onImageChange(croppedImageUrl)
      setPreview(null)
      setError(null)
    } catch (error) {
      console.error('Error uploading image:', error)
      setError('Failed to upload image. Please try again.')
      setPreview(null)
    } finally {
      setIsUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleCropCancel = () => {
    setShowCropModal(false)
    setSelectedImageSrc('')
    setError(null)
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemoveImage = () => {
    onImageChange('')
    setPreview(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const displayImage = preview || currentImage

  return (
    <div className={`relative ${className}`}>
      {/* Error Display */}
      {error && (
        <div className="mb-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-xs text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}
      
      <div className={`${sizeClasses[size]} relative rounded-full overflow-hidden border-2 border-white shadow-lg bg-gray-100`}>
        {displayImage ? (
          <>
            <Image
              src={displayImage}
              alt="Profile"
              fill
              className="object-cover"
              sizes="(max-width: 128px) 100vw, 128px"
            />
            {isUploading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600">
            <Camera className="w-8 h-8 text-white" />
          </div>
        )}
      </div>

      {/* Upload/Change Button */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading || showCropModal}
        className="absolute -bottom-2 -right-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white p-2 rounded-full shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title={currentImage ? 'Change photo' : 'Upload photo'}
        aria-label={currentImage ? 'Change profile photo' : 'Upload profile photo'}
      >
        <Upload className="w-4 h-4" />
      </button>

      {/* Remove Button */}
      {currentImage && !isUploading && (
        <button
          type="button"
          onClick={handleRemoveImage}
          className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full shadow-lg transition-colors"
          title="Remove photo"
        >
          <X className="w-3 h-3" />
        </button>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
        aria-label="Select profile picture"
      />

      {/* Crop Modal */}
      <CropModal
        isOpen={showCropModal}
        imageSrc={selectedImageSrc}
        onComplete={handleCropComplete}
        onCancel={handleCropCancel}
      />
    </div>
  )
}

export default ProfileImageUpload