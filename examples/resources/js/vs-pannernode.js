let audioContext;
let audioElement;
let audioElementSource;
let foaSource;
let toaSource;
let pannerNode;
let foaScene;
let toaScene;
let noneGain;
let pannerGain;
let foaGain;
let toaGain;
let dimensions = {width: 1, height: 1, depth: 1};
let audioReady = false;

/**
 * Select the desired rendering mode.
 * @param {Object} event
 * @private
 */
function selectRenderingMode(event) {
  if (!audioReady)
    return;

  switch (document.getElementById('renderingMode').value) {
    case 'toa':
    {
      noneGain.gain.value = 0;
      pannerGain.gain.value = 0;
      foaGain.gain.value = 0;
      toaGain.gain.value = 1;
    }
    break;
    case 'foa':
    {
      noneGain.gain.value = 0;
      pannerGain.gain.value = 0;
      foaGain.gain.value = 1;
      toaGain.gain.value = 0;
    }
    break;
    case 'panner-node':
    {
      noneGain.gain.value = 0;
      pannerGain.gain.value = 1;
      foaGain.gain.value = 0;
      toaGain.gain.value = 0;
    }
    break;
    case 'none':
    default:
    {
      noneGain.gain.value = 1;
      pannerGain.gain.value = 0;
      foaGain.gain.value = 0;
      toaGain.gain.value = 0;
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
  if (!audioReady)
    return;

  for (let i = 0; i < elements.length; i++) {
    let x = (elements[i].x - 0.5) * dimensions.width / 2;
    let y = 0;
    let z = (elements[i].y - 0.5) * dimensions.depth / 2;
    if (i == 0) {
      pannerNode.setPosition(x, y, z);
      foaSource.setPosition(x, y, z);
      toaSource.setPosition(x, y, z);
    } else {
      audioContext.listener.setPosition(x, y, z);
      foaScene.setListenerPosition(x, y, z);
      toaScene.setListenerPosition(x, y, z);
    }
  }
}

/**
 * @private
 */
function initAudio() {
  // Create <audio> streaming audio source.
  audioContext = new (window.AudioContext || window.webkitAudioContext);
  let audioSource = 'resources/cube-sound.wav';
  audioElement = document.createElement('audio');
  audioElement.src = audioSource;
  audioElement.crossOrigin = 'anonymous';
  audioElement.load();
  audioElement.loop = true;
  audioElementSource =
    audioContext.createMediaElementSource(audioElement);

  // Create gain nodes.
  noneGain = audioContext.createGain();
  pannerGain = audioContext.createGain();
  foaGain = audioContext.createGain();
  toaGain = audioContext.createGain();

  // Initialize scene and create Source(s).
  // Initialize PannerNode/Listener
  foaScene = new ResonanceAudio(audioContext, {ambisonicOrder: 1});
  toaScene = new ResonanceAudio(audioContext, {ambisonicOrder: 3});
  pannerNode = audioContext.createPanner();
  pannerNode.panningModel = 'HRTF';
  pannerNode.distanceModel = 'inverse';
  pannerNode.refDistance = ResonanceAudio.Utils.DEFAULT_MIN_DISTANCE;
  pannerNode.maxDistance = ResonanceAudio.Utils.DEFAULT_MAX_DISTANCE;
  foaSource = foaScene.createSource();
  toaSource = toaScene.createSource();

  // Connect audio graph.
  audioElementSource.connect(noneGain);
  audioElementSource.connect(pannerNode);
  audioElementSource.connect(foaSource.input);
  audioElementSource.connect(toaSource.input);
  pannerNode.connect(pannerGain);
  foaScene.output.connect(foaGain);
  toaScene.output.connect(toaGain);
  noneGain.connect(audioContext.destination);
  pannerGain.connect(audioContext.destination);
  foaGain.connect(audioContext.destination);
  toaGain.connect(audioContext.destination);

  audioReady = true;
  selectRenderingMode();
}

let onLoad = function() {
  // Initialize play button functionality.
  let sourcePlayback = document.getElementById('sourceButton');
  sourcePlayback.onclick = function(event) {
    switch (event.target.textContent) {
      case 'Play': {
        if (!audioReady) {
          initAudio();
        }
        event.target.textContent = 'Pause';
        audioElement.play();
      }
      break;
      case 'Pause': {
        event.target.textContent = 'Play';
        audioElement.pause();
      }
      break;
    }
  };

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
