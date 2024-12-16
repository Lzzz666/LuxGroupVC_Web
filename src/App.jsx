import {useRef, useState } from 'react';
import './App.css';

import  Sidebar  from './components/Sidebar';
import  Screen  from './components/Screen';

function App() {
  const videoRefs = useRef([]); // 使用空數組來儲存 video 元素的引用
  const [panoflag, setPanoflag] = useState(false);
  const [isDetect, setIsDetect] = useState(false);
  const [devices, setDevices] = useState([]); // 用於存儲設備列表
  const [streams, setStreams] = useState({}); // 存儲每個設備的流
  const [isVideoVisible, setIsVideoVisible] = useState({});
  const canvasRefs = useRef([]); // 使用空數組來儲存 canvas 元素的引用
  return (
    <>
      <Sidebar devices={devices} 
                videoRefs={videoRefs}
                streams={streams} 
                setStreams={setStreams} 
                setIsVideoVisible={setIsVideoVisible} 
                isVideoVisible={isVideoVisible}
                canvasRefs={canvasRefs}
                panoflag={panoflag}
                setPanoflag={setPanoflag}
                isDetect={isDetect}
                setIsDetect={setIsDetect}
                />
      <Screen devices={devices}
              setDevices={setDevices}
              videoRefs={videoRefs}
              setStreams={setStreams}
              isVideoVisible={isVideoVisible}
              setIsVideoVisible={setIsVideoVisible}
              canvasRefs={canvasRefs}
              panoflag={panoflag}
              isDetect={isDetect}
              />
    </>
  );
}

export default App;