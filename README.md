# vc-gif

### Summary
Adds GIF playback support for the BBC's [VideoContext](https://github.com/bbc/VideoContext) player


### Installation:
`npm i vc-gif`

### Example usage:
```
import GIFNode from "vc-gif";
import VideoContext from "videocontext";

const vcCanvas = document.getElementById(`player`);
const vc = new VideoContext(vcCanvas);

const node = vc.customSourceNode(GIFNode, `https://media1.giphy.com/media/4dDquQRZZOPyo/giphy.gif`);

node.startAt(0);
node.stopAt(60);

node.connect(vc.destination);
vc.play();
```

### Implementation
Uses [gify-parse](https://www.npmjs.com/package/gify-parse) and [libgif](https://www.npmjs.com/package/libgif) in order to decode a gif for playback and collect the necessary metadata for controlling the playback with VideoContext.
`libgif` controls the actual playback, drawing a GIF on to a canvas element which is then used as a source for a VideoContext node.
`gify-parse` is only used to extract the duration of the gif, as `lib-gif` does not expose this information. This is very ineffcient as it means we have to decode the gif twice, so the biggest priority for further development will be to find a way of getting this information without doing so.
