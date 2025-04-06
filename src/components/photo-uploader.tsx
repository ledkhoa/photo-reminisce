import { useState } from 'react';
import { PhotoWithMetadata } from '../lib/types';
import { Upload } from 'lucide-react';
import { Button } from './ui/button';
import heic2any from 'heic2any';
import { extractMetadata } from '../lib/metadata-extractor';
import { cn } from '../lib/utils';

interface PhotoUploaderProps {
  onPhotoSelected: (photo: PhotoWithMetadata) => void;
}

const PhotoUploader = ({ onPhotoSelected }: PhotoUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversionProgress, setConversionProgress] = useState<string | null>(
    null
  );

  const handleFile = async (file: File) => {
    // Check if it's an image file
    if (
      !file.type.startsWith('image/') &&
      !file.name.toLowerCase().endsWith('.heic') &&
      !file.name.toLowerCase().endsWith('.heif')
    ) {
      setError('Please upload an image file');
      return;
    }

    setIsLoading(true);
    setError(null);
    setConversionProgress(null);

    try {
      // Check if it's a HEIC/HEIF file
      const isHeic =
        file.name.toLowerCase().endsWith('.heic') ||
        file.name.toLowerCase().endsWith('.heif') ||
        file.type === 'image/heic' ||
        file.type === 'image/heif';

      let processedFile = file;

      if (isHeic) {
        setConversionProgress('Converting HEIC image...');

        try {
          // Convert HEIC to JPEG
          const convertedBlob = (await heic2any({
            blob: file,
            toType: 'image/jpeg',
            quality: 0.9,
          })) as Blob;

          // Create a new File from the converted Blob
          processedFile = new File(
            [convertedBlob],
            file.name.replace(/\.heic$/i, '.jpg').replace(/\.heif$/i, '.jpg'),
            {
              type: 'image/jpeg',
              lastModified: file.lastModified,
            }
          );

          setConversionProgress('HEIC conversion complete');
        } catch (conversionError) {
          console.error('HEIC conversion error:', conversionError);
          setError(
            'Failed to convert HEIC image. Please try another file format.'
          );
          setIsLoading(false);
          return;
        }
      }

      // Process the file (original or converted)
      const photoWithMetadata = await extractMetadata(processedFile);
      onPhotoSelected(photoWithMetadata);
    } catch (err) {
      setError('Failed to process image. Please try another one.');
      console.error(err);
    } finally {
      setIsLoading(false);
      setConversionProgress(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <section
      className={cn(
        'border-2 border-dashed rounded-lg p-12 text-center',
        isDragging
          ? 'border-primary bg-primary/5'
          : 'border-muted-foreground/20'
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className='flex flex-col items-center justify-center space-y-4'>
        <div className='bg-muted rounded-full p-3'>
          <Upload className='h-8 w-8 text-muted-foreground' />
        </div>
        <div>
          <p className='text-lg font-medium'>Drag and drop your photo here</p>
          <p className='text-sm text-muted-foreground mt-1'>
            or click to browse from your device
          </p>
          <p className='text-xs text-muted-foreground mt-1'>
            Supports JPG, PNG, GIF, WEBP, and HEIC formats
          </p>
        </div>
        <input
          type='file'
          id='file-upload'
          className='hidden'
          accept='image/*,.heic,.heif'
          onChange={(e) => {
            if (e.target.files?.[0]) {
              handleFile(e.target.files[0]);
            }
          }}
        />
        <Button
          variant='outline'
          onClick={() => document.getElementById('file-upload')?.click()}
          disabled={isLoading}
        >
          {isLoading ? conversionProgress || 'Processing...' : 'Select Photo'}
        </Button>
        {error && <p className='text-destructive text-sm'>{error}</p>}
      </div>
    </section>
  );
};

export default PhotoUploader;
