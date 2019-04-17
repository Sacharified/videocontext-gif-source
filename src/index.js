import gifyParse from "gify-parse";
import SuperGif from "libgif";
import VideoContext from "videocontext";
import axios from "axios";

/**
 * @summary - Get the duration of a GIF from a URL
 * @param {String} url 
 */
const getDuration = (url) => {
	return new Promise((res, rej) => {
		axios(url, { responseType: 'arraybuffer' })
			.then(({ data: b64 }) => {
				const pictureDatainBinary = Buffer.from(b64, 'base64');
				res(gifyParse.getInfo(pictureDatainBinary).duration);
			});
	});
};

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
	constructor(src, { loop = true }) {
		this.src = src;
		this.loop = loop;
		this._createImageElement();
		this._gif = new SuperGif({ gif: this._imageElement, auto_play: false });
	}

	/**
	 * @method
	 * @summary - Create the necessary img element for libgif
	 */
	_createImageElement() {
		const image = document.createElement(`img`);

		// libgif requires the img to have a parent element
		const wrapper = document.createElement(`div`);
		wrapper.appendChild(image);

		this._imageElement = image;
	}

	/**
	 * @method
	 * @summary - Play the gif on the canvas
	 */
	play() {
		this._gif.play();
	}
	
	/**
	 * @method
	 * @summary - Paus eht playback
	 */
	pause() {
		this._gif.pause();
	}

	/**
	 * @method
	 * @summary - Seek to a given point in time in the gif 
	 * @param {Number} time - Time to seek to in SECONDS. If the time is greater than the length of the GIF, it will loop back around
	 */
	seek(time) {
		const absoluteFrame = time * this.frameRate;
		const targetFrame = this.loop ? absoluteFrame % this.length : absoluteFrame;
		this.seekToFrame(Math.floor(targetFrame));
	}

	/**
	 * @method
	 * @summary - Seek to a specific frame in the gif.
	 * @param {Number} index = The index of the frame that should be seeked to
	 */

	seekToFrame(index) {
		this._gif.move_to(index);
	}

	/**
	 * @method
	 * @summary - Parse the GIF to get the data we need for playback
	 * 
	 * @returns {Promise<GIFPlayer>}
	 */
	load() {
		return new Promise(res => {
			Promise.all([
				getDuration(this.src),   
				new Promise(res => this._gif.load_url(this.src, res))
			]).then(([duration]) => {
				this.duration = duration / 1000;
				res(this);
			});
		});
	}

	/**
	 * @summary - The duration of a frame in SECONDS
	 * 
	 * @returns {Number}
	 */
	get frameDuration() {
		return 1 / this.frameRate;
	}
	
	/**
	 * @summary - The index of the currently displayed frame
	 * @returns {Number}
	 */
	get currentFrame() {
		return this._gif.get_current_frame();
	}

	/**
	 * @summary - The total number of frames in the gif file
	 * @returns {Number}
	 */
	get length() {
		return this._gif.get_length();
	}

	/**
	 * @summary - The frameReate of the gif file in frames per second.
	 * @warn - GIF frame rates are weird, and the delay between frames can vary so this is not 100% reliable
	 */
	get frameRate() {
		return this.length / this.duration;
	}

	/**
	 * @summary - The canvas element that the gif is drawn on to
	 * @returns {HTMLCanvasElement}
	 */
	get canvas() {
		return this._gif.get_canvas();
	}

	/**
	 * @summary - Whether the gif has been loaded and is ready for playback
	 * @returns {Boolean}
	 */
	get loaded() {
		return !this._gif.get_loading() && this.duration;
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
		
		this._gif.load().then(gif => this._element = gif.canvas );
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