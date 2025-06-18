let capture;
let isRearCamera = true;
let analyzing = true;
let frozen = false;

let frozenImage;

let currentColor;


function setup(){
    createCanvas(windowWidth,windowHeight);
    startCamera();

}

function draw(){
    //loadedmetadata is web standart property and tells us if the camera is ready on the phone
    if(capture && capture.loadedmetadata){
        image(capture,0,0,width,height);
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