// Define source audio files.
var audioSources = [
  'resources/CubeSound.wav', 'resources/SpeechSample.wav',
  'resources/Music.wav',
];

// Attach labels to associated input elements.
var labels = document.getElementsByTagName('label');
for (var i = 0; i < labels.length; i++) {
  if (labels[i].htmlFor != '') {
    var elem = document.getElementById(labels[i].htmlFor);
    if (elem)
      elem.label = labels[i];
  }
}

// This is used to scale the appropriate dimension.
var dimensions = {};
var materials = {}
function pollDimensionsAndMaterials () {
  // Update dimensions.
  dimensions.width = Math.max(0,
    Number(document.getElementById('eWidthNumber').value));
  dimensions.height = Math.max(0,
    Number(document.getElementById('eHeightNumber').value));
  dimensions.depth = Math.max(0,
    Number(document.getElementById('eDepthNumber').value));

  // Update materials.
  materials.left = document.getElementById('eLeftMaterial').value;
  materials.right = document.getElementById('eRightMaterial').value
  materials.up = document.getElementById('eUpMaterial').value;
  materials.down = document.getElementById('eDownMaterial').value;
  materials.front = document.getElementById('eFrontMaterial').value;
  materials.back = document.getElementById('eBackMaterial').value;
}


function updatePositions () {
  for (var i = 0; i < ballPositions.length; i++) {
    var x = ballPositions[i][0] / pixelsPerMeter - dimensions.width / 2;
    var y = dimensions.height / 2 * ballHeightsInPercent[i];
    var z = ballPositions[i][1] / pixelsPerMeter - dimensions.depth / 2;
    if (i < ballPositions.length - 1) {
      songbirdSource[i].setPosition(x, y, z);
    } else {
      songbird.setListenerPosition(x, y, z);
    }
  }
}


// Initial positions (0=sourceA, 1=sourceB, 2=sourceC, 3=listener).
var initialBallRelativePositions = [
  [0.4, 0.3], [0.7, 0.8], [0.1, 0.5], [0.5, 0.5],
];
var ballHeightsInPercent = [0.25, -0.05, 0, 0];
var ballPositions = [[0, 0], [0, 0], [0, 0], [0, 0]];
var ballColors = ['red', 'blue', 'orange', 'green'];
var ballLabels = ['A', 'B', 'C', 'L'];
var ballRadius = 12;
var ballCurrentIndex = -1;
var pixelsPerMeter = 64;
function drawRoom(canvas) {
  var context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);

  // Draw room.
  context.beginPath();
  context.rect(0, 0, canvas.width, canvas.height);
  context.lineWidth = 4;
  context.stroke();

  // Draw balls.
  for (var i = 0; i < ballPositions.length; i++) {
    context.beginPath();
    if (i < ballPositions.length - 1) {
      context.arc(ballPositions[i][0], ballPositions[i][1],
        ballRadius, 0, 2*Math.PI);
    } else {
      context.rect(ballPositions[i][0] - ballRadius,
        ballPositions[i][1] - ballRadius, 2 * ballRadius, 2 * ballRadius);
    }
    context.fillStyle = ballColors[i];
    context.fill();

    context.beginPath();
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.font = 'bold 16px monospace';
    context.fillStyle = 'white';
    context.fillText(ballLabels[i],
      ballPositions[i][0], ballPositions[i][1]);
  }
}


function getMousePos(canvas, evt) {
  var rect = canvas.getBoundingClientRect();
  return {
    x: evt.clientX - rect.left,
    y: evt.clientY - rect.top
  };
}


function getNearestBall(mousePos) {
  var minDistance = 1e8;
  var minIndex = -1;
  for (var i = 0; i < ballPositions.length; i++) {
    var dx = Math.abs(mousePos.x - ballPositions[i][0]);
    var dy = Math.abs(mousePos.y - ballPositions[i][1]);
    var distance = dx + dy; // Manhattan distance.
    if (distance < minDistance && distance < 2 * ballRadius) {
      minDistance = distance;
      minIndex = i;
    }
  }
  return minIndex;
}


var canvas = document.getElementById('canvas');
var context = canvas.getContext('2d');
function initializeCanvas () {
  // Update canvas size.
  var context = canvas.getContext('2d');
  context.canvas.width = Math.round(dimensions.width * pixelsPerMeter);
  context.canvas.height = Math.round(dimensions.depth * pixelsPerMeter);

  // Initialize ball positions in pixels.
  for (var i = 0; i < ballPositions.length; i++) {
    ballPositions[i][0] =
      initialBallRelativePositions[i][0] * canvas.width;
    ballPositions[i][1] =
      initialBallRelativePositions[i][1] * canvas.height;
  }
  drawRoom(canvas);
  updatePositions();
}


// Global mouseDown tracking.
var mouseDown = false;
document.addEventListener('mousedown', function (event) {
  mouseDown = true;
});
document.addEventListener('mouseup', function (event) {
  mouseDown = false;
  ballCurrentIndex = -1;
});


canvas.addEventListener('mousemove', function (event) {
  if (mouseDown) {
    var mousePos = getMousePos(canvas, event);
    if (ballCurrentIndex > -1) {
      ballPositions[ballCurrentIndex][0] = mousePos.x;
      ballPositions[ballCurrentIndex][1] = mousePos.y;
    }
    drawRoom(canvas);
    updatePositions();
  }
});
canvas.addEventListener('mousedown', function (event) {
  var mousePos = getMousePos(canvas, event);
  ballCurrentIndex = getNearestBall(mousePos);
  if (ballCurrentIndex > -1) {
    ballPositions[ballCurrentIndex][0] = mousePos.x;
    ballPositions[ballCurrentIndex][1] = mousePos.y;
  }
  drawRoom(canvas);
  updatePositions();
});


function updateRoomProperties() {
  pollDimensionsAndMaterials();
  songbird.setRoomProperties(dimensions, materials);
}


function updateDimensions() {
  updateRoomProperties();
  initializeCanvas();
}


var defaultMaterials = {
  'eLeftMaterial': 'brick-bare', 'eRightMaterial': 'brick-bare',
  'eFrontMaterial': 'brick-bare', 'eBackMaterial': 'brick-bare',
  'eUpMaterial': 'wood-ceiling', 'eDownMaterial': 'concrete-block-coarse'
};
function populateMaterialDropdowns() {
  // Build drop-down menus.
  var keys = Object.keys(Songbird.Utils.ROOM_MATERIAL_COEFFICIENTS);
  var selects = [
    'eLeftMaterial', 'eRightMaterial', 'eDownMaterial',
    'eUpMaterial', 'eFrontMaterial', 'eBackMaterial'
  ];
  for (var i = 0; i < selects.length; i++) {
    var select = document.getElementById(selects[i]);
    for (var j = 0; j < keys.length; j++) {
      var option = document.createElement('option');
      option.value = keys[j];
      option.textContent = keys[j];
      if (keys[j] == defaultMaterials[selects[i]]) {
        option.selected = true;
      }
      select.appendChild(option);
    }
  }
}


var audioElements = [];
var songbirdSource = [];
var onLoad = function () {
  // Populate and poll intial values.
  populateMaterialDropdowns();
  pollDimensionsAndMaterials();

  var context = new AudioContext();
  var audioElementSources = Array(audioSources.length);

  // Create <audio> streaming audio sources.
  for (var i = 0; i < audioSources.length; i++) {
    audioElements[i] = document.createElement('audio');
    audioElements[i].src = audioSources[i];
    audioElements[i].load();
    audioElements[i].loop = true;
    audioElementSources[i] =
      context.createMediaElementSource(audioElements[i]);
  }

  // Initialize Songbird and create Source(s).
  songbird = new Songbird(context, {
    ambisonicOrder: 3,
    dimensions: dimensions,
    materials: materials
  });
  for (var i = 0; i < audioSources.length; i++) {
    songbirdSource[i] = songbird.createSource();
    audioElementSources[i].connect(songbirdSource[i].input);
  }
  songbird.output.connect(context.destination);

  // Initialize play button functionality.
  var sourcesPlayback = Array(audioSources.length);
  sourcesPlayback[0] = document.getElementById('eSourceAPlayback');
  sourcesPlayback[1] = document.getElementById('eSourceBPlayback');
  sourcesPlayback[2] = document.getElementById('eSourceCPlayback');
  for (var i = 0; i < audioSources.length; i++) {
    sourcesPlayback[i].index = i;
    sourcesPlayback[i].onclick = function (event) {
      if (event.target.textContent === 'Play') {
        event.target.textContent = 'Pause';
        audioElements[event.target.index].play();
      } else {
        event.target.textContent = 'Play';
        audioElements[event.target.index].pause();
      }
    };
  }

  // Setup demo.
  initializeCanvas();
};
window.addEventListener('load', onLoad);