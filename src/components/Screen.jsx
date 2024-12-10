import React, { useEffect} from 'react';
import './Screen.css';
import Canvas from './Canvas';
import VideoCanvas from './pano';
// import * as blazeface from '@tensorflow-models/blazeface';
// import * as tf from '@tensorflow/tfjs';

// Load the backend

const Screen = ({devices,setDevices,videoRefs,isVideoVisible,canvasRefs,panoflag}) => {

  const visibleVideoCount = Object.values(isVideoVisible).filter(visible => visible).length;

  function gotDevices(devices) {
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setDevices(videoDevices); 
      videoRefs.current = videoDevices.map(device => ({ deviceId: device.deviceId, ref: React.createRef() }));
      canvasRefs.current = videoDevices.map(device => ({ deviceId: device.deviceId, ref: React.createRef() }));
  }

  const reload = () => {
    navigator.mediaDevices.enumerateDevices().then(devices => {gotDevices(devices);})
    .catch(err => {
      console.error('無法取得媒體設備:', err);
    });
  }

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then(devices => {gotDevices(devices);})
      .catch(err => {
        console.error('無法取得媒體設備:', err);
      });
  }, []); 
  
  return (
    <>
      <button className={'reload'} onClick={reload} ><img src="./refresh.png" className='reload_img'/></button>
      {!panoflag ? (
        <div className={`stream-container`}>
          {videoRefs.current.map((videoRef, index) => (
            <div 
              className={`stream ${visibleVideoCount === 1 ? 'large' : ''} ${isVideoVisible[videoRef.deviceId] ? '' : 'hidden'}`}
              key={videoRef.deviceId}
            >
              <video className={`${visibleVideoCount === 1 ? 'large' : 'small'}`} ref={videoRef.ref} autoPlay playsInline />
              <Canvas canvasRefs={canvasRefs} index={index} visibleVideoCount={visibleVideoCount} />
              <div className='overlay'>
                <p>{devices[index]?.label || `鏡頭 ${index + 1}`}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <VideoCanvas devices={devices}/>
        </>
      )}
      
    </>
  );
}

export default Screen;