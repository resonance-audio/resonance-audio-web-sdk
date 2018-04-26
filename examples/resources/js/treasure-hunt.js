let audioContext;
let audioElement;
let htmlElement;
let renderer;
let visualScene;
let camera;
let mesh;
let isCursorDown = false;
let cursorDown;
let screenPercentToHorizontalAngleSpeed = 90;
let screenPercentToVerticalAngleSpeed = 90;
let azimuth = 0;
let elevation = 0;
let clickTime = 0;
let audioScene;
let source;
let dimensions = {
  width: 10, height: 7, depth: 10,
};
let materials = {
  left: 'uniform', right: 'uniform',
  front: 'uniform', back: 'uniform',
  up: 'uniform', down: 'uniform',
};
let defaultSourceRadius = 3;
let useDragControls = true;
let alphaInit = 0;
let betaInit = 0;
let gammaInit = 0;
let lastMatrixUpdate = 0;
let audioReady = false;
let cursorStayStill = false;

/**
 * Compute rotation matrix.
 * @param {Number} xAngle
 * @param {Number} yAngle
 * @param {Number} zAngle
 * @private
 */
function updateAngles(xAngle, yAngle, zAngle) {
  let deg2rad = Math.PI / 180;
  let euler = new THREE.Euler(
    xAngle * deg2rad,
    yAngle * deg2rad,
    zAngle * deg2rad,
    'YXZ');
  let matrix = new THREE.Matrix4().makeRotationFromEuler(euler);
  camera.setRotationFromMatrix(matrix);
  if (!audioReady)
    return;

  if (Date.now() - lastMatrixUpdate > 100) {
    audioScene.setListenerFromMatrix(camera.matrixWorld);
  }
}

/**
 * Get cursor position on canvas.
 * @param {Object} event
 * @return {Object}
 * @private
 */
function getCursorPosition(event) {
  let cursorX;
  let cursorY;
  let rect = htmlElement.getBoundingClientRect();
  if (event.touches !== undefined) {
    cursorX = event.touches[0].clientX;
    cursorY = event.touches[0].clientY;
  } else {
    cursorX = event.clientX;
    cursorY = event.clientY;
  }
  return {
    x: cursorX - rect.left,
    y: cursorY - rect.top,
  };
}

/**
 * @param {Object} event
 * @private
 */
function cursorDownFunc(event) {
  cursorDown = getCursorPosition(event);
  isCursorDown = true;
  document.body.style = 'overflow: hidden;';
  cursorStayStill = true;
}

/**
 * @param {Object} event
 * @private
 */
function cursorMoveFunc(event) {
  if (isCursorDown) {
    let rect = htmlElement.getBoundingClientRect();
    let cursorMove = getCursorPosition(event);
    if (Math.abs(cursorMove.x) > 1 || Math.abs(cursorMove.y) > 1) {
      let cursorDiff = {
        x: (cursorMove.x - cursorDown.x) / rect.width,
        y: (cursorMove.y - cursorDown.y) / rect.height,
      };
      cursorDown = cursorMove;
      azimuth += cursorDiff.x * screenPercentToHorizontalAngleSpeed;
      elevation += cursorDiff.y * screenPercentToVerticalAngleSpeed;
      if (elevation > 90) {
        elevation = 90;
      }
      if (elevation < -90) {
        elevation = -90;
      }
      azimuth = azimuth % 360;
      cursorStayStill = false;
    }
  }
}

/**
 * @param {Object} event
 * @private
 */
function cursorUpFunc(event) {
  isCursorDown = false;
  document.body.style = '';
  if (cursorStayStill) {
    if (clickTime == 0) {
      clickTime = Date.now();
    } else {
      if (Date.now() - clickTime < 800) {
        clickTime = 0;
        moveSource();
      } else {
        clickTime = Date.now();
      }
    }
  }
  cursorStayStill = false;
}

/**
 * @private
 */
function moveSource() {
  let randomAzimuth = Math.random() * 2 * Math.PI;
  let randomElevation = Math.acos(2 * Math.random() - 1);
  let x =
    Math.cos(randomAzimuth) * Math.sin(randomElevation) * defaultSourceRadius;
  let y = Math.cos(randomElevation) * defaultSourceRadius;
  let z =
    Math.sin(randomAzimuth) * Math.sin(randomElevation) * defaultSourceRadius;
  mesh.position.set(x, y, z);
  if (!audioReady)
    return;

  source.setPosition(x, y, z);
}

let prevTime = performance.now();
const rotateSpeed = 1;
/**
 * @private
 */
function animate() {
  if (useDragControls) {
    updateAngles(elevation, azimuth, 0);
  }

  let currTime = performance.now();
  let deltaTime = (currTime - prevTime) / 1000;
  prevTime = currTime;

  mesh.rotation.x += rotateSpeed * deltaTime;
  mesh.rotation.y += rotateSpeed * deltaTime;

  renderer.render(visualScene, camera);
}

let isFullscreen = false;
/**
 * @private
 */
function resize() {
  let width = htmlElement.parentNode.clientWidth;
  let height = htmlElement.parentNode.clientHeight;
  if (!isFullscreen) {
    height = width;
  }
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

/**
 * @private
 */
function initAudio() {
  // Create audio scene.
  audioContext = new (window.AudioContext || window.webkitAudioContext);
  audioScene = new ResonanceAudio(audioContext, {
    ambisonicOrder: 3,
    dimensions: dimensions,
    materials: materials,
  });
  source = audioScene.createSource();
  audioElement = document.createElement('audio');
  audioElement.src = 'resources/cube-sound.wav';
  audioElement.crossOrigin = 'anonymous';
  audioElement.load();
  audioElement.loop = true;
  audioElementSource =
    audioContext.createMediaElementSource(audioElement);
  audioElementSource.connect(source.input);
  audioScene.output.connect(audioContext.destination);
  source.setPosition(mesh.position.x, mesh.position.y, mesh.position.z);
  audioReady = true;
}

let onLoad = function() {
  htmlElement = document.getElementById('renderer');

  // Construct the 3D scene.
  visualScene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, 1, 0.1, 100);
  camera.position.set(0, 0, 0);

  let room = new THREE.Mesh(
    new THREE.BoxGeometry(
      dimensions.width, dimensions.height, dimensions.depth),
    new THREE.MeshPhongMaterial({
      side: THREE.BackSide,
    })
  );
  visualScene.add(room);

  let cameraLight = new THREE.PointLight(0xffffff, 0.9, 100);
  cameraLight.position.set(camera.position.x, camera.position.y,
    camera.position.z);
    visualScene.add(cameraLight);

  let ceilingLight = new THREE.DirectionalLight(0xffffff, 0.5);
  ceilingLight.position.set(0, 1, 0);
  visualScene.add(ceilingLight);

  mesh = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshPhongMaterial({
      color: 0xff0000,
    })
  );
  mesh.position.set(0, 0, -1 * defaultSourceRadius);
  visualScene.add(mesh);

  renderer = new THREE.WebGLRenderer({
    antialias: true,
  });
  htmlElement.appendChild(renderer.domElement);

  htmlElement.style.cursor = 'pointer';
  htmlElement.addEventListener('touchstart', function(event) {
    cursorDownFunc(event);
  });
  htmlElement.addEventListener('mousedown', function(event) {
    cursorDownFunc(event);
  });
  window.addEventListener('touchmove', function(event) {
    clickTime = 0;
    cursorMoveFunc(event);
  }, true);
  window.addEventListener('mousemove', function(event) {
    clickTime = 0;
    cursorMoveFunc(event);
  }, true);
  window.addEventListener('touchend', function(event) {
    cursorUpFunc(event);
  });
  window.addEventListener('mouseup', function(event) {
    if (window.getSelection) {
      window.getSelection().removeAllRanges();
    }
    if (document.selection) {
      document.selection.empty();
    }
    cursorUpFunc(event);
  });
  // window.addEventListener('deviceorientation', function(event) {
  //   if (event.alpha == null || event.beta == null || event.gamma == null) {
  //     return false;
  //   }

  //   if (useDragControls) {
  //     alphaInit = event.alpha;
  //     betaInit = event.beta;
  //     gammaInit = event.gamma;
  //     useDragControls = false;
  //   }
  //   updateAngles(event.beta - betaInit, event.alpha - alphaInit,
  //     -(event.gamma - gammaInit));
  // }, false);
  renderer.animate(animate);

  resize();

  let button = document.getElementById('sourceButton');
  let buttonContainer = document.getElementById('buttonContainer');
  let goFullscreenIcon = document.getElementById('goFullscreenIcon');
  let exitFullscreenIcon = document.getElementById('exitFullscreenIcon');
  button.addEventListener('click', function(event) {
    switch (event.target.textContent) {
      case 'Go Fullscreen': {
        if (!audioReady) {
          initAudio();
        }
        audioElement.play();
        button.textContent = 'Exit Fullscreen';
        htmlElement.parentNode.className = 'fullscreen';
        buttonContainer.className = 'fullscreenContainer';
        goFullscreenIcon.hidden = true;
        exitFullscreenIcon.hidden = false;
        let buttonContainerWidth = buttonContainer.clientWidth;
        buttonContainer.style.marginLeft =
          '-' + buttonContainerWidth / 2 + 'px';
        isFullscreen = true;
        resize();
      }
      break;
      case 'Exit Fullscreen': {
        button.textContent = 'Go Fullscreen';
        audioElement.pause();
        htmlElement.parentNode.className = '';
        buttonContainer.className = '';
        goFullscreenIcon.hidden = false;
        exitFullscreenIcon.hidden = true;
        buttonContainer.style.marginLeft = '0px';
        isFullscreen = false;
        resize();
      }
    }
  });
  window.addEventListener('resize', function(event) {
    resize();
  }, false);
};
window.addEventListener('load', onLoad);
