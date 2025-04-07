export type PhotoWithMetadata = {
  // TODO: add id?
  dataUrl: string;
  file: File;
  metadata: PhotoMetadata;
};

export type PhotoMetadata = {
  date: Date;
};

export type TimestampColor = 'orange' | 'white' | 'yellow';
export type TimestampFormat = 'standard' | 'dateOnly';
export type FileExtensions = 'jpeg' | 'png';
