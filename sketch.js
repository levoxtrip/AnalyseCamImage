let capture;
let isRearCamera = true;
let analyzing = true;
let frozen = false;

let frozenImage;

let currentColor;

let socket;



let camScale = 1;
let camOffsetX = 0;
let camOffsetY = 0;
let scaleCalculated = false;

//  gyroscope code part
let permissionGranted = false;

function setup(){
    createCanvas(windowWidth,windowHeight);
    startCamera();

  if (typeof(DeviceOrientationEvent) !== 'undefined' && typeof(DeviceOrientationEvent.requestPermission) === 'function') {
    // ios 13 device
    
    DeviceOrientationEvent.requestPermission()
      .catch(() => {
        // show permission dialog only the first time
        let button = createButton("click to allow access to sensors");
        button.style("font-size", "24px");
        button.center();
        button.mousePressed( requestAccess );
        throw error;
      })
      .then(() => {
        // on any subsequent visits
        permissionGranted = true;
      })
  } else {
    // non ios 13 device
    textSize(48);
    // text("non ios 13 device", 100, 100);
    permissionGranted = true;
  }

  connectToTouchDesigner()

  socket.onopen = function() {
    document.getElementById('TD-state').textContent = `Connected to TD`
  };

}




function draw(){
    if (!permissionGranted) return;
    //loadedmetadata is web standart property and tells us if the camera is ready on the phone
    if(capture && capture.loadedmetadata){

        //      if (!scaleCalculated) {
        //     calculateCameraScale();
        //     scaleCalculated = true;
        // }
        
        // Draw camera with proper scaling
        push();
        // translate(camOffsetX, camOffsetY);
        // scale(camScale);
        image(capture, 0, 0, capture.width, capture.height);
        pop();

    }

    if(analyzing){
        analyzeCenter();


        drawCrossHair();

        showDeviceRotation();

      sendDeviceData();
    }




    
}

function startCamera(){
    if(capture) {
        capture.remove();
    }

    const constraints = {
        video: {
            facingMode: isRearCamera ? "environment" : "user"
        }
    }

    capture = createCapture(constraints, () => {
        // document.getElementById('status').textContent = 'Camera can be used'
    });
    capture.hide();
}


function analyzeCenter(){
    if(capture && capture.loadedmetadata){
        let x = width/2;
        let y = height/2;
        currentColor = get(x,y);
        updateColorInfo(currentColor);
    }

}

function showDeviceRotation(){
    document.getElementById('device-rotation').textContent = `RotationX:${rotationX} RotationY:${rotationY} RotationZ:${rotationZ}`;
     
}

function sendDeviceData(){
    if (socket.readyState === WebSocket.OPEN) {
    document.getElementById('TD-state').textConent = `WebSocket OPEN`
    let data = {
      rotX: rotationX,
      rotY: rotationY,
      rotZ: rotationZ,
      color: currentColor,
      timestamp: millis()
    };
    socket.send(JSON.stringify(data));
  }
}



function updateColorInfo(color){
    const r = red(color);
    const g = green(color);
    const b = blue(color);
     document.getElementById('color-info').textContent = `R: ${Math.round(r)}, G: ${Math.round(g)}, B: ${Math.round(b)}`;
     document.getElementById('color-field').style.backgroundColor = `rgb(${r}, ${g}, ${b})`;

}

function drawCrossHair(){

    push();
    stroke(255);
    strokeWeight(2);
    noFill();


     let centerX = width / 2;
    let centerY = height / 2;
    
    circle(centerX, centerY, 30);

}



function calculateCameraScale() {
    if (capture && capture.loadedmetadata) {
        const camWidth = capture.width;
        const camHeight = capture.height;
        const canvasWidth = width;
        const canvasHeight = height;
        
        // Calculate scale to cover the entire screen while maintaining aspect ratio
        const scaleX = canvasWidth / camWidth;
        const scaleY = canvasHeight / camHeight;
        
        // Use the larger scale to ensure full coverage (crop if needed)
        camScale = max(scaleX, scaleY);
        
        // Calculate offsets to center the image
        const scaledWidth = camWidth * camScale;
        const scaledHeight = camHeight * camScale;
        
        camOffsetX = (canvasWidth - scaledWidth) / 2;
        camOffsetY = (canvasHeight - scaledHeight) / 2;
    }
}


function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    // Recalculate scaling when window size changes
    scaleCalculated = false;
}
function requestAccess() {
  DeviceOrientationEvent.requestPermission()
    .then(response => {
      if (response == 'granted') {
        permissionGranted = true;
      } else {
        permissionGranted = false;
      }
    })
  .catch(console.error);
  
  this.remove();
}

function connectToTouchDesigner() {
  // Start with regular WebSocket since you're on localhost
  socket = new WebSocket('wss://hx-web-extra-657e6f19865a.herokuapp.com/');
  
  socket.onopen = function() {
    console.log('Connected to TouchDesigner!');
    document.getElementById('TD-state').textContent = 'Connected to TD';
  };
  
  socket.onerror = function(error) {
    console.log('WebSocket error:', error);
    document.getElementById('TD-state').textContent = 'Connection Failed';
  };
  
  socket.onclose = function() {
    console.log('Disconnected from TouchDesigner');
    document.getElementById('TD-state').textContent = 'Disconnected';
    
    // Auto-reconnect after 3 seconds
    setTimeout(() => {
      connectToTouchDesigner();
    }, 3000);
  };
}