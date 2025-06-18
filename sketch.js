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
    if(capture){
        image(capture,0,0,width,height);
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