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

  console.log(tags);

  getExifDate(tags['DateTimeOriginal']!.description.toString());

  return {
    date:
      getExifDate(tags['CreateDate']?.description) ??
      getExifDate(
        convertDateString(tags['DateTimeOriginal']?.description || '')
      ) ??
      new Date(),
  };
}

function getExifDate(unsafeDate: string): Date | undefined {
  const date = new Date(unsafeDate);
  if (isNaN(date.getTime())) {
    return undefined;
  }

  return date;
}

function convertDateString(dateString: string): string {
  // Convert from YYYY:MM:DD HH:MM:SS to YYYY-MM-DDTHH:MM:SS
  const [datePart, timePart] = dateString.split(' ');
  const [year, month, day] = datePart.split(':');
  const isoString = `${year}-${month}-${day}T${timePart}`;

  return isoString;
}
