
import {useRef, useState} from "react";
import './Screenshot.css';
const data = []
let stream;

const ScreenShot =  () =>{
    const [isRecording, setIsRecording] = useState(false);
    const videoRef = useRef()
    const shareScreen = async () => {
        if (navigator.mediaDevices.getDisplayMedia) {
            stream = await navigator.mediaDevices.getDisplayMedia({
                audio: true,
                video: {
                    cursor: "always"
                }
            })
            const mr = new MediaRecorder(stream)

            mr.ondataavailable = (chnk) => {
                console.log(chnk.data)
                data.push(chnk.data)
            }
            mr.start(1000)

            mr.onstop = (c) => {
                console.log('cEvent', c)
                const videoUrl = URL.createObjectURL(new Blob(data, {type: 'video/mp4'}))
                alert(videoUrl)
                videoRef.current.src=videoUrl
            }
            console.log('stream', stream)
           videoRef.current.srcObject = stream
        }
    }


    return (
        <div className="video-screen">
            <header className="App-header">
                <video width={800} height={800} ref={videoRef} autoPlay controls/>
            </header>
            <button onClick={isRecording? () => {
                
                let tracks = videoRef.current.srcObject.getTracks()
                tracks.forEach((t) => t.stop())
                videoRef.current.srcObject = null
                console.log(tracks)
                setIsRecording(false);
            }: () => {
                shareScreen()
                setIsRecording(true);
            } }>{isRecording ? 'Stop Recording' : 'Start Recording'}
            </button>
            
        </div>
    );
}

export default ScreenShot ;