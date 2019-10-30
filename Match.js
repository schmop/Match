import Utils from './Utils.js';
import Color from './Color.js';
import vec2 from './vec2.js';
import AudioSrc from './AudioSrc.js';
import Field from './Field.js';

export default class Match {

	constructor(canvasId) {
		this.renderables = [];
		this.updateables = [];
		this.canvas = document.getElementById(canvasId);
		this.ctx = this.canvas.getContext("2d");
		this.width = this.canvas.width;
		this.height = this.canvas.height;
		this.mouse = {
			pos: new vec2(-1, -1),
			down: false,
		};
	}

	createRandomColor() {
		return new Color(
			Utils.rand(0, 50),
			Utils.rand(0, 50),
			Utils.rand(0, 50)
		);
	}

	init() {
		this.loadAudioFiles();
		this.registerListeners();
		this.initField();
	}

	initField() {
		this.field = new Field();
	}

	loadAudioFiles() {
		this.audio = new AudioSrc('water.mp3');
	}

	registerListeners() {
		this.canvas.addEventListener('mousemove', (event) => {
			this.mouse.pos = new vec2(event.x, event.y);
		});
		this.canvas.addEventListener('mousedown', (event) => {
			this.mouse.down = true;
		});
		this.canvas.addEventListener('mouseup', (event) => {
			this.mouse.down = false;
		});
		this.canvas.addEventListener('mouseout', (event) => {
			this.mouse.pos = new vec2(-1, -1);
		});
		window.addEventListener('keydown', (event) => {
			if (event.key === 'Enter') {
				this.field.spawnBlockAtRandom();
			}
			else if (event.key === 'Escape') {
				this.clear();
			}
			else if (event.key === 'Backspace') {
				this.audio.play();
			}
		});
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
		this.renderables = this.renderables.filter(renderable => renderable.obj !== obj)
	}

	get width() { return this._width; }
	get height() { return this._height; }
	set width(width) { this._width = width; }
	set height(height) { this._height = height; }
};
