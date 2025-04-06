import type { PhotoWithMetadata } from './types';

export async function extractMetadata(file: File): Promise<PhotoWithMetadata> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const dataUrl = e.target?.result as string;

        // Create an image to get dimensions
        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
          resolve({
            dataUrl,
            file,
          });
        };

        img.onerror = (err) => {
          console.error('Image loading error:', err);
          reject(new Error('Failed to load image'));
        };

        img.src = dataUrl;
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}
