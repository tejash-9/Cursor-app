import React, { useState, useEffect, useRef } from 'react';
import './grid.css';
import axios from 'axios'

const SCANNER_SIZE = 10; // Scanner size

const MorphleScanner = () => {
  
  const canvasRef = useRef(null);
  const [scannerPosition, setScannerPosition] = useState({ x: 0, y: 0 });
  const [moving, setMoving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [focus, setFocus] = useState(false);
  const [focused, setFocused] = useState(true);
  const [idle, setIdle] = useState(true);
  const [keyQueue, setKeyQueue] = useState([]);

  // Handle movement and update target position when key is pressed
  const moveScanner = async () => {
    if (moving) {
      return;
    }
    try {
      const response = await axios.post("http://127.0.0.1:8000/move_cursor/", {
        key_presses: keyQueue.map(key => ({ key }))  // Mapping the key strings into objects with a 'key' property
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
  
      const newTargetPosition = response.data.new_position
      const duration = response.data.move_time
      setKeyQueue([]);
      
      if (newTargetPosition.x === scannerPosition.x && newTargetPosition.y === scannerPosition.y) {
        return; // No need to update if the position hasn't changed
      }
      
      setIdle(false);
      setMoving(true);
  
      // Move the scanner smoothly
      smoothMove(newTargetPosition, duration);
    } catch(error) {
      console.error("Error moving cursor:", error)
      throw error
    }
  };

  const focusScanner = async () => {
    if(focused) {
      return
    }
    setIdle(false);
    setFocus(true);
    try {
      const response = await axios.get("http://localhost:8000/focus_cursor/", {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      setFocus(false); // Set focus to false after the focus duration (2 seconds)
      setIdle(true)
      setFocused(true)
    } catch (error) {
      console.error("Error focusing cursor:", error);
      throw error; // Propagate the error for handling in the UI
    }
  }

  // Smoothly move scanner over 3 seconds to the new target position
  const smoothMove = (newTargetPosition, duration) => {
    const startTime = Date.now();
    const initialPosition = { ...scannerPosition };

    const animateMove = () => {
      const currentTime = Date.now();
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / duration, 1);

      const newX = initialPosition.x + (newTargetPosition.x - initialPosition.x) * progress;
      const newY = initialPosition.y + (newTargetPosition.y - initialPosition.y) * progress;

      setScannerPosition({ x: newX, y: newY });

      if (progress < 1) {
        requestAnimationFrame(animateMove); // Keep animating until done
      } else {
        // Mark as idle and stop the movement
        setMoving(false);
        setIdle(true);
        setFocused(false);
      }
    };

    animateMove();
  };

  // Handle keydown event for arrow keys
  const handleKeyDown = (e) => {
    switch (e.key) {
      case 'ArrowLeft':
        setKeyQueue((prevQueue) => [...prevQueue, e.key]);
        break;
      case 'ArrowRight':
        setKeyQueue((prevQueue) => [...prevQueue, e.key]);
        break;
      case 'ArrowUp':
        setKeyQueue((prevQueue) => [...prevQueue, e.key]);
        break;
      case 'ArrowDown':
        setKeyQueue((prevQueue) => [...prevQueue, e.key]);
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    // Add event listener for keydown
    window.addEventListener('keydown', handleKeyDown);
    const fetchCursorPosition = async () => {
      try {
        const response = await axios.get("http://localhost:8000/get_cursor_position/", {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        setScannerPosition(response.data);
      } catch (error) {
        console.error('Error fetching cursor position:', error);
      } finally {
        setLoading(false); // Set loading to false once the data is fetched
      }
    };
    fetchCursorPosition();
  }, []);

  useEffect(() => {
    if(idle && keyQueue.length > 0) {
      moveScanner()
    } else if(idle && keyQueue.length == 0) {
      if(!focused) {
        focusScanner()
      }
    }
  }, [idle, keyQueue]);

  // Draw the scanner, captured regions, and the grid on the canvas
  const drawCanvas = (ctx) => {
    if(!loading) {
      const canvasWidth = ctx.canvas.width;
      const canvasHeight = ctx.canvas.height;
      
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      // Set background color
      ctx.fillStyle = '#1e1e1e'; // Dark background color
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // Draw grid lines
      drawGrid(ctx, canvasWidth, canvasHeight);

      // Draw the scanner as a red circle
      ctx.fillStyle = moving ? 'green' : 'grey';
      if(focus) {
        ctx.fillStyle = 'red'
      }
      ctx.beginPath();
      ctx.arc(scannerPosition.x, scannerPosition.y, SCANNER_SIZE, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const drawGrid = (ctx, canvasWidth, canvasHeight) => {
    const gridSpacing = 50; // Space between grid lines

    // Draw horizontal and vertical grid lines
    ctx.strokeStyle = '#555'; // Light grey color for grid lines
    ctx.lineWidth = 0.5;
    
    // Draw vertical lines
    for (let x = gridSpacing; x < canvasWidth; x += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasHeight);
      ctx.stroke();
    }

    // Draw horizontal lines
    for (let y = gridSpacing; y < canvasHeight; y += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvasWidth, y);
      ctx.stroke();
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      drawCanvas(ctx);
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [scannerPosition, focus]);

  return (
    <div className="scanner-container">
      <canvas ref={canvasRef} />
      <div className="info">
        <p>Scanner Position: ({Math.round(scannerPosition.x)}, {Math.round(scannerPosition.y)})</p>
      </div>
    </div>
  );
};

export default MorphleScanner;


