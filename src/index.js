import VideoContext from "videocontext";
import { Decoder } from "fastgif/fastgif.js";

const decode = url => {
	return new Promise((res, rej) => {
		const decoder = new Decoder();

		window.fetch(url)
			.then(response => response.arrayBuffer())
			.then(buffer => decoder.decode(buffer))
			.then(res);
	});
}

/**
 * @class
 * @summary - Brings together 2 GIF libraries to get the data we need and control a GIF on a canvas
 */
export class GIFPlayer {

	/**
	 * @param {String} src - Path to the gif file
	 * @param {Object} options
	 * @param {Boolean[true]} options.loop - Whether the gif should loop or play once and hold on end
	 */
	constructor(src, { loop = true, canvas }) {
		this.src = src;
		this.loop = loop;
		this.currentFrameIndex = 0;
		this.loaded = false;

		if (!canvas) {
			canvas = this.createElement();
		}
		this.element = canvas;
		this.ctx = this.element.getContext(`2d`);
		this.onDecodeComplete = this.onDecodeComplete.bind(this);
		this.load();
	}
	
	load() {
		return new Promise((res, rej) => {
			decode(this.src)
				.then(data => {
					this.onDecodeComplete(data);
					res(this);
				})
				.catch(rej);
		});
	}

	createElement() {
		const canvas = document.createElement(`canvas`);
		return canvas;
	}

	/**
	 * 
	 * @param {Array<Object>} data 
	 * @param {Number} data.delay
	 * @param {Array<ImageData>} data.imageData
	 */
	onDecodeComplete(data = []) {
		this.data = data;
		const [firstItem] = data;
		this.width = firstItem.imageData.width;
		this.height = firstItem.imageData.height;
		this.render();
		this.frameDelay = firstItem.delay;
		this.loaded = true;

		console.log(this.data.reduce((memo, frame) => memo + frame.imageData.data.reduce((memo, val) => memo + val, 0), 0))
	}

	render(index) {
		if (!index) {
			index = this.currentFrameIndex;
		}
		const frame = this.getFrame(index);
		console.log(frame.imageData.data.reduce((memo, val) => memo + val, 0));

		const draw = () => {
			this.ctx.putImageData(frame.imageData, 0, 0);
			this.currentFrameIndex = index;
		}

		requestAnimationFrame(draw);
	}

	get currentFrame() {
		return this.getFrame(this.currentFrameIndex);
	}

	set width(width = 0) {
		this.element.width = width;
	}

	set height(height = 0) {
		this.element.height = height;
	}

	get width() {
		return this.element.width;
	}

	get height() {
		return this.element.height;
	}

	getFrame(index = 0) {
		return this.data[index];
	}

	/**
	 * @method
	 * @summary - Play the gif on the canvas
	 */
	play() {
		let prevTime = 0;
		let now = performance.now();
		let delta = now - prevTime;
		if (delta > this.currentFrame.delay) {
			this.render(this.currentFrameIndex + 1);
		}
		this.paused = false;
		
		prevTime = now;
	}
	
	/**
	 * @method
	 * @summary - Paus eht playback
	 */
	pause() {
		this._gif.pause();
	}

	/**
	 * 
	 * @param {Number} time - SECONDS
	 */
	getFrameAtTime(time) {
		let tracker = 0;
		const relativeTime = this.loop && time > this.duration ? time % this.duration : time;
		const timems = relativeTime * 1000;
		const index = this.data.findIndex(({ delay }) => {
			tracker += delay;
			return tracker >= timems;
		});

		return { frame: this.data[index], index };
	}

	/**
	 * @method
	 * @summary - Seek to a given point in time in the gif 
	 * @param {Number} time - Time to seek to in SECONDS. If the time is greater than the length of the GIF, it will loop back around
	 */
	seek(time) {
		const { index } = this.getFrameAtTime(time);
		// console.log(index);
		this.seekToFrame(index);
	}

	/**
	 * @method
	 * @summary - Seek to a specific frame in the gif.
	 * @param {Number} index = The index of the frame that should be seeked to
	 */

	seekToFrame(index) {
		this.render(index);
	}

	/**
	 * @summary - The duration of a frame in SECONDS
	 * 
	 * @returns {Number}
	 */
	get frameDuration() {
		return 1 / this.frameRate;
	}

	get frameRate() {
		return this.data.length / (this.frameDelay / 100);
	}
	
	/**
	 * @summary - The total number of frames in the gif file
	 * @returns {Number}
	 */
	get length() {
		return this.data.length;
	}

	/**
	 * @summary - The frameReate of the gif file in frames per second.
	 * @warn - GIF frame rates are weird, and the delay between frames can vary so this is not 100% reliable
	 */
	get frameRate() {
		return this.length / this.duration;
	}

	get duration() {
		return this.data.reduce((memo, { delay }) => {
			return memo + delay / 1000;
		}, 0);
	}
}

/**
 * @class GIFNode
 * @summary - Use a GIF image like a video in VideoContext
 */
class GIFNode extends VideoContext.NODES.CanvasNode {
	/**
	 * @param {String} src - Path to the GIF file
	 * @param {Object} gl 
	 * @param {Object} renderGraph 
	 * @param {Number} currentTime 
	 * @param {Number} preloadTime 
	 */
	constructor(src, gl, renderGraph, currentTime, preloadTime = 4) {
		const placeholderel = document.createElement(`canvas`);
		super(placeholderel, gl, renderGraph, currentTime);

		this._displayName = `GIF`;
		this._seek = this._seek.bind(this);
		this._update = this._update.bind(this);
		this._gif = new GIFPlayer(src, { loop: true });
		
		this._gif.load().then(gif => this._element = gif.element );
	}

	_seek(time) {
		if(!this._gif.loaded) ;
		this._gif.seek(time);
		super._seek(time);
	}
	
	_update(time) {
		if(!this._gif.loaded) return;
		this._gif.seek(time);
		super._update(time);
	}

	_isReady() {
		return this._gif.loaded;
	}
}

export default GIFNode;