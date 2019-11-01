import Utils from './Utils.js';
import Color from './Color.js';
import vec2 from './vec2.js';
import AudioSrc from './AudioSrc.js';
import Field from './Field.js';

export default class Match {

	constructor(canvasId, gameMode) {
		Utils.removeAllEventListeners(window, "keydown");
		this.gameMode = gameMode;
		this.canvasId = canvasId;
		this.mouse = {
			pos: new vec2(-1, -1),
			down: false,
		};
		this.bestMoveElement = document.getElementById("best-move");
		this.scoreElement = document.getElementById("score");
		this.score = 0;
		this.bestMove = 0;
	}

	createRandomColor() {
		return new Color(
			Utils.rand(0, 50),
			Utils.rand(0, 50),
			Utils.rand(0, 50)
		);
	}

	initCanvas() {
		this.width = Math.floor(window.innerWidth / Field.BLOCK_SIZE) * Field.BLOCK_SIZE;
		this.height = this.width * (window.innerHeight / window.innerWidth) - this.canvas.getBoundingClientRect().top;
		// round to blocksize
		this.height = Math.floor(this.height / Field.BLOCK_SIZE) * Field.BLOCK_SIZE;
		this.canvas.width = this.width;
		this.canvas.height = this.height;
		this.ctx = this.canvas.getContext("2d");
	}

	init() {
		Utils.removeAllEventListeners(document.getElementById(this.canvasId));
		this.canvas = document.getElementById(this.canvasId);
		this.renderables = [];
		this.updateables = [];
		this.nextTicks = [];
		this.setScore(0);
		this.setBestMove(0);
		this.initCanvas();
		this.loadAudioFiles();
		this.registerListeners();
		this.initField();
	}

	initField() {
		this.field = new Field();
	}

	setScore(score) {
		this.score = score;
		this.scoreElement.innerHTML = "Score: " + this.score;
	}

	addScore(score) {
		this.setScore(this.score + score);
		if (score > this.bestMove) {
			this.setBestMove(score);
		}
	}

	setBestMove(score) {
		this.bestMove = score;
		this.bestMoveElement.innerHTML = "Best Move: " + this.bestMove;
	}

	loadAudioFiles() {
		this.audio = new AudioSrc('water.mp3');
	}

	registerListeners() {
		let updateMouseByTouchEvent = (touch) => {
			let rect = touch.target.getBoundingClientRect();
			this.mouse.pos = new vec2(touch.targetTouches[0].pageX - rect.left, touch.targetTouches[0].pageY - rect.top);
		};
		let mouseMoveCallback = (event) => {
			if ('touches' in event) {
				updateMouseByTouchEvent(event);
				event.preventDefault();
			} else {
				this.mouse.pos = new vec2(event.offsetX, event.offsetY);
			}
		};
		this.canvas.addEventListener('mousemove', mouseMoveCallback);
		this.canvas.addEventListener('touchmove', mouseMoveCallback, false);
		let mouseStartCallback = (event) => {
			this.mouse.down = true;
			if ('touches' in event) {
				updateMouseByTouchEvent(event);
			}
		};
		this.canvas.addEventListener('mousedown', mouseStartCallback);
		this.canvas.addEventListener('touchstart', mouseStartCallback, false);
		let mouseEndCallback = (event) => {
			this.mouse.down = false;
			if ('touches' in event) {
				this.nextTick(() => {
					this.mouse.pos = new vec2(-1, -1);
				});
			}
		};
		this.canvas.addEventListener('mouseup', mouseEndCallback);
		this.canvas.addEventListener('touchend', mouseEndCallback, false);
		this.canvas.addEventListener('touchcancel', mouseEndCallback, false);

		this.canvas.addEventListener('mouseout', (event) => {
			this.mouse.pos = new vec2(-1, -1);
		});
		window.addEventListener('keydown', this.keyDownListener);
	}

	keyDownListener(event) {
		if (event.key === 'Enter') {
			this.field.spawnBlockAtRandom();
		}
		else if (event.key === 'Escape') {
			this.clear();
		}
		else if (event.key === 'Backspace') {
			this.audio.play();
		}
	}

	nextTick(callback) {
		this.nextTicks.push(callback);
	}

	clear() {
		this.updateables = [];
		this.renderables = [];
	}

	startGame() {
		requestAnimationFrame(this.tick.bind(this));
	}

	tick() {
		this.update();
		this.render();
		this.execNextTicks();
		requestAnimationFrame(this.tick.bind(this));
	}

	update() {
		this.updateables.forEach(updateable => {
			updateable.update();
		});
	}

	render() {
		this.ctx.clearRect(0, 0, this.width, this.height);

		this.renderables.forEach(renderable => {
		  renderable.obj.render(this.ctx);
		});
	}

	execNextTicks() {
		this.nextTicks.forEach(callback => {
			if (typeof callback === 'function') {
				callback();
			}
		});
		this.nextTicks = [];
	}

	addUpdateable(obj) {
		this.updateables.push(obj);
	}

	addRenderable(obj, layer) {
		layer = layer || 0;
		this.renderables.push({obj: obj, layer: layer});
		this.renderables.sort((r1, r2) => r1.layer - r2.layer);
	}

	removeUpdateable(obj) {
		this.updateables = this.updateables.filter(updateable => updateable !== obj);
	}

	removeRenderable(obj) {
		this.renderables = this.renderables.filter(renderable => renderable.obj !== obj);
	}

	get width() { return this._width; }
	get height() { return this._height; }
	set width(width) { this._width = width; }
	set height(height) { this._height = height; }
};
