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
    const indexToRemove = photos.findIndex((p) => p.dataUrl === dataUrl);

    // Remove the photo
    setPhotos(photos.filter((p) => p.dataUrl !== dataUrl));

    // If we removed the selected photo
    if (indexToRemove === selectedPhotoIndex) {
      // If we removed the last photo, select the new last photo
      if (indexToRemove >= photos.length - 1) {
        setSelectedPhotoIndex(Math.max(0, photos.length - 2));
      }
      // Otherwise keep the same index (which will now point to the next photo)
      else {
        setSelectedPhotoIndex(indexToRemove);
      }
    }
    // If we removed a photo before the selected one, decrement the index
    else if (indexToRemove < selectedPhotoIndex) {
      setSelectedPhotoIndex(selectedPhotoIndex - 1);
    }
    // If we removed a photo after the selected one, index stays the same
    // No action needed here
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
      <PhotoUploader onPhotosUploaded={handlePhotosSelected} photos={photos} />
    </main>
  );
}

export default App;
