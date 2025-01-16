from fastapi import FastAPI
from pydantic import BaseModel
import math
import asyncio
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from config import canvas_config
from fastapi.middleware.cors import CORSMiddleware
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


app = FastAPI()

# Add CORS middleware to allow requests from any origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)

# Create an asyncio Lock to ensure only one action is processed at a time
action_lock = asyncio.Lock()

# Define a model for key press data
class KeyPress(BaseModel):
    key: str  # The key pressed (ArrowUp, ArrowDown, ArrowLeft, ArrowRight)

# Define a model for list of key presses
class KeyPressList(BaseModel):
    key_presses: list[KeyPress]

# Define a model for cursor position
class CursorPosition(BaseModel):
    x: float  # X-coordinate (float)
    y: float  # Y-coordinate (float)


cursor_position = CursorPosition(x=925, y=456)

# Helper function to calculate time based on the number of steps
def calculate_time(steps: int) -> float:
    logger.debug(f"Calculating time for {steps} steps.")
    return 3 * math.sqrt(steps) * 1000  # Time in miliseconds

# Helper function to simulate the process with delay
async def simulate_delay(delay):
    logger.debug(f"Simulating a delay of {delay}ms.")
    await asyncio.sleep(delay/1000)

# Middleware to log incoming requests
@app.middleware("http")
async def log_request(request: Request, call_next):
    logger.info(f"Request: {request.method} {request.url}")
    response = await call_next(request)
    logger.info(f"Response status: {response.status_code}")
    return response

# Endpoint to get the current position
@app.get("/get_cursor_position/")
async def get_cursor_position():
    """Endpoint to get the current cursor position."""
    return cursor_position

# Endpoint to get the new position and move duration
@app.post("/move_cursor/")
async def move_cursor(key_press_list: KeyPressList):
    """Endpoint to get the new position and move duration"""
    global cursor_position, canvas_config
    keypresses = {"up": 0, "down": 0, "left": 0, "right": 0}
    # Acquire the lock to ensure that only one action is processed at a time
    async with action_lock:
        for keypress in key_press_list.key_presses:
            # Update the key press count based on the key received
            if keypress.key == 'ArrowUp':
                keypresses["up"] += 1
            elif keypress.key == 'ArrowDown':
                keypresses["down"] += 1
            elif keypress.key == 'ArrowLeft':
                keypresses["left"] += 1
            elif keypress.key == 'ArrowRight':
                keypresses["right"] += 1

        new_x = cursor_position.x
        new_y = cursor_position.y

        # Calculate the steps in x and y
        steps_x = abs(keypresses["right"] - keypresses["left"])
        steps_y = abs(keypresses["down"] - keypresses["up"])

        # Calculate the new position based on the key presses
        new_x += (keypresses["right"] - keypresses["left"])*50
        new_y += (keypresses["down"] - keypresses["up"])*50

        if new_x <= 0:
            new_x = 0
            steps_x = abs(cursor_position.x)//50

        if new_y <= 0:
            new_y = 0
            steps_y = abs(cursor_position.y)//50
        
        if new_x >= canvas_config.width:
            new_x = canvas_config.width
            steps_x = abs(new_x - cursor_position.x)//50

        if new_y >= canvas_config.height:
            new_y = canvas_config.height
            steps_y = abs(new_y - cursor_position.y)//50

        # Calculate steps and time to move
        steps = steps_x + steps_y
        time_to_move = calculate_time(steps)

        logger.info(f"Moving cursor to new position: ({new_x}, {new_y}) with a move time of {time_to_move}ms.")

        asyncio.create_task(simulate_delay(time_to_move))

        cursor_position = CursorPosition(x=new_x, y=new_y)

        return {"new_position": {"x": new_x, "y": new_y}, "move_time": time_to_move}

# Endpoint to simulate focus
@app.get("/focus_cursor/")
async def focus_cursor():
    """Endpoint to simulate focus"""
    # Acquire the lock to ensure that only one action is processed at a time
    async with action_lock:
        await simulate_delay(2000)
        logger.debug("Cursor focus completed.")
        return {"focus_time": 2000}  # Return 2 seconds for focus
    
# Global exception handler (custom error handler)
@app.exception_handler(Exception)
async def validation_exception_handler(request: Request, exc: Exception):
    logger.error(f"An error occurred: {exc}")
    return JSONResponse(
        status_code=500,
        content={"message": f"Internal Server Error: {exc}"},
    )







