// sidebar.js
import React from 'react';
import Switch from '@mui/material/Switch';

const Sidebar = ({ devices, videoRefs, streams ,setStreams, setIsVideoVisible, isVideoVisible }) => {
    const label = { inputProps: { 'aria-label': 'Switch demo' } };

    const handleSwitchChange = (deviceId, checked) => {
        if (checked) {
            navigator.mediaDevices.getUserMedia({ video: { deviceId: deviceId } })
            .then(stream => {
                const videoRef = videoRefs.current.find(ref => ref.deviceId === deviceId);
                if (videoRef && videoRef.ref.current) {
                    videoRef.ref.current.srcObject = stream; // 設置視頻流
                    setStreams(prevStreams => ({
                        ...prevStreams,
                        [deviceId]: stream,
                    }));
                    setIsVideoVisible(prev => ({ ...prev, [deviceId]: true })); // 顯示視頻
                }
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
                </div>
            ))}
        </div>
    );
};

export default Sidebar;
