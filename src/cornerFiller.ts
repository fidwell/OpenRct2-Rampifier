import * as utilities from "./utilities";

export function fillCorners(mapX: number, mapY: number, slopeDirection: Direction, baseHeight: number) {
  fillCornersAtTop(mapX, mapY, slopeDirection, baseHeight);
  fillCornersAtBottom(mapX, mapY, slopeDirection, baseHeight);
}

function fillCornersAtTop(mapX: number, mapY: number, slopeDirection: Direction, baseHeight: number) {
  const tileAtTopCoord = utilities.travel(<CoordsXY>{ x: mapX, y: mapY }, slopeDirection, 1);
  const tileAtTop = map.getTile(tileAtTopCoord.x, tileAtTopCoord.y);
  const footpaths = tileAtTop.elements.filter(e => e.type === "footpath" && !e.isHidden && e.baseHeight === baseHeight + 2);
  if (footpaths.length === 0)
    return;
  const footpath = <FootpathElement>footpaths[0];

  const directionBack = utilities.turnAround(slopeDirection);
  const isConnectedToRamp = utilities.isPathConnected(footpath.edges, directionBack);

  // fill top left
  const directionToLeft = utilities.turnLeft(slopeDirection);
  const isConnectedToLeft = utilities.isPathConnected(footpath.edges, directionToLeft);
  if (isConnectedToLeft && isConnectedToRamp) {
    const corner = utilities.directionToEdgeIndex(directionBack);
    footpath.corners = footpath.corners | corner;
  }

  // fill top right
  const directionToRight = utilities.turnRight(slopeDirection);
  const isConnectedToRight = utilities.isPathConnected(footpath.edges, directionToRight);
  if (isConnectedToRight && isConnectedToRamp) {
    const corner = utilities.directionToEdgeIndex(directionToRight);
    footpath.corners = footpath.corners | corner;
  }
}

function fillCornersAtBottom(mapX: number, mapY: number, slopeDirection: Direction, baseHeight: number) {
  const tileAtBottomCoord = utilities.travel(<CoordsXY>{ x: mapX, y: mapY }, slopeDirection, -1);
  const tileAtBottom = map.getTile(tileAtBottomCoord.x, tileAtBottomCoord.y);
  const footpaths = tileAtBottom.elements.filter(e => e.type === "footpath" && !e.isHidden && e.baseHeight === baseHeight);
  if (footpaths.length === 0)
    return;
  const footpath = <FootpathElement>footpaths[0];

  const directionBack = utilities.turnAround(slopeDirection);
  const isConnectedToRamp = utilities.isPathConnected(footpath.edges, slopeDirection);

  fillBottomLeft(directionBack, footpath, isConnectedToRamp, slopeDirection);
  fillBottomright(directionBack, footpath, isConnectedToRamp);
}

function fillBottomLeft(directionBack: Direction, footpath: FootpathElement,
  isConnectedToRamp: boolean, slopeDirection: Direction): void {
  const directionToLeft = utilities.turnLeft(directionBack);
  const isConnectedToLeft = utilities.isPathConnected(footpath.edges, directionToLeft);
  if (isConnectedToLeft && isConnectedToRamp) {
    const corner = utilities.directionToEdgeIndex(slopeDirection);
    footpath.corners = footpath.corners | corner;
  }
}

function fillBottomright(directionBack: Direction, footpath: FootpathElement,
  isConnectedToRamp: boolean): void {
  const directionToRight = utilities.turnRight(directionBack);
  const isConnectedToRight = utilities.isPathConnected(footpath.edges, directionToRight);
  if (isConnectedToRight && isConnectedToRamp) {
    const corner = utilities.directionToEdgeIndex(directionToRight);
    footpath.corners = footpath.corners | corner;
  }
}
