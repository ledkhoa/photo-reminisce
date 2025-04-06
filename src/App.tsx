import { useState } from 'react';
import './App.css';
import { PhotoWithMetadata } from './lib/types';
import PhotoUploader from './components/photo-uploader';

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
          <div>Photo here</div>
        ) : (
          <PhotoUploader onPhotoSelected={setPhoto} />
        )}
      </main>
    </>
  );
}

export default App;
