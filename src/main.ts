export function activateTool() {
  ui.activateTool({
    id: "rampifier",
    cursor: "path_down",
    onMove: args => move(args),
    onUp: args => apply(args)
  });
}

function move(args: ToolEventArgs): void {
  if (!args.mapCoords)
    return;

  const tile = map.getTile(args.mapCoords.x >> 5, args.mapCoords.y >> 5);
  if (isValidTile(tile)) {
    ui.tileSelection.tiles = [args.mapCoords];
  } else {
    ui.tileSelection.tiles = [];
  }
}

function apply(args: ToolEventArgs): void {
  if (!args.mapCoords)
    return;

  const mapX = args.mapCoords.x >> 5;
  const mapY = args.mapCoords.y >> 5;

  const tile = map.getTile(mapX, mapY);
  if (!isValidTile(tile))
    return;

  let path: FootpathElement | null = null;

  for (let i = 0; i < tile.elements.length; i++) {
    const element = tile.elements[i];
    if (element.type === "surface") {
      element.isHidden = true;
    } else if (element.type === "footpath") {
      element.isHidden = true;
      path = <FootpathElement>tile.elements[i];
    }
  }

  if (path === null)
    return;

  const pathSurface = path.surfaceObject;
  const pathRailings = path.railingsObject;

  if (path.slopeDirection === null ||
    pathSurface === null ||
    pathRailings === null)
    return;

  const slopeDirection: Direction = path.slopeDirection;
  const pathLocations: CoordsXYZ[] = [];

  const tileAtTopCoord = travel(<CoordsXY>{ x: mapX, y: mapY }, slopeDirection, 3);
  calculateTopTiles(path, tileAtTopCoord, slopeDirection, pathLocations, (d) => turnRight(d));
  calculateTopTiles(path, tileAtTopCoord, slopeDirection, pathLocations, (d) => turnLeft(d));

  const tileAtBottomCoord = travel(<CoordsXY>{ x: mapX, y: mapY }, slopeDirection, -3);
  const tileAtBottomCoordLeftSide = travel(tileAtBottomCoord, turnLeft(slopeDirection), 3);
  const tileAtBottomCoordRightSide = travel(tileAtBottomCoord, turnRight(slopeDirection), 3);
  calculateBottomTiles(path, tileAtBottomCoordLeftSide, pathLocations);
  calculateBottomTiles(path, tileAtBottomCoordRightSide, pathLocations);

  pathLocations.sort((a, b) => b.z - a.z);

  for (let i = 0; i < pathLocations.length; i++) {
    placePathIfNeeded(pathLocations[i], pathSurface, pathRailings);
  }
}

function isValidTile(tile: Tile): boolean {
  // todo: check map edge bounds

  const surfaces = tile.elements.filter(e => e.type === "surface");
  if (surfaces.length !== 1)
    return false;

  const surface = <SurfaceElement>surfaces[0];
  const validSlopes = [0b1100, 0b0110, 0b0011, 0b1001];
  if (!validSlopes.some(s => surface.slope === s))
    return false;

  const paths = tile.elements.filter(e => e.type === "footpath");
  return paths.some(p => surface.baseHeight === p.baseHeight &&
    slopeToDirection(surface.slope) === p.slopeDirection);
}

function slopeToDirection(slope: number): Direction {
  switch (slope) {
    case 0b1100: return 0;
    case 0b1001: return 1;
    case 0b0011: return 2;
    case 0b0110: return 3;
  }
  throw new RangeError("Slope not valid.");
}

function placePathIfNeeded(coord: CoordsXYZ, pathSurface: number, pathRailings: number): void {
  const tile = map.getTile(coord.x, coord.y);
  const z = coord.z << 3;

  if (tile.elements.some(e => e.baseHeight === z && e.type === "footpath")) {
    return;
  }

  const newElement = <FootpathElement>tile.insertElement(0);
  newElement.type = "footpath";
  newElement.baseHeight = z;
  newElement.baseZ = z;
  newElement.clearanceHeight = z + (4 << 3);
  newElement.clearanceZ = z + (4 << 3);
  newElement.surfaceObject = pathSurface;
  newElement.railingsObject = pathRailings;
  newElement.edges = 0b1111;
  newElement.corners = 0b1111;
}

function travel(coord: CoordsXY, direction: Direction, amount: number): CoordsXY {
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

function calculateTopTiles(
  path: FootpathElement,
  tileAtTopCoord: CoordsXY,
  slopeDirection: Direction,
  pathLocations: CoordsXYZ[],
  turnFunc: (d: Direction) => Direction) {
  const tile1 = travel(tileAtTopCoord, turnFunc(slopeDirection), 2);
  pathLocations.push(<CoordsXYZ>{
    x: tile1.x,
    y: tile1.y,
    z: path.baseHeight - 8
  });

  const tile2 = travel(tileAtTopCoord, turnFunc(slopeDirection), 3);
  pathLocations.push(<CoordsXYZ>{
    x: tile2.x,
    y: tile2.y,
    z: path.baseHeight - 12
  });
  pathLocations.push(<CoordsXYZ>{
    x: tile2.x,
    y: tile2.y,
    z: path.baseHeight - 8
  });

  const tile3 = travel(tileAtTopCoord, turnFunc(slopeDirection), 4);
  pathLocations.push(<CoordsXYZ>{
    x: tile3.x,
    y: tile3.y,
    z: path.baseHeight - 12
  });
}

function calculateBottomTiles(
  path: FootpathElement,
  tile: CoordsXY,
  pathLocations: CoordsXYZ[]) {
  pathLocations.push(<CoordsXYZ>{
    x: tile.x,
    y: tile.y,
    z: path.baseHeight - 12
  });
  pathLocations.push(<CoordsXYZ>{
    x: tile.x,
    y: tile.y,
    z: path.baseHeight - 10
  });
}

function turnRight(direction: Direction): Direction {
  return <Direction>((direction + 1) % 4);
}

function turnLeft(direction: Direction): Direction {
  return <Direction>((direction + 3) % 4);
}
