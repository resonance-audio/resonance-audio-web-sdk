const sampleRate = 48000;
const numberOutputChannels = 2;
const durationSeconds = 1;

let playback;

/**
 * Select appropriate dimensions and materials.
 * @return {Object}
 * @private
 */
function selectDimensionsAndMaterials() {
  let reverbLength = document.getElementById('reverbLengthSelect').value;
  switch (reverbLength) {
    case 'none':
    default:
    {
      return {
        dimensions: {
          width: 0,
          height: 0,
          depth: 0,
        },
        materials: {
          left: 'transparent',
          right: 'transparent',
          front: 'transparent',
          back: 'transparent',
          up: 'transparent',
          down: 'transparent',
        },
      };
    }
    break;
    case 'short':
    {
      return {
        dimensions: {
          width: 1.5,
          height: 1.5,
          depth: 1.5,
        },
        materials: {
          left: 'uniform',
          right: 'uniform',
          front: 'uniform',
          back: 'uniform',
          up: 'uniform',
          down: 'uniform',
        },
      };
    }
    break;
    case 'medium':
    {
      return {
        dimensions: {
          width: 6,
          height: 6,
          depth: 6,
        },
        materials: {
          left: 'uniform',
          right: 'uniform',
          front: 'uniform',
          back: 'uniform',
          up: 'uniform',
          down: 'uniform',
        },
      };
    }
    break;
    case 'long':
    {
      return {
        dimensions: {
          width: 24,
          height: 24,
          depth: 24,
        },
        materials: {
          left: 'uniform',
          right: 'uniform',
          front: 'uniform',
          back: 'uniform',
          up: 'uniform',
          down: 'uniform',
        },
      };
    }
    break;
  }
}

/**
 * Begin processing the benchmark.
 * @private
 */
function startBenchmark() {
  let audioContext =
    new OfflineAudioContext(numberOutputChannels,
      durationSeconds * sampleRate, sampleRate);
  if (typeof webkitOfflineAudioContext !== 'undefined') {
    playback.textContent = 'Begin';
    playback.disabled = false;
    let statusBar = document.getElementById('statusBar');
    statusBar.innerHTML = 'Benchmarks are unsupported on Safari/iOS.';
    statusBar.hidden = false;
    let progressBar = document.getElementById('progressBar');
    progressBar.hidden = true;
    return;
  }

  let audioElement = document.createElement('audio');
  audioElement.src = 'resources/cube-sound.wav';
  audioElement.load();
  audioElement.loop = true;
  let audioElementSource = audioContext.createMediaElementSource(audioElement);

  let numberSources =
    Number(document.getElementById('numberSourcesNumber').value);
  if (numberSources < 1) {
    playback.textContent = 'Begin';
    playback.disabled = false;
    return;
  }

  let renderingMode = document.getElementById('renderingModeSelect');
  let order = -1;
  switch (renderingMode.value) {
    case 'foa':
    {
      order = 1;
    }
    break;
    case 'soa':
    {
      order = 2;
    }
    break;
    case 'toa':
    {
      order = 3;
    }
    break;
  }

  let sources = [];
  if (order > -1) {
    let options = selectDimensionsAndMaterials();
    let scene = new ResonanceAudio(audioContext, {
      ambisonicOrder: order,
      dimensions: options.dimensions,
      materials: options.materials,
    });
    for (let i = 0; i < numberSources; i++) {
      sources[i] = scene.createSource();
      audioElementSource.connect(sources[i].input);
    }
    scene.output.connect(audioContext.destination);
  } else {
    for (let i = 0; i < numberSources; i++) {
      sources[i] = audioContext.createPanner();
      sources[i].panningModel = 'HRTF';
      sources[i].distanceModel = 'inverse';
      sources[i].refDistance = 0.1;
      sources[i].maxDistance = 1000;
      audioElementSource.connect(sources[i]);
      sources[i].connect(audioContext.destination);
    }
  }

  for (let i = 0; i < numberSources; i++) {
    let theta = Math.random() * Math.PI * 2;
    let phi = Math.acos(Math.random() * 2 - 1);
    let x = Math.cos(theta) * Math.sin(phi);
    let y = Math.cos(phi);
    let z = Math.sin(theta) * Math.sin(phi);
    sources[i].setPosition(x, y, z);
  }

  audioElement.currentTime = 0;
  audioElement.play();

  window.setTimeout(function() {
    let startTime = Date.now();
    audioContext.startRendering().then(function(renderedBuffer) {
      playback.textContent = 'Begin';
      playback.disabled = false;
      let currentTime = (Date.now() - startTime) / 1000;
      let statusBar = document.getElementById('statusBar');
      statusBar.innerHTML = 'Elapsed Time: ' + currentTime + ' seconds.';
      statusBar.hidden = false;
      let progressBar = document.getElementById('progressBar');
      progressBar.hidden = true;
    }).catch(function(error) {
      console.log(error);
    });
  }, 100);
}

let onLoad = function() {
  playback = document.getElementById('playback');
  playback.addEventListener('click', function(event) {
    if (event.target.textContent == 'Begin') {
      playback.disabled = true;
      playback.textContent = 'Please Wait';
      let statusBar = document.getElementById('statusBar');
      statusBar.hidden = true;
      let progressBar = document.getElementById('progressBar');
      progressBar.hidden = false;
      window.setTimeout(startBenchmark, 100);
    } else {
      playback.textContent = 'Begin';
      playback.disabled = false;
    }
  });
  let reverbLength = document.getElementById('reverbLengthSelect');
  let renderingMode = document.getElementById('renderingModeSelect');
  renderingMode.addEventListener('change', function(event) {
    switch (event.target.value) {
      case 'panner-node':
      {
        reverbLength.disabled = true;
      }
      break;
      default:
      {
        reverbLength.disabled = false;
      }
      break;
    }
  });
};
window.addEventListener('load', onLoad);
