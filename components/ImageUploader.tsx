'use client'
import { useState, useRef } from 'react'
import { uploadBusinessImage, updateBusinessImageInDB } from '@/lib/supabaseStorage'
import { supabase } from '@/lib/supabase'

interface ImageUploaderProps {
  businessSlug: string
  imageType: 'logo' | 'hero' | 'about'
  currentUrl?: string
  onUploadSuccess?: (url: string) => void
}

export default function ImageUploader({ 
  businessSlug, 
  imageType, 
  currentUrl,
  onUploadSuccess 
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [urlInput, setUrlInput] = useState(currentUrl || '')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a valid image file (JPG, PNG, or WebP)')
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    setUploading(true)

    try {
      // Upload to Supabase storage
      const uploadResult = await uploadBusinessImage(file, businessSlug, imageType)
      
      if (!uploadResult.success || !uploadResult.data) {
        throw new Error('Upload failed')
      }

      const { publicUrl } = uploadResult.data

      // Update database
      const dbResult = await updateBusinessImageInDB(businessSlug, imageType, publicUrl)
      
      if (!dbResult.success) {
        throw new Error('Database update failed')
      }

      setUrlInput(publicUrl)
      onUploadSuccess?.(publicUrl)
      
      alert(`✅ ${imageType} image uploaded and saved successfully!`)
      
    } catch (error) {
      console.error('Upload error:', error)
      alert(`❌ Failed to upload ${imageType} image. Please try again.`)
    } finally {
      setUploading(false)
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleUrlUpdate = async () => {
    if (!urlInput.trim()) {
      alert('Please enter a valid image URL')
      return
    }

    setUploading(true)

    try {
      // Update database with new URL
      const result = await updateBusinessImageInDB(businessSlug, imageType, urlInput)
      
      if (!result.success) {
        throw new Error('Database update failed')
      }

      onUploadSuccess?.(urlInput)
      alert(`✅ ${imageType} image URL updated successfully!`)
      
    } catch (error) {
      console.error('URL update error:', error)
      alert(`❌ Failed to update ${imageType} image URL. Please try again.`)
    } finally {
      setUploading(false)
    }
  }

  const handleResetToDefault = async () => {
    if (!confirm(`Are you sure you want to reset the ${imageType} image to the template default?`)) {
      return
    }

    setUploading(true)

    try {
      // Get current image_overrides
      const { data: business, error: fetchError } = await supabase
        .from('leads')
        .select('image_overrides')
        .eq('slug', businessSlug)
        .single()

      if (fetchError) {
        console.error('Error fetching business:', fetchError)
        throw new Error('Failed to fetch business data')
      }

      // Remove the specific image type from overrides
      const currentOverrides = business?.image_overrides || {}
      const updatedOverrides = { ...currentOverrides }
      delete updatedOverrides[imageType]

      const { error } = await supabase
        .from('leads')
        .update({ 
          image_overrides: Object.keys(updatedOverrides).length > 0 ? updatedOverrides : null,
          // Also clear legacy logo field if resetting logo
          ...(imageType === 'logo' && { logo: null })
        })
        .eq('slug', businessSlug)

      if (error) {
        console.error('Database reset error:', error)
        throw new Error('Database update failed')
      }

      setUrlInput('')
      onUploadSuccess?.('')
      alert(`✅ ${imageType} image reset to template default!`)
      
    } catch (error) {
      console.error('Reset error:', error)
      alert(`❌ Failed to reset ${imageType} image. Please try again.`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {imageType.charAt(0).toUpperCase() + imageType.slice(1)} Image
        </label>
        
        {/* File Upload */}
        <div className="flex gap-2 mb-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={uploading}
            className="flex-1 text-sm text-gray-500 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>

        {/* URL Input */}
        <div className="flex gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Or enter image URL..."
            disabled={uploading}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:opacity-50"
          />
          <button 
            onClick={handleUrlUpdate}
            disabled={uploading || !urlInput.trim()}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm disabled:opacity-50"
          >
            {uploading ? 'Saving...' : 'Update URL'}
          </button>
        </div>

        {/* Reset to Default Button */}
        <div className="flex justify-center mt-2">
          <button 
            onClick={handleResetToDefault}
            disabled={uploading}
            className="px-3 py-1 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-xs disabled:opacity-50"
          >
            Reset to Template Default
          </button>
        </div>

        {/* Current Image Preview */}
        {urlInput && (
          <div className="mt-2">
            <p className="text-xs text-gray-500 mb-1">Current:</p>
            <img 
              src={urlInput} 
              alt={`${imageType} preview`}
              className="h-16 w-16 object-cover rounded-lg border"
              onError={() => console.warn('Image failed to load')}
            />
          </div>
        )}
      </div>
    </div>
  )
}