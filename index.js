const BOX_SIDE_SIZE = 4;

let boxElement, tiles, emptySlot;

/* Errors */

class TileDoesNotExistError extends Error {}
class TileCannotBeMovedError extends Error {
  constructor(tile) {
    super();
    this.tile = tile;
  }
}

/* Utility functions */

function randomInteger(min, max) {
  const integerMin = Math.ceil(min);
  const integerMax = Math.floor(max);
  return Math.floor(Math.random() * (integerMax - integerMin + 1) + integerMin);
}

/* Initialization functions */

function initializeBox() {
  boxElement = document.querySelector('.box');
  boxElement.style.setProperty('--box-side-size', BOX_SIDE_SIZE);

  const tileTemplate = getTemplate('#tile-template');

  tiles = Array(BOX_SIDE_SIZE ** 2 - 1).fill(null).map(function initializeTile(_, index) {
    const tile = {
      rowIndex: Math.floor(index / BOX_SIDE_SIZE),
      columnIndex: index % BOX_SIDE_SIZE,
      value: index + 1,
      element: tileTemplate.cloneNode(true),
    };

    setTileProperties(tile);

    tile.element.querySelector('text').textContent = tile.value;
    tile.element.addEventListener('click', function onTileClick() { tryToMoveTile(tile); });
    boxElement.appendChild(tile.element);

    return tile;
  });

  emptySlot = { rowIndex: BOX_SIDE_SIZE - 1, columnIndex: BOX_SIDE_SIZE - 1 };

  forceReflow(boxElement);
}

function initializeNewGame() {
  shuffle(randomInteger(20, 100));
  listenToArrowKeys();
}

function endGame() {
  stopListeningToArrowKeys();
  showCongratulationsScreen();
}

/* UI functions */

function getTemplate(selector) {
  return document.querySelector(selector).content.firstElementChild;
}

function onKeyDown(event) {
  slideTileInDirection({ 'ArrowUp': 'up', 'ArrowRight': 'right', 'ArrowDown': 'down', 'ArrowLeft': 'left' }[event.key]);
}

function listenToArrowKeys() {
  document.addEventListener('keydown', onKeyDown);
}

function stopListeningToArrowKeys() {
  document.removeEventListener('keydown', onKeyDown);
}

function forceReflow(element) {
  element.offsetHeight;
}

function setTileProperties(tile) {
  tile.element.style.setProperty('--row-index', tile.rowIndex);
  tile.element.style.setProperty('--column-index', tile.columnIndex);
}

function signalInvalidMoveAttempt(element) {
  element.classList.remove('invalid-move-attempt');
  forceReflow(element);
  element.classList.add('invalid-move-attempt');
  element.addEventListener('animationend', function onInvalidMoveAnimationEnd() {
    element.classList.remove('invalid-move-attempt');
  }, { once: true });
}

function showCongratulationsScreen() {
  const congratulationsScreenElement = getTemplate('#congratulations-screen-template').cloneNode(true);
  const playAgainButton = congratulationsScreenElement.querySelector('.play-again-button');
  playAgainButton.addEventListener('click', function onPlayAgainButtonClick() {
    congratulationsScreenElement.remove();
    initializeNewGame();
  }, { once: true });
  document.body.appendChild(congratulationsScreenElement);
  playAgainButton.focus();
}

/* Tile manipulation functions */

function slideTileInDirection(direction) {
  switch (direction) {
    case 'up':    tryToMoveTile({ rowIndex: emptySlot.rowIndex + 1, columnIndex: emptySlot.columnIndex     }); break;
    case 'down':  tryToMoveTile({ rowIndex: emptySlot.rowIndex - 1, columnIndex: emptySlot.columnIndex     }); break;
    case 'left':  tryToMoveTile({ rowIndex: emptySlot.rowIndex    , columnIndex: emptySlot.columnIndex + 1 }); break;
    case 'right': tryToMoveTile({ rowIndex: emptySlot.rowIndex    , columnIndex: emptySlot.columnIndex - 1 }); break;
  }
}

function shuffle(times = 1) {
  let direction;

  for (let i = 0; i < times; i++) {
    const possibleDirections = [
      emptySlot.rowIndex    > 0                 && direction !== 'up'    && 'down',
      emptySlot.columnIndex < BOX_SIDE_SIZE - 1 && direction !== 'right' && 'left',
      emptySlot.rowIndex    < BOX_SIDE_SIZE - 1 && direction !== 'down'  && 'up',
      emptySlot.columnIndex > 0                 && direction !== 'left'  && 'right',
    ].filter(Boolean);
    direction = possibleDirections[randomInteger(0, possibleDirections.length - 1)];
    slideTileInDirection(direction);
  }
}

function tryToMoveTile({ rowIndex, columnIndex }) {
  try {
    moveTile({ rowIndex, columnIndex });
  } catch (error) {
    if (error instanceof TileDoesNotExistError) {
      signalInvalidMoveAttempt(boxElement);
    } else if (error instanceof TileCannotBeMovedError) {
      signalInvalidMoveAttempt(error.tile.element);
    } else {
      throw error;
    }
  }
}

function moveTile({ rowIndex, columnIndex }) {
  const tile = findTile({ rowIndex, columnIndex });

  if (!tile) throw new TileDoesNotExistError();
  if (!canTileBeMoved(tile)) throw new TileCannotBeMovedError(tile);

  tile.rowIndex    = emptySlot.rowIndex;
  tile.columnIndex = emptySlot.columnIndex;

  emptySlot.rowIndex    = rowIndex;
  emptySlot.columnIndex = columnIndex;

  setTileProperties(tile);

  if (isSolved()) { endGame(); }
}

/* Query functions */

function findTile({ rowIndex, columnIndex }) {
  return tiles.find(tile => tile.rowIndex === rowIndex && tile.columnIndex === columnIndex);
}

function canTileBeMoved(tile) {
  return (tile.rowIndex === emptySlot.rowIndex && Math.abs(tile.columnIndex - emptySlot.columnIndex) === 1)
    || (tile.columnIndex === emptySlot.columnIndex && Math.abs(tile.rowIndex - emptySlot.rowIndex) === 1);
}

function isTileOnItsFinalPlace(tile) {
  return tile.value === tile.rowIndex * BOX_SIDE_SIZE + tile.columnIndex + 1;
}

function isSolved() {
  return tiles.every(isTileOnItsFinalPlace);
}

/* Application */

function run() {
  initializeBox();
  initializeNewGame();
}

// run the app after the 'load' event occurs, to ensure that the CSS file is loaded
// and the CSS transitions run for the initial shuffle of the tiles
window.addEventListener('load', run);
