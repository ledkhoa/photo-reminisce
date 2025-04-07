'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import type { PhotoWithMetadata } from '@/lib/types';
import { cn, formatDate } from '@/lib/utils';

interface PhotoGalleryProps {
  photos: PhotoWithMetadata[];
  selectedPhotoIndex: number;
  onSelectPhoto: (index: number) => void;
  onRemovePhoto: (id: string) => void;
  onClearAllPhotos: () => void;
}

const PhotoGallery = ({
  photos,
  selectedPhotoIndex,
  onSelectPhoto,
  onRemovePhoto,
  onClearAllPhotos,
}: PhotoGalleryProps) => {
  const [hoveredPhotoId, setHoveredPhotoId] = useState<string | null>(null);

  return (
    <Card>
      <CardHeader>
        <div className='flex justify-between items-center'>
          <h2 className='text-xl font-semibold'>Photo Gallery</h2>
          <Button variant='outline' onClick={onClearAllPhotos}>
            Clear All Photos
          </Button>
        </div>
      </CardHeader>
      <CardContent className='px-6'>
        <div className='grid grid-cols-2 gap-2 max-h-[70vh] overflow-y-auto p-1'>
          {photos.map((photo, index) => (
            <div
              key={photo.dataUrl}
              className={cn(
                'relative rounded-md overflow-hidden border-2 cursor-pointer',
                index === selectedPhotoIndex
                  ? 'border-primary'
                  : 'border-secondary'
              )}
              onClick={() => onSelectPhoto(index)}
              onMouseEnter={() => setHoveredPhotoId(photo.dataUrl)}
              onMouseLeave={() => setHoveredPhotoId(null)}
            >
              <img
                src={photo.dataUrl || '/placeholder.svg'}
                alt={`Photo ${index + 1}`}
                className='w-full h-32 object-cover'
              />
              {(hoveredPhotoId === photo.dataUrl ||
                index === selectedPhotoIndex) && (
                <Button
                  variant='destructive'
                  size='icon'
                  className='absolute top-1 right-1 h-6 w-6'
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemovePhoto(photo.dataUrl);
                  }}
                >
                  <X className='h-3 w-3' />
                </Button>
              )}
              <div className='absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 truncate'>
                {photo.metadata.date
                  ? formatDate(photo.metadata.date, 'MM/DD/YY')
                  : 'No date'}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default PhotoGallery;
