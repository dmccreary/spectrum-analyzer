// MicroSim for generating sound from a sine wave
// the width of the entire canvas
let canvasWidth = 400;
// The top drawing region above the interactive controls
let drawHeight = 200;
let waveHeight = drawHeight / 4;
// control region height
let controlHeight = 50;
// The total height of both the drawing region height + the control region height
let canvasHeight = drawHeight + controlHeight;
// margin around the active plotting region
let margin = 25;
let sliderLeftMargin = 150;
// larger text so students in the back of the room can read the labels
let defaultTextSize = 16;

// global variables for width and height
let containerWidth; // calculated by container upon resize
let containerHeight = canvasHeight; // fixed height on page

// Sound variables
let osc; // oscillator
let frequencySlider;
let frequency = 440; // default frequency in Hz
let isPlaying = false;
let startButton;

// Wave visualization variables
let wavePoints = [];
let waveLength = 200;

function setup() {
  // Create a canvas to match the parent container's size
  updateCanvasSize();
  const canvas = createCanvas(containerWidth, containerHeight);
  canvas.parent(document.querySelector('main'));
  
  // Initialize the oscillator
  osc = new p5.Oscillator('sine');
  osc.amp(0.5); // set amplitude (volume)
  
  // Create frequency slider (0 to 4000 Hz)
  frequencySlider = createSlider(0, 4000, 440);
  frequencySlider.position(sliderLeftMargin, drawHeight + 15);
  frequencySlider.size(canvasWidth - sliderLeftMargin - 15);
  
  // Create start/stop button
  startButton = createButton('Start');
  startButton.position(10, drawHeight + 15);
  startButton.mousePressed(toggleSound);
  
  // Initialize wave points array
  for (let i = 0; i < waveLength; i++) {
    wavePoints[i] = 0;
  }
  
  describe('A sound wave generator MicroSim with frequency control slider.', LABEL);
}

function draw() {
  // Background for drawing area
  fill('aliceblue');
  stroke('silver');
  strokeWeight(1);
  rect(0, 0, canvasWidth, drawHeight);
  
  // Background for controls area
  fill('white');
  rect(0, drawHeight, canvasWidth, controlHeight);
  
  // Get current frequency from slider
  frequency = frequencySlider.value();
  
  // If sound is playing, update oscillator frequency
  if (isPlaying) {
    osc.freq(frequency);
    
    // Update wave points for visualization
    // phase is a reserved word
    let thePhase = frameCount * 0.05;
    for (let i = 0; i < waveLength; i++) {
      // Calculate sine wave based on current frequency
      let angle = map(i, 0, waveLength, 0, TWO_PI);
      // The higher the frequency, the more waves we draw
      let frequencyFactor = frequency / 440; // normalized to standard A
      wavePoints[i] = sin(angle * frequencyFactor + thePhase) * waveHeight;
    }
  }
  
  // Draw the sine wave visualization
  drawWave();
  
  // Draw frequency text in the center
  fill('black');
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(48);
  text(frequency + ' Hz', width/2, 40);
  
  // Draw control labels
  fill('black');
  textSize(defaultTextSize);
  textAlign(LEFT, CENTER);
  text('Frequency:', 60, drawHeight + 25);
}

function drawWave() {
  push();
  translate(width/2, height/2);
  stroke(0, 0, 255);
  strokeWeight(3);
  noFill();
  
  // Draw the sine wave
  beginShape();
  for (let i = 0; i < waveLength; i++) {
    let x = map(i, 0, waveLength, -waveLength/2, waveLength/2);
    vertex(x* canvasWidth*.0047, wavePoints[i]);
  }
  endShape();
  pop();
}

function toggleSound() {
  if (!isPlaying) {
    osc.start();
    isPlaying = true;
    startButton.html('Stop');
  } else {
    osc.stop();
    isPlaying = false;
    startButton.html('Start');
    
    // Reset wave visualization
    for (let i = 0; i < waveLength; i++) {
      wavePoints[i] = 0;
    }
  }
}

function windowResized() {
  // Update canvas size when the container resizes
  updateCanvasSize();
  resizeCanvas(containerWidth, containerHeight);
  redraw();
  // resize the slider to match the new canvasWidth
  frequencySlider.size(canvasWidth - sliderLeftMargin - 15);
}

function updateCanvasSize() {
  // Get the exact dimensions of the container
  const container = document.querySelector('main').getBoundingClientRect();
  containerWidth = Math.floor(container.width);  // Avoid fractional pixels
  canvasWidth = containerWidth;
}