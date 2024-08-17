import React, { useRef, useEffect, useState } from 'react';
import './App.css';
import * as tf from '@tensorflow/tfjs';
import * as facemesh from '@tensorflow-models/facemesh';
import Webcam from 'react-webcam';

// Triangulation matrix (simplified example)
const TRIANGULATION = [
  [127, 34, 139], [11, 0, 37], [232, 231, 120], [72, 37, 39],
  // Add more triangles as per the full face mesh points
];

function App() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [model, setModel] = useState(null);

  useEffect(() => {
    const loadModel = async () => {
      const net = await facemesh.load();
      setModel(net);
    };
    loadModel();
  }, []);

  const drawDots = (ctx, keypoints) => {
    keypoints.forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, 1 /* radius */, 0, 2 * Math.PI);
      ctx.fillStyle = 'aqua';
      ctx.fill();
    });
  };

  const drawTriangles = (ctx, keypoints, triangulation) => {
    ctx.strokeStyle = 'lime';
    ctx.lineWidth = 1;

    triangulation.forEach(triangle => {
      ctx.beginPath();
      ctx.moveTo(keypoints[triangle[0]][0], keypoints[triangle[0]][1]);
      ctx.lineTo(keypoints[triangle[1]][0], keypoints[triangle[1]][1]);
      ctx.lineTo(keypoints[triangle[2]][0], keypoints[triangle[2]][1]);
      ctx.closePath();
      ctx.stroke();
    });
  };

  const detect = async () => {
    if (
      webcamRef.current &&
      webcamRef.current.video.readyState === 4 &&
      model &&
      canvasRef.current
    ) {
      const video = webcamRef.current.video;
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;

      // Set video and canvas dimensions
      webcamRef.current.video.width = videoWidth;
      webcamRef.current.video.height = videoHeight;
      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;

      const predictions = await model.estimateFaces(video);

      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, videoWidth, videoHeight);

      if (predictions.length > 0) {
        predictions.forEach((prediction) => {
          const keypoints = prediction.scaledMesh;

          drawDots(ctx, keypoints);
          drawTriangles(ctx, keypoints, TRIANGULATION);
        });
      }
    }
  };

  useEffect(() => {
    const intervalId = setInterval(detect, 100);
    return () => clearInterval(intervalId);
  }, [model]);

  return (
    <div className="App">
      <header className="App-header">
        <Webcam ref={webcamRef} screenshotFormat="image/jpeg" />
        <canvas ref={canvasRef} />
      </header>
    </div>
  );
}

export default App;
