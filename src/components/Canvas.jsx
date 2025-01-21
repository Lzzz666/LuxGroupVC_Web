import React from 'react';
import './Canvas.css';
// 用於進行面部檢測的函數
export const detectFaces = async (model, videoRef, canvasRef,deviceId) => {
    
    const predictions = await model.estimateFaces(videoRef);

    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    const videoWidth = videoRef.videoWidth;
    const videoHeight = videoRef.videoHeight;



    const scaleX = canvasRef.current.width / videoWidth;
    const scaleY = canvasRef.current.height / videoHeight;

    const faceCoordinates = []; 

    if (predictions.length > 0) {


        predictions.forEach(face => {

            const { xMin, yMin, width, height } = face.box;
            const scaledStart = [xMin * scaleX, yMin * scaleY];
            const scaledSize = [width* scaleX, height * scaleY ];
            
            ctx.beginPath();
            ctx.lineWidth = "0.5";
            ctx.strokeStyle = "blue";
            ctx.rect(scaledStart[0], scaledStart[1], scaledSize[0], scaledSize[1]);
            ctx.stroke();
            
            //     faceCoordinates.push([{
            //         deviceId: deviceId,
            //         timestamp: new Date().toISOString(),
            //         x: scaledStart[0],
            //         y: scaledStart[1],
            //         width: scaledSize[0],
            //         height: scaledSize[1]
            //     }]);
            // });

        })
    }
    // if (faceCoordinates.length > 0) {
    //     sendFaceCoordinates(faceCoordinates);
    // }
};

export const sendFaceCoordinates = async (coordinates) => {

    try {
        const response = await fetch('https://www.lux.cloudnativeteam12.xyz/face-coordinates', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(coordinates),
        });

        if (response.ok) {
            console.log('Face coordinates sent successfully');
        } else {
            console.error('Failed to send face coordinates');
        }
    } catch (error) {
        console.error('Error sending face coordinates:', error);
    }
    
};

const Canvas = ({canvasRefs,index,visibleVideoCount}) => {
    return (
        <canvas ref={canvasRefs.current[index].ref}  className={`canvas ${visibleVideoCount === 1 ? 'large' : ''}` } />
    );
}

export default Canvas;