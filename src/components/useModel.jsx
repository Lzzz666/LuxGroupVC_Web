import { useEffect,useState } from 'react';
import * as blazeface from '@tensorflow-models/blazeface';
import '@tensorflow/tfjs-backend-webgl';

export const useModel = ({stopStreamAndDetection,detectIntervals,streams,setStreams,setIsVideoVisible,videoRefs}) => {
    const [model, setModel] = useState(null);

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
                stopStreamAndDetection({deviceId,detectIntervals,streams,setStreams,setIsVideoVisible,videoRefs});
            });
        };
    }, []);
    return model;
}

