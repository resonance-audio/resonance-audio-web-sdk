let audioContext;
let scene;
let audioElement;
let audioElementSource;
let source;
let audioReady = false;

/**
 * @private
 */
function initAudio() {
  audioContext = new (window.AudioContext || window.webkitAudioContext);

  // Create a (1st-order Ambisonic) ResonanceAudio scene.
  scene = new ResonanceAudio(audioContext);

  // Send scene's rendered binaural output to stereo out.
  scene.output.connect(audioContext.destination);

  // Set room acoustics properties.
  let dimensions = {
    width: 3.1,
    height: 2.5,
    depth: 3.4,
  };
  let materials = {
    left: 'brick-bare',
    right: 'curtain-heavy',
    front: 'marble',
    back: 'glass-thin',
    down: 'grass',
    up: 'transparent',
  };
  scene.setRoomProperties(dimensions, materials);

  // Create an audio element. Feed into audio graph.
  audioElement = document.createElement('audio');
  audioElement.src = 'resources/cube-sound.wav';
  audioElement.load();
  audioElement.loop = true;

  audioElementSource = audioContext.createMediaElementSource(audioElement);

  // Create a Source, connect desired audio input to it.
  source = scene.createSource();
  audioElementSource.connect(source.input);

  // The source position is relative to the origin
  // (center of the room).
  source.setPosition(-0.707, -0.707, 0);

  audioReady = true;
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

  let canvas = document.getElementById('canvas');
  let elements = [
    {
      icon: 'sourceIcon',
      x: 0.25,
      y: 0.25,
      radius: 0.04,
      alpha: 0.333,
      clickable: false,
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
  new CanvasControl(canvas, elements);
};
window.addEventListener('load', onLoad);
