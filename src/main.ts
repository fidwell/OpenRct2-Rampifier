import { fillCorners } from "./cornerFiller";
import * as utilities from "./utilities";

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
  let surface: SurfaceElement | null = null;
  let surfaceBaseHeight: number = 0;

  for (let i = 0; i < tile.elements.length; i++) {
    const element = tile.elements[i];
    if (element.type === "surface") {
      surface = <SurfaceElement>element;
      surfaceBaseHeight = surface.baseHeight;
    } else if (element.type === "footpath") {
      path = <FootpathElement>tile.elements[i];
    }
  }

  if (surface === null || path === null)
    return;

  surface.isHidden = true;
  path.isHidden = true;

  const pathSurface = path.surfaceObject;
  const pathRailings = path.railingsObject;

  if (path.slopeDirection === null ||
    pathSurface === null ||
    pathRailings === null)
    return;

  const slopeDirection: Direction = path.slopeDirection;
  makeRamp(mapX, mapY, slopeDirection, path, pathSurface, pathRailings);
  fillCorners(mapX, mapY, slopeDirection, surfaceBaseHeight);
}

function makeRamp(
  mapX: number,
  mapY: number,
  slopeDirection: Direction,
  path: FootpathElement,
  pathSurface: number,
  pathRailings: number
): void {
  const pathLocations: CoordsXYZ[] = [];

  const tileAtTopCoord = utilities.travel(<CoordsXY>{ x: mapX, y: mapY }, slopeDirection, 3);
  calculateTopTiles(path, tileAtTopCoord, slopeDirection, pathLocations, (d) => utilities.turnRight(d));
  calculateTopTiles(path, tileAtTopCoord, slopeDirection, pathLocations, (d) => utilities.turnLeft(d));

  const tileAtBottomCoord = utilities.travel(<CoordsXY>{ x: mapX, y: mapY }, slopeDirection, -3);
  const tileAtBottomCoordLeftSide = utilities.travel(tileAtBottomCoord, utilities.turnLeft(slopeDirection), 3);
  const tileAtBottomCoordRightSide = utilities.travel(tileAtBottomCoord, utilities.turnRight(slopeDirection), 3);
  calculateBottomTiles(path, tileAtBottomCoordLeftSide, pathLocations);
  calculateBottomTiles(path, tileAtBottomCoordRightSide, pathLocations);

  pathLocations.sort((a, b) => b.z - a.z);

  for (let i = 0; i < pathLocations.length; i++) {
    placePathIfNeeded(pathLocations[i], pathSurface, pathRailings);
  }
}

function isValidTile(tile: Tile): boolean {
  if (!isWithinMapBounds(tile))
    return false;

  const surfaces = tile.elements.filter(e => e.type === "surface");
  if (surfaces.length !== 1)
    return false;

  const surface = <SurfaceElement>surfaces[0];
  const validSlopes = [0b1100, 0b0110, 0b0011, 0b1001];
  if (!validSlopes.some(s => surface.slope === s))
    return false;

  const paths = tile.elements.filter(e => e.type === "footpath");
  return paths.some(p => surface.baseHeight === p.baseHeight &&
    utilities.slopeToDirection(surface.slope) === p.slopeDirection);
}

function isWithinMapBounds(tile: Tile): boolean {
  const minX = tile.x - 3;
  const maxX = tile.x + 3;
  const minY = tile.y - 4;
  const maxY = tile.y + 4;
  return minX >= 2 &&
    maxX <= map.size.x - 3 &&
    minY >= 2 &&
    maxY <= map.size.y - 3;
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

function calculateTopTiles(
  path: FootpathElement,
  tileAtTopCoord: CoordsXY,
  slopeDirection: Direction,
  pathLocations: CoordsXYZ[],
  turnFunc: (d: Direction) => Direction): void {
  const tile1 = utilities.travel(tileAtTopCoord, turnFunc(slopeDirection), 2);
  pathLocations.push(<CoordsXYZ>{
    x: tile1.x,
    y: tile1.y,
    z: path.baseHeight - 8
  });

  const tile2 = utilities.travel(tileAtTopCoord, turnFunc(slopeDirection), 3);
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

  const tile3 = utilities.travel(tileAtTopCoord, turnFunc(slopeDirection), 4);
  pathLocations.push(<CoordsXYZ>{
    x: tile3.x,
    y: tile3.y,
    z: path.baseHeight - 12
  });
}

function calculateBottomTiles(
  path: FootpathElement,
  tile: CoordsXY,
  pathLocations: CoordsXYZ[]): void {
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
