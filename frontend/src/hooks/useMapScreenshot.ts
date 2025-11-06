/**
 * useMapScreenshot Hook
 * 
 * Custom React hook for capturing map screenshots using html2canvas.
 * Handles map element preparation, screenshot generation, and cleanup.
 * 
 * Module: RG-01 (Report Generation)
 * Change: add-advanced-map-features (Phase 4)
 * 
 * Usage:
 * ```tsx
 * const { captureMapScreenshot, isCapturing } = useMapScreenshot();
 * const imageData = await captureMapScreenshot(mapContainerRef.current);
 * ```
 */

import { useState, useCallback } from 'react';
import html2canvas, { type Options as Html2CanvasOptions } from 'html2canvas';

interface CaptureOptions {
  /**
   * Image format: 'png' or 'jpeg'
   * Default: 'png'
   */
  format?: 'png' | 'jpeg';
  
  /**
   * JPEG quality (0.0 - 1.0)
   * Default: 0.95
   */
  quality?: number;
  
  /**
   * Scale factor for higher resolution
   * Default: 2 (2x resolution)
   */
  scale?: number;
  
  /**
   * Background color for transparent areas
   * Default: '#ffffff'
   */
  backgroundColor?: string;
  
  /**
   * Width of captured image (null = element width)
   * Default: null
   */
  width?: number | null;
  
  /**
   * Height of captured image (null = element height)
   * Default: null
   */
  height?: number | null;
}

interface CaptureResult {
  /**
   * Base64 data URL of the screenshot
   */
  dataUrl: string;
  
  /**
   * Blob object for uploading
   */
  blob: Blob;
  
  /**
   * Width of captured image in pixels
   */
  width: number;
  
  /**
   * Height of captured image in pixels
   */
  height: number;
}

export const useMapScreenshot = () => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Capture screenshot of map element
   * 
   * @param element - DOM element to capture (usually map container)
   * @param options - Capture configuration options
   * @returns Promise resolving to capture result with dataUrl and blob
   */
  const captureMapScreenshot = useCallback(
    async (
      element: HTMLElement | null,
      options: CaptureOptions = {}
    ): Promise<CaptureResult | null> => {
      if (!element) {
        setError('Map element not found');
        return null;
      }

      setIsCapturing(true);
      setError(null);

      try {
        const {
          format = 'png',
          quality = 0.95,
          scale = 2,
          backgroundColor = '#ffffff',
          width = null,
          height = null,
        } = options;

        // Prepare html2canvas options
        const html2canvasOptions: Partial<Html2CanvasOptions> = {
          scale,
          backgroundColor,
          useCORS: true, // Allow cross-origin images
          allowTaint: false, // Prevent tainted canvas
          logging: false, // Disable console logs
          
          // Custom size if specified
          ...(width && { width }),
          ...(height && { height }),
          
          // Callback to modify cloned document before rendering
          onclone: (clonedDoc: Document) => {
            // Hide UI controls that shouldn't appear in screenshot
            const controlsToHide = [
              '.leaflet-control-container', // Leaflet controls (zoom, layers)
              '.leaflet-control-attribution', // Attribution text
              '[role="dialog"]', // Modal dialogs
              '.map-controls', // Custom map controls
              '.map-legend', // Legend panel
              '.filter-panel', // Filter panel
              '.floating-controls', // Floating control buttons
              '[data-map-control="true"]', // Any element marked as map control
              'button[aria-label*="Generate"]', // Generate Report button
              'button[aria-label*="Report"]', // Any report-related buttons
            ];

            controlsToHide.forEach((selector) => {
              const elements = clonedDoc.querySelectorAll(selector);
              elements.forEach((el) => {
                (el as HTMLElement).style.display = 'none';
              });
            });

            // Ensure map tiles are fully loaded and visible
            const mapContainer = clonedDoc.querySelector('.leaflet-container');
            if (mapContainer) {
              // Force repaint to ensure tiles are rendered
              (mapContainer as HTMLElement).style.opacity = '0.99999';
            }

            // Expand any collapsed sections for complete capture
            const collapsedElements = clonedDoc.querySelectorAll('[data-collapsed="true"]');
            collapsedElements.forEach((el) => {
              (el as HTMLElement).removeAttribute('data-collapsed');
            });
          },
        };

        // Wait a moment for tiles to fully render
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Capture the screenshot
        const canvas = await html2canvas(element, html2canvasOptions);

        // Convert canvas to data URL
        const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
        const dataUrl = canvas.toDataURL(mimeType, quality);

        // Convert canvas to blob for uploading
        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(
            (result) => {
              if (result) {
                resolve(result);
              } else {
                reject(new Error('Failed to create blob from canvas'));
              }
            },
            mimeType,
            quality
          );
        });

        setIsCapturing(false);

        return {
          dataUrl,
          blob,
          width: canvas.width,
          height: canvas.height,
        };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('Screenshot capture failed:', err);
        setError(`Failed to capture screenshot: ${errorMessage}`);
        setIsCapturing(false);
        return null;
      }
    },
    []
  );

  /**
   * Download screenshot directly to user's computer
   * 
   * @param result - Capture result from captureMapScreenshot
   * @param filename - Name of downloaded file (without extension)
   */
  const downloadScreenshot = useCallback(
    (result: CaptureResult, filename: string = 'map-screenshot') => {
      const link = document.createElement('a');
      link.download = `${filename}.${result.dataUrl.startsWith('data:image/jpeg') ? 'jpg' : 'png'}`;
      link.href = result.dataUrl;
      link.click();
    },
    []
  );

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    captureMapScreenshot,
    downloadScreenshot,
    isCapturing,
    error,
    clearError,
  };
};
