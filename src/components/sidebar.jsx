// sidebar.js
import { useState,useEffect, useRef } from 'react';
import Switch from '@mui/material/Switch';
import ScreenShot from './Screenshot';
import './Sidebar.css';

import * as blazeface from '@tensorflow-models/blazeface';
import '@tensorflow/tfjs-backend-webgl';
import { detectFaces, sendFaceCoordinates } from './Canvas';


const Sidebar = ({ devices, videoRefs, streams ,setStreams, setIsVideoVisible, isVideoVisible,canvasRefs,panoflag,setPanoflag}) => {

    const [curRes, setCurRes] = useState({});
    const [model, setModel] = useState(null);
    const [panobutton, setPanobutton] = useState(false);
    const label = { inputProps: { 'aria-label': 'Switch demo' } };
    const detectIntervals = useRef({});
    
    const p180Constraints = JSON.stringify( {width: {exact: 320}, height: {exact: 180}});
    const p360Constraints =  JSON.stringify({width: {exact: 640}, height: {exact: 360}});
    const hdConstraints =  JSON.stringify({width: {exact: 1280}, height: {exact: 720}});
    const fullHdConstraints =  JSON.stringify({width: {exact: 1920}, height: {exact: 1080}});
    const k2 =  JSON.stringify({width: {exact: 2560}, height: {exact: 1440}});
    const k4 =  JSON.stringify({width: {exact: 3840}, height: {exact: 2160}});


    const clearAllStreams = () => {
        Object.keys(streams).forEach((deviceId) => {
            // 停止每個流的 tracks
            if (streams[deviceId]) {
              streams[deviceId].getTracks().forEach((track) => track.stop());
            }
        
            // 刪除已停止的流
            setStreams((prevStreams) => {
              const newStreams = { ...prevStreams };
              delete newStreams[deviceId];
              return newStreams;
            });
        
            // 更新視訊顯示狀態
            setIsVideoVisible((prev) => ({
              ...prev,
              [deviceId]: false, // 隱藏所有視頻
            }));
        
            // 清空 video 元素的 srcObject
            const videoRef = videoRefs.current.find((ref) => ref.deviceId === deviceId);
            if (videoRef?.ref.current) {
              videoRef.ref.current.srcObject = null;
            }
          });
    }

    const handlepano = () => {
        // 切換按鈕狀態
        setPanobutton(!panobutton);
        setPanoflag(!panoflag);
        clearAllStreams();
        
      };

    const checkConstraints = (stream, deviceId, resolution) => {
        const track = stream.getVideoTracks()[0];
        const constraints = track.getCapabilities();
        console.log('resolution:', resolution);
        console.log('constraina:', constraints);
        console.log('此鏡頭最大解析度:', constraints.height.max,'P');
        if(constraints.deviceId != deviceId ||constraints.width.max < resolution.video.width || constraints.height.max < resolution.video.height){
            console.log('不支援的解析度:', resolution);
            alert('不支援的解析度:'+ resolution.video.width + 'x' + resolution.video.height);
            handleSwitchChange(deviceId, false);
            return false;
        }
        return true;
    }
    
    const gotStream = (stream,deviceId,checked=false) => {
        const videoRef = videoRefs.current.find(ref => ref.deviceId === deviceId);
        if (videoRef && videoRef.ref.current) {
            videoRef.ref.current.srcObject = stream; // 更新視頻流
            setStreams(prevStreams => ({
                ...prevStreams,
                [deviceId]: stream,
            }));
        }
        if(checked){
            setIsVideoVisible(prev => ({ ...prev, [deviceId]: true })); // 顯示視頻
        }
    };

    const handleChangeResolution = async (deviceId, resolution,checked) => {
        // console.log(deviceId);
        // console.log(checked); // 設備 ID
        // console.log('resolution:', resolution); // 新資料
        
        setCurRes(prevResolutions => ({
            ...prevResolutions,
            [deviceId]: resolution,
        }));

        const constraints = {
            video: {
                deviceId: deviceId ,
                width: resolution.width,
                height: resolution.height
            }
        };
  
        console.log('更改攝像頭解析度:', deviceId, constraints);
        if (streams[deviceId]) {
            console.log('停止攝像頭:', deviceId);
            streams[deviceId].getTracks().forEach(track => track.stop());
        }
    
        try {
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            if (!checkConstraints(stream, deviceId, constraints)) return;
            gotStream(stream, deviceId, checked);
        } catch (err) {
            console.error('無法更改攝像頭解析度:', err.message);
            alert('不支援的解析度');
            handleSwitchChange(deviceId, false);
        }

    };


    const handleSwitchChange = (deviceId, checked) => {
        console.log('deviceId:', deviceId, 'checked:', checked);

        if(panobutton && checked){
            let flag = false;
            for (let i = 0; i < devices.length; i++) {
                if(isVideoVisible[devices[i].deviceId]){
                    flag = true;
                    break;
                }
            }
            if(flag){
                alert('全景模式只能開啟一個鏡頭');
                return;
            }
        }
        if(panobutton && !checked){
            let flag = false;
            for (let i = 0; i < devices.length; i++) {
                if(isVideoVisible[devices[i].deviceId]){
                    flag = true;
                    break;
                }
            }
            if(!flag){
                setPanobutton(false);
            }
        }

        if (checked) {
            const resolution = curRes[deviceId] || { width: 320, height: 180 };
            handleChangeResolution(deviceId, resolution,checked);
        } else {
            stopStreamAndDetection(deviceId);
        }
    };


    const stopStreamAndDetection = (deviceId) => {
        if (detectIntervals.current[deviceId]) {
            clearInterval(detectIntervals.current[deviceId]);
            delete detectIntervals.current[deviceId];
        }
        if (streams[deviceId]) {
            streams[deviceId].getTracks().forEach(track => track.stop());
            setStreams(prevStreams => {
                const newStreams = { ...prevStreams };
                delete newStreams[deviceId];
                return newStreams;
            });
        }
        setIsVideoVisible(prev => ({ ...prev, [deviceId]: false }));
        const videoRef = videoRefs.current.find(ref => ref.deviceId === deviceId);
        if (videoRef?.ref.current) {
            videoRef.ref.current.srcObject = null;
        }
    };

    // 載入模型的 Effect
    useEffect(() => {
        const loadModel = async () => {
            try {
                const loadedModel = await blazeface.load();
                setModel(loadedModel);
            } catch (error) {
                console.error('載入模型失敗:', error);
            }
        };
        loadModel();

        // 組件卸載時清理所有流和檢測
        return () => {
            Object.keys(streams).forEach(deviceId => {
                stopStreamAndDetection(deviceId);
            });
        };
    }, []);

    // 處理面部檢測的 Effect
    useEffect(() => {
        // 清理之前的所有 intervals
        Object.keys(detectIntervals.current).forEach(deviceId => {
            clearInterval(detectIntervals.current[deviceId]);
            delete detectIntervals.current[deviceId];
        });

        // 為每個活躍的視頻流設置新的檢測
        videoRefs.current.forEach(({ ref, deviceId }) => {
            if (model && ref.current && streams[deviceId]) {
                console.log('開始偵測臉部:', deviceId);
                
                const canvasRef = canvasRefs.current.find(c => c.deviceId === deviceId)?.ref;
                if (!canvasRef) return;

                detectIntervals.current[deviceId] = setInterval(() => {
                    detectFaces(model, ref.current, canvasRef, deviceId);
                }, 100);
            }
        });

        // 清理函數
        return () => {
            Object.keys(detectIntervals.current).forEach(deviceId => {
                clearInterval(detectIntervals.current[deviceId]);
            });
        };
    }, [model, streams]);


    
    return (
        <div className='sidebar'>
            <h2>LUXGroup</h2>
            {devices.map((device, index) => (
                <div key={device.deviceId}>
                    {device.label || `鏡頭 ${index + 1}`} 
                    <Switch
                        {...label}
                        checked={isVideoVisible[device.deviceId] || false}
                        onChange={(e) => handleSwitchChange(device.deviceId, e.target.checked)}
                    />
                    <select onChange={(event) => handleChangeResolution(device.deviceId, JSON.parse(event.target.value))}>
                        <option value={p180Constraints}>180p</option>
                        <option value={p360Constraints}>360p</option>
                        <option value={hdConstraints}>720p</option>
                        <option value={fullHdConstraints}>1080p</option>
                        <option value={k2}>2k</option>
                        <option value={k4}>4k</option>
                    </select>
                </div>
            ))}
            {/* <CameraCapture videoRefs={videoRefs}/> */}
            <div className="checkbox-wrapper">
                <label>
                    <input type="checkbox" onClick={handlepano}/>
                    <span>全景模式</span>
                </label>
            </div>
            <ScreenShot />
        </div>
    );
};

export default Sidebar;
