import { useState } from 'react';
import { PhotoWithMetadata } from './lib/types';
import PhotoUploader from './components/photo-uploader';
import PhotoEditor from './components/photo-editor';
import PhotoGallery from './components/photo-gallery';

function App() {
  const [photos, setPhotos] = useState<PhotoWithMetadata[]>([]);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number>(-1);

  const handlePhotosSelected = (newPhotos: PhotoWithMetadata[]) => {
    setPhotos((prevPhotos) => [...prevPhotos, ...newPhotos]);
    setSelectedPhotoIndex(photos.length); // select the first new photo
  };

  const handleRemovePhoto = (dataUrl: string) => {
    const index = photos.findIndex((p) => p.dataUrl === dataUrl);
    setPhotos(photos.filter((p) => p.dataUrl !== dataUrl));
    // TODO: bug when removing photo before selected
    if (index >= photos.length - 1) {
      setSelectedPhotoIndex(Math.max(0, photos.length - 2));
    }
  };

  const handleClearAllPhotos = () => {
    setPhotos([]);
    setSelectedPhotoIndex(-1);
  };

  return (
    <main className='container mx-auto py-10 px-4 max-w-6xl'>
      <h1 className='text-3xl font-bold text-center mb-4'>Photo Reminisce</h1>
      <p className='text-center text-muted-foreground mb-8'>
        Upload photos to add vintage timestamp overlays with the dates and times
        they were taken
      </p>

      {photos.length > 0 && (
        <div className='mb-5'>
          <div className='grid grid-cols-1 lg:grid-cols-3 grid-rows-1 gap-5'>
            {selectedPhotoIndex >= 0 && (
              <div className='lg:col-span-2'>
                <PhotoEditor photo={photos[selectedPhotoIndex]} />
              </div>
            )}
            <div className='lg:col-span-1'>
              <PhotoGallery
                photos={photos}
                selectedPhotoIndex={selectedPhotoIndex}
                onSelectPhoto={setSelectedPhotoIndex}
                onRemovePhoto={handleRemovePhoto}
                onClearAllPhotos={handleClearAllPhotos}
              />
            </div>
          </div>
        </div>
      )}
      <PhotoUploader onPhotoSelected={handlePhotosSelected} />
    </main>
  );
}

export default App;
