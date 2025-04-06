export type PhotoWithMetadata = {
  dataUrl: string;
  file: File;
  metadata: PhotoMetadata;
};

export type PhotoMetadata = {
  date: Date;
};
