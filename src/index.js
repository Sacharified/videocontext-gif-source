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

// let startLoad;

class GIFPlayer {
    constructor(src, { onLoad = () => {}, loop = true }) {
        const image = document.createElement(`img`);
        const wrapper = document.createElement(`div`);
        wrapper.appendChild(image);

        this._src = src;
        this.loop = loop;
        this._loadCallback = onLoad;

        this._gif = new SuperGif({ gif: image, auto_play: false });
		this._onLoad = this._onLoad.bind(this);
		startLoad = performance.now();
        this.load(src);
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

    load(src) {
        Promise.all([
            getDuration(src),   
            new Promise((res, rej) => this._gif.load_url(src, res))
        ]).then(([duration]) => {
            this.duration = duration / 1000;
            this._onLoad();
        });
    }

    get loaded() {
        return !this._gif.get_loading() && this.duration;
    }

    _onLoad() {
        const canvas = this._gif.get_canvas();
        this._canvas = canvas;
        this._loadCallback(this);
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
        this._gif = new GIFPlayer(src, {
			onLoad: gif => this._element = gif._canvas,
			loop: true
        });
    }

    _seek(time) {
        if(!this._gif.loaded) return;
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