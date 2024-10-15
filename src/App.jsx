import React, { useEffect, useRef, useState } from 'react';
import './App.css';

import  Sidebar  from './components/sidebar';

function App() {
  const videoRefs = useRef([]); // 使用空數組來儲存 video 元素的引用
  const [devices, setDevices] = useState([]); // 用於存儲設備列表
  const [streams, setStreams] = useState({}); // 存儲每個設備的流
  const [isVideoVisible, setIsVideoVisible] = useState({});


  useEffect(() => {
    navigator.mediaDevices.enumerateDevices()
      .then(devices => {
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setDevices(videoDevices); 
        console.log('找到的攝像頭:', videoDevices);

        // 初始化 videoRefs
        videoRefs.current = videoDevices.map(device => ({ deviceId: device.deviceId, ref: React.createRef() }));

        videoDevices.forEach(device => {
          navigator.mediaDevices.getUserMedia({
            video: { deviceId: device.deviceId }
          }).then(stream => {
            const videoRef = videoRefs.current.find(ref => ref.deviceId === device.deviceId);
            console.log('videoRef',videoRef);

            
            if (videoRef && videoRef.ref.current) {
              videoRef.ref.current.srcObject = stream;
              setStreams(prevStreams => ({
                ...prevStreams,
                [device.deviceId]: stream,
              }));
              setIsVideoVisible(prev => ({ ...prev, [devices.deviceId]: true })); // 顯示視頻
            }
          }).catch(err => {
            console.error('無法存取攝像頭:', err);
          });
        });
        
      })
      .catch(err => {
        console.error('無法取得媒體設備:', err);
        setLoading(false); // 如果出現錯誤，則停止加載
      });
  }, []); 


  return (
    <>
      <Sidebar devices={devices} 
                videoRefs={videoRefs}
                streams={streams} 
                setStreams={setStreams} 
                setIsVideoVisible={setIsVideoVisible} 
                isVideoVisible={isVideoVisible}/>
      <div className='stream-container'>
        {console.log('hihi')}
        {videoRefs.current.map((videoRef, index) => ((
          <div className={`stream ${isVideoVisible[videoRef.deviceId] ? '' : 'hidden'}`} key={videoRef.deviceId}>
            <video ref={videoRef.ref} autoPlay playsInline></video>
            <div className='overlay'><p>{devices[index]?.label || `鏡頭 ${index + 1}`}</p></div>
          </div>
        )))}
          {/* isVideoVisible[videoRef.deviceId] */}
      </div>
    </>
  );
}

export default App;