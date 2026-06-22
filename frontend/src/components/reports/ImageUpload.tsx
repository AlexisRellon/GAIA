/**
 * Image Upload Component (CR-02)
 * Handles file uploads with drag-and-drop, validation, preview, and EXIF metadata extraction
 * 
 * Features:
 * - Drag-and-drop file upload
 * - File type validation (JPEG/PNG/JFIF/HEIC/HEIF)
 * - File size validation (<5MB)
 * - Image preview with remove button
 * - EXIF metadata extraction (GPS, timestamp, device info)
 * - Auto-populate location if GPS coordinates found
 * - Error handling and user feedback
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, X, AlertCircle, Check } from 'lucide-react';
import EXIF from 'exif-js';

// ============================================================================
// TYPES
// ============================================================================

interface ImageUploadProps {
  onFileSelect: (file: File | undefined, metadata?: ImageMetadata) => void;
  disabled?: boolean;
  /** Controlled file value — keeps preview when parent remounts the component */
  value?: File | null;
}

interface ImageMetadata {
  timestamp?: string;
  device?: string;
  gps?: {
    latitude: number;
    longitude: number;
  };
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/heic', 'image/heif'];
const HEIC_HEIF_TYPES = ['image/heic', 'image/heif'];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Detect if file is HEIC/HEIF by MIME type or extension fallback
 */
function isHeicFile(filename: string, mimeType: string): boolean {
  // Check if MIME type is already HEIC/HEIF
  if (HEIC_HEIF_TYPES.includes(mimeType)) {
    return true;
  }

  // Fallback: check file extension if MIME type is empty or generic
  if (!mimeType || mimeType === 'application/octet-stream') {
    const ext = filename.toLowerCase().split('.').pop();
    return ext === 'heic' || ext === 'heif';
  }

  return false;
}

/**
 * Convert EXIF GPS format to decimal degrees
 */
function convertDMSToDD(degrees: number, minutes: number, seconds: number, direction: string): number {
  let dd = degrees + minutes / 60 + seconds / 3600;
  if (direction === 'S' || direction === 'W') {
    dd = dd * -1;
  }
  return dd;
}

/**
 * Extract EXIF metadata from image file
 */
async function extractEXIFMetadata(file: File): Promise<ImageMetadata | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        EXIF.getData(img as any, function (this: any) {
          const metadata: ImageMetadata = {};

          // Extract timestamp
          const dateTime = EXIF.getTag(this, 'DateTime');
          if (dateTime) {
            metadata.timestamp = dateTime;
          }

          // Extract device info
          const make = EXIF.getTag(this, 'Make');
          const model = EXIF.getTag(this, 'Model');
          if (make && model) {
            metadata.device = `${make} ${model}`;
          } else if (model) {
            metadata.device = model;
          }

          // Extract GPS coordinates
          const lat = EXIF.getTag(this, 'GPSLatitude');
          const latRef = EXIF.getTag(this, 'GPSLatitudeRef');
          const lng = EXIF.getTag(this, 'GPSLongitude');
          const lngRef = EXIF.getTag(this, 'GPSLongitudeRef');

          if (lat && latRef && lng && lngRef) {
            try {
              const latitude = convertDMSToDD(lat[0], lat[1], lat[2], latRef);
              const longitude = convertDMSToDD(lng[0], lng[1], lng[2], lngRef);

              // Validate coordinates are within Philippine bounds (approximately)
              if (latitude >= 4 && latitude <= 21 && longitude >= 116 && longitude <= 127) {
                metadata.gps = { latitude, longitude };
              }
            } catch (error) {
              console.error('Failed to parse GPS coordinates:', error);
            }
          }

          resolve(Object.keys(metadata).length > 0 ? metadata : null);
        });
      };

      img.onerror = () => {
        resolve(null);
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      resolve(null);
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Format file size for display
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const ImageUpload: React.FC<ImageUploadProps> = ({ onFileSelect, disabled = false, value = null }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(value);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [metadata, setMetadata] = useState<ImageMetadata | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);

  // Sync controlled value from parent (e.g. when navigating wizard steps)
  useEffect(() => {
    if (value) {
      setSelectedFile(value);
      if (!previewUrlRef.current) {
        const url = URL.createObjectURL(value);
        previewUrlRef.current = url;
        setPreviewUrl(url);
      }
      setError(null);
      return;
    }

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setPreviewUrl(null);
    setSelectedFile(null);
    setMetadata(null);
    setWarning(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [value]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  // ============================================================================
  // VALIDATION
  // ============================================================================

  const validateFile = (file: File): string | null => {
    // Check file type (with HEIC/HEIF extension fallback)
    const isHeic = isHeicFile(file.name, file.type);
    const isStandardType = ALLOWED_TYPES.includes(file.type);

    if (!isHeic && !isStandardType) {
      return 'Only JPEG, PNG, JFIF, HEIC, and HEIF images are allowed';
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `File size must be less than ${formatFileSize(MAX_FILE_SIZE)}`;
    }

    return null;
  };

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleFileSelect = useCallback(async (file: File) => {
    setError(null);
    setWarning(null);
    setMetadata(null);

    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Warn about HEIC/HEIF support limitations (separate from error state)
    if (HEIC_HEIF_TYPES.includes(file.type) || isHeicFile(file.name, file.type)) {
      setWarning('HEIC/HEIF images may not preview in all browsers and EXIF/GPS extraction may be unavailable. Please use JPEG or PNG for best compatibility.');
    }

    // Create preview URL
    const url = URL.createObjectURL(file);
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }
    previewUrlRef.current = url;
    setPreviewUrl(url);
    setSelectedFile(file);

    // Extract EXIF metadata
    setIsExtracting(true);
    try {
      const extractedMetadata = await extractEXIFMetadata(file);
      if (extractedMetadata) {
        setMetadata(extractedMetadata);
        onFileSelect(file, extractedMetadata);
      } else {
        onFileSelect(file);
      }
    } catch (error) {
      console.error('Failed to extract EXIF metadata:', error);
      onFileSelect(file);
    } finally {
      setIsExtracting(false);
    }
  }, [onFileSelect]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemove = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
    setWarning(null);
    setMetadata(null);
    onFileSelect(undefined);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  // If file is selected, show preview
  if (selectedFile && previewUrl) {
    return (
      <div className="space-y-3">
        {/* Preview Container */}
        <div className="relative border-2 border-border rounded-lg overflow-hidden bg-card">
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full h-64 object-cover"
          />

          {/* Remove Button */}
          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled}
            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg disabled:opacity-50"
            aria-label="Remove image"
          >
            <X size={20} />
          </button>

          {/* EXIF Extracting Overlay */}
          {isExtracting && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="text-white text-sm flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Extracting metadata...
              </div>
            </div>
          )}
        </div>

        {/* File Info */}
        <div className="flex items-start justify-between p-3 bg-muted rounded-lg text-sm dark:bg-muted/60">
          <div>
            <p className="font-medium text-foreground">{selectedFile.name}</p>
            <p className="text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
          </div>
          <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
            <Check size={16} aria-hidden />
            <span>Uploaded</span>
          </div>
        </div>

        {/* EXIF Metadata Display */}
        {metadata && (
          <div className="p-3 rounded-lg border border-primary/25 bg-primary/10 text-sm space-y-1 dark:border-primary/40 dark:bg-primary/15">
            <p className="font-medium text-foreground mb-2">Image Metadata</p>

            {metadata.timestamp && (
              <p className="text-foreground/90">
                <span className="font-medium">Captured:</span> {metadata.timestamp}
              </p>
            )}

            {metadata.device && (
              <p className="text-foreground/90">
                <span className="font-medium">Device:</span> {metadata.device}
              </p>
            )}

            {metadata.gps && (
              <p className="text-foreground/90">
                <span className="font-medium">GPS Location:</span> Found ✓
                <br />
                <span className="text-xs text-muted-foreground">
                  {metadata.gps.latitude.toFixed(6)}, {metadata.gps.longitude.toFixed(6)}
                </span>
              </p>
            )}
          </div>
        )}

        {/* Warning Display (non-error) */}
        {warning && (
          <div className="p-3 rounded-lg border border-amber-500/35 bg-amber-500/10 text-sm flex items-start gap-2 dark:bg-amber-500/15 dark:border-amber-500/45">
            <AlertCircle size={16} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" aria-hidden />
            <p className="text-amber-950 dark:text-amber-50">{warning}</p>
          </div>
        )}
      </div>
    );
  }

  // Default upload area
  return (
    <div className="space-y-3">
      {/* Upload Area */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary/55'}
          ${isDragging ? 'border-primary bg-primary/10 dark:bg-primary/15' : 'border-border'}
          ${error ? 'border-destructive/50 bg-destructive/10 dark:bg-destructive/15' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={`${ALLOWED_TYPES.join(',')},.jfif,.heic,.heif`}
          onChange={handleInputChange}
          disabled={disabled}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-3">
          <div className={`p-3 rounded-full ${error ? 'bg-destructive/15' : 'bg-muted'}`}>
            {error ? (
              <AlertCircle className="text-destructive" size={32} aria-hidden />
            ) : (
              <Upload className={isDragging ? 'text-primary' : 'text-muted-foreground'} size={32} aria-hidden />
            )}
          </div>

          {error ? (
            <div className="space-y-1">
              <p className="text-sm font-medium text-destructive">{error}</p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setError(null);
                }}
                className="text-xs text-destructive underline hover:no-underline"
              >
                Try again
              </button>
            </div>
          ) : (
            <>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {isDragging ? 'Drop image here' : 'Click to upload or drag and drop'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  JPEG or PNG (max {formatFileSize(MAX_FILE_SIZE)})
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Help Text */}
      <p className="text-xs text-muted-foreground text-center">
        📍 If your photo contains GPS data, we&apos;ll automatically extract the location
      </p>
    </div>
  );
};

export default ImageUpload;