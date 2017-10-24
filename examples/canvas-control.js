function CanvasControl(canvas, elements) {
  this._canvas = canvas;
  this._elements = elements;

  this._context = this._canvas.getContext('2d');
  this._cursorDown = false;

  this._selected = {
    index: -1,
    xOffset: 0,
    yOffset: 0,
  };

  let that = this;
  canvas.addEventListener('touchstart', function(event) {
    that._cursorDownFunc(event);
    event.preventDefault();
  });

  canvas.addEventListener('mousedown', function(event) {
    that._cursorDownFunc(event);
  });

  canvas.addEventListener('touchmove', function(event) {
    that._cursorMoveFunc(event);
    event.preventDefault();
  });

  canvas.addEventListener('mousemove', function(event) {
    that._cursorMoveFunc(event);
  });

  document.addEventListener('touchend', function(event) {
    that._cursorUpFunc(event);
    event.preventDefault();
  });

  document.addEventListener('mouseup', function(event) {
    that._cursorUpFunc(event);
  });

  this.draw();
}

CanvasControl.prototype.draw = function() {
  this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);

  this._context.beginPath();
  this._context.rect(0, 0, canvas.width, canvas.height);
  this._context.lineWidth = 4;
  this._context.stroke();

  for (let i = 0; i < this._elements.length; i++) {
    this._context.beginPath();
    if (i < this._elements.length - 1) {
      this._context.rect(
        this._elements[i].x * this._canvas.width - this._elements[i].radius * this._canvas.width,
        this._elements[i].y * this._canvas.height - this._elements[i].radius * this._canvas.width,
        2 * this._elements[i].radius * this._canvas.width,
        2 * this._elements[i].radius * this._canvas.width);
    } else {
      this._context.arc(this._elements[i].x * this._canvas.width,
        this._elements[i].y * this._canvas.height,
        this._elements[i].radius * this._canvas.width, 0, 2 * Math.PI);
    }
    this._context.fillStyle = this._elements[i].color;
    this._context.fill();

    this._context.beginPath();
    this._context.textAlign = 'center';
    this._context.textBaseline = 'middle';
    this._context.font = 'bold 20px monospace';
    this._context.fillStyle = 'white';
    this._context.fillText(this._elements[i].label,
      this._elements[i].x * this._canvas.width,
      this._elements[i].y * this._canvas.height);
  }
};

CanvasControl.prototype.getCursorPosition = function(event) {
  let rect = this._canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };
}

CanvasControl.prototype.getNearestElement = function(cursorPosition) {
  let minDistance = 1e8;
  let minIndex = -1;
  let minXOffset = 0;
  let minYOffset = 0;
  for (let i = 0; i < this._elements.length; i++) {
    let dx = this._elements[i].x * this._canvas.width - cursorPosition.x;
    let dy = this._elements[i].y * this._canvas.height - cursorPosition.y;
    let distance = Math.abs(dx) + Math.abs(dy); // Manhattan distance.
    if (distance < minDistance && distance < 2 * this._elements[i].radius * this._canvas.width) {
      minDistance = distance;
      minIndex = i;
      minXOffset = dx;
      minYOffset = dy;
    }
  }
  return {
    index: minIndex,
    xOffset: minXOffset,
    yOffset: minYOffset,
  };
}

CanvasControl.prototype._cursorUpdateFunc = function(cursorPosition) {
  if (this._selected.index > -1) {
    this._elements[this._selected.index].x =
      (cursorPosition.x + this._selected.xOffset) / this._canvas.width;
    this._elements[this._selected.index].y =
      (cursorPosition.y + this._selected.yOffset) / this._canvas.height;
  }
  this.draw();
};

CanvasControl.prototype._cursorDownFunc = function(event) {
  this._cursorDown = true;
  let cursorPosition = this.getCursorPosition(event);
  this._selected = this.getNearestElement(cursorPosition);
  this._cursorUpdateFunc(cursorPosition);
};

CanvasControl.prototype._cursorUpFunc = function(event) {
  this._cursorDown = false;
  this._selected.index = -1;
};

CanvasControl.prototype._cursorMoveFunc = function(event) {
  if (this._cursorDown == true) {
    let cursorPosition = this.getCursorPosition(event);
    this._cursorUpdateFunc(cursorPosition);
  }
};