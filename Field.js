import Color from './Color.js';
import vec2 from './vec2.js';
import Utils from './Utils.js';
import Block from './Block.js';
import Grid from './Grid.js';

export default class Field {
  constructor() {
    this.blocks = [];
    this.grid = new Grid(this.maxCols);
    this.draggingStart = null;
    this.game.addUpdateable(this);
    this.game.addRenderable(this);
    this.registerListeners();

    this.createBlocks();
  }

  static get BLOCK_SIZE() { return 64; }
  static get NUM_BLOCKTYPES() { return 5; }
  static get MATCH_NUM() { return 3; }

  get game() { return window.game; }
  get maxCols() { return Math.floor(this.game.width / Field.BLOCK_SIZE); }
  get maxRows() { return Math.floor(this.game.height / Field.BLOCK_SIZE); }

  registerListeners() {
    this.game.canvas.addEventListener("mousedown", (event) => {
      this.draggingStart = null;
      this.blocks.forEach(block => {
        if (block.hovered) {
          this.draggingStart = block;
        }
      });
    });
    this.game.canvas.addEventListener("mouseup", (event) => {
      this.blocks.forEach(block => {
        if (block.hovered) {
          this.dragEnd(block);
        }
      });
    });
  }

  dragEnd(block) {
    if (!this.draggingStart) {
      return;
    }
    // swap positions of blocks
    let tmpPos = block.pos;
    block.pos = this.draggingStart.pos;
    this.draggingStart.pos = tmpPos;
    this.createGrid();
    this.findMatch(this.grid, true);
  }

  createSingleBlock(column, row, team) {
    return new Block(
      column * Field.BLOCK_SIZE,
      row    * Field.BLOCK_SIZE,
      team
    );
  }

  createBlocks() {
    //this.spawnBlockAtRandom();
    let block = null;
    for (let x = 0; x < this.maxCols; x++) {
      for (let y = 0; y < this.maxRows; y++) {
        let match, team;
        let block = this.createSingleBlock(x, y, 0);
        this.grid.set(x,y,block);
        do {
          team = Utils.randInt(0, Field.NUM_BLOCKTYPES);
          block.updateTeam(team);
          match = this.findMatch(this.grid);
        } while (match != null);
        this.blocks.push(block);
      }
    }
  }

  spawnBlockAtRandom() {
    this.createSingleBlock(
      Utils.randInt(0, this.maxCols),
      Utils.randInt(0, this.maxRows),
      Utils.randInt(0, Field.NUM_BLOCKTYPES)
    );
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
    for (let x = 0; x < this.maxCols; x++) {
      for (let y = 0; y < this.maxRows; y++) {
        if (grid.get(x,y) == null) {
          continue;
        }
        if (this.BDFCount(grid, new vec2(x,y), Field.MATCH_NUM, remove)) {
          return new vec2(x,y);
        }
      }
    }
    return null;
  }

  BDFCount(grid, pos, countTo, remove) {
    let team = grid.get(pos).team;
    let seen = [];
    let count = 0;
    let recurse = (x,y) => {
      let stepPos = new vec2(x,y);
      if (seen.includes(stepPos.toString())
        || grid.get(x,y) == null
        || grid.get(x,y).team !== team) {
        return;
      }
      count++;
      seen.push(stepPos.toString());
      recurse(x + 1, y);
      recurse(x - 1, y);
      recurse(x, y + 1);
      recurse(x, y - 1);
    };
    recurse(pos.x, pos.y);

    let countedEnough = count >= countTo;
    if (countedEnough && remove) {
      seen.forEach(block => {
        block.remove();
        grid.remove(block);
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

  }

  render(ctx) {

  }

}
