import Utils from './Utils.js';
import vec2 from './vec2.js';
import Field from './Field.js';
import Color from './Color.js';

export default class Block {

	constructor(x, y, team) {
		this.pos = new vec2(x,y);
		this.posOffset = new vec2(0,0);
		this.vel = new vec2(0,0);
		this.team = team;
		this.color = Color.getUniqueColor(this.team, Field.NUM_BLOCKTYPES);
		this.shownSize = 0;

		this.game.addUpdateable(this);
	}

	// statics
	static get GRAVITY() { return 0.6; }
	static get FRICTION() { return 0.99; }

	get game() { return window.game; }
	get field() { return this.game.field; }
	get width() { return this.game.width; }
	get height() { return this.game.height; }
	get size() { return Field.BLOCK_SIZE; }
	get topLeft() { return this.pos; }
	get center() { return this.pos.add(this.size / 2, this.size / 2); }
	get bottomRight() { return this.pos.add(this.size, this.size); }
	get column() { return Math.floor(this.pos.x / Field.BLOCK_SIZE); }
	get hovered() { return Utils.rectContains(this.topLeft, this.bottomRight, this.game.mouse.pos); }
	get clicked() { return this.hovered && this.game.mouse.down; }
	get highlighted() {
		return ((this.hovered && this.field.isDragging)
			|| this.field.draggingStart === this
			|| (this.field.draggingToBlockPos && this.contains(this.field.draggingToBlockPos))
		);
	}
	get otherBlocks() { return this.field.blocks; }
	get nextPos() { return this.pos.add(this.vel); }
	get nextBox() { return {
		left: this.nextPos.x,
		top: this.nextPos.y,
		right: this.nextPos.x + this.size,
		bottom: this.nextPos.y + this.size
	}; }

	contains(pos) {
		return Utils.rectContains(this.topLeft, this.bottomRight, pos);
	}

	remove() {
		this.game.removeUpdateable(this);
		this.game.removeRenderable(this);
		this.field.columns[this.column] = this.field.columns[this.column].filter(block => block !== this);
		this.field.blocks = this.otherBlocks.filter(block => block !== this);
	}

	updateTeam(team) {
		this.team = team;
		this.color = Color.getUniqueColor(this.team, Field.NUM_BLOCKTYPES);
	}

	update() {
		this.applyAcceleration();
		this.checkCollision();
		this.applyVelocity();
		this.animate();
	}

	animate() {
		this.shownSize += (this.size - this.shownSize) * 0.1;
	}

	checkCollision() {
		this.checkOtherBoxes();
		this.checkBoundaries();
	}

	checkOtherBoxes() {
		let nextPos = this.nextPos;
		for(let box of this.field.columns[this.column]) {
			if (box === this) {
				continue;
			}
			// TODO: also check horizontally
			// just check vertically downwards
			if (Math.abs(this.pos.x - box.pos.x) < Field.BLOCK_SIZE) {
				if (this.pos.y < box.pos.y) {
					if (Math.abs(nextPos.y - box.pos.y) < Field.BLOCK_SIZE) {
						this.pos.y = box.pos.y - Field.BLOCK_SIZE;
						this.vel.y = 0;
					}
				}
			}
		}
	}

	checkBoundaries() {
		let nextBox = this.nextBox;
		if (nextBox.right > this.width) {
			this.pos.x = this.width - this.size;
			this.vel.x = 0;
		}
		else if (nextBox.left < 0) {
			this.pos.x = 0;
			this.vel.x = 0;
		}

		if (nextBox.bottom > this.height) {
			this.pos.y = this.height - this.size;
			this.vel.y = 0;
		}
		else if (nextBox.top < 0) {
			this.pos.y = 0;
			this.vel.y = 0;
		}
	}

	applyAcceleration() {
		this.vel.y += Block.GRAVITY;
		this.vel = this.vel.scale(Block.FRICTION);
	}

	applyVelocity() {
		this.pos = this.nextPos;
	}

	render(ctx) {
		let renderPosition = this.pos.add(this.posOffset).add(new vec2(1,1).scale((this.size - this.shownSize) / 2));
		ctx.rect(renderPosition.x, renderPosition.y, this.shownSize, this.shownSize);
	}
}
