import { useEffect,useState } from 'react';

export const useModel = ({stopStreamAndDetection,detectIntervals,streams,setStreams,setIsVideoVisible,videoRefs}) => {
    const [model, setModel] = useState(null);

    // 載入模型的 Effect
    
    useEffect(() => {
        const loadModel = async () => {
            const { SupportedModels, createDetector } = await import('@tensorflow-models/face-detection');
            await import('@tensorflow/tfjs-core');
            await import('@tensorflow/tfjs-backend-webgl');
            await import('@mediapipe/face_detection');

            const fd = SupportedModels.MediaPipeFaceDetector;
            const detectorConfig = {
                runtime: 'mediapipe',
                modelType: 'full',
                solutionPath: `/mediapipe/`,                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
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

