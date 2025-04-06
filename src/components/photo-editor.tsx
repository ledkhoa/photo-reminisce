import { PhotoWithMetadata } from '../lib/types';

interface PhotoEditorProps {
  photo: PhotoWithMetadata;
}

const PhotoEditor = ({ photo }: PhotoEditorProps) => {
  return (
    <section>
      <p>Date: {photo.metadata.date.toLocaleString()}</p>
    </section>
  );
};

export default PhotoEditor;
