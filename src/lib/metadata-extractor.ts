import type { PhotoMetadata, PhotoWithMetadata } from './types';
import * as ExifReader from 'exifreader';

export async function extractMetadata(file: File): Promise<PhotoWithMetadata> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const dataUrl = e.target?.result as string;

        // Create an image to get dimensions
        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = async () => {
          const metadata = await extractExif(file);

          resolve({
            dataUrl,
            file,
            metadata,
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

async function extractExif(file: File): Promise<PhotoMetadata> {
  const buffer = await file.arrayBuffer();
  const tags = ExifReader.load(buffer);

  return {
    date: tags['CreateDate']
      ? new Date(tags['CreateDate'].description)
      : new Date(),
  };
}
