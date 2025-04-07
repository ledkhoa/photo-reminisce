import { useState } from 'react';
import { PhotoWithMetadata } from '../lib/types';
import { Upload } from 'lucide-react';
import { Button } from './ui/button';
import heic2any from 'heic2any';
import { extractMetadata } from '../lib/metadata-extractor';
import { cn } from '../lib/utils';

interface PhotoUploaderProps {
  onPhotoSelected: (photos: PhotoWithMetadata[]) => void;
}

const PhotoUploader = ({ onPhotoSelected }: PhotoUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);

  const processFile = async (file: File): Promise<PhotoWithMetadata> => {
    // Check if it's a HEIC/HEIF file
    const isHeic =
      file.name.toLowerCase().match(/\.(heic|heif)$/i) ||
      file.type.match(/^image\/(heic|heif)$/i);

    let processedFile = file;

    if (isHeic) {
      try {
        const convertedBlob = (await heic2any({
          blob: file,
          toType: 'image/jpeg',
          quality: 0.9,
        })) as Blob;

        processedFile = new File(
          [convertedBlob],
          file.name.replace(/\.(heic|heif)$/i, '.jpg'),
          {
            type: 'image/jpeg',
            lastModified: file.lastModified,
          }
        );
      } catch (conversionError) {
        console.error('HEIC conversion error:', conversionError);
        setError(
          'Failed to convert HEIC image. Please try another file format.'
        );
      }
    }

    return await extractMetadata(processedFile);
  };

  // TODO: Prevent processing the same file (by dataUrl?)
  const handleFiles = async (files: FileList) => {
    setIsLoading(true);
    setError(null);
    setProgress(null);

    const validFiles = Array.from(files).filter(
      (file) =>
        file.type.startsWith('image/') ||
        file.name.toLowerCase().match(/\.(heic|heif)$/i)
    );

    if (validFiles.length === 0) {
      setError('Please upload image files');
      setIsLoading(false);
      return;
    }

    try {
      const processed: PhotoWithMetadata[] = [];
      let completed = 0;

      for (const file of validFiles) {
        try {
          const photo = await processFile(file);
          processed.push(photo);
          completed++;
          setProgress(`Processing ${completed}/${validFiles.length} images...`);
        } catch (error) {
          console.error(`Failed to process ${file.name}:`, error);
        }
      }

      if (processed.length > 0) {
        onPhotoSelected(processed);
      }
    } catch (err) {
      setError('Failed to process images. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
      setProgress(null);
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
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
    >
      <div className='flex flex-col items-center justify-center space-y-4'>
        <div className='bg-muted rounded-full p-3'>
          <Upload className='h-8 w-8 text-muted-foreground' />
        </div>
        <div>
          <p className='text-lg font-medium'>Drag and drop your photos here</p>
          <p className='text-sm text-muted-foreground mt-1'>
            or click to browse from your device
          </p>
          <p className='text-xs text-muted-foreground mt-1'>
            Supports multiple files: JPG, PNG, GIF, WEBP, and HEIC formats
          </p>
        </div>
        <input
          type='file'
          id='file-upload'
          className='hidden'
          accept='image/*,.heic,.heif'
          multiple
          onChange={(e) => {
            if (e.target.files?.length) {
              handleFiles(e.target.files);
            }
          }}
        />
        <Button
          variant='outline'
          onClick={() => document.getElementById('file-upload')?.click()}
          disabled={isLoading}
        >
          {isLoading ? progress || 'Processing...' : 'Select Photos'}
        </Button>
        {error && <p className='text-destructive text-sm'>{error}</p>}
      </div>
    </section>
  );
};

export default PhotoUploader;
