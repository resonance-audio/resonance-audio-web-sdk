let audioContext;
let audioSource = 'resources/CubeSound.wav';
let audioElement;
let foaSongbirdSource;
let toaSongbirdSource;
let pannerNode;
let foaSongbird;
let toaSongbird;
let noneGain;
let pannerGain;
let foaSongbirdGain;
let toaSongbirdGain;
let canvas;
let dimensions = {width: 5, depth: 5, height: 5};
let canvasControl;

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

function updatePositions() {
  for (let i = 0; i < ballPositions.length; i++) {
    let x = ballPositions[i][0] / pixelsPerMeter - dimensions.width / 2;
    let y = 0;
    let z = ballPositions[i][1] / pixelsPerMeter - dimensions.depth / 2;
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

let pixelsPerMeter = 64;
let ballRadius = 20;
let ballLabels = ['S', 'L'];
let ballColors = ['red', 'green'];
let ballPositions = [[0, 0], [0, 0]];
function drawRoom() {
  let canvasContext = canvas.getContext('2d');
  canvasContext.clearRect(0, 0, canvas.width, canvas.height);

  canvasContext.beginPath();
  canvasContext.rect(0, 0, canvas.width, canvas.height);
  canvasContext.lineWidth = 4;
  canvasContext.stroke();

  for (let i = 0; i < ballLabels.length; i++) {
    canvasContext.beginPath();
    if (i == 1) {
      canvasContext.rect(ballPositions[i][0] - ballRadius,
        ballPositions[i][1] - ballRadius, 2 * ballRadius,
        2 * ballRadius);
    } else {
      canvasContext.arc(ballPositions[i][0], ballPositions[i][1], ballRadius,
        0, 2 * Math.PI);
    }
    canvasContext.fillStyle = ballColors[i];
    canvasContext.fill();

    canvasContext.beginPath();
    canvasContext.textAlign = 'center';
    canvasContext.textBaseline = 'middle';
    canvasContext.font = 'bold 20px monospace';
    canvasContext.fillStyle = 'white';
    canvasContext.fillText(ballLabels[i], ballPositions[i][0],
      ballPositions[i][1]);
  }
}

function getCursorPosition(canvas, evt) {
  let rect = canvas.getBoundingClientRect();
  return {
    x: evt.clientX - rect.left,
    y: evt.clientY - rect.top
  };
}

function getNearestBall(mousePos) {
  let minDistance = 1e8;
  let minIndex = -1;
  for (let i = 0; i < ballPositions.length; i++) {
    let dx = Math.abs(mousePos.x - ballPositions[i][0]);
    let dy = Math.abs(mousePos.y - ballPositions[i][1]);
    let distance = dx + dy; // Manhattan distance.
    if (distance < minDistance && distance < 2 * ballRadius) {
      minDistance = distance;
      minIndex = i;
    }
  }
  return minIndex;
}

let onLoad = function() {
  // Assign event handlers.
  let renderingMode = document.getElementById('renderingMode');
  renderingMode.addEventListener('change', selectRenderingMode);

  canvas = document.getElementById('canvas');
  let canvasDiv = document.getElementById('canvasDiv');
  let canvasWidth = canvasDiv.clientWidth;
  let maxCanvasSize = 640;
  if (canvasWidth > maxCanvasSize) {
    canvasWidth = maxCanvasSize;
  }
  canvas.width = canvasWidth;
  canvas.height = canvasWidth;

  let elements = [
    {
      label: 'S',
      x: 0.2,
      y: 0.2,
      radius: 0.04,
      color: 'red',
    },
    {
      label: 'L',
      x: 0.5,
      y: 0.5,
      radius: 0.04,
      color: 'blue',
    },
  ];
  canvasControl = new CanvasControl(canvas, elements);

  audioContext = new AudioContext();
  let audioElementSource;

  // Create <audio> streaming audio source.
  audioElement = document.createElement('audio');
  audioElement.src = audioSource;
  audioElement.load();
  audioElement.loop = true;
  audioElementSource =
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
  selectRenderingMode();

  // Initialize play button functionality.
  sourcePlayback = document.getElementById('eSourcePlayback');
  sourcePlayback.onclick = function(event) {
    if (event.target.textContent === 'Play') {
      event.target.textContent = 'Pause';
      audioElement.play();
    } else {
      event.target.textContent = 'Play';
      audioElement.pause();
    }
  };
};

window.addEventListener('load', onLoad);
