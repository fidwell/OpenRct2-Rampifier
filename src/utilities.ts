export function slopeToDirection(slope: number): Direction {
  switch (slope) {
    case 0b1100: return 0;
    case 0b1001: return 1;
    case 0b0011: return 2;
    case 0b0110: return 3;
  }
  throw new RangeError("Slope not valid.");
}

export function travel(coord: CoordsXY, direction: Direction, amount: number): CoordsXY {
  switch (direction % 4) {
    case 0:
      return <CoordsXY>{ x: coord.x - amount, y: coord.y };
    case 1:
      return <CoordsXY>{ x: coord.x, y: coord.y + amount };
    case 2:
      return <CoordsXY>{ x: coord.x + amount, y: coord.y };
    case 3:
      return <CoordsXY>{ x: coord.x, y: coord.y - amount };
  }
  throw new RangeError("Direction not valid.");
}

export function turnRight(direction: Direction): Direction {
  return <Direction>((direction + 1) % 4);
}

export function turnLeft(direction: Direction): Direction {
  return <Direction>((direction + 3) % 4);
}

export function turnAround(direction: Direction): Direction {
  return <Direction>((direction + 2) % 4);
}

export function isPathConnected(edges: number, direction: Direction): boolean {
  switch (direction) {
    case 0:
      return (edges & 0b0001) !== 0;
    case 1:
      return (edges & 0b0010) !== 0;
    case 2:
      return (edges & 0b0100) !== 0;
    case 3:
      return (edges & 0b1000) !== 0;
  }
}

export function directionToEdgeIndex(direction: Direction) {
  return Math.pow(2, direction);
}
