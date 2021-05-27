let options = {
  cameraZoomMin: 100,
  cameraZoomMax: .01,
  showOrigin: true,
  showGrid: true,
  major: 10,
  minor: 3,
  gridOpacity: .9,
  spanSub: 1,
  grayScale: 150,
  clamp: 1000000000,
  scaleFactor: 1.1,
}

document.body.style.height = "100%"

//Tab index trick to make canvas focusable: https://stackoverflow.com/a/12887221/10047920
document.body.innerHTML += "<canvas id='canv' tabindex=1></canvas>";
document.body.style.setProperty('margin', '0px');
document.body.style.setProperty('overflow', 'hidden');
document.documentElement.style.setProperty('margin', '0px'); //Apparently you can't do document.html...https://stackoverflow.com/questions/9362907/how-can-i-reference-the-html-elements-corresponding-dom-object

document.getElementById('canv').addEventListener('mousemove', mouseMove);
document.getElementById('canv').addEventListener('mousedown', mouseDown);
document.getElementById('canv').addEventListener('mouseup', mouseUp);
document.getElementById('canv').addEventListener('mousewheel', mouseWheel);
document.getElementById('canv').addEventListener('keyup', keyup);


var width = 0;  //Will store the width of the canvas
var height = 0; //Will store the hegiht of the canvas

var cameraCenterX = 0; //The x position the camera is looking at
var cameraCenterY = 0; //The y position the camera is looking at

var isMouseDown = false; //True if the mouse is down

var lastMouseX = 0;
var lastMouseY = 0;

var cameraZoom = 1;

///This gets called once when the page is completetly loaded.
///Think main()
function initialBoot() {
  console.log(window.innerHeight)

  ///Update the model
  update();

  ///Start a timer
  timerID = setTimeout(tick, 33);    								///Initialize the timer
}

///This gets called evertime the timer ticks
function tick() {

  ///Respond differently based on the game state
  timerID = setTimeout(tick, 33);    ///Restart the timer

  var currentTime = new Date();       ///Get the current time
  var now = currentTime.getTime();    ///Get the current time in milliseconds

  //Update the global model
  update();


  drawCanvas();
}

///This gets called whenever the window size changes and the
///canvas neends to adjust.
///This also adjusts the content pane
function update() {

  ///Make sure everything is the right size
  canvas = document.getElementById("canv");   ///Get the canvas object

  width = window.innerWidth;
  height = window.innerHeight

  canvas.width = width;
  canvas.height = height;

  if (typeof customUpdate === "function") {
    customUpdate();
  }

  drawCanvas();       ///Draw the canvas
}

///Called whenever the canvas needs to be redrawn
function drawCanvas() {

  ///Grab the canvas so we can draw on it
  var ctx = canvas.getContext("2d");      ///Get the canvas context

  ///Clear the rectangles
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();

  ctx.translate(width / 2 - cameraCenterX, height / 2 - cameraCenterY);
  if(ctx.getTransform().e != (width/2 - cameraCenterX))
    console.log("Bad")
  ctx.scale(cameraZoom, cameraZoom);

  //console.log(cameraZoom)

  let left = (0 - (width / 2 - cameraCenterX)) / cameraZoom;
  let right = (width - (width / 2 - cameraCenterX)) / cameraZoom;
  let bottom = (height - (height / 2 - cameraCenterY)) / cameraZoom;
  let top = (0 - (height / 2 - cameraCenterY)) / cameraZoom;


  //console.log(left + "," + top + " " + right + ", " + bottom);


  let maxSpan = Math.max(right - left, bottom - top);

  let maxSpanLog = Math.ceil(Math.log(maxSpan / options.spanSub) / Math.log(options.major));
  let zero = options.major ** (maxSpanLog);
  let downOne = options.major ** (maxSpanLog - 1);
  let difference = maxSpan - (options.major ** maxSpanLog);
  //console.log(difference);
  //difference /= (options.major ** maxSpanLog);
  //console.log(difference);
  //if (Math.random() < .1)
  //  console.log(maxSpan + ": " + zero + " " + downOne + " " + (maxSpan / zero) + " " + (downOne / maxSpan))
  //console.log(maxSpanLog);
  let gridSteps = [];
  for (let i = 0; i < options.minor; i++) {
    let last = i == options.minor - 1;
    let first = i == 0;
    let toPush = {
      step: options.major ** (maxSpanLog - 1) / options.major ** i,

    };
    if (!last)
      toPush.opacity = options.gridOpacity;
    else if (last) {
      toPush.opacity = options.gridOpacity * (downOne / maxSpan);
      toPush.opacity **= 2;
    }

    gridSteps.push(toPush);


  }



  let multiple = options.major ** (maxSpanLog);
  if (options.showGrid) {
    for (let i = 0; i < gridSteps.length; i++) {
      let gridStep = gridSteps[i];
      let startX = multiple * Math.floor(left / (multiple));
      let endX = multiple * Math.ceil(right / (multiple));
      let startY = multiple * Math.floor(top / multiple);
      let endY = multiple * Math.ceil(bottom / multiple);

      if (Number.isNaN(startX) || Number.isNaN(startY) || Number.isNaN(endX) || Number.isNaN(endY) || Number.isNaN(cameraZoom))
        console.log("bad")
      if (left == right || top == bottom || startX == endX || startY == endY)
        console.log("badder")
      if (startX > endX || startY > endY)
        console.log("baddest")
      //if (startX > 1000000000)
      //  console.log("Bomb")

      // if (Math.random() < .1)
      //   console.log(ctx.getTransform().a + "," + ctx.getTransform().d + "  " + ctx.getTransform().e + ", " + ctx.getTransform().f)
      // if (Math.random() < .1)
      //   console.log(cameraCenterX)

      for (let y = startY; y <= endY; y += gridStep.step) {
        ctx.strokeStyle = `rgba(${options.grayScale}, ${options.grayScale}, ${options.grayScale}, ${gridStep.opacity})`;
        ctx.lineWidth = 1 / cameraZoom;
        ctx.beginPath();
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
        ctx.stroke();
      }
      for (let x = startX; x <= endX; x += gridStep.step) {
        ctx.strokeStyle = `rgba(${options.grayScale}, ${options.grayScale}, ${options.grayScale}, ${gridStep.opacity})`;
        ctx.lineWidth = 1 / cameraZoom;
        ctx.beginPath();
        ctx.moveTo(x, startY);
        ctx.lineTo(x, endY);
        ctx.stroke();
      }
    }
  }

  if (options.showOrigin) {
    ctx.strokeStyle = "red";
    ctx.lineWidth = 2 / cameraZoom;
    ctx.beginPath();
    ctx.moveTo(left, 0);
    ctx.lineTo(right, 0);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(1, -.5);
    ctx.lineTo(1, .5);
    ctx.stroke();



    ctx.strokeStyle = "green";
    ctx.lineWidth = 2 / cameraZoom;
    ctx.beginPath();
    ctx.moveTo(0, top);
    ctx.lineTo(0, bottom);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-.5, 1);
    ctx.lineTo(.5, 1);
    ctx.stroke();

  }



  if (typeof customDraw === "function") {
    customDraw(ctx);
  }

  ctx.restore();

  ctx.fillStyle = "black"
  ctx.font = "10pt arial"
  for (let i = 0; i < gridSteps.length; i++) {

    ctx.fillText(gridSteps[i].step, 10, 32 * (i + 1));
    ctx.strokeStyle = "rgba(0, 0, 0, " + (options.gridOpacity * ((options.minor - 1 - i) / (options.minor - 1))) + ")";
    ctx.beginPath();
    ctx.moveTo(10, 32 * (i + 1));
    ctx.lineTo(10 + gridSteps[i].step * cameraZoom, 32 * (i + 1));
    ctx.stroke();
  }

  if (typeof customUI === "function") {
    customUI(ctx);
  }

}

function mouseMove(e) {
  let currentMouseX = e.clientX;
  let currentMouseY = e.clientY;

  if (isMouseDown) {
    let diffX = currentMouseX - lastMouseX;
    let diffY = currentMouseY - lastMouseY;

    cameraCenterX -= diffX;
    cameraCenterY -= diffY;

    cameraCenterX = Math.min(Math.max(cameraCenterX, -options.clamp), options.clamp);
    cameraCenterY = Math.min(Math.max(cameraCenterY, -options.clamp), options.clamp);

  }
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
}

function mouseDown(e) {
  let currentMouseX = e.clientX;
  let currentMouseY = e.clientY;


  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
  isMouseDown = true;
}

function mouseUp(e) {
  let currentMouseX = e.clientX;
  let currentMouseY = e.clientY;

  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
  isMouseDown = false
}

function keyup(e) {
  console.log(e.key)


  //Figure out the current world space coordinate
  let x = lastMouseX - (width / 2 - cameraCenterX);
  let y = lastMouseY - (height / 2 - cameraCenterY)
  x /= cameraZoom;
  y /= cameraZoom;
  x -= (width / 2 - cameraCenterX);
  y -= (height / 2 - cameraCenterY);

  if (e.key == "PageUp")
    cameraZoom *= options.scaleFactor;
  if (e.key == "PageDown")
    cameraZoom /= options.scaleFactor;


  if (cameraZoom < options.cameraZoomMax) cameraZoom = options.cameraZoomMax;
  if (cameraZoom > options.cameraZoomMin) cameraZoom = options.cameraZoomMin;


  //Now figure out what the new world space coordinate has changed to

  let x2 = lastMouseX - (width / 2 - cameraCenterX);
  let y2 = lastMouseY - (height / 2 - cameraCenterY);
  x2 /= cameraZoom;
  y2 /= cameraZoom;
  x2 -= (width / 2 - cameraCenterX);
  y2 -= (height / 2 - cameraCenterY);

  cameraCenterX -= x2 - x;
  cameraCenterY -= y2 - y;
  cameraCenterX = Math.min(Math.max(cameraCenterX, -options.clamp), options.clamp);
  cameraCenterY = Math.min(Math.max(cameraCenterY, -options.clamp), options.clamp);

}

function mouseWheel(e) {

  //Figure out the current world space coordinate
  let x = e.clientX - (width / 2 - cameraCenterX);
  let y = e.clientY - (height / 2 - cameraCenterY)
  x /= cameraZoom;
  y /= cameraZoom;
  x -= (width / 2 - cameraCenterX);
  y -= (height / 2 - cameraCenterY);

  if (e.wheelDelta > 0) {
    cameraZoom *= options.scaleFactor;
  }
  else if (e.wheelDelta < 0) {
    cameraZoom /= options.scaleFactor;
  }

  if (cameraZoom < options.cameraZoomMax) cameraZoom = options.cameraZoomMax;
  if (cameraZoom > options.cameraZoomMin) cameraZoom = options.cameraZoomMin;


  //Now figure out what the new world space coordinate has changed to

  let x2 = e.clientX - (width / 2 - cameraCenterX);
  let y2 = e.clientY - (height / 2 - cameraCenterY);
  x2 /= cameraZoom;
  y2 /= cameraZoom;
  x2 -= (width / 2 - cameraCenterX);
  y2 -= (height / 2 - cameraCenterY);

  cameraCenterX -= x2 - x;
  cameraCenterY -= y2 - y;
  cameraCenterX = Math.min(Math.max(cameraCenterX, -options.clamp), options.clamp);
  cameraCenterY = Math.min(Math.max(cameraCenterY, -options.clamp), options.clamp);

}


initialBoot();