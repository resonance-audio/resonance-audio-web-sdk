let context = new AudioContext();
let audioElement;
let audioElementSource;
let songbird;
let sources = [];
let outputGain = context.createGain();
outputGain.connect(context.destination);

function initializeBenchmark() {
  let button = document.getElementById('initializeBenchmark');
  if (button.value == 'Begin') {
    button.value = 'Stop';

    delete songbird;
    delete sources;

    let numSources =
        Number(document.getElementById('numSources').value);
    let ambisonicOrder =
      Number(document.getElementById('ambisonicOrder').value);
    if (ambisonicOrder == -1) {
      /* Use PannerNode. */
      for (let i = 0; i < numSources; i++) {
        sources[i] = context.createPanner();
        sources[i].panningModel = 'HRTF';
        sources[i].distanceModel = 'inverse';
        sources[i].refDistance = 0.1;
        sources[i].maxDistance = 1000;
        audioElementSource.connect(sources[i]);
        sources[i].connect(outputGain);
      }
    } else {
      /* Use Songbird. */
      let roomSize =
        Number(document.getElementById('reverbDuration').value);
      let dimensions = {
        width: 0,
        height: 0,
        depth: 0,
      };
      let materials = {
        left: 'transparent',
        right: 'transparent',
        front: 'transparent',
        back: 'transparent',
        up: 'transparent',
        down: 'transparent',
      };
      switch (roomSize) {
        case 1:
        default:
          dimensions = {
            width: 0,
            height: 0,
            depth: 0,
          };
          materials = {
            left: 'transparent',
            right: 'transparent',
            front: 'transparent',
            back: 'transparent',
            up: 'transparent',
            down: 'transparent',
          };
          break;
        case 2:
          dimensions = {
            width: 2,
            height: 2,
            depth: 2,
          };
          materials = {
            left: 'uniform',
            right: 'uniform',
            front: 'uniform',
            back: 'uniform',
            up: 'uniform',
            down: 'uniform',
          };
          break;
        case 3:
          dimensions = {
            width: 5,
            height: 5,
            depth: 5,
          };
          materials = {
            left: 'uniform',
            right: 'uniform',
            front: 'uniform',
            back: 'uniform',
            up: 'uniform',
            down: 'uniform',
          };
          break;
        case 4:
          dimensions = {
            width: 20,
            height: 20,
            depth: 20,
          };
          materials = {
            left: 'uniform',
            right: 'uniform',
            front: 'uniform',
            back: 'uniform',
            up: 'uniform',
            down: 'uniform',
          };
          break;
      }

      songbird = new Songbird(context, {
        ambisonicOrder: ambisonicOrder,
        dimensions: dimensions,
        materials: materials,
      });
      sources = [];
      for (let i = 0; i < numSources; i++) {
        sources[i] = songbird.createSource();
        audioElementSource.connect(sources[i].input);
      }
      songbird.output.connect(outputGain);
    }
    if (numSources > 0) {
      outputGain.gain.value = 1 / numSources;
    } else {
      outputGain.gain.value = 1;
    }
    audioElement.play();
  } else {
    button.value = 'Begin';

    audioElement.pause();
    audioElement.currentTime = 0;

    for (let i = 0; i < sources.length; i++) {
      sources[i].disconnect;
    }

    audioElementSource.disconnect();
    if (songbird != undefined) {
      songbird.output.disconnect();
    }
  }
};

let onLoad = function() {
  audioElement = document.createElement('audio');
  audioElement.src = 'resources/CubeSound.wav';
  audioElement.load();
  audioElement.loop = true;
  audioElementSource = context.createMediaElementSource(audioElement);
};
window.addEventListener('load', onLoad);