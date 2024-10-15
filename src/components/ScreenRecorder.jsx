import React, { useState, useRef } from 'react';

const ScreenRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [screenStream, setScreenStream] = useState(null); // Store the screen stream

  const startRecording = async () => {
    try {
      // Get the screen stream
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true, // If you want to record audio as well
      });
      console.log("screen stream:",stream);
      // Save the screen stream
      setScreenStream(stream);
      // Create a new MediaRecorder instance
      mediaRecorderRef.current = new MediaRecorder(stream);
      // Listen to dataavailable event which gets triggered when the recording is available
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setRecordedChunks((prev) => [...prev, event.data]);
        }
      };
      // Listen to stop event which gets triggered when the recording is stopped
      mediaRecorderRef.current.onstop = () => {
        setRecordedChunks([]);

        console.log('recording chunks:', recordedChunks);
        // Combine all the recorded chunks into a single blob
        
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        // Create a URL for the blob
        const url = URL.createObjectURL(blob);
        // Create a link element to download the recording
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'recording.webm';
        document.body.appendChild(a);
        // Click the link to download the recording
        a.click();
        // Remove the link
        window.URL.revokeObjectURL(url);

        // Stop the screen sharing
        if (screenStream) {
          screenStream.getTracks().forEach(track => {addEventListener('ended', stopRecording);});
        }
      };

      mediaRecorderRef.current.start();
      console.log('Recording started:',stream);
      setIsRecording(true);
    } catch (err) {
      console.error('Error: ' + err);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    setIsRecording(false);
  };

  return (
    <div>
      <h2>Screen Recorder</h2>
      <button onClick={isRecording ? stopRecording : startRecording}>
        {isRecording ? 'Stop Recording' : 'Start Recording'}
      </button>
    </div>
  );
};

export default ScreenRecorder;
