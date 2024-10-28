// sidebar.js
import { useState } from 'react';
import Switch from '@mui/material/Switch';
import ScreenShot from './Screenshot';
import './sidebar.css';
const Sidebar = ({ devices, videoRefs, streams ,setStreams, setIsVideoVisible, isVideoVisible }) => {

    const [curRes, setCurRes] = useState({});
    const p180Constraints = JSON.stringify( {width: {exact: 320}, height: {exact: 180}});
    const p360Constraints =  JSON.stringify({width: {exact: 640}, height: {exact: 360}});
    const hdConstraints =  JSON.stringify({width: {exact: 1280}, height: {exact: 720}});
    const fullHdConstraints =  JSON.stringify({width: {exact: 1920}, height: {exact: 1080}});

    const label = { inputProps: { 'aria-label': 'Switch demo' } };

    const checkConstraints = (stream, deviceId, resolution) => {
        const track = stream.getVideoTracks()[0];
        const constraints = track.getCapabilities();
        console.log('constraints:', constraints);
        if(constraints.deviceId != deviceId ||constraints.width.max < resolution.width || constraints.height.max < resolution.height){
            console.log('不支援的解析度:', resolution);
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

    const handleChangeResolution = (deviceId, resolution) => {

        console.log('resolution:', resolution); // 新資料
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
  
        if (streams[deviceId]) {
            console.log('停止攝像頭:', deviceId);
            streams[deviceId].getTracks().forEach(track => track.stop());
        }
    
        const msg = navigator.mediaDevices.getUserMedia(constraints)
            .then(stream => {
                if (!checkConstraints(stream, deviceId, constraints)) return;
                gotStream(stream,deviceId);})
            .catch(err => {
                console.error('無法更改攝像頭解析度:', err.message, err.name, err);
            });
        console.log('msg', msg);
        
    };


    const handleSwitchChange = (deviceId, checked) => {
        console.log('deviceId:', deviceId, 'checked:', checked);
        if (checked) {
            const resolution = curRes[deviceId] || { width: 320, height: 180 };

            navigator.mediaDevices.getUserMedia({ video: { deviceId: deviceId, width: resolution.width, height: resolution.height } })
            .then(stream => {
                if (!checkConstraints(stream, deviceId, resolution)) return;
                gotStream(stream,deviceId,checked);
            }).catch(err => {
                console.error('無法存取攝像頭:', err);
            });
        } else {
            if (streams[deviceId]) {
                streams[deviceId].getTracks().forEach(track => track.stop()); // 停止流
                setStreams(prevStreams => {
                    const newStreams = { ...prevStreams };
                    delete newStreams[deviceId]; // 移除流
                    return newStreams;
                });
                setIsVideoVisible(prev => ({ ...prev, [deviceId]: false })); // 隱藏視頻
                const videoRef = videoRefs.current.find(ref => ref.deviceId === deviceId);
                if (videoRef && videoRef.ref.current) {
                    videoRef.ref.current.srcObject = null; // 清除視頻元素的 srcObject
                }
            }
        }
    };

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
                    </select>
                </div>
            ))}
            <ScreenShot />
        </div>
    );
};

export default Sidebar;
