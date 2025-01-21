import { useEffect,useState } from 'react';
import '@mediapipe/face_detection';
import '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import { SupportedModels, createDetector } from '@tensorflow-models/face-detection';


export const useModel = ({stopStreamAndDetection,detectIntervals,streams,setStreams,setIsVideoVisible,videoRefs}) => {
    const [model, setModel] = useState(null);

    // 載入模型的 Effect
    
    useEffect(() => {
        const loadModel = async () => {
            const fd = SupportedModels.MediaPipeFaceDetector;
            const detectorConfig = {
                runtime: 'mediapipe',
                modelType: 'full',
                solutionPath: `/LuxGroupVC_Web/mediapipe/`,                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
            };
            try{
                const detector = await createDetector(fd, detectorConfig);
                console.log('載入模型成功');
                setModel(detector);
            } catch (error) {
                console.error('載入模型失敗:', error);
            }
        };
        loadModel();

        return () => {
            Object.keys(streams).forEach(deviceId => {
                stopStreamAndDetection({deviceId,detectIntervals,streams,setStreams,setIsVideoVisible,videoRefs});
            });
        };
    }, []);
    return model;
}

