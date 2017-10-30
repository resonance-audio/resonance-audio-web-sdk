let htmlElement;
let renderer;
let scene;
let camera;
let mesh;
let isCursorDown = false;
let cursorDown;
let screenPercentToHorizontalAngleSpeed = 90;
let screenPercentToVerticalAngleSpeed = 90;
let azimuth = 0;
let elevation = 0;
let clickTime = 0;
let songbird;
let source;
let dimensions = {
  width: 10, height: 7, depth: 10,
};
let materials = {
  left: 'uniform', right: 'uniform',
  front: 'uniform', back: 'uniform',
  up: 'uniform', down: 'uniform',
};

let lastSongbirdMatrixUpdate = 0;
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
  if (Date.now() - lastSongbirdMatrixUpdate > 100) {
    songbird.setListenerFromMatrix(camera.matrixWorld);
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
}

/**
 * @param {Object} event
 * @private
 */
function cursorMoveFunc(event) {
  if (isCursorDown) {
    let rect = htmlElement.getBoundingClientRect();
    let cursorMove = getCursorPosition(event);
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
  }
}

/**
 * @param {Object} event
 * @private
 */
function cursorUpFunc(event) {
  isCursorDown = false;
}

/**
 * @private
 */
function moveSource() {
  let randomAzimuth = Math.random() * 2 * Math.PI;
  let randomElevation = Math.acos(2 * Math.random() - 1);
  const radius = 3;
  let x = Math.cos(randomAzimuth) * Math.sin(randomElevation);
  let y = Math.cos(randomElevation);
  let z = Math.sin(randomAzimuth) * Math.sin(randomElevation);
  mesh.position.set(x * radius, y * radius, z * radius);
  source.setPosition(x, y, z);
}

let prevTime = performance.now();
const rotateSpeed = 1;
/**
 * @private
 */
function animate() {
  updateAngles(elevation, azimuth, 0);

  let currTime = performance.now();
  let deltaTime = (currTime - prevTime) / 1000;
  prevTime = currTime;

  mesh.rotation.x += rotateSpeed * deltaTime;
  mesh.rotation.y += rotateSpeed * deltaTime;

  renderer.render(scene, camera);
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

let onLoad = function() {
  htmlElement = document.getElementById('renderer');

  // Create audio scene.
  let audioContext = new AudioContext();
  songbird = new Songbird(audioContext, {
    ambisonicOrder: 3,
    dimensions: dimensions,
    materials: materials,
  });
  source = songbird.createSource();
  let audioElement = document.createElement('audio');
  audioElement.src = 'resources/CubeSound.wav';
  audioElement.load();
  audioElement.loop = true;
  let audioElementSource = audioContext.createMediaElementSource(audioElement);
  audioElementSource.connect(source.input);
  songbird.output.connect(audioContext.destination);

  // Construct the 3D scene.
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, 1, 0.1, 100);
  camera.position.set(0, 0, 0);

  let room = new THREE.Mesh(
    new THREE.BoxGeometry(
      dimensions.width, dimensions.height, dimensions.depth),
    new THREE.MeshPhongMaterial({
      side: THREE.BackSide,
    })
  );
  scene.add(room);

  let cameraLight = new THREE.PointLight(0xffffff, 0.9, 100);
  cameraLight.position.set(camera.position.x, camera.position.y,
    camera.position.z);
  scene.add(cameraLight);

  let ceilingLight = new THREE.DirectionalLight(0xffffff, 0.5);
  ceilingLight.position.set(0, 1, 0);
  scene.add(ceilingLight);

  mesh = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshPhongMaterial({
      color: 0xff0000,
    })
  );
  mesh.position.set(0, 0, -3);
  source.setPosition(mesh.position.x, mesh.position.y, mesh.position.z);
  scene.add(mesh);

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
  htmlElement.addEventListener('touchmove', function(event) {
    clickTime = 0;
    cursorMoveFunc(event);
  });
  htmlElement.addEventListener('mousemove', function(event) {
    clickTime = 0;
    cursorMoveFunc(event);
  });
  htmlElement.addEventListener('click', function(event) {
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
  });
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
  renderer.animate(animate);

  resize();

  let button = document.getElementById('sourceButton');
  let buttonContainer = document.getElementById('buttonContainer');
  let goFullscreenIcon = document.getElementById('goFullscreenIcon');
  let exitFullscreenIcon = document.getElementById('exitFullscreenIcon');
  button.addEventListener('click', function(event) {
    if (event.target.textContent == 'Go Fullscreen') {
      audioElement.play();
      button.textContent = 'Exit Fullscreen';
      htmlElement.parentNode.className = 'fullscreen';
      buttonContainer.className = 'fullscreenContainer';
      goFullscreenIcon.hidden = true;
      exitFullscreenIcon.hidden = false;
      let buttonContainerWidth = buttonContainer.clientWidth;
      buttonContainer.style.marginLeft = '-' + buttonContainerWidth / 2 + 'px';
      isFullscreen = true;
      resize();
    } else {
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
  });
  window.addEventListener('resize', function(event) {
    resize();
  }, false);
};
window.addEventListener('load', onLoad);
