let audioContext;
let foaSongbirdSource;
let toaSongbirdSource;
let pannerNode;
let foaSongbird;
let toaSongbird;
let noneGain;
let pannerGain;
let foaSongbirdGain;
let toaSongbirdGain;
let dimensions = {width: 1, height: 1, depth: 1};

/**
 * Select the desired rendering mode.
 * @param {Object} event
 * @private
 */
function selectRenderingMode(event) {
  switch (document.getElementById('renderingMode').value) {
    case 'toa':
    {
      noneGain.gain.value = 0;
      pannerGain.gain.value = 0;
      foaSongbirdGain.gain.value = 0;
      toaSongbirdGain.gain.value = 1;
    }
    break;
    case 'foa':
    {
      noneGain.gain.value = 0;
      pannerGain.gain.value = 0;
      foaSongbirdGain.gain.value = 1;
      toaSongbirdGain.gain.value = 0;
    }
    break;
    case 'panner-node':
    {
      noneGain.gain.value = 0;
      pannerGain.gain.value = 1;
      foaSongbirdGain.gain.value = 0;
      toaSongbirdGain.gain.value = 0;
    }
    break;
    case 'none':
    default:
    {
      noneGain.gain.value = 1;
      pannerGain.gain.value = 0;
      foaSongbirdGain.gain.value = 0;
      toaSongbirdGain.gain.value = 0;
    }
    break;
  }
}

/**
 * Update the audio sound objects' positions.
 * @param {Object} elements
 * @private
 */
function updatePositions(elements) {
  for (let i = 0; i < elements.length; i++) {
    let x = (elements[i].x - 0.5) * dimensions.width / 2;
    let y = 0;
    let z = (elements[i].y - 0.5) * dimensions.depth / 2;
    if (i == 0) {
      pannerNode.setPosition(x, y, z);
      foaSongbirdSource.setPosition(x, y, z);
      toaSongbirdSource.setPosition(x, y, z);
    } else {
      audioContext.listener.setPosition(x, y, z);
      foaSongbird.setListenerPosition(x, y, z);
      toaSongbird.setListenerPosition(x, y, z);
    }
  }
}

let onLoad = function() {
  // Create <audio> streaming audio source.
  audioContext = new AudioContext();
  let audioSource = 'resources/CubeSound.wav';
  let audioElement = document.createElement('audio');
  audioElement.src = audioSource;
  audioElement.load();
  audioElement.loop = true;
  let audioElementSource =
    audioContext.createMediaElementSource(audioElement);

  // Create gain nodes.
  noneGain = audioContext.createGain();
  pannerGain = audioContext.createGain();
  foaSongbirdGain = audioContext.createGain();
  toaSongbirdGain = audioContext.createGain();

  // Initialize Songbird and create Source(s).
  // Initialize PannerNode/Listener
  foaSongbird = new Songbird(audioContext, {ambisonicOrder: 1});
  toaSongbird = new Songbird(audioContext, {ambisonicOrder: 3});
  pannerNode = audioContext.createPanner();
  pannerNode.panningModel = 'HRTF';
  pannerNode.distanceModel = 'inverse';
  pannerNode.refDistance = Songbird.Utils.DEFAULT_MIN_DISTANCE;
  pannerNode.maxDistance = Songbird.Utils.DEFAULT_MAX_DISTANCE;
  foaSongbirdSource = foaSongbird.createSource();
  toaSongbirdSource = toaSongbird.createSource();

  // Connect audio graph.
  audioElementSource.connect(noneGain);
  audioElementSource.connect(pannerNode);
  audioElementSource.connect(foaSongbirdSource.input);
  audioElementSource.connect(toaSongbirdSource.input);
  pannerNode.connect(pannerGain);
  foaSongbird.output.connect(foaSongbirdGain);
  toaSongbird.output.connect(toaSongbirdGain);
  noneGain.connect(audioContext.destination);
  pannerGain.connect(audioContext.destination);
  foaSongbirdGain.connect(audioContext.destination);
  toaSongbirdGain.connect(audioContext.destination);

  // Initialize play button functionality.
  let sourcePlayback = document.getElementById('sourceButton');
  sourcePlayback.onclick = function(event) {
    if (event.target.textContent === 'Play') {
      event.target.textContent = 'Pause';
      audioElement.play();
    } else {
      event.target.textContent = 'Play';
      audioElement.pause();
    }
  };

  selectRenderingMode();

  // Assign event handlers.
  let renderingMode = document.getElementById('renderingMode');
  renderingMode.addEventListener('change', selectRenderingMode);

  let canvas = document.getElementById('canvas');
  let elements = [
    {
      icon: 'sourceIcon',
      x: 0.25,
      y: 0.25,
      radius: 0.04,
      alpha: 0.75,
      clickable: true,
    },
    {
      icon: 'listenerIcon',
      x: 0.5,
      y: 0.5,
      radius: 0.04,
      alpha: 0.333,
      clickable: false,
    },
  ];
  new CanvasControl(canvas, elements, updatePositions);
};

window.addEventListener('load', onLoad);
