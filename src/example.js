import GIFNode from "./index";
import VideoContext from "videocontext";

const vcCanvas = document.getElementById(`player`);
const vc = new VideoContext(vcCanvas);

const node = vc.customSourceNode(GIFNode, `https://media1.giphy.com/media/4dDquQRZZOPyo/giphy.gif`);
const node2 = vc.customSourceNode(GIFNode, `https://media.giphy.com/media/TrFTekH49d8yY/giphy.gif`);

node.startAt(0);
node.stopAt(60);
node2.startAt(0);
node2.stopAt(60);
node.connect(vc.destination);
node2.connect(vc.destination);
vc.play();