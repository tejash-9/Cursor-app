import React, { useState, useEffect, useRef } from 'react';
import './grid.css';
import axios from 'axios'

const SCANNER_SIZE = 10; // Scanner size
const GRID_SIZE = 50

const MorphleScanner = () => {
  
  const canvasRef = useRef(null);
  const [gridSize, setGridSize] = useState({width: 0, height: 0});
  const [scannerPosition, setScannerPosition] = useState({ x: 0, y: 0 });
  const [gridIndex, setGridIndex] = useState({x: 0, y: 0});
  const [visitedGrids, setVisitedGrids] = useState([]); // Array to store visited grids
  const [focusedGrids, setFocusedGrids] = useState([]); // Array to store focused grids
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
      const response = await axios.post("http://34.204.14.128:8000/move_cursor/", {
        key_presses: keyQueue.map(key => ({ key }))  // Mapping the key strings into objects with a 'key' property
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
  
      const newGrid = response.data.new_position
      const duration = response.data.move_time
      
      if (newGrid.x === gridIndex.x && newGrid.y === gridIndex.y) {
        setMoving(false);
        setIdle(true);
        return; // No need to update if the position hasn't changed
      }
      
      const newPosition = {x: newGrid.x*GRID_SIZE - GRID_SIZE/2, y: newGrid.y*GRID_SIZE - GRID_SIZE/2}
      // Move the scanner smoothly
      smoothMove(newPosition, duration, newGrid);
    } catch(error) {
      console.error("Error moving cursor:", error)
      throw error
    }
  };

  const focusScanner = async () => {
    if(focused) {
      return
    }
    try {
      const response = await axios.get("http://34.204.14.128:8000/focus_cursor/", {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      setFocus(false); // Set focus to false after the focus duration (2 seconds)
      setIdle(true)
      setFocused(true)
      // Mark this grid as focused
      setFocusedGrids((prevVisited) => [...prevVisited, { x: Math.max(gridIndex.x-1, 0), y: Math.max(gridIndex.y-1, 0) }]);
    } catch (error) {
      console.error("Error focusing cursor:", error);
      throw error; // Propagate the error for handling in the UI
    }
  }

  // Smoothly move scanner over 3 seconds to the new target position
  const smoothMove = (newTargetPosition, duration, newGrid) => {
    const startTime = Date.now();
    const initialPosition = { ... scannerPosition };

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
        setGridIndex(newGrid)
        // Mark this grid as visited
        setVisitedGrids((prevVisited) => [...prevVisited, { x: Math.max(newGrid.x-1, 0), y: Math.max(newGrid.y-1, 0) }]);
      }
    };

    animateMove();
  };

  // Handle keydown event for arrow keys
  const handleKeyDown = (e) => {
    if(keyQueue.length > 60) {
      return
    }
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
    const fetchCursorPosition = async () => {
      try {
        const response = await axios.get("http://34.204.14.128:8000/get_cursor_position/", {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        console.log(response)
        setGridIndex(response.data.current_position);
        setGridSize(response.data.size);
        setScannerPosition({x: response.data.current_position.x*GRID_SIZE - GRID_SIZE/2, y: response.data.current_position.y*GRID_SIZE - GRID_SIZE/2});
      } catch (error) {
        console.error('Error fetching cursor position:', error);
      } finally {
        setLoading(false); // Set loading to false once the data is fetched
      }
    };
    console.log("getting init")
    fetchCursorPosition();

    // Add event listener for keydown
    window.addEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if(idle && keyQueue.length > 0) {
      setMoving(true);
      setIdle(false);
      setKeyQueue([]);
      moveScanner()
    } else if(idle && keyQueue.length == 0) {
      if(!focused) {
        setIdle(false);
        setFocus(true);
        focusScanner()
      }
    }
  }, [idle, keyQueue, focused]);

  // Draw the scanner, captured regions, and the grid on the canvas
  const drawCanvas = (ctx) => {
    if(!loading) {
      const canvasWidth = ctx.canvas.width;
      const canvasHeight = ctx.canvas.height;
      
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      // Set background color
      ctx.fillStyle = '#1e1e1e'; // Dark background color
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // Draw visited grids in green
      visitedGrids.forEach((grid) => {
        ctx.fillStyle = 'green';
        ctx.fillRect(
          grid.x * GRID_SIZE, 
          grid.y * GRID_SIZE, 
          GRID_SIZE, 
          GRID_SIZE
        );
      });

      // Draw focused grids in red
      focusedGrids.forEach((grid) => {
        ctx.fillStyle = 'red';
        ctx.fillRect(
          grid.x * GRID_SIZE, 
          grid.y * GRID_SIZE, 
          GRID_SIZE, 
          GRID_SIZE
        );
      });

      // Draw grid lines
      drawGrid(ctx, canvasWidth, canvasHeight);

      // Draw the scanner as a red circle
      ctx.fillStyle = 'white';
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
    if(!loading) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const resizeCanvas = () => {
        canvas.width = gridSize.width*50;
        canvas.height = gridSize.height*50;
        drawCanvas(ctx);
      };
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);
      return () => {
        window.removeEventListener('resize', resizeCanvas);
      };  
    }
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


