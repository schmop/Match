import Color from './Color.js';
import vec2 from './vec2.js';
import Utils from './Utils.js';
import Block from './Block.js';
import Grid from './Grid.js';
import Animation from './Animation.js';
import ExplicitAnimations from './ExplicitAnimations.js';
import Endless from './GameTypes/Endless.js';
import MatchX from './GameTypes/MatchX.js';

export default class Field {
  constructor() {
    this.blocks = [];
    this.grid = new Grid(this.maxCols);
    this.draggingStart = null;
    this.waitForMovementStop = false;
    this.blockingAnimation = new Animation();
    this.animation = new Animation();
    this.moveScore = 0;

    this.game.addUpdateable(this);
    this.game.addRenderable(this, 10);

    this.registerListeners();
    this.fillField();
  }

  static get BLOCK_SIZE() { return 64; }
  static get NUM_BLOCKTYPES() { return 4; }
  static get MATCH_NUM() { return 3; }

  get game() { return window.game; }
  get maxCols() { return Math.floor(this.game.width / Field.BLOCK_SIZE); }
  get maxRows() { return Math.floor(this.game.height / Field.BLOCK_SIZE); }
  get isDragging() { return this.dragginStart != null; }
  get draggingStartPos() { return this.draggingStart.pos.add(Field.BLOCK_SIZE / 2, Field.BLOCK_SIZE / 2); }
  get draggingToBlockPos() {
    if (!this.draggingStart || this.draggingStart.hovered) {
      return null;
    }
    // determine direction to swap
    let dragDir = this.game.mouse.pos.sub(this.draggingStartPos).normalize();
    let otherBlockDir = Math.abs(dragDir.x) > Math.abs(dragDir.y)
      ? new vec2(Math.sign(dragDir.x), 0)
      : new vec2(0, Math.sign(dragDir.y))
    ;

    return this.draggingStartPos.add(otherBlockDir.scale(Field.BLOCK_SIZE));
  }
  get draggingToBlock() {
    return this.blocks.find(block => block.contains(this.draggingToBlockPos));
  }

  registerListeners() {
    let mouseStartCallback, mouseEndCallback;
    switch(this.game.gameMode) {
      case 'endless':
        mouseStartCallback = Endless.mouseStartCallback(this);
        mouseEndCallback = Endless.mouseEndCallback(this);
        break;
      case 'x':
        mouseStartCallback = MatchX.mouseStartCallback(this);
        mouseEndCallback = MatchX.mouseEndCallback(this);
        break;
      case 'move':

        break;
    }
    this.game.canvas.addEventListener("mousedown", mouseStartCallback);
    this.game.canvas.addEventListener("touchstart", mouseStartCallback);
    this.game.canvas.addEventListener("mouseup", mouseEndCallback);
    this.game.canvas.addEventListener("touchend", mouseEndCallback);
  }

  findAndRemoveMatches() {
    this.createGrid();
    if (!this.findMatch(this.grid, true)) {
      this.game.addScore(this.moveScore);
      this.moveScore = 0;
      this.fillField();
      this.waitForMovementStop = false;
      return false;
    }
    return true;
  }

  createSingleBlock(column, row, team) {
    return new Block(
      column * Field.BLOCK_SIZE,
      row    * Field.BLOCK_SIZE,
      team
    );
  }

  fillFieldNoMatches() {
    for (let x = 0; x < this.maxCols; x++) {
      for (let y = 0; y < this.maxRows; y++) {
        if (this.grid.get(x,y)) {
          continue;
        }
        let match, team;
        let block = this.createSingleBlock(x, y, 0);
        this.grid.set(x,y,block);
        do {
          team = Utils.randInt(0, Field.NUM_BLOCKTYPES);
          block.updateTeam(team);
          match = this.findMatch(this.grid);
        } while (match);
        this.blocks.push(block);
      }
    }
    this.sortBlocks();
  }

  fillFieldRandom() {
    for (let x = 0; x < this.maxCols; x++) {
      for (let y = 0; y < this.maxRows; y++) {
        if (this.grid.get(x,y)) {
          continue;
        }
        let match, team;
        let block = this.createSingleBlock(x, y, Utils.randInt(0, Field.NUM_BLOCKTYPES));
        this.grid.set(x,y,block);
        this.blocks.push(block);
      }
    }
    this.sortBlocks();
  }

  fillField() {
    let block = null;
    if (this.game.gameMode === 'endless') {
      this.fillFieldNoMatches();
    } else {
      this.fillFieldRandom();
    }
  }

  spawnBlockAtRandom() {
    this.blocks.push(this.createSingleBlock(
      Utils.randInt(0, this.maxCols),
      Utils.randInt(0, this.maxRows),
      Utils.randInt(0, Field.NUM_BLOCKTYPES)
    ));
    this.sortBlocks();
  }

  sortBlocks() {
    this.blocks.sort((a,b) => a.team - b.team);
    this.updateColumns();
  }

  updateColumns() {
    this.columns = [];
    this.blocks.forEach(block => {
      let blockCol = Math.floor(block.pos.x / Field.BLOCK_SIZE);
      if (this.columns[blockCol] == null) {
        this.columns[blockCol] = [];
      }
      this.columns[blockCol].push(block);
    });
  }

  blockAt(column, row) {
    let pos = new vec2(column, row).scale(Field.BLOCK_SIZE);
    let foundBlocks = this.blocks.find(block => Utils.rectContains(block.topLeft, block.bottomRight, pos));
    return foundBlocks.length > 0 ? foundBlocks[0] : null;
  }

  createGrid() {
    this.grid = new Grid(this.maxCols);
    this.blocks.forEach(block => {
      let blockPos = block.pos.add(Field.BLOCK_SIZE / 2, Field.BLOCK_SIZE / 2).scale(1 / Field.BLOCK_SIZE);
      blockPos = new vec2(Math.floor(blockPos.x), Math.floor(blockPos.y));
      this.grid.set(blockPos, block);
    });
  }

  findMatch(grid, remove) {
    let biggestCount = 0;
    let foundSomething = false;
    let aboutToRemove = [];
    for (let x = 0; x <= this.maxCols; x++) {
      for (let y = 0; y <= this.maxRows; y++) {
        if (grid.get(x,y) == null) {
          continue;
        }
        if (this.BDFCount(grid, new vec2(x,y), Field.MATCH_NUM, remove, aboutToRemove)) {
          foundSomething = true;

          if (!remove) {
            break;
          }
        }
      }
    }
    if (aboutToRemove.length > 0) {
      this.moveScore += aboutToRemove.length;
      this.blockingAnimation.startAnimation(
        ExplicitAnimations.killBlocks(aboutToRemove),
        ExplicitAnimations.killBlocksEndEndless(aboutToRemove, grid, this)
      );
    }
    return foundSomething;
  }

  BDFCount(grid, pos, countTo, remove, aboutToRemove) {
    let team = grid.get(pos).team;
    let seen = [];
    let count = 0;
    let recurse = (x,y) => {
      let stepPos = new vec2(x,y);
      let block = grid.get(x,y);
      if (!Utils.rectContains(new vec2(0,0), new vec2(this.maxCols, this.maxRows), stepPos)
        || block == null
        || block.team !== team
        || seen.find(seenBlock => seenBlock.pos.toString() == block.pos.toString())) {
        return;
      }
      count++;
      seen.push(block);
      recurse(x + 1, y);
      recurse(x - 1, y);
      recurse(x, y + 1);
      recurse(x, y - 1);
    };
    recurse(pos.x, pos.y);

    let countedEnough = count >= countTo;
    if (countedEnough && remove) {
      aboutToRemove.push(...seen);
      // remove doubles
      for (let i = aboutToRemove.length - 1; i > 0; i--) {
        if (aboutToRemove.indexOf(aboutToRemove[i]) !== i) {
          aboutToRemove.splice(i);
        }
      }
    }

    return countedEnough;
  }

  getHoveredBlock() {
    for (let point of this.points) {
      if (point.distance(this.game.mouse.pos) < Ramp.POINT_SIZE) {
        return point;
      }
    }
    return null;
  }

  update() {
    if (this.waitForMovementStop) {
      // check if some block is in the 'air'
      let movementDetected = false;
      for (let block of this.blocks) {
        let inAir = true;
        let nextBlockPos = block.pos.add(Field.BLOCK_SIZE / 2, Field.BLOCK_SIZE);
        for (let otherBlock of this.blocks) {
          if (block === otherBlock) {
            continue;
          }
          if (nextBlockPos.y >= this.game.height
            || Utils.rectContains(otherBlock.topLeft, otherBlock.bottomRight, nextBlockPos)) {
            inAir = false;
            break;
          }
        }
        if (inAir) {
          movementDetected = true;
          break;
        }
      }
      if (!movementDetected) {
        if (this.game.gameMode === 'endless') {
          Endless.movementStop(this);
        } else if (this.game.gameMode === 'x') {
          MatchX.movementStop(this);
        }
        this.waitForMovementStop = false;
      }
    }
  }

  render(ctx) {
    let lastTeam = -1;
    this.blocks.forEach(block => {
      if (block.team !== lastTeam) {
        if (lastTeam !== -1) {
          ctx.fill();
        }
        ctx.beginPath();
        ctx.fillStyle = block.color.toString();
        lastTeam = block.team;
      }
      block.render(ctx);
    });
    ctx.fill();

    if (this.draggingStart && this.draggingToBlockPos) {
      let normal = this.draggingToBlockPos.sub(this.draggingStartPos).normalize();
      normal = new vec2(-normal.y, normal.x);
      let vertices = [
        this.draggingStartPos.add(normal.scale(Field.BLOCK_SIZE / 2)),
        this.draggingStartPos.sub(normal.scale(Field.BLOCK_SIZE / 2)),
        this.draggingToBlockPos.add(normal.scale(Field.BLOCK_SIZE / 2)),
        this.draggingToBlockPos.sub(normal.scale(Field.BLOCK_SIZE / 2)),
      ];
      let topLeft = vertices[0].clone();
      let bottomRight = vertices[0].clone();
      vertices.forEach(vertex => {
        if (topLeft.x > vertex.x) {
          topLeft.x = vertex.x;
        }
        if (topLeft.y > vertex.y) {
          topLeft.y = vertex.y;
        }
        if (bottomRight.x < vertex.x) {
          bottomRight.x = vertex.x;
        }
        if (bottomRight.y < vertex.y) {
          bottomRight.y = vertex.y;
        }
      });
      let width = bottomRight.x - topLeft.x;
      let height = bottomRight.y - topLeft.y;
      let grd = ctx.createLinearGradient(this.draggingStartPos.x,this.draggingStartPos.y,this.draggingToBlockPos.x, this.draggingToBlockPos.y);
      grd.addColorStop(0.4, this.draggingStart.color);
      grd.addColorStop(0.6, this.draggingToBlock.color);
      ctx.fillStyle = grd;
      ctx.fillRect(topLeft.x, topLeft.y, width, height);
    }
  }

}
