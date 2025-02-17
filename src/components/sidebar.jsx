// sidebar.js
import { useState,useEffect, useRef } from 'react';
import Switch from '@mui/material/Switch';
import ScreenShot from './Screenshot';
import './Sidebar.css';
import React from 'react';  // 加入這一行
import { detectFaces, sendFaceCoordinates } from './Canvas';
import { clearAllStreams, stopStreamAndDetection, gotStream } from './sidebarUseCase';
import { useModel } from './useModel';

const Sidebar = ({ devices, videoRefs, streams ,setStreams, setIsVideoVisible, isVideoVisible,canvasRefs,panoflag,setPanoflag,isDetect,setIsDetect,model,setModel,deviceRes,setDeviceRes}) => {

    const [curRes, setCurRes] = useState({});

    // const [deviceRes, setDeviceRes] = useState({});

    const [panobutton, setPanobutton] = useState(false);
    const [aibutton, setAibutton] = useState(false);
    const label = { inputProps: { 'aria-label': 'Switch demo' } };
    const detectIntervals = useRef({});

    const [loading, setLoading] = useState(false); // 加入 loading 狀態
    //問題：setModel(model_tmp) 在每次重新渲染時都會執行，可能導致不必要的重新設置操作。
    const model_tmp = useModel({stopStreamAndDetection,detectIntervals,streams,setStreams,setIsVideoVisible,videoRefs});
    setModel(model_tmp);
    
    const handlepano = () => {
        setPanobutton(!panobutton);
        setPanoflag(!panoflag); 
        clearAllStreams({streams,setStreams,setIsVideoVisible,videoRefs});
    };
    
    const handleAI = () => {
        setIsDetect(!isDetect);
        setAibutton(!aibutton);
        console.log(isDetect);
    }
    const handleDeviceLabel = (device) => {
        let cleanedText = device.replace(/\s*\(.*?\)/, "");
        return cleanedText;
    }
    // ---- 處理開關按鈕的函數 ---- //
    const handleSwitchChange = (deviceId, checked) => {
        console.log('handleSwitchChange deviceId:',deviceId);

        if(panobutton){
            alert('全景模式請利用選單調整');
            return;
        }

        if (!checked){
            console.log("stop")
            stopStreamAndDetection({deviceId,detectIntervals,streams,setStreams,setIsVideoVisible,videoRefs});
            return;
        }
        const resolution = curRes[deviceId] || { width: 1920, height: 1080 };
        console.log("resolution:",resolution);
        handleChangeResolution(deviceId, resolution,checked);
    };

    // ---- 處理解析度變更的函數 ---- //
    const handleChangeResolution = async (deviceId, resolution, checked) => {
        console.log("handle change resolution")
        if (panobutton) {
            alert('全景模式請利用選單調整');
            return;
        }
        if(!checked){
            return;
        }
        setCurRes(prevResolutions => ({
            ...prevResolutions,
            [deviceId]: resolution,
        }));
        
        const constraints = {
            video: {
                deviceId: deviceId,
                width: resolution.width,
                height: resolution.height
            }
        };

        try {
            if (streams[deviceId]) {
                streams[deviceId].getTracks().forEach(track => track.stop());
            }
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            gotStream({videoRefs,stream,setStreams,setIsVideoVisible,deviceId,checked});

        } catch (err) {
            console.error('無法更改攝像頭解析度:', err.message);
            alert('不支援的解析度');
            setCurRes(prevResolutions => ({
                ...prevResolutions,
                [deviceId]: { width: 320, height: 180 },
            }));
            handleSwitchChange(deviceId, false);
        }

    };

    const clearDetectIntervals = () => {
        Object.keys(detectIntervals.current).forEach(deviceId => {
            clearInterval(detectIntervals.current[deviceId]);
            delete detectIntervals.current[deviceId];
        });
    };
    
    // 處理解析度測試的 Effect
    useEffect(() => {
        const resolutionsToTest = [
            // 16:9 比例
            // { width: 320, height: 180 },
            // { width: 640, height: 360 },
            { width: 1920, height: 1080 },
            { width: 1280, height: 720 },

            // { width: 2560, height: 1440 },
            // { width: 3840, height: 2160 },
            // 4:3 比例
            // { width: 320, height: 240 },
            // { width: 640, height: 480 },
        ];
        
        async function getSupportedResolutionsForDevice(deviceId) {
            const supported = [];
            for (const res of resolutionsToTest) {
            try {
                // console.log(`Testing resolution: ${res.width}x${res.height}`); // 測試解析度
                // const stream = await navigator.mediaDevices.getUserMedia({
                // video: {
                //     deviceId: { exact: deviceId },  // 指定設備ID
                //     width: { exact: res.width} ,    // 強制指定寬度
                //     height:  { exact: res.height}  // 強制指定高度
                // }
                // });
                // const videoTrack = stream.getVideoTracks()[0];

                // // 使用 getSettings() 方法獲取當前解析度
                // const settings = videoTrack.getSettings();
            
                // // 輸出當前解析度
                // console.log(`Current resolution: ${settings.width}x${settings.height}`);
                supported.push(res);
                // stream.getTracks().forEach(track => track.stop()); // 停止攝像頭
            } catch {
                console.log(`Resolution ${res.width}x${res.height} not supported, skipping`);
                // 不支持該解析度，忽略
            }
            }
            return supported;
        }

        async function testAllDevices(devices) {
            setLoading(true);
            for (const device of devices) {
            console.log(`Testing device: ${device.label || 'Unnamed Device'} (ID: ${device.deviceId})`);
            const supportedResolutions = await getSupportedResolutionsForDevice(device.deviceId);

            setDeviceRes((prev) => ({
                ...prev,
                [device.deviceId]: supportedResolutions,
            }));
            console.log(`Supported resolutions for ${device.label || 'Unnamed Device'}:`, supportedResolutions);
            }
            setLoading(false);
        }
        if (devices.length > 0) {
            testAllDevices(devices);
          }
    },[devices])

    // 處理面部檢測的 Effect
    useEffect(() => {
        // 清理之前的所有 intervals
        if(isDetect){
            clearDetectIntervals();
            videoRefs.current.forEach(({ ref, deviceId }) => {
                if (model && ref.current && streams[deviceId]) {
                    const canvasRef = canvasRefs.current.find(c => c.deviceId === deviceId)?.ref;
                    if (!canvasRef) return;
                    detectIntervals.current[deviceId] = setInterval(() => {
                        detectFaces(model, ref.current, canvasRef, deviceId);
                    }, 50);
                }
            });
            return  clearDetectIntervals;
        }
    }, [model, streams,aibutton]);

    useEffect(() => {
        console.log('解析度已變更:', curRes);
    }, [curRes]);
    
    return (
        <>
        {loading ?  <><div className='loading'>正在測試鏡頭解析度...</div> <div className=' loading-spinner'></div></> :<div className='sidebar'>
            <h2>LUXMeet</h2>
            <div className='function-bar'>
                <img src='https://icons.veryicon.com/png/o/miscellaneous/very-thin-linear-icon/camera-310.png' className='camera-icon'/>
                <p className='tag'>Streams</p>
            </div>
            {devices.map((device, index) => (
                <div key={device.deviceId} className='list-bar'>
                    {/* {handleDeviceLabel(device.label) || `鏡頭 ${index + 1}`}  */}
                    <div className='buttom-bar'>
                        {/* <Switch
                            {...label}
                            checked={isVideoVisible[device.deviceId] || false} 
                            onChange={(e) => handleSwitchChange(device.deviceId, e.target.checked)}
                        /> */}
                         <div className="checkbox-wrapper-video">
                            <label>
                                <input type="checkbox" onChange={(e) => handleSwitchChange(device.deviceId, e.target.checked)}/>
                                <span> {handleDeviceLabel(device.label) || `鏡頭 ${index + 1}`} </span>
                            </label>
                        </div>
                        <select
                            value={JSON.stringify(curRes[device.deviceId] || { width: 1920, height: 1080 })}
                            onChange={(event) =>
                                handleChangeResolution(device.deviceId, JSON.parse(event.target.value), isVideoVisible[device.deviceId])
                            }
                            disabled={!isVideoVisible[device.deviceId]}
                            className='resolution-select'
                        >
                                {deviceRes[device.deviceId]?.map((resolution, index) => (
                                <option key={index} value={JSON.stringify(resolution)}>
                                {`${resolution.width}x${resolution.height}`}
                                </option>
                            ))}
                        </select>
                    </div>
                    {/* todo: 我想要加一條橫線 */}
                    <hr />
                </div>
            ))}
            <div className='function-box'>
                <div className='function-bar'>
                    <img src="https://static-00.iconduck.com/assets.00/tools-icon-2046x2048-62tkwxkm.png" alt="pano" className="icon"/>
                    <p className='tag'>Function</p>
                </div>

                <div className="checkbox-wrapper">
                    <label>
                        <input type="checkbox"  onClick={handlepano}/>
                        <span>  Panoramic</span>
                    </label>
                </div>
                <div className="checkbox-wrapper">
                    <label>
                        <input type="checkbox" onClick={handleAI}/>
                        <span>  Face-detection</span>
                    </label>
                </div>
                <a href="https://github.com/Lzzz666/LuxGroupVC_Web" target="_blank">
                    <img src='https://cdn-icons-png.flaticon.com/512/25/25231.png' className='small-icon'/>
                </a>
                <a href="https://www.polyvisions-tech.com/" target="_blank">
                    <img src='https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Icon-round-Question_mark.svg/2048px-Icon-round-Question_mark.svg.png' className='small-icon'/>
                </a>
            </div>

            {/*<ScreenShot />*/}
        </div>}

        </>
    );
};

export default Sidebar;
