let capture;
let isRearCamera = true;
let analyzing = true;
let frozen = false;

let frozenImage;

let currentColor;





let camScale = 1;
let camOffsetX = 0;
let camOffsetY = 0;
let scaleCalculated = false;

function setup(){
    createCanvas(windowWidth,windowHeight);
    startCamera();

}

function draw(){
    //loadedmetadata is web standart property and tells us if the camera is ready on the phone
    if(capture && capture.loadedmetadata){

             if (!scaleCalculated) {
            calculateCameraScale();
            scaleCalculated = true;
        }
        
        // Draw camera with proper scaling
        push();
        translate(camOffsetX, camOffsetY);
        scale(camScale);
        image(capture, 0, 0, capture.width, capture.height);
        pop();

    }

    if(analyzing){
        analyzeCenter();
    }
}

function startCamera(){
    if(capture) {
        capture.remove();
    }

    const constraints = {
        video: {
            facingMode: isRearCamera ? "environment" : "user",
            width: { ideal:windowWidth},
            height: {ideal:windowHeight}
        }
    }

    capture = createCapture(constraints, () => {
        document.getElementById('status').textContent = 'Camera can be used'
    });
    capture.hide();
}


function analyzeCenter(){
    if(capture && capture.loadedmetadata){
        let x = width/2;
        let y = height/2;
        currentColor = get(x,y);
        console.log("analysing")
        updateColorInfo(currentColor);
    }

}


function updateColorInfo(color){
    document.getElementById('color-info').textContent = `${color}`


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