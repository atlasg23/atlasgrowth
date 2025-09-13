'use client'
import { useState, useCallback } from 'react'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'

interface CsvUploaderProps {
  onDataParsed: (data: any[], headers: string[]) => void
  acceptedTypes?: string[]
  maxFileSize?: number // in MB
  className?: string
}

export default function CsvUploader({ 
  onDataParsed, 
  acceptedTypes = ['.csv', '.xlsx', '.xls'],
  maxFileSize = 10,
  className = ''
}: CsvUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadStatus, setUploadStatus] = useState<string | null>(null)

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File size must be less than ${maxFileSize}MB`
    }

    // Check file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!acceptedTypes.includes(fileExtension)) {
      return `Only ${acceptedTypes.join(', ')} files are accepted`
    }

    return null
  }

  const processFile = useCallback(async (file: File) => {
    setError(null)
    setIsProcessing(true)
    setUploadStatus('Processing file...')

    try {
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()

      let data: any[] = []
      let headers: string[] = []

      if (fileExtension === '.csv') {
        // Parse CSV
        const text = await file.text()
        const result = Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (header) => header.trim()
        })
        
        if (result.errors.length > 0) {
          throw new Error(`CSV parsing error: ${result.errors[0].message}`)
        }
        
        data = result.data
        headers = result.meta.fields || []
      } else if (['.xlsx', '.xls'].includes(fileExtension)) {
        // Parse Excel
        const buffer = await file.arrayBuffer()
        const workbook = XLSX.read(buffer, { type: 'buffer' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: '',
          raw: false
        }) as any[][]
        
        if (jsonData.length === 0) {
          throw new Error('Excel file is empty')
        }
        
        headers = jsonData[0].map((h: any) => String(h).trim())
        data = jsonData.slice(1).map(row => {
          const obj: any = {}
          headers.forEach((header, index) => {
            obj[header] = row[index] || ''
          })
          return obj
        }).filter(row => Object.values(row).some(v => v !== ''))
      }

      if (data.length === 0) {
        throw new Error('No data rows found in file')
      }

      setUploadStatus(`Successfully parsed ${data.length} rows`)
      onDataParsed(data, headers)
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to process file'
      setError(errorMsg)
      setUploadStatus(null)
    } finally {
      setIsProcessing(false)
    }
  }, [onDataParsed])

  const handleFileSelect = (file: File) => {
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }
    processFile(file)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  return (
    <div className={`w-full ${className}`}>
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragOver 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        } ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {isProcessing ? (
          <div className="space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600">{uploadStatus}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-6xl mb-4">📊</div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Upload Business Data
              </h3>
              <p className="text-gray-600 mb-4">
                Drag and drop your CSV or Excel file here, or click to browse
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Supports: {acceptedTypes.join(', ')} • Max size: {maxFileSize}MB
              </p>
            </div>
            
            <label className="inline-block">
              <input
                type="file"
                className="hidden"
                accept={acceptedTypes.join(',')}
                onChange={handleFileInput}
                disabled={isProcessing}
              />
              <span className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg cursor-pointer font-medium transition-colors">
                Choose File
              </span>
            </label>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {uploadStatus && !error && !isProcessing && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 text-sm">{uploadStatus}</p>
        </div>
      )}
    </div>
  )
}