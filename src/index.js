import SuperGif from "libgif";
import gif from "./assets/giphy.gif";
import VideoContext from "videocontext";
import gifyParse from "gify-parse";
import axios from "axios";

const getDuration = (url) => {
	return new Promise((res, rej) => {
		axios(url, { responseType: 'arraybuffer' })
			.then(({ data: b64 }) => {
				const pictureDatainBinary = Buffer.from(b64, 'base64');
				res(gifyParse.getInfo(pictureDatainBinary).duration);
			});
	});
  };

// const container = document.getElementById(`container`);
// const progressEl = document.getElementById(`progress`);
// const playBtn = document.getElementById(`play`);
// const pauseBtn = document.getElementById(`pause`);
// const nextFrameBtn = document.getElementById(`nextFrame`);
// const prevFrameBtn = document.getElementById(`prevFrame`);

class GIFPlayer {
    constructor(src, { loop = true }) {
        this.src = src;
        this.loop = loop;
        this._createImageElement();
        this._gif = new SuperGif({ gif: this._imageElement, auto_play: false });
    }

    _createImageElement() {
        const image = document.createElement(`img`);

        // libgif requires the img to have a parent element
        const wrapper = document.createElement(`div`);
        wrapper.appendChild(image);

        this._imageElement = image;
    }

    play() {
        this._gif.play();
    }
    
    pause() {
        this._gif.pause();
    }

    seek(time) {
		const absoluteFrame = time * this.frameRate;
        const targetFrame = this.loop ? absoluteFrame % this.length : absoluteFrame;
        this.seekToFrame(Math.floor(targetFrame));
    }

    seekToFrame(i) {
        this._gif.move_to(i);
    }

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

    get frameDuration() {
        return 1 / this.frameRate;
    }
    
    get currentFrame() {
        return this._gif.get_current_frame();
    }

    get length() {
        return this._gif.get_length();
    }

    get frameRate() {
        return this.length / this.duration;
    }

    get canvas() {
        return this._gif.get_canvas();
    }

    get loaded() {
        return !this._gif.get_loading() && this.duration;
    }
}


class GIFNode extends VideoContext.NODES.CanvasNode {
    constructor(src, gl, renderGraph, currentTime, preloadTime = 4) {
        const placeholderel = document.createElement(`canvas`);
		super(placeholderel, gl, renderGraph, currentTime);

        this._displayName = `GIF`;
        this._preloadTime = preloadTime;
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

const vcCanvas = document.getElementById(`player`);
const vc = new VideoContext(vcCanvas);

const node = vc.customSourceNode(GIFNode, `https://media.giphy.com/media/KHWXGQRjbKrvUIjN2r/giphy.gif`);
const node2 = vc.customSourceNode(GIFNode, `https://media.giphy.com/media/TrFTekH49d8yY/giphy.gif`);

node.startAt(0);
node.stopAt(60);
node2.startAt(0);
node2.stopAt(60);
node.connect(vc.destination);
node2.connect(vc.destination);
vc.play();