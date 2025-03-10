export function slopeToDirection(slope: number): Direction {
  switch (slope) {
    case 0b1100: return 0;
    case 0b1001: return 1;
    case 0b0011: return 2;
    case 0b0110: return 3;
  }
  throw new RangeError("Slope not valid.");
}

export function turnRight(direction: Direction): Direction {
  return <Direction>((direction + 1) % 4);
}

export function turnLeft(direction: Direction): Direction {
  return <Direction>((direction + 3) % 4);
}
