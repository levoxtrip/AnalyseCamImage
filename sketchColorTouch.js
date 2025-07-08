let capture;
let isRearCamera = true;
let analyzing = true;
let frozen = false;

let frozenImage;
let currentColor;
let socket;
let deviceId;

let camScale = 1;
let camOffsetX = 0;
let camOffsetY = 0;
let scaleCalculated = false;

// gyroscope code part
let permissionGranted = false;

function setup(){
    createCanvas(windowWidth,windowHeight);
    deviceId = 'device_' + Math.random().toString(36).substr(2, 9);
    startCamera();

    if (typeof(DeviceOrientationEvent) !== 'undefined' && typeof(DeviceOrientationEvent.requestPermission) === 'function') {
        // iOS 13 device
        DeviceOrientationEvent.requestPermission()
            .catch((error) => {  // Fixed: added error parameter
                // show permission dialog only the first time
                let button = createButton("click to allow access to sensors");
                button.style("font-size", "24px");
                button.center();
                button.mousePressed(requestAccess);
                // Removed throw error since it's handled
            })
            .then(() => {
                // on any subsequent visits
                permissionGranted = true;
            })
    } else {
        // non iOS 13 device
        permissionGranted = true;
    }

    connectToTouchDesigner()

    socket.onopen = function() {
        document.getElementById('TD-state').textContent = `Connected to TD`
    };
}

function draw(){
    if (!permissionGranted) return;
    
    // loadedmetadata is web standard property and tells us if the camera is ready on the phone
    if(capture && capture.loadedmetadata){
        // Draw camera
        push();
        image(capture, 0, 0, capture.width, capture.height);
        pop();
    }

    if(analyzing){
        analyzeCenter();
        drawCrossHair();
        showDeviceAcceleration();
        sendDeviceData();
    }

    // Only draw touch indicator if there's an active touch
    if (touches.length > 0 || (typeof touchX !== 'undefined' && typeof touchY !== 'undefined')) {
        drawTouch();
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
        // Camera ready callback
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
    const rotX = typeof rotationX !== 'undefined' ? rotationX.toFixed(2) : 'N/A';
    const rotY = typeof rotationY !== 'undefined' ? rotationY.toFixed(2) : 'N/A';
    const rotZ = typeof rotationZ !== 'undefined' ? rotationZ.toFixed(2) : 'N/A';
    document.getElementById('device-rotation').textContent = `RotationX:${rotX} RotationY:${rotY} RotationZ:${rotZ}`;
}

function showDeviceAcceleration(){  // Fixed: removed duplicate
    const accelX = typeof accelerationX !== 'undefined' ? accelerationX.toFixed(2) : 'N/A';
    const accelY = typeof accelerationY !== 'undefined' ? accelerationY.toFixed(2) : 'N/A';
    const accelZ = typeof accelerationZ !== 'undefined' ? accelerationZ.toFixed(2) : 'N/A';
    document.getElementById('device-accel').textContent = `AccelX:${accelX} AccelY:${accelY} AccelZ:${accelZ}`;
}

function showDeviceTouch(){
    const tX = typeof touchX !== 'undefined' ? touchX.toFixed(0) : 'N/A';
    const tY = typeof touchY !== 'undefined' ? touchY.toFixed(0) : 'N/A';
    document.getElementById('device-touch').textContent = `TouchX:${tX} TouchY:${tY}`;
}

function sendDeviceData(){
    if (socket && socket.readyState === WebSocket.OPEN) {
        document.getElementById('TD-state').textContent = `WebSocket OPEN`;

        let data = {
            id: deviceId,
            rotX: (typeof rotationX !== 'undefined') ? rotationX : 0,
            rotY: (typeof rotationY !== 'undefined') ? rotationY : 0,
            rotZ: (typeof rotationZ !== 'undefined') ? rotationZ : 0,
            touchX: (typeof touchX !== 'undefined') ? touchX : 0,
            touchY: (typeof touchY !== 'undefined') ? touchY : 0,
            color: currentColor || [0, 0, 0],
            timestamp: millis()
        };
        socket.send(JSON.stringify(data));
    }
}

function updateColorInfo(color){
    if (!color) return;
    
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
    pop();
}

function drawTouch(){
    // Use touches array for more reliable touch detection
    if (touches.length > 0) {
        push();
        stroke(255);
        strokeWeight(6);
        noFill();
        
        // Draw circle at first touch point
        circle(touches[0].x, touches[0].y, 80);
        pop();
    } else if (typeof touchX !== 'undefined' && typeof touchY !== 'undefined') {
        push();
        stroke(255);
        strokeWeight(6);
        noFill();
        
        circle(touchX, touchY, 80);
        pop();
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    scaleCalculated = false;
}

// Touch event handlers for better touch detection
function touchStarted() {
    showDeviceTouch();
    return false; // Prevent default behavior
}

function touchMoved() {
    showDeviceTouch();
    return false; // Prevent default behavior
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
    try {
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
    } catch (error) {
        console.log('Failed to create WebSocket:', error);
        document.getElementById('TD-state').textContent = 'Connection Failed';
    }
}