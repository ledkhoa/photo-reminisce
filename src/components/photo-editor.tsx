import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import {
  FileExtensions,
  PhotoWithMetadata,
  TimestampColor,
  TimestampFormat,
} from '../lib/types';
import { formatDate } from '../lib/utils';
import { Card, CardContent, CardFooter, CardHeader } from './ui/card';
import { Download, ImageDown, Move, Settings2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Slider } from './ui/slider';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { toast } from 'sonner';

interface PhotoEditorProps {
  photos: PhotoWithMetadata[];
  selectedPhotoIndex: number;
}

const PhotoEditor = ({ photos, selectedPhotoIndex }: PhotoEditorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [color, setColor] = useState<TimestampColor>('orange');
  const [format, setFormat] = useState<TimestampFormat>('dateOnly');
  const [size, setSize] = useState(128);
  const [timestampShadow, setTimestampShadow] = useState(true);
  const [fileExtension, setFileExtension] = useState<FileExtensions>('jpeg');
  const [quality, setQuality] = useState(100);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [fixedToBottomRight, setFixedToBottomRight] = useState(true);

  // Timestamp position state - initial values will be updated after image loads
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Hint state
  const [showHint, setShowHint] = useState(true);
  const [isHovering, setIsHovering] = useState(false);

  const formatTimestamp = useCallback(
    (date: Date): string => {
      switch (format) {
        case 'dateOnly':
          return formatDate(date, 'MM/DD/YYYY');
        default:
          return formatDate(date, 'MM/DD/YYYY hh:mm A');
      }
    },
    [format]
  );

  const addTimestamp = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const date = photos[selectedPhotoIndex].metadata.date || new Date();
      const timestamp = formatTimestamp(date);

      // Set font style
      ctx.font = `${size}px "Courier New", monospace`;
      ctx.fillStyle = getColorValue(color);

      if (timestampShadow) {
        drawTimestampShadow(ctx);
      }

      // Draw text at the current position
      ctx.fillText(timestamp, position.x, position.y);

      // Reset shadow
      ctx.shadowColor = 'transparent';

      // Only draw the indicator if actively dragging
      if (isDragging) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 5;

        // Draw a rectangle around the text
        const metrics = ctx.measureText(timestamp);
        const textWidth = metrics.width;
        const textHeight = size;

        ctx.strokeRect(
          position.x - 2,
          position.y - textHeight,
          textWidth + 4,
          textHeight + 4
        );
      }
    },
    [
      color,
      formatTimestamp,
      photos,
      selectedPhotoIndex,
      position,
      size,
      timestampShadow,
      isDragging,
    ]
  );

  const drawTimestampShadow = (ctx: CanvasRenderingContext2D) => {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 3;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
  };

  const getColorValue = (color: TimestampColor): string => {
    switch (color) {
      case 'white':
        return '#FFFFFF';
      case 'yellow':
        return '#FFEB3B';
      default:
        return '#FF9800';
    }
  };

  const positionTimestampAtBottomRight = useCallback(() => {
    if (!fixedToBottomRight) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const date = photos[selectedPhotoIndex].metadata.date;
    const timestamp = formatTimestamp(date);

    // Set font to measure text width
    ctx.font = `${size}px "Courier New", monospace`;
    const metrics = ctx.measureText(timestamp);
    const textWidth = metrics.width;

    // Padding from right and bottom
    const padding = 30;
    const x = canvas.width - textWidth - padding;
    const y = canvas.height - padding;

    setPosition({ x, y });
  }, [formatTimestamp, photos, selectedPhotoIndex, size, fixedToBottomRight]);

  const processAndDownloadImage = async (
    photo: PhotoWithMetadata
  ): Promise<void> => {
    const filename = photo.file.name.replace(/\.[^/.]+$/, '');
    // Create and setup temporary canvas
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) throw new Error('Failed to get canvas context');

    // Load and draw image
    await new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        tempCanvas.width = img.width;
        tempCanvas.height = img.height;
        tempCtx.drawImage(img, 0, 0);
        resolve();
      };
      img.onerror = reject;
      img.src = photo.dataUrl;
    });

    // Setup timestamp styling
    tempCtx.font = `${size}px "Courier New", monospace`;
    tempCtx.fillStyle = getColorValue(color);

    if (timestampShadow) {
      drawTimestampShadow(tempCtx);
    }

    // Calculate position and draw timestamp
    const date = photo.metadata.date || new Date();
    const timestamp = formatTimestamp(date);
    const metrics = tempCtx.measureText(timestamp);
    const textWidth = metrics.width;
    const padding = 30;

    const x = fixedToBottomRight
      ? tempCanvas.width - textWidth - padding
      : position.x;
    const y = fixedToBottomRight ? tempCanvas.height - padding : position.y;

    tempCtx.fillText(timestamp, x, y);

    // Convert to blob and download
    const extension = fileExtension === 'jpeg' ? 'jpg' : 'png';
    const mimeType = `image/${fileExtension}`;
    const qualityValue = fileExtension === 'jpeg' ? quality / 100 : 1;

    return new Promise((resolve, reject) => {
      tempCanvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to create blob'));
            return;
          }

          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = `${filename}-photo-reminisce.${extension}`;
          link.href = url;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          resolve();
        },
        mimeType,
        qualityValue
      );
    });
  };

  const downloadImage = async () => {
    setIsDownloading(true);
    try {
      await processAndDownloadImage(photos[selectedPhotoIndex]);
      toast.success('Photo downloaded.');
    } catch (error) {
      console.error('Error in download process:', error);
      toast.error('Failed to download Photo. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const downloadAllImages = async () => {
    setIsDownloadingAll(true);
    setDownloadProgress(0);

    try {
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];

        await processAndDownloadImage(photo);

        setDownloadProgress(Math.round(((i + 1) / photos.length) * 100));
        // delay to prevent browser throttling
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      toast.success(`Downloaded ${photos.length} photos.`);
    } catch (error) {
      console.error('Error in batch download process:', error);
      toast.error('Failed to download Photo. Please try again.');
    } finally {
      setIsDownloadingAll(false);
      setDownloadProgress(0);
    }
  };

  // Hide hint after 3 seconds
  useEffect(() => {
    if (showHint) {
      const timer = setTimeout(() => {
        setShowHint(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [showHint]);

  const renderImage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Set canvas dimensions to match image
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw the image
      ctx.drawImage(img, 0, 0);

      // Add timestamp
      addTimestamp(ctx);
      positionTimestampAtBottomRight();
    };
    img.src = photos[selectedPhotoIndex].dataUrl;
  }, [
    addTimestamp,
    photos,
    selectedPhotoIndex,
    positionTimestampAtBottomRight,
    canvasRef,
  ]);

  useEffect(() => {
    renderImage();
  }, [
    photos,
    selectedPhotoIndex,
    position,
    color,
    format,
    size,
    timestampShadow,
    isDragging,
    renderImage,
  ]);

  // Drag event handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    // Check if the click is near the timestamp
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const date = photos[selectedPhotoIndex].metadata.date || new Date();
    const timestamp = formatTimestamp(date);
    ctx.font = `${size}px "Courier New", monospace`;
    const metrics = ctx.measureText(timestamp);
    const textWidth = metrics.width;
    const textHeight = size;

    // Define the clickable area around the timestamp
    const clickArea = {
      x: position.x - 10,
      y: position.y - textHeight - 10,
      width: textWidth + 20,
      height: textHeight + 20,
    };

    if (
      mouseX >= clickArea.x &&
      mouseX <= clickArea.x + clickArea.width &&
      mouseY >= clickArea.y &&
      mouseY <= clickArea.y + clickArea.height
    ) {
      setIsDragging(true);
      setDragOffset({
        x: mouseX - position.x,
        y: mouseY - position.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    // Calculate new position
    let newX = mouseX - dragOffset.x;
    let newY = mouseY - dragOffset.y;

    // Keep timestamp within canvas bounds
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const date = photos[selectedPhotoIndex].metadata.date || new Date();
      const timestamp = formatTimestamp(date);
      const metrics = ctx.measureText(timestamp);
      const textWidth = metrics.width;

      // Constrain X position
      if (newX < 0) newX = 0;
      if (newX + textWidth > canvas.width) newX = canvas.width - textWidth;

      // Constrain Y position
      if (newY < size) newY = size;
      if (newY > canvas.height) newY = canvas.height;
    }

    setPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      // Force re-render to remove the white box
      renderImage();
    }
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      // Force re-render to remove the white box
      renderImage();
    }
    setIsHovering(false);
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  // Touch event handlers for mobile support
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length !== 1) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const touch = e.touches[0];
    const touchX = (touch.clientX - rect.left) * scaleX;
    const touchY = (touch.clientY - rect.top) * scaleY;

    // Check if the touch is near the timestamp
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const date = photos[selectedPhotoIndex].metadata.date || new Date();
    const timestamp = formatTimestamp(date);
    ctx.font = `${size}px "Courier New", monospace`;
    const metrics = ctx.measureText(timestamp);
    const textWidth = metrics.width;
    const textHeight = size;

    // Define the touchable area around the timestamp
    const touchArea = {
      x: position.x - 20, // Larger touch area for mobile
      y: position.y - textHeight - 20,
      width: textWidth + 40,
      height: textHeight + 40,
    };

    if (
      touchX >= touchArea.x &&
      touchX <= touchArea.x + touchArea.width &&
      touchY >= touchArea.y &&
      touchY <= touchArea.y + touchArea.height
    ) {
      setIsDragging(true);
      setDragOffset({
        x: touchX - position.x,
        y: touchY - position.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging || e.touches.length !== 1) return;
    e.preventDefault(); // Prevent scrolling while dragging

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const touch = e.touches[0];
    const touchX = (touch.clientX - rect.left) * scaleX;
    const touchY = (touch.clientY - rect.top) * scaleY;

    // Calculate new position
    let newX = touchX - dragOffset.x;
    let newY = touchY - dragOffset.y;

    // Keep timestamp within canvas bounds
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const date = photos[selectedPhotoIndex].metadata.date || new Date();
      const timestamp = formatTimestamp(date);
      const metrics = ctx.measureText(timestamp);
      const textWidth = metrics.width;

      // Constrain X position
      if (newX < 0) newX = 0;
      if (newX + textWidth > canvas.width) newX = canvas.width - textWidth;

      // Constrain Y position
      if (newY < size) newY = size;
      if (newY > canvas.height) newY = canvas.height;
    }

    setPosition({ x: newX, y: newY });
  };

  const handleTouchEnd = () => {
    if (isDragging) {
      setIsDragging(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className='grid sm:flex justify-between items-center'>
          <h2 className='text-xl font-semibold'>Edit Photo</h2>
          <div className='flex gap-2 mt-1 sm:mt-0'>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant='outline'>
                  <Settings2 className='h-4 w-4 mr-1' />
                  <p className='sr-only sm:not-sr-only'>Settings</p>
                </Button>
              </PopoverTrigger>
              <PopoverContent className='w-full px-2'>
                <div className='grid gap-4'>
                  <div className='space-y-2'>
                    <h4 className='font-semibold'>Timestamp Settings</h4>

                    <div className='grid gap-2'>
                      <Label htmlFor='color'>Color</Label>
                      <Select
                        value={color}
                        onValueChange={(value) =>
                          setColor(value as TimestampColor)
                        }
                      >
                        <SelectTrigger className='w-full' id='color'>
                          <SelectValue placeholder='Color' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='orange'>Orange</SelectItem>
                          <SelectItem value='white'>White</SelectItem>
                          <SelectItem value='yellow'>Yellow</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className='grid gap-2'>
                      <Label htmlFor='format'>Format</Label>
                      <Select
                        value={format}
                        onValueChange={(value) =>
                          setFormat(value as TimestampFormat)
                        }
                      >
                        <SelectTrigger className='w-full' id='format'>
                          <SelectValue placeholder='Format' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='standard'>
                            Standard (MM/DD/YYYY hh:mm AM/PM)
                          </SelectItem>
                          <SelectItem value='dateOnly'>
                            Date Only (MM/DD/YYYY)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className='grid gap-2'>
                      <div className='flex justify-between'>
                        <Label htmlFor='size'>Size</Label>
                        <span className='text-sm text-muted-foreground'>
                          {size}px
                        </span>
                      </div>
                      <Slider
                        id='size'
                        min={64}
                        max={256}
                        step={1}
                        value={[size]}
                        onValueChange={(value) => setSize(value[0])}
                      />
                    </div>

                    <div className='flex items-center justify-between'>
                      <Label htmlFor='border'>Show Border/Shadow</Label>
                      <Switch
                        id='border'
                        checked={timestampShadow}
                        onCheckedChange={setTimestampShadow}
                      />
                    </div>

                    <div className='flex items-center justify-between'>
                      <Label htmlFor='fixed'>Fix to Bottom Right</Label>
                      <Switch
                        id='fixed'
                        checked={fixedToBottomRight}
                        onCheckedChange={setFixedToBottomRight}
                      />
                    </div>
                  </div>
                  <div className='grid gap-2 pt-2 border-t mt-2'>
                    <h4 className='font-semibold'>Download Settings</h4>

                    <div className='grid gap-2'>
                      <Label htmlFor='format'>File Extension</Label>
                      <Select
                        value={fileExtension}
                        onValueChange={(value) =>
                          setFileExtension(value as FileExtensions)
                        }
                      >
                        <SelectTrigger className='w-full' id='fileFormat'>
                          <SelectValue placeholder='File Extension' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='jpeg'>
                            JPEG (smaller file)
                          </SelectItem>
                          <SelectItem value='png'>
                            PNG (better quality)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className='grid gap-2'>
                      <div className='flex justify-between'>
                        <Label htmlFor='quality'>Quality</Label>
                        <span className='text-sm text-muted-foreground'>
                          {quality}%
                        </span>
                      </div>
                      <Slider
                        id='quality'
                        min={50}
                        max={100}
                        step={5}
                        value={[quality]}
                        onValueChange={(value) => setQuality(value[0])}
                      />
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            <Button onClick={downloadImage} disabled={isDownloading}>
              <Download className='h-4 w-4 mr-1' />
              <p>{isDownloading ? 'Downloading...' : 'Download'}</p>
            </Button>
            {photos.length > 1 && (
              <Button onClick={downloadAllImages} disabled={isDownloadingAll}>
                <ImageDown className='h-4 w-4 mr-1' />
                <p>
                  {isDownloadingAll
                    ? 'Downloading...'
                    : `Download All (${photos.length})`}
                </p>
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className='px-6'>
        <Badge className='mb-2' variant='outline'>
          {photos[selectedPhotoIndex].file.name}
        </Badge>

        <div className='relative max-h-[70vh] overflow-auto flex justify-center'>
          <div className='relative'>
            <canvas
              ref={canvasRef}
              className='max-w-full h-auto border rounded-md cursor-move'
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              onMouseEnter={handleMouseEnter}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            />
          </div>
          {/* Only show hint when initially loaded or when hovering */}
          {(showHint || isHovering) && (
            <div className='absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded-md flex items-center transition-opacity'>
              <Move className='h-3 w-3 mr-1' />
              Drag timestamp to reposition
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className='flex flex-col'>
        <div className='text-sm text-muted-foreground'>
          {photos[selectedPhotoIndex].metadata.date ? (
            <p>
              Photo taken:{' '}
              {formatDate(
                photos[selectedPhotoIndex].metadata.date,
                'MMMM D, YYYY [at] h:mm A'
              )}
            </p>
          ) : (
            <p>No date information found in this photo</p>
          )}
        </div>
        {isDownloadingAll && (
          <div className='w-full'>
            <div className='flex justify-between text-sm'>
              <span>Downloading images...</span>
              <span>{Math.round(downloadProgress)}%</span>
            </div>
            <Progress value={downloadProgress} className='h-2' />
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default PhotoEditor;
