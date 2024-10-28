import {useRef, useState } from 'react';
import './App.css';

import  Sidebar  from './components/Sidebar';
import  Screen  from './components/Screen';

function App() {
  const videoRefs = useRef([]); // 使用空數組來儲存 video 元素的引用
  const [devices, setDevices] = useState([]); // 用於存儲設備列表
  const [streams, setStreams] = useState({}); // 存儲每個設備的流
  const [isVideoVisible, setIsVideoVisible] = useState({});

  
  return (
    <>
      <Sidebar devices={devices} 
                videoRefs={videoRefs}
                streams={streams} 
                setStreams={setStreams} 
                setIsVideoVisible={setIsVideoVisible} 
                isVideoVisible={isVideoVisible}/>
      <Screen devices={devices}
              setDevices={setDevices}
              videoRefs={videoRefs}
              setStreams={setStreams}
              isVideoVisible={isVideoVisible}
              setIsVideoVisible={setIsVideoVisible
              }/>
    </>
  );
}

export default App;