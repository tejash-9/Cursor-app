from dataclasses import dataclass

@dataclass(frozen=True)
class CanvasConfig:
    width: int
    height: int

# Create an instance of the CanvasConfig dataclass
canvas_config = CanvasConfig(width=37, height=19)