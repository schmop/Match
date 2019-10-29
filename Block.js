import Utils from './Utils.js';
import vec2 from './vec2.js';
import Field from './Field.js';
import Color from './Color.js';

export default class Block {

	constructor(x, y, team) {
		this.pos = new vec2(x,y);
		this.vel = new vec2(0,0);
		this.team = team;
		this.color = Color.getUniqueColor(this.team, Field.NUM_BLOCKTYPES, Block.UNHOVERED_BRIGHTNESS);
		this.hoverColor = this.color.maximizeBrightness();

		this.game.addUpdateable(this);
		this.game.addRenderable(this);
	}

	// statics
	static get GRAVITY() { return 0.2; }
	static get FRICTION() { return 0.99; }
	static get UNHOVERED_BRIGHTNESS() { return 100; }

	get game() { return window.game; }
	get field() { return this.game.field; }
	get width() { return this.game.width; }
	get height() { return this.game.height; }
	get size() { return Field.BLOCK_SIZE; }
	get topLeft() { return this.pos; }
	get bottomRight() { return this.pos.add(this.size, this.size); }
	get hovered() { return Utils.rectContains(this.topLeft, this.bottomRight, this.game.mouse.pos); }
	get clicked() { return this.hovered && this.game.mouse.down; }
	get otherBlocks() { return this.field.blocks; }
	get nextPos() { return this.pos.add(this.vel); }
	get nextBox() { return {
		left: this.nextPos.x,
		top: this.nextPos.y,
		right: this.nextPos.x + this.size,
		bottom: this.nextPos.y + this.size
	}; }

	remove() {
		this.game.removeUpdateable(this);
		this.game.removeRenderable(this);
		this.field.blocks = this.otherBlocks.filter(block => block !== this);
	}

	updateTeam(team) {
		this.team = team;
		this.color = Color.getUniqueColor(this.team, Field.NUM_BLOCKTYPES, Block.UNHOVERED_BRIGHTNESS);
		this.hoverColor = this.color.maximizeBrightness();
	}

	update() {
		this.applyAcceleration();
		this.checkCollision();
		this.applyVelocity();
		this.handleMouse();
	}

	handleMouse() {
		if (this.clicked) {

		}
	}

	checkCollision() {
		this.checkOtherBoxes();
		this.checkBoundaries();
	}

	checkOtherBoxes() {
		this.otherBlocks.forEach(box => {
			if (box === this) {
				return;
			}
			// TODO: also check horizontally
			// just check vertically downwards

			if (Math.abs(this.pos.x - box.pos.x) < Field.BLOCK_SIZE) {
				if (this.pos.y < box.pos.y) {
					if (Math.abs(this.nextPos.y - box.pos.y) < Field.BLOCK_SIZE) {
						this.pos.y = box.pos.y - Field.BLOCK_SIZE;
						this.vel.y = 0;
					}
				}
			}
		});
	}

	checkBoundaries(nextBox) {
		if (this.nextBox.right > this.width) {
			this.pos.x = this.width - this.size;
			this.vel.x = 0;
		}
		else if (this.nextBox.left < 0) {
			this.pos.x = 0;
			this.vel.x = 0;
		}

		if (this.nextBox.bottom > this.height) {
			this.pos.y = this.height - this.size;
			this.vel.y = 0;
		}
		else if (this.nextBox.top < 0) {
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
		ctx.beginPath();
		ctx.fillStyle = (this.hovered ? this.hoverColor : this.color).toString();

		ctx.rect(this.pos.x, this.pos.y, this.size, this.size);
		ctx.fill();
	}
}
