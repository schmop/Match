import Color from './Color.js';
import vec2 from './vec2.js';
import Utils from './Utils.js';
import Block from './Block.js';
import Grid from './Grid.js';
import Animation from './Animation.js';

export default class Field {
  constructor() {
    this.blocks = [];
    this.grid = new Grid(this.maxCols);
    this.draggingStart = null;
    this.waitForMovementStop = false;
    this.animation = new Animation();

    this.game.addUpdateable(this);
    this.game.addRenderable(this, 10);

    this.registerListeners();
    this.fillField();
  }

  static get BLOCK_SIZE() { return 64; }
  static get NUM_BLOCKTYPES() { return 5; }
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

  registerListeners() {
    this.game.canvas.addEventListener("mousedown", (event) => {
      this.draggingStart = null;
      if (this.animation.animationsActive === 0 && !this.waitForMovementStop) {
        this.blocks.forEach(block => {
          if (block.hovered) {
            this.draggingStart = block;
          }
        });
      }
    });
    this.game.canvas.addEventListener("mouseup", (event) => {
      if (!this.draggingToBlockPos) {
        this.draggingStart = null;
        return;
      }

      for (let block of this.blocks) {
        if (Utils.rectContains(block.topLeft, block.bottomRight, this.draggingToBlockPos)) {
          this.dragEnd(block);
          break;
        }
      }
      this.draggingStart = null;
    });
  }

  dragEnd(block) {
    // swap positions of blocks

    let animationCallback = (() => {
      let block1 = block;
      let block2 = this.draggingStart;
      return () => {
        let positionDifference = 0;
        [block1, block2].forEach(curBlock => {
          let otherBlock = curBlock === block1 ? block2 : block1;
          let shownPos = curBlock.pos.add(curBlock.posOffset);
          let movingDirection = otherBlock.pos.sub(shownPos).scale(0.1);
          positionDifference += movingDirection.length();
          curBlock.posOffset = curBlock.posOffset.add(movingDirection);
        });
        if (positionDifference < 0.01) {
          return true;
        }
        return false;
      };
    })();

    let animationEndCallback = (() => {
      let block1 = block;
      let block2 = this.draggingStart;
      return () => {
        block1.posOffset = new vec2(0,0);
        block2.posOffset = new vec2(0,0);
        let tmpPos = block1.pos;
        block1.pos = block2.pos;
        block2.pos = tmpPos;
        this.findAndRemoveMatches();
      };
    })();

    this.animation.startAnimation(animationCallback, animationEndCallback);

  }

  findAndRemoveMatches() {
    this.createGrid();
    if (this.findMatch(this.grid, true)) {
      this.waitForMovementStop =  true;
    } else {
      this.fillField();
      this.waitForMovementStop = false;
    }
  }

  createSingleBlock(column, row, team) {
    return new Block(
      column * Field.BLOCK_SIZE,
      row    * Field.BLOCK_SIZE,
      team
    );
  }

  fillField() {
    let block = null;
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
  }

  spawnBlockAtRandom() {
    this.blocks.push(this.createSingleBlock(
      Utils.randInt(0, this.maxCols),
      Utils.randInt(0, this.maxRows),
      Utils.randInt(0, Field.NUM_BLOCKTYPES)
    ));
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
    for (let x = 0; x <= this.maxCols; x++) {
      for (let y = 0; y <= this.maxRows; y++) {
        if (grid.get(x,y) == null) {
          continue;
        }
        if (this.BDFCount(grid, new vec2(x,y), Field.MATCH_NUM, remove)) {
          foundSomething = true;

          if (!remove) {
            break;
          }
        }
      }
    }
    return foundSomething;
  }

  BDFCount(grid, pos, countTo, remove) {
    let team = grid.get(pos).team;
    let seen = [];
    let count = 0;
    let recurse = (x,y) => {
      let stepPos = new vec2(x,y);
      let block = grid.get(x,y);
      if (block == null
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
      seen.forEach(block => {
        grid.remove(block);
        block.remove();
      });
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
        this.findAndRemoveMatches();
      }
    }
  }

  render(ctx) {
    if (this.draggingStart && this.draggingToBlockPos) {
      console.log("drags", this.dragginStart);
      ctx.beginPath();
      ctx.moveTo(this.draggingStartPos.x, this.draggingStartPos.y);
      ctx.lineTo(this.draggingToBlockPos.x, this.draggingToBlockPos.y);
      ctx.stroke();
    }
  }

}
