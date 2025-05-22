import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
  font-family: "Avenir", "Helvetica Neue", Helvetica, Arial, sans-serif;
`;

const Title = styled.h1`
  font-family: "Avenir", "Helvetica Neue", Helvetica, Arial, sans-serif;
  font-weight: bold;
  color: #FFB6C1;
  font-size: 48px;
  margin-bottom: 20px;
  text-transform: lowercase;
`;

const CameraContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 640px;
  margin: 20px 0;
`;

const Video = styled.video`
  width: 100%;
  border-radius: 0;
`;

const Button = styled.button`
  background-color: white;
  color: #666666;
  padding: 10px 20px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 14px;
  margin: 4px 2px;
  cursor: pointer;
  border: 1px solid #666666;
  border-radius: 4px;
  transition: all 0.3s;
  font-family: "Anonymous Pro", monospace;

  &:hover {
    background-color: #666666;
    color: white;
  }

  &:disabled {
    background-color: #cccccc;
    border-color: #cccccc;
    color: white;
    cursor: not-allowed;
  }
`;

const Countdown = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 120px;
  color: white;
  font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
`;

const PhotoGrid = styled.div<{ isGrid: boolean }>`
  display: grid;
  grid-template-columns: ${props => props.isGrid ? 'repeat(2, 1fr)' : '1fr'};
  gap: 2px;
  width: 100%;
  max-width: 1280px;
  margin: 20px 0;
  background-color: #000;
`;

const Photo = styled.img`
  width: 100%;
  height: auto;
  display: block;
`;

const Gallery = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 640px;
  margin-top: 20px;
`;

interface ModeButtonProps {
  active: boolean;
}

const ModeButton = styled(Button)<ModeButtonProps>`
  background-color: ${props => props.active ? '#666666' : 'white'};
  color: ${props => props.active ? 'white' : '#666666'};
  margin: 0 5px;
`;

interface PhotoData {
  id: string;
  url: string;
  timestamp: string;
}

const Flash = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: white;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease-out;
  z-index: 1000;
`;

const App: React.FC = () => {
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [count, setCount] = useState(3);
  const [isGridMode, setIsGridMode] = useState(false);
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [photosToTake, setPhotosToTake] = useState(1);
  const [tempPhotos, setTempPhotos] = useState<string[]>([]);
  const [showFlash, setShowFlash] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    startCamera();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
    }
  };

  const startCountdown = () => {
    setIsCountingDown(true);
    setCount(3);
  };

  const createGridImage = (photoUrls: string[]) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size for 2x2 grid
    canvas.width = 1280;  // 640 * 2
    canvas.height = 720;  // 360 * 2

    // Create temporary images to load the photos
    const loadImage = (url: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
      });
    };

    // Load all images and draw them in a grid
    Promise.all(photoUrls.map(loadImage))
      .then(images => {
        // Draw each image in its grid position
        images.forEach((img, index) => {
          const x = (index % 2) * 640;
          const y = Math.floor(index / 2) * 360;
          ctx.drawImage(img, x, y, 640, 360);
        });

        // Convert to data URL and save
        const gridImageUrl = canvas.toDataURL('image/png');
        const newPhoto = {
          id: Date.now().toString(),
          url: gridImageUrl,
          timestamp: new Date().toISOString()
        };
        setPhotos(prev => [...prev, newPhoto]);
      });
  };

  const takePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const imageUrl = canvas.toDataURL('image/png');
        
        if (isGridMode) {
          setTempPhotos(prev => [...prev, imageUrl]);
        } else {
          const newPhoto = {
            id: Date.now().toString(),
            url: imageUrl,
            timestamp: new Date().toISOString()
          };
          setPhotos(prev => [...prev, newPhoto]);
        }
      }
    }
  };

  const triggerFlash = () => {
    setShowFlash(true);
    setTimeout(() => {
      setShowFlash(false);
    }, 300);
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isCountingDown && count > 0) {
      timer = setTimeout(() => {
        setCount(count - 1);
      }, 1000);
    } else if (isCountingDown && count === 0) {
      triggerFlash();
      takePhoto();
      if (isGridMode && photosToTake < 4) {
        setPhotosToTake(prev => prev + 1);
        setCount(3);
      } else {
        if (isGridMode && tempPhotos.length === 4) {
          createGridImage(tempPhotos);
          setTempPhotos([]);
        }
        setIsCountingDown(false);
        setPhotosToTake(1);
      }
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isCountingDown, count, isGridMode, photosToTake, tempPhotos]);

  const downloadPhoto = (photo: PhotoData) => {
    const link = document.createElement('a');
    link.href = photo.url;
    link.download = `mei-photo-${photo.timestamp}.png`;
    link.click();
  };

  const downloadAllPhotos = () => {
    photos.forEach(photo => downloadPhoto(photo));
  };

  const handleModeChange = (isGrid: boolean) => {
    setIsGridMode(isGrid);
    setPhotosToTake(1);
    setTempPhotos([]);
    startCountdown();
  };

  return (
    <Container>
      <Title>mei</Title>
      <CameraContainer>
        <Video
          ref={videoRef}
          autoPlay
          playsInline
          muted
        />
        {isCountingDown && <Countdown>{count}</Countdown>}
      </CameraContainer>
      <div>
        <ModeButton
          active={!isGridMode}
          onClick={() => handleModeChange(false)}
        >
          Single Photo
        </ModeButton>
        <ModeButton
          active={isGridMode}
          onClick={() => handleModeChange(true)}
        >
          4 Photo Grid
        </ModeButton>
      </div>
      {photos.length > 0 && (
        <Gallery>
          <PhotoGrid isGrid={isGridMode}>
            {photos.slice(-4).map((photo, index) => (
              <Photo
                key={photo.id}
                src={photo.url}
                alt={`Photo ${index + 1}`}
                onClick={() => downloadPhoto(photo)}
                style={{ cursor: 'pointer' }}
              />
            ))}
          </PhotoGrid>
          <Button onClick={downloadAllPhotos}>
            Download All Photos
          </Button>
        </Gallery>
      )}
      <Flash style={{ opacity: showFlash ? 1 : 0 }} />
    </Container>
  );
};

export default App; 