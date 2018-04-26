let numberOfBirds = 8;
let elements;
let canvasControl;
let deltaTimeMilliseconds = 33;
let areaSize = 10;
let speedRange = 0.2;
let speedMinimum = 0.1;
let neighborDistance = 0.1;
let alignmentWeight = 0.3;
let cohesionWeight = 0.1;
let separationWeight = 0.15;
let radiusMinimum = 0.015;
let radiusRange = 0.025 - radiusMinimum;
let audioContext;
let audioElements = [];
let soundSources = [];
let intervalCallback;
let audioReady = false;

/**
 * @param {Object} elements
 * @private
 */
function updatePositions(elements) {
  if (!audioReady)
    return;

  for (let i = 0; i < elements.length - 1; i++) {
    let x = (elements[i].x - 0.5) * areaSize / 2;
    let y = (elements[i].z - 0.5) * areaSize / 2;
    let z = (elements[i].y - 0.5) * areaSize / 2;
    if (i < elements.length - 1) {
      soundSources[i].setPosition(x, y, z);
    }
  }
}

/**
 * @param {Object} elements
 * @private
 */
function integrateBirdPaths(elements) {
  for (let i = 0; i < elements.length - 1; i++) {
    let alignment = {x: 0, y: 0, z: 0};
    let cohesion = {x: 0, y: 0, z: 0};
    let separation = {x: 0, y: 0, z: 0};
    let numberOfNeighbors = 0;

    for (let j = 0; j < elements.length - 1; j++) {
      if (i !== j) {
        let dx = elements[i].x - elements[j].x;
        let dy = elements[i].y - elements[j].y;
        let dz = elements[i].z - elements[j].z;
        let distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (distance < neighborDistance) {
          alignment.x += elements[j].vx;
          alignment.y += elements[j].vy;
          alignment.z += elements[j].vz;
          cohesion.x += elements[j].x;
          cohesion.y += elements[j].y;
          cohesion.z += elements[j].z;
          separation.x += dx;
          separation.y += dy;
          separation.z += dz;
          numberOfNeighbors++;
        }
      }
    }
    if (numberOfNeighbors > 0) {
      // Normalize alignment.
      let alignmentNorm = Math.sqrt(alignment.x * alignment.x +
        alignment.y * alignment.y + alignment.z * alignment.z);
      alignment.x /= alignmentNorm;
      alignment.y /= alignmentNorm;
      alignment.z /= alignmentNorm;

      // Normalize cohesion.
      cohesion.x /= numberOfNeighbors;
      cohesion.y /= numberOfNeighbors;
      cohesion.z /= numberOfNeighbors;
      cohesion.x -= elements[i].x;
      cohesion.y -= elements[i].y;
      cohesion.z -= elements[i].z;
      let cohesionNorm = Math.sqrt(cohesion.x * cohesion.x +
        cohesion.y * cohesion.y + cohesion.z * cohesion.z);
      cohesion.x /= cohesionNorm;
      cohesion.y /= cohesionNorm;
      cohesion.z /= cohesionNorm;

      // Normalize separation.
      let separationNorm = Math.sqrt(separation.x * separation.x +
        separation.y * separation.y + separation.z * separation.z);
      separation.x /= separationNorm;
      separation.y /= separationNorm;
      separation.z /= separationNorm;

      elements[i].vx += alignmentWeight * alignment.x +
        cohesionWeight * cohesion.x + separationWeight * separation.x;
      elements[i].vy += alignmentWeight * alignment.y +
        cohesionWeight * cohesion.y + separationWeight * separation.y;
      elements[i].vz += alignmentWeight * alignment.z +
        cohesionWeight * cohesion.z + separationWeight * separation.z;

      let elementVelocityNorm = Math.sqrt(elements[i].vx * elements[i].vx +
        elements[i].vy * elements[i].vy + elements[i].vz * elements[i].vz);
      elements[i].vx = elements[i].vx / elementVelocityNorm * elements[i].speed;
      elements[i].vy = elements[i].vy / elementVelocityNorm * elements[i].speed;
      elements[i].vz = elements[i].vz / elementVelocityNorm * elements[i].speed;
    }

    elements[i].x += elements[i].vx * deltaTimeMilliseconds / 1000;
    elements[i].y += elements[i].vy * deltaTimeMilliseconds / 1000;
    elements[i].z += elements[i].vz * deltaTimeMilliseconds / 1000;

    if (elements[i].x < 0 || elements[i].x > 1 ||
        elements[i].y < 0 || elements[i].y > 1 ||
        elements[i].z < 0 || elements[i].z > 1) {
      elements[i].x = Math.min(1, Math.max(0, elements[i].x));
      elements[i].y = Math.min(1, Math.max(0, elements[i].y));
      elements[i].z = Math.min(1, Math.max(0, elements[i].z));
      elements[i].vx = -elements[i].vx;
      elements[i].vy = -elements[i].vy;
      elements[i].vz = -elements[i].vz;
    }

    elements[i].radius =
      (1 - Math.abs(elements[i].z - 0.5) * 2) * radiusRange + radiusMinimum;
  }
  canvasControl.draw();
}

/**
 * @private
 */
function initAudio() {
  audioContext = new (window.AudioContext || window.webkitAudioContext);
  let audioSources = [
    'resources/bird-1.wav',
    'resources/bird-2.wav',
    'resources/bird-3.wav',
    'resources/bird-4.wav',
    'resources/bird-5.wav',
    'resources/bird-6.wav',
  ];
  let audioElementSources = [];
  for (let i = 0; i < numberOfBirds; i++) {
    let birdIndex =
      Math.round(Math.random() * (audioSources.length - 1));
    audioElements[i] = document.createElement('audio');
    audioElements[i].src = audioSources[birdIndex];
    audioElements[i].load();
    audioElements[i].loop = true;
    audioElementSources[i] =
      audioContext.createMediaElementSource(audioElements[i]);
  }

  let scene = new ResonanceAudio(audioContext, {
    ambisonicOrder: 3,
    dimensions: {
      width: 20, height: 6, depth: 20,
    },
    materials: {
      left: 'transparent', right: 'transparent',
      front: 'transparent', back: 'transparent',
      up: 'transparent', down: 'grass',
    },
  });
  for (let i = 0; i < numberOfBirds; i++) {
    soundSources[i] = scene.createSource();
    audioElementSources[i].connect(soundSources[i].input);
  }

  let gain = audioContext.createGain();
  gain.gain.value = 1 / (2 * numberOfBirds);
  scene.output.connect(gain);
  gain.connect(audioContext.destination);

  audioReady = true;
}

let onLoad = function() {
  let canvas = document.getElementById('canvas');
  elements = [];
  for (let i = 0; i < numberOfBirds; i++) {
    elements[i] = {
      icon: 'birdIcon',
      x: Math.random(),
      y: Math.random(),
      z: Math.random(),
      radius: 0.02,
      alpha: 0.333,
      clickable: false,
    };
    elements[i].speed = Math.random() * speedRange + speedMinimum;
    let phaseAzi = Math.random() * Math.PI * 2;
    let phaseEle = Math.random() * Math.PI * 2;
    elements[i].vx =
      Math.cos(phaseAzi) * Math.cos(phaseEle) * elements[i].speed;
    elements[i].vy =
      Math.sin(phaseAzi) * Math.cos(phaseEle) * elements[i].speed;
    elements[i].vz =
      Math.sin(phaseEle) * elements[i].speed;
  }
  elements[elements.length] = {
    icon: 'listenerIcon',
    x: 0.5,
    y: 0.5,
    radius: 0.04,
    alpha: 0.333,
    clickable: false,
  };
  canvasControl = new CanvasControl(canvas, elements, updatePositions);

  // Initialize play button functionality.
  let sourcePlayback = document.getElementById('sourceButton');
  sourcePlayback.onclick = function(event) {
    switch (event.target.textContent) {
      case 'Play': {
        if (!audioReady) {
          initAudio();
        }
        event.target.textContent = 'Pause';
        intervalCallback = window.setInterval(
          integrateBirdPaths, deltaTimeMilliseconds, elements);
        for (let i = 0; i < numberOfBirds; i++) {
          audioElements[i].play();
        }
      }
      break;
      case 'Pause': {
        event.target.textContent = 'Play';
        window.clearInterval(intervalCallback);
        for (let i = 0; i < numberOfBirds; i++) {
          audioElements[i].pause();
        }
      }
      break;
    }
  };
};
window.addEventListener('load', onLoad);
