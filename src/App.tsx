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
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const Button = styled.button`
  background-color: white;
  color: #FFB6C1;
  padding: 15px 32px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 16px;
  margin: 4px 2px;
  cursor: pointer;
  border: 2px solid #FFB6C1;
  border-radius: 5px;
  transition: all 0.3s;
  font-family: "Avenir", "Helvetica Neue", Helvetica, Arial, sans-serif;

  &:hover {
    background-color: #FFB6C1;
    color: white;
  }

  &:disabled {
    background-color: #ffd6de;
    border-color: #ffd6de;
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
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  font-family: "Avenir", "Helvetica Neue", Helvetica, Arial, sans-serif;
`;

const PhotoGrid = styled.div<{ isGrid: boolean }>`
  display: grid;
  grid-template-columns: ${props => props.isGrid ? 'repeat(2, 1fr)' : '1fr'};
  gap: 10px;
  width: 100%;
  max-width: 640px;
  margin: 20px 0;
`;

const Photo = styled.img`
  width: 100%;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
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
  background-color: ${props => props.active ? '#FFB6C1' : 'white'};
  color: ${props => props.active ? 'white' : '#FFB6C1'};
  margin: 0 5px;
`;

interface PhotoData {
  id: string;
  url: string;
  timestamp: string;
}

const App: React.FC = () => {
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [count, setCount] = useState(3);
  const [isGridMode, setIsGridMode] = useState(false);
  const [photos, setPhotos] = useState<PhotoData[]>([]);
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

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isCountingDown && count > 0) {
      timer = setTimeout(() => {
        setCount(count - 1);
      }, 1000);
    } else if (isCountingDown && count === 0) {
      takePhoto();
      setIsCountingDown(false);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isCountingDown, count]);

  const takePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const imageUrl = canvas.toDataURL('image/png');
        const newPhoto = {
          id: Date.now().toString(),
          url: imageUrl,
          timestamp: new Date().toISOString()
        };
        setPhotos(prev => [...prev, newPhoto]);
      }
    }
  };

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
    </Container>
  );
};

export default App; 