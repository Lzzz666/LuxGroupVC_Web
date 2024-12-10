
export const clearAllStreams = ({streams,setStreams,setIsVideoVisible,videoRefs}) => {
    Object.keys(streams).forEach((deviceId) => {
        // 停止每個流的 tracks
        if (streams[deviceId]) {
          streams[deviceId].getTracks().forEach((track) => track.stop());
        }
        console.log('清理流:', deviceId);
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


export const checkConstraints = async ({stream, deviceId, resolution,handleSwitchChange}) => {
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


export  const stopStreamAndDetection = ({deviceId,detectIntervals,streams,setStreams,setIsVideoVisible,videoRefs}) => {
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


export  const gotStream = ({videoRefs,stream,setStreams,setIsVideoVisible,deviceId,checked=false}) => {
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