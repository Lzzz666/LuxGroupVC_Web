import React, { useEffect} from 'react';
import './Screen.css';

const Screen = ({devices,setDevices,videoRefs,isVideoVisible}) => {

  const visibleVideoCount = Object.values(isVideoVisible).filter(visible => visible).length;
  function gotDevices(devices) {
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setDevices(videoDevices); 
      console.log('找到的攝像頭:', videoDevices);
      videoRefs.current = videoDevices.map(device => ({ deviceId: device.deviceId, ref: React.createRef() }));
  }

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then(devices => {gotDevices(devices);})
      .catch(err => {
        console.error('無法取得媒體設備:', err);
      });
  }, []); 

  return (
    <>
      <div className={`stream-container`}>
        {console.log("a",visibleVideoCount)}
        {videoRefs.current.map((videoRef, index) => ((
          <div className={`stream ${visibleVideoCount === 1 ? 'large' : ''} ${isVideoVisible[videoRef.deviceId] ? '' : 'hidden'}`} key={videoRef.deviceId}>
            <video className={`${visibleVideoCount === 1 ? 'large' : 'small'}`}ref={videoRef.ref} autoPlay playsInline></video>
            <div className='overlay'><p>{devices[index]?.label || `鏡頭 ${index + 1}`}</p></div>
          </div>
        )))}
      </div>
    </>
  );
}

export default Screen;