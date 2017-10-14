let alpha = 0;
let aziPhase = [];
let elePhase = [];
let aziRate = [];
let eleRate = [];
let radPhase = [];
let radRate = [];
let radRange = 20;
let radMin = 1;
let songbird, audioContext;
let birdFilenames = [
  'resources/bird01.wav',
  'resources/bird02.wav',
  'resources/bird03.wav',
  'resources/bird04.wav',
  'resources/bird05.wav',
  'resources/bird06.wav',
  'resources/bird07.wav',
  'resources/bird08.wav',
  'resources/bird09.wav',
];
let birdProb = [100, 100, 100, 100, 0, 0, 100, 100, 100];
let numberOfProbs = 0;
birdProb.forEach(function(elem) {
  numberOfProbs += elem;
});
let numberOfBirds = 16;
let birdElements = [];
let birdElementSources = [];
let birdSources = [];
let deltaTime = 100;

function updatePositions() {
  let x, y, z;
  for (let i = 0; i < numberOfBirds; i++) {
    let theta = alpha * aziRate[i] + aziPhase[i];
    let phi = alpha * eleRate[i] + elePhase[i];
    let rad = (Math.cos(alpha * radRate[i] + radPhase[i]) / 2 + 0.5) *
      radRange + radMin;
    x = Math.sin(theta) * Math.cos(phi) * rad;
    y = Math.sin(phi) * rad;
    z = Math.cos(theta) * Math.cos(phi) * rad;
    birdSources[i].setPosition(x, y, z);
  }
  alpha += deltaTime / 1000;
}

let onLoad = function() {
  audioContext = new AudioContext();

  // Create a (1st-order Ambisonic) Songbird scene.
  songbird = new Songbird(audioContext, {ambisonicOrder: 3});

  // Send songbird's binaural output to stereo out.
  songbird.output.connect(audioContext.destination);

  for (let i = 0; i < numberOfBirds; i++) {
    birdElements[i] = document.createElement('audio');
    let randProb = Math.round(Math.random() * numberOfProbs);
    let filenameIndex = 0;
    for (let j = 0; j < birdProb.length; j++) {
      randProb -= birdProb[j];
      if (randProb <= 0) {
        filenameIndex = j;
        break;
      }
    }
    birdElements[i].src = birdFilenames[filenameIndex];
    birdElements[i].loop = true;
    birdElementSources[i] =
      audioContext.createMediaElementSource(birdElements[i]);
    birdSources[i] = songbird.createSource({gain: 1 / numberOfBirds});
    birdElementSources[i].connect(birdSources[i].input);
  }

  for (let i = 0; i < numberOfBirds; i++) {
    aziPhase[i] = Math.random() * Math.PI * 2;
    aziRate[i] = Math.random() * 2 + 0.1;
    elePhase[i] = Math.random() * Math.PI * 2;
    eleRate[i] = Math.random() * 2 + 0.1;
    radPhase[i] = Math.random() * Math.PI * 2;
    radRate[i] = Math.random() * 0.1 + 0.01;
  }

  for (let i = 0; i < numberOfBirds; i++) {
    birdElements[i].play();
  }
  setInterval(updatePositions, deltaTime);
};
window.addEventListener('load', onLoad);