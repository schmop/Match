import Utils from './Utils.js';

export default class AudioSrc {
  constructor(path) {
    this.ready = false;
    this.fetchData();
    this.source = null;
    this.audioCtx = new AudioContext();
  }

  fetchData() {
	  let request = new XMLHttpRequest();
	  request.open('GET', 'water.mp3', true);
	  request.responseType = 'arraybuffer';
	  request.onload = () => {
	    this.audioData = request.response;
      this.ready = true;
	  };
	  request.send();
  }

  play(pitch) {
    if (this.ready) {
      /*if (this.source) {
        this.source.stop(0);
      }*/
      this.source = this.audioCtx.createBufferSource();
      this.audioCtx.decodeAudioData(
        this.audioData.slice(0),
        (buffer) => {
          this.source.buffer = buffer;
          this.source.playbackRate.value = pitch;
          this.source.connect(this.audioCtx.destination);
          this.source.loop = false;
          this.source.start(0);
        },
        (e) => {
          console.error("Error with decoding audio data", e.toString());
        }
      );
    }
  }
}
