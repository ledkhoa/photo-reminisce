import { useState } from 'react';
import './App.css';
import { PhotoWithMetadata } from './lib/types';
import PhotoUploader from './components/photo-uploader';
import { Button } from './components/ui/button';
import PhotoEditor from './components/photo-editor';

function App() {
  const [photo, setPhoto] = useState<PhotoWithMetadata | null>(null);

  return (
    <>
      <main className='container mx-auto py-10 px-4 max-w-4xl'>
        <h1 className='text-3xl font-bold text-center mb-8'>Photo Reminisce</h1>
        <p className='text-center text-muted-foreground mb-8'>
          Upload a photo to add a vintage timestamp overlay with the date and
          time it was taken
        </p>

        {photo ? (
          <div className='space-y-6'>
            <PhotoEditor photo={photo} />
            <div className='flex justify-center'>
              <Button variant='outline' onClick={() => setPhoto(null)}>
                Upload Another Photo
              </Button>
            </div>
          </div>
        ) : (
          <PhotoUploader onPhotoSelected={setPhoto} />
        )}
      </main>
    </>
  );
}

export default App;
