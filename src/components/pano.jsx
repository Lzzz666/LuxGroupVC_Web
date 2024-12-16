import React, { useRef, useEffect, useState } from 'react';
import './pano.css';
import * as tf from '@tensorflow/tfjs';
import * as blazeface from '@tensorflow-models/blazeface';
const VideoCanvas = ({devices}) => {
  const videoCanvasRef = useRef(null);
  const zoomCanvasRef = useRef(null);
  const secondZoomCanvasRef = useRef(null);

  const videoRef = useRef(null);
  
  const [videoInputs, setVideoInputs] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [selectedResolution, setSelectedResolution] = useState({ width: 640, height: 360 });

  useEffect(() => {
    const initCameras = async () => {
      const cameras = devices;
      setVideoInputs(cameras);
      if (cameras.length > 0) {
        setSelectedDeviceId(cameras[0].deviceId); // 預設選擇第一個鏡頭
      }
    };
    initCameras();
  }, []);


  useEffect(() => {
    if (!selectedDeviceId) return;

    const startStream = async () => {
      const video = videoRef.current;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: { exact: selectedDeviceId },
            width: selectedResolution.width,
            height: selectedResolution.height,
          },
        });

        const track = stream.getVideoTracks()[0];
        const constraints = track.getCapabilities();
        console.log('constraina:', constraints);
        console.log('此鏡頭最大解析度:', constraints.height.max,'P');
        if(constraints.width.max < selectedResolution.width || constraints.height.max < selectedResolution.height){
          console.log('不支援的解析度');
          alert('不支援的解析度');
          return false;
      }

        if (video.srcObject) {
          video.srcObject.getTracks().forEach((track) => track.stop());
        }

        video.srcObject = stream;
        video.play();
        console.log('Switched to new camera:', selectedDeviceId);
      } catch (error) {
        console.error('无法访问所选摄像头:', error);
      }
    };

    startStream();

    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, [selectedDeviceId, selectedResolution]);

  const handleCameraChange = (e) => {
    setSelectedDeviceId(e.target.value);
  };
  
  const handleResolutionChange = (e) => {
    const [width, height] = e.target.value.split('x').map(Number);
    setSelectedResolution({ width, height });
  };

  useEffect(() => {
    const videoCanvas = videoCanvasRef.current;
    const zoomCanvas = zoomCanvasRef.current;
    const secondZoomCanvas = secondZoomCanvasRef.current;
    
    // 創建視頻元素
    const video = document.createElement('video');
    video.autoplay = true;
    videoRef.current = video;

    let model;
    // 載入TensorFlow.js並初始化後端
    const loadModel = async () => {
      await tf.ready(); // 等待TensorFlow.js初始化完成
      model = await blazeface.load();
      console.log('Blazeface model loaded');
      // 在模型加載完成後，啟動視頻播放和繪製
      video.play().then(() => {
        start(model, video, videoCanvas, zoomCanvas, secondZoomCanvas);
      }).catch((error) => {
        console.error('視頻播放錯誤:', error);
      });
    };
    loadModel();

    // 獲取鏡頭影像流
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        video.srcObject = stream;
        video.play();
      })
      .catch((error) => {
        console.error('無法訪問相機:', error);
      });

    // const getRandomInt = (min, max) => {
    //   return Math.floor(Math.random() * (max - min + 1)) + min;
    // };

    // 更新畫面
    let last_zoomX = 0;
    let last_zoomY = 0;
    let pre_zoomX = 0;
    let pre_zoomY = 0;
    let zoomWidth = 320; // 放大區域的寬度
    let zoomHeight = 180; // 放大區域的高度


    let preZoomPositions = []; // 儲存臉部框的位置信息

    const detectFace = async (model, video, videoCanvas) => {
      if (!model) return;
    
      try {
        const predictions = await model.estimateFaces(video, false);
    
        if (predictions.length > 0) {
          const scaleX = videoCanvas.width / video.videoWidth;
          const scaleY = videoCanvas.height / video.videoHeight;
    
          preZoomPositions = predictions.slice(0, 2).map((face, index) => {
            const adjustedTopLeft = [face.topLeft[0] * scaleX, face.topLeft[1] * scaleY];
            const adjustedBottomRight = [face.bottomRight[0] * scaleX, face.bottomRight[1] * scaleY];
    
            const faceCenterX = (adjustedTopLeft[0] + adjustedBottomRight[0]) / 2;
            const faceCenterY = (adjustedTopLeft[1] + adjustedBottomRight[1]) / 2;
    
            let newZoomX = Math.max(0, faceCenterX - zoomWidth / 2);
            let newZoomY = Math.max(0, faceCenterY - zoomHeight / 2 - 20);
    
            newZoomX = Math.min(newZoomX, videoCanvas.width - zoomWidth);
            newZoomY = Math.min(newZoomY, videoCanvas.height - zoomHeight);
    
            const preZoom = preZoomPositions[index] || { x: 0, y: 0 };
            const deltaX = Math.abs(newZoomX - preZoom.x);
            const deltaY = Math.abs(newZoomY - preZoom.y);
    
            const threshold = 30; // 減小閾值
            const zoomX = deltaX > threshold ? newZoomX : preZoom.x;
            const zoomY = deltaY > threshold ? newZoomY : preZoom.y;
    
            return { x: zoomX, y: zoomY };
          });
        } else {
          preZoomPositions = [];
        }
      } catch (error) {
        console.error('Error during face detection:', error);
      }
    };
    

    
    
    // 主畫面繪製循環
    const drawFrame = (video, videoCanvas, zoomCanvas,secondZoomCanvas) => {
      const videoCtx = videoCanvas.getContext('2d');
      const zoomCtx = zoomCanvas.getContext('2d');
      const secondZoomCtx = secondZoomCanvas.getContext('2d');
    
      // 清空畫布
      videoCtx.clearRect(0, 0, videoCanvas.width, videoCanvas.height);
      zoomCtx.clearRect(0, 0, zoomCanvas.width, zoomCanvas.height);
      secondZoomCtx.clearRect(0, 0, secondZoomCanvas.width, secondZoomCanvas.height);
    
      // 繪製主畫布
      videoCtx.drawImage(video, 0, 0, videoCanvas.width, videoCanvas.height);
    
      // 繪製每個臉部的框
      preZoomPositions.forEach(({ x, y }, index) => {
        const targetCtx = index === 0 ? zoomCtx : secondZoomCtx; // 根據索引選擇對應畫布
    
        // 繪製放大框
        targetCtx.drawImage(
          videoCanvas,
          x,
          y,
          zoomWidth,
          zoomHeight,
          0,
          0,
          zoomCanvas.width,
          zoomCanvas.height
        );
    
        // 在主畫布上繪製框
        // videoCtx.strokeStyle = index === 0 ? 'green' : 'blue'; // 使用不同顏色區分框
        // videoCtx.lineWidth = 2;
        // videoCtx.strokeRect(x, y, zoomWidth, zoomHeight);
      });
    
      // 繼續下一幀
      requestAnimationFrame(() => drawFrame(video, videoCanvas, zoomCanvas,secondZoomCanvas));
    };
    

      // 啟動
      let intervalId;
      const start = async (model, video, videoCanvas, zoomCanvas, secondZoomCanvas) => {
        // 每三秒執行一次臉部偵測
        if (intervalId) clearInterval(intervalId);
        intervalId = setInterval(() => {
          console.log(pre_zoomX, pre_zoomY, last_zoomX, last_zoomY);
          detectFace(model, video, videoCanvas);
          last_zoomX = pre_zoomX;
          last_zoomY = pre_zoomY;
        }, 3000);
        
        // 啟動畫布繪製循環
        drawFrame(video, videoCanvas, zoomCanvas, secondZoomCanvas);
      };


    video.addEventListener('play', drawFrame);

    // 清理資源
    return () => {
      video.removeEventListener('play', drawFrame);
      if (intervalId) clearInterval(intervalId);
    };
    
  }, []);

  return (
    <div className="pano-container">
      <select onChange={handleCameraChange} value={selectedDeviceId || ''}>
        {videoInputs.map((device) => (
          <option key={device.deviceId} value={device.deviceId}>
            {device.label || `Camera ${device.deviceId}`}
          </option>
        ))}
      </select>

      <select onChange={handleResolutionChange} value={`${selectedResolution.width}x${selectedResolution.height}`}>
      <option value="320x180">320x180</option>
        <option value="640x360">640x360</option>
        <option value="1280x720">1280x720</option>
        <option value="1920x1080">1920x1080</option>
      </select>
      <div className="face-container">
        <canvas ref={zoomCanvasRef} id="zoomCanvas" width="320" height="180" className='smallcanvas'></canvas>
        <canvas ref={secondZoomCanvasRef} id="secondZoomCanvas" width="320" height="180" className='smallcanvas'></canvas>
      </div>

      <canvas ref={videoCanvasRef} id="videoCanvas" width="640" height="360" className='maincanvas'></canvas>
    </div>
  );
};

export default VideoCanvas;
