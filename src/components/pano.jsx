import React, { useRef, useEffect, useState } from 'react';
import './pano.css';
import '@mediapipe/face_detection';
import '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';




const Pano = ({devices,model,panoflag,deviceRes}) => {
  const videoCanvasRef = useRef(null);
  const firstzoomCanvasRef = useRef(null);
  const secondZoomCanvasRef = useRef(null);
  const thirdZoomCanvasRef = useRef(null);
  const fourthZoomCanvasRef = useRef(null);
  const fifthZoomCanvasRef = useRef(null);
  const sixthZoomCanvasRef = useRef(null);

  const videoRef = useRef(null);
  
  const [videoInputs, setVideoInputs] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [selectedResolution, setSelectedResolution] = useState({ width: 1280, height: 720 });
  const [p, setP] = useState(0); // 用於控制渲染的 canvas 數量
  const [x, setX] = useState(0); // 控制拉桿的值
  const video = videoRef.current;

  const handleCameraChange = (e) => {
    setSelectedDeviceId(e.target.value);
  };


  const handleResolutionChange = (e) => {
    const [width, height] = e.target.value.split('x').map(Number);
    setSelectedResolution({ width, height });
  };

  const handleXchange = (e) => {
    setX(parseInt(e.target.value, 10));
  }


  // ---- 先設定第一個鏡頭/第一個解析度 ---- //
  useEffect(() => {
    const initCameras = async () => {
      const cameras = devices;
      setVideoInputs(cameras);
      if (cameras.length > 0) {
        setSelectedDeviceId(cameras[0].deviceId); // 預設選擇第一個鏡頭
        setSelectedResolution({ width: deviceRes[cameras[0].deviceId][0].width, height: deviceRes[cameras[0].deviceId][0].height });
      }
    };
    initCameras();
  }, []);
  

  // ---- 解析度變更 ---- //
  useEffect(() => {
    if (!selectedDeviceId) return;
    const startStream = async () => {
      if (video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: { exact: selectedDeviceId },
            width: selectedResolution.width,
            height: selectedResolution.height,
          },
        });
        const videoTrack = stream.getVideoTracks()[0];
        const settings = videoTrack.getSettings();

        if (settings.width !== selectedResolution.width || settings.height !== selectedResolution.height) {
          alert('解析度變更失敗，目標解析度 ' + selectedResolution.width + 'x' + selectedResolution.height +'目前解析度'+ settings.width + 'x' + settings.height);
        }

        console.log('Current resolution:', settings.width, settings.height);

        if (video.srcObject) {
          video.srcObject.getTracks().forEach((track) => track.stop());
        }
        video.srcObject = stream;
        video.play();
        
        console.log('Switched to new camera:', selectedDeviceId);
      } catch (error) {
        console.error('無法訪問所選鏡頭:', error);
      }
    };

    startStream();

    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, [selectedDeviceId, selectedResolution]);



  // ---- 人臉辨識以及畫布渲染 ---- //
  useEffect(() => {
    const videoCanvas = videoCanvasRef.current;
    const firstzoomCanvas = firstzoomCanvasRef.current;
    const secondZoomCanvas = secondZoomCanvasRef.current;
    const thirdZoomCanvas = thirdZoomCanvasRef.current;
    const fourthZoomCanvas = fourthZoomCanvasRef.current;
    const fifthZoomCanvas = fifthZoomCanvasRef.current;
    const sixthZoomCanvas = sixthZoomCanvasRef.current;

    // ---- 初始化 video 元素 ---- //
    const video = document.createElement('video');
    videoRef.current = video;

    setSelectedResolution({width: selectedResolution.width, height: selectedResolution.height });
    // 1. 獲取鏡頭影像流
    navigator.mediaDevices
    .getUserMedia({          
      video: {
        deviceId: { exact: selectedDeviceId },
        width: selectedResolution.width,
        height: selectedResolution.height,
      }, })

    .then((stream) => {
      video.srcObject = stream;
      video.play();
      console.log('訪問相機成功');
    })
    .catch((error) => {
      console.error('無法訪問相機:', error);
    });
    
    let zoomWidth = 100;
    let zoomHeight = 112.50; 

    let preZoomPositions = [];

    // 3. 人臉檢測  
    const detectFace = async (model, video, videoCanvas) => {
      if (!model) return;
      try {
        const predictions = await model.estimateFaces(video);
        const videoWidth = video.videoWidth + x;
        if (predictions.length > 0) { 
          switch (predictions.length) {
            case 1:
                zoomWidth = videoWidth*0.5; // 鋸齒狀很嚴重
                zoomHeight = zoomWidth*0.56; 
                break;
            case 2:
                zoomWidth = videoWidth*0.4;
                zoomHeight = zoomWidth*1.125; 
                break;
            case 3:
                zoomWidth = videoWidth*0.3; // 鋸齒狀很嚴重
                zoomHeight = zoomWidth *1.69; 
                break;
            case 4:
                zoomWidth =videoWidth*0.2;
                zoomHeight = zoomWidth* 2.25;
                break;
            case 5:
                zoomWidth = videoWidth*0.15;
                zoomHeight = zoomWidth*0.84;
                break;
            case 6:
                zoomWidth = videoWidth*0.15;
                zoomHeight = zoomWidth*0.84;
                break;
            default:
                return;
        }
          const scaleX = videoCanvas.width / video.videoWidth;
          const scaleY = videoCanvas.height / video.videoHeight;
          
          preZoomPositions = predictions.slice(0, 6).map((face, index) => {
            const { xMin, yMin,xMax,yMax} = face.box;
            const adjustedTopLeft = [xMin* scaleX, yMin* scaleY];
            const adjustedBottomRight = [xMax * scaleX, yMax * scaleY];
    
            const faceCenterX = (adjustedTopLeft[0] + adjustedBottomRight[0]) / 2;
            const faceCenterY = (adjustedTopLeft[1] + adjustedBottomRight[1]) / 2;
    
            let newZoomX = Math.max(0, faceCenterX - zoomWidth / 2);
            let newZoomY = Math.max(0, faceCenterY - zoomHeight / 2 );
    
            newZoomX = Math.min(newZoomX, videoCanvas.width - zoomWidth);
            newZoomY = Math.min(newZoomY, videoCanvas.height - zoomHeight);
    
            const preZoom = preZoomPositions[index] || { x: 0, y: 0 };
            const deltaX = Math.abs(newZoomX - preZoom.x);
            const deltaY = Math.abs(newZoomY - preZoom.y);
    
            const threshold = 40; // 減小閾值
            const zoomX = deltaX > threshold ? newZoomX : preZoom.x;
            const zoomY = deltaY > threshold ? newZoomY : preZoom.y;
    
            return { x: zoomX, y: zoomY }; // 這裡應該也要返回人臉的寬度和高度
          });
        } else {
          preZoomPositions = [];
          setP(0)
        }
      } catch (error) {
        console.error('Error during face detection:', error);
      }
    };

    const videoCtx = videoCanvas.getContext('2d');
    const firstzoomCtx = firstzoomCanvas.getContext('2d');
    const secondZoomCtx = secondZoomCanvas.getContext('2d');
    const thirdZoomCtx = thirdZoomCanvas.getContext('2d');
    const fourthZoomCtx = fourthZoomCanvas.getContext('2d');
    const fifthZoomCtx = fifthZoomCanvas.getContext('2d');
    const sixthZoomCtx = sixthZoomCanvas.getContext('2d');

    // 4.主畫面繪製循環
    const drawFrame = (video, videoCanvas, firstzoomCanvas,secondZoomCanvas, thirdZoomCanvas,fourthZoomCanvas,fifthZoomCanvas,sixthZoomCanvas) => {


      firstzoomCanvas.width = videoCanvas.width;
      firstzoomCanvas.height = videoCanvas.height;
      secondZoomCanvas.width = videoCanvas.width;
      secondZoomCanvas.height = videoCanvas.height;
      thirdZoomCanvas.width = videoCanvas.width;
      thirdZoomCanvas.height = videoCanvas.height;
      fourthZoomCanvas.width = videoCanvas.width;
      fourthZoomCanvas.height = videoCanvas.height;
      fifthZoomCanvas.width = videoCanvas.width;
      fifthZoomCanvas.height = videoCanvas.height;
      sixthZoomCanvas.width = videoCanvas.width;
      sixthZoomCanvas.height = videoCanvas.height;

      // videoCtx.clearRect(0, 0, videoCanvas.width, videoCanvas.height);
      // firstzoomCtx.clearRect(0, 0, firstzoomCanvas.width, firstzoomCanvas.height);
      // secondZoomCtx.clearRect(0, 0, secondZoomCanvas.width, secondZoomCanvas.height);
      // thirdZoomCtx.clearRect(0, 0, thirdZoomCanvas.width, thirdZoomCanvas.height);
      // fourthZoomCtx.clearRect(0, 0, fourthZoomCanvas.width, fourthZoomCanvas.height);
      // fifthZoomCtx.clearRect(0, 0, fifthZoomCanvas.width, fifthZoomCanvas.height);
      // sixthZoomCtx.clearRect(0, 0, sixthZoomCanvas.width, sixthZoomCanvas.height);
      
      videoCtx.drawImage(video, 0, 0, videoCanvas.width, videoCanvas.height);
      preZoomPositions.forEach(({ x, y }, index) => {
        const targetCtx = index === 0 ? firstzoomCtx : (index === 1 ? secondZoomCtx : (index === 2 ? thirdZoomCtx : (index === 3 ? fourthZoomCtx : (index === 4 ? fifthZoomCtx : sixthZoomCtx))))
        // console.log("video:",video.videoWidth, video.videoHeight); // 鏡頭解析度
        // console.log("zoom:",zoomWidth, zoomHeight);  // 框框的大小
        // console.log("firstzoom:",firstzoomCanvas.width, firstzoomCanvas.height);  // 目標畫布大小
        // console.log("videoCanvas",videoCanvas.width, videoCanvas.height); // 主畫布大小


        targetCtx.drawImage(
          video,
          x,
          y,
          zoomWidth,
          zoomHeight,
          0,
          0,
          firstzoomCanvas.width,
          firstzoomCanvas.height
        );
        setP(index + 1);
        // ---- 畫框框 ---- //
        // videoCtx.beginPath();
        // videoCtx.lineWidth = "1";
        // videoCtx.strokeStyle = "blue";
        // videoCtx.rect(x, y, zoomWidth, zoomHeight);
        // videoCtx.stroke();
      });

      requestAnimationFrame(() => drawFrame(video, videoCanvas, firstzoomCanvas,secondZoomCanvas, thirdZoomCanvas,fourthZoomCanvas,fifthZoomCanvas,sixthZoomCanvas));
    };
    

    let intervalId;
    const start = async (model, video, videoCanvas, firstzoomCanvas, secondZoomCanvas,thirdZoomCanvas,fourthZoomCanvas,fifthZoomCanvas,sixthZoomCanvas) => {
      if (intervalId) clearInterval(intervalId);
      drawFrame(video, videoCanvas, firstzoomCanvas, secondZoomCanvas,thirdZoomCanvas,fourthZoomCanvas,fifthZoomCanvas,sixthZoomCanvas);
      intervalId = setInterval(() => {
        // videoCtx.clearRect(0, 0, videoCanvas.width, videoCanvas.height);
        // firstzoomCtx.clearRect(0, 0, firstzoomCanvas.width, firstzoomCanvas.height);
        // secondZoomCtx.clearRect(0, 0, secondZoomCanvas.width, secondZoomCanvas.height);
        // thirdZoomCtx.clearRect(0, 0, thirdZoomCanvas.width, thirdZoomCanvas.height);
        // fourthZoomCtx.clearRect(0, 0, fourthZoomCanvas.width, fourthZoomCanvas.height);
        // fifthZoomCtx.clearRect(0, 0, fifthZoomCanvas.width, fifthZoomCanvas.height);
        // sixthZoomCtx.clearRect(0, 0, sixthZoomCanvas.width, sixthZoomCanvas.height);
        detectFace(model, video, videoCanvas);
      }, 2500);  // 4 秒執行一次
    };

    start(model, video, videoCanvas, firstzoomCanvas, secondZoomCanvas,thirdZoomCanvas,fourthZoomCanvas,fifthZoomCanvas,sixthZoomCanvas);

    video.addEventListener('play', drawFrame);

    return () => {
      video.removeEventListener('play', drawFrame);
      if (intervalId) clearInterval(intervalId);
    };
    
  }, [p]);


  // ---- 根據 `p` 值渲染對應數量的 canvas ---- //

  const renderCanvases = () => {
    let canvases = [];
    if(p == 0 ){
      canvases.push(
        <div className={`face-container ${getLayoutClass()}`}>
          <canvas ref={firstzoomCanvasRef}  className='canvas-full'></canvas>
          <canvas ref={secondZoomCanvasRef}  style={{ display: 'none' }}></canvas>
          <canvas ref={thirdZoomCanvasRef}   style={{ display: 'none' }}></canvas>
          <canvas ref={fourthZoomCanvasRef} style={{ display: 'none' }}></canvas>
          <canvas ref={fifthZoomCanvasRef}  style={{ display: 'none' }}></canvas>
          <canvas ref={sixthZoomCanvasRef}  style={{ display: 'none' }}></canvas>
        </div>
    );
    }
    else if(p == 1) {
      canvases.push(
          <div className={`face-container ${getLayoutClass()}`}>
            <canvas ref={firstzoomCanvasRef}  className='canvas-full'></canvas>
            <canvas ref={secondZoomCanvasRef}  style={{ display: 'none' }}></canvas>
            <canvas ref={thirdZoomCanvasRef}   style={{ display: 'none' }}></canvas>
            <canvas ref={fourthZoomCanvasRef} style={{ display: 'none' }}></canvas>
            <canvas ref={fifthZoomCanvasRef}  style={{ display: 'none' }}></canvas>
            <canvas ref={sixthZoomCanvasRef}  style={{ display: 'none' }}></canvas>

          </div>
      );
    }

    else if(p == 2) {
      canvases.push(
        <div className={`face-container ${getLayoutClass()}`}>
          <canvas ref={firstzoomCanvasRef} className='canvas-rec2'></canvas>
          <canvas ref={secondZoomCanvasRef} className='canvas-rec2'></canvas>
          <canvas ref={thirdZoomCanvasRef}   style={{ display: 'none' }}></canvas>
          <canvas ref={fourthZoomCanvasRef} style={{ display: 'none' }}></canvas>
          <canvas ref={fifthZoomCanvasRef}  style={{ display: 'none' }}></canvas>
          <canvas ref={sixthZoomCanvasRef}  style={{ display: 'none' }}></canvas>
        </div>
      );
    }
    else if(p == 3) {
        canvases.push(
          <div className={`face-container ${getLayoutClass()}`}>
          <canvas ref={firstzoomCanvasRef} className='canvas-rec3'></canvas>
          <canvas ref={secondZoomCanvasRef} className='canvas-rec3'></canvas>
          <canvas ref={thirdZoomCanvasRef} className='canvas-rec3'></canvas>
          <canvas ref={fourthZoomCanvasRef}  style={{ display: 'none' }}></canvas>
          <canvas ref={fifthZoomCanvasRef}  style={{ display: 'none' }}></canvas>
          <canvas ref={sixthZoomCanvasRef}  style={{ display: 'none' }}></canvas>
        </div>
        );

    }

    else if(p == 4) {
        canvases.push(
          <div className={`face-container ${getLayoutClass()}`}>
            <canvas ref={firstzoomCanvasRef} className='canvas-rec4'></canvas>
            <canvas ref={secondZoomCanvasRef} className='canvas-rec4'></canvas>
            <canvas ref={thirdZoomCanvasRef} className='canvas-rec4'></canvas>
            <canvas ref={fourthZoomCanvasRef} className='canvas-rec4'></canvas>
            <canvas ref={fifthZoomCanvasRef}  style={{ display: 'none' }}></canvas>
            <canvas ref={sixthZoomCanvasRef}  style={{ display: 'none' }}></canvas>
          </div>
        );
    }
    else if(p == 5) {
      canvases.push(
        <div className={`face-container ${getLayoutClass()}`}>
          <canvas ref={firstzoomCanvasRef} className='smallcanvas'></canvas>
          <canvas ref={secondZoomCanvasRef}  className='smallcanvas'></canvas>
          <canvas ref={thirdZoomCanvasRef}  className='smallcanvas'></canvas>
          <canvas ref={fourthZoomCanvasRef} className='smallcanvas'></canvas>
          <canvas ref={fifthZoomCanvasRef} className='smallcanvas'></canvas>
          <canvas ref={sixthZoomCanvasRef}  style={{ display: 'none' }}></canvas>
        </div>
      );
    }
    else if(p == 6) {
        canvases.push(
          <div className={`face-container ${getLayoutClass()}`}>
            <canvas ref={firstzoomCanvasRef} className='smallcanvas'></canvas>
            <canvas ref={secondZoomCanvasRef}  className='smallcanvas'></canvas>
            <canvas ref={thirdZoomCanvasRef}  className='smallcanvas'></canvas>
            <canvas ref={fourthZoomCanvasRef} className='smallcanvas'></canvas>
            <canvas ref={fifthZoomCanvasRef} className='smallcanvas'></canvas>
            <canvas ref={sixthZoomCanvasRef}  className='smallcanvas'></canvas>
          </div>
        );
    }
    
    return canvases;
  };


  // ---- 根據 `p` 值決定對應的 CSS 類名 ---- //
  const getLayoutClass = () => {
    if (p === 1) {
      return 'fullscreen-layout'; // 全屏
    } else if (p === 2 ) {
      return 'rec-layout2'; // 縱向排列
    } else if (p === 3) {
      return 'rec-layout3';  
    } else if (p === 4) {
      return 'rec-layout4'; 
    }
    else if (p === 5 || p === 6) {
      return 'grid-layout'; // 網格排列
    }
    return ''; // 預設空
  };
  

  return (
    <div className='pano'>
      <div className='pano-select'>
        <select onChange={handleCameraChange} value={selectedDeviceId || ''}>
          {videoInputs.map((device) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label || `Camera ${device.deviceId}`}
            </option>
          ))}
        </select>

        
        <select
          onChange={handleResolutionChange}
          value={`${selectedResolution.width}x${selectedResolution.height}`}
        >
          {deviceRes[selectedDeviceId]?.map((res, index) => (
            <option key={index} value={`${res.width}x${res.height}`}>
              {`${res.width}x${res.height}`}
            </option>
          ))}
        </select>

        {/* <div>
          <label htmlFor="widthSlider">調整人物大小:</label>
          <input
            id="widthSlider"
            type="range"
            min="-400"   
            max="400" 
            value={x}
            onChange={(e) => handleXchange(e)}
          />
          <span>{x}</span>
      </div> */}
      </div>
      <div className="pano-container">
        {renderCanvases()}
      </div>
      {/* <canvas ref={videoCanvasRef} id="videoCanvas" width="1600" height="1200" className='maincanvas'></canvas> */}
      <canvas ref={videoCanvasRef} id="videoCanvas" className='maincanvas' width={selectedResolution.width} height={selectedResolution.height}></canvas>
    </div>
  );
};

export default Pano;
