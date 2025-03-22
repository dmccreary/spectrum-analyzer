// MicroSim for displaying different waveform types
// Waveform types are sine, square, triangle and sawtooth
// the width of the entire canvas
let canvasWidth = 400;
// The top drawing region above the interactive controls
let drawHeight = 220;
let waveHeight = drawHeight / 4;
// control region height - increased to accommodate checkboxes
let controlHeight = 100;
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

// Waveform variables
let frequencySlider;
let frequency = 440; // default frequency in Hz
let waveLength = 200;
let phase = 0;
let isAnimating = true; // Controls whether the animation is running
let startStopButton;

// Checkbox variables for each waveform type
let sineCheckbox, squareCheckbox, triangleCheckbox, sawtoothCheckbox;
let checkboxes = [];

// Colors for different waveforms
const waveColors = {
  sine: 'rgba(0, 0, 255, 0.8)',     // blue
  square: 'rgba(255, 0, 0, 0.8)',   // red
  triangle: 'rgba(0, 128, 0, 0.8)', // green
  sawtooth: 'rgba(255, 165, 0, 0.8)' // orange
};

function setup() {
  // Create a canvas to match the parent container's size
  updateCanvasSize();
  const canvas = createCanvas(containerWidth, containerHeight);
  canvas.parent(document.querySelector('main'));
  
  // Create Start/Stop button
  startStopButton = createButton('Stop');
  startStopButton.position(10, drawHeight + 15);
  startStopButton.mousePressed(toggleAnimation);
  
  // Create frequency slider (50 to 1000 Hz)
  frequencySlider = createSlider(50, 1000, 440);
  frequencySlider.position(sliderLeftMargin, drawHeight + 15);
  frequencySlider.size(canvasWidth - sliderLeftMargin - 15);
  
  // Create checkboxes for each waveform type
  sineCheckbox = createCheckbox('Sine Wave', true);
  sineCheckbox.position(10, drawHeight + 45);
  sineCheckbox.style('color', waveColors.sine);
  
  squareCheckbox = createCheckbox('Square Wave', false);
  squareCheckbox.position(10, drawHeight + 65);
  squareCheckbox.style('color', waveColors.square);
  
  triangleCheckbox = createCheckbox('Triangle Wave', false);
  triangleCheckbox.position(canvasWidth/2, drawHeight + 45);
  triangleCheckbox.style('color', waveColors.triangle);
  
  sawtoothCheckbox = createCheckbox('Sawtooth Wave', false);
  sawtoothCheckbox.position(canvasWidth/2, drawHeight + 65);
  sawtoothCheckbox.style('color', waveColors.sawtooth);
  
  // Store checkboxes in an array for easier repositioning during window resize
  checkboxes = [sineCheckbox, squareCheckbox, triangleCheckbox, sawtoothCheckbox];
  
  describe('A waveform visualization MicroSim with different wave types and frequency control.', LABEL);
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
  
  // Draw the different waveforms if their checkbox is checked
  translate(margin, drawHeight/2);
  let graphWidth = canvasWidth - 2*margin;
  
  // Update phase for animation if animation is running
  if (isAnimating) {
    phase += 0.05;
    if (phase > TWO_PI) phase -= TWO_PI;
  }
  
  // Draw grid lines
  drawGrid(graphWidth);
  
  // Draw each waveform if its checkbox is checked
  if (sineCheckbox.checked()) {
    drawWaveform('sine', graphWidth);
  }
  
  if (squareCheckbox.checked()) {
    drawWaveform('square', graphWidth);
  }
  
  if (triangleCheckbox.checked()) {
    drawWaveform('triangle', graphWidth);
  }
  
  if (sawtoothCheckbox.checked()) {
    drawWaveform('sawtooth', graphWidth);
  }
  
  // Reset translation
  resetMatrix();
  
  // Draw frequency text
  fill('black');
  noStroke();
  textAlign(CENTER, TOP);
  textSize(24);
  text(frequency + ' Hz', width/2, 20);
  
  // Draw control labels
  fill('black');
  textSize(defaultTextSize);
  textAlign(LEFT, CENTER);
  text('Frequency:', 60, drawHeight + 25);
}

function drawGrid(width) {
  // Draw horizontal center line
  stroke(200);
  strokeWeight(1);
  line(0, 0, width, 0);
  
  // Draw vertical grid lines
  let frequencyFactor = frequency / 100;
  let wavelength = width / (frequencyFactor * 2);
  
  for (let x = 0; x < width; x += wavelength) {
    stroke(230);
    line(x, -waveHeight*1.5, x, waveHeight*1.5);
  }
}

function drawWaveform(type, width) {
  stroke(waveColors[type]);
  strokeWeight(3);
  noFill();
  
  beginShape();
  let frequencyFactor = frequency / 100;
  
  for (let x = 0; x < width; x++) {
    let angle = map(x, 0, width, 0, TWO_PI * frequencyFactor * 2) + phase;
    let y = 0;
    
    // Calculate y based on waveform type
    switch(type) {
      case 'sine':
        y = sin(angle) * waveHeight;
        break;
      case 'square':
        y = sin(angle) >= 0 ? waveHeight : -waveHeight;
        break;
      case 'triangle':
        y = (2 / PI) * asin(sin(angle)) * waveHeight;
        break;
      case 'sawtooth':
        y = (2 * (angle / TWO_PI - floor(1/2 + angle/TWO_PI))) * waveHeight;
        break;
    }
    
    vertex(x, y);
  }
  endShape();
}

function toggleAnimation() {
  isAnimating = !isAnimating;
  startStopButton.html(isAnimating ? 'Stop' : 'Start');
}

function windowResized() {
  // Update canvas size when the container resizes
  updateCanvasSize();
  resizeCanvas(containerWidth, containerHeight);
  
  // resize the slider to match the new canvasWidth
  frequencySlider.size(canvasWidth - sliderLeftMargin - 15);
  
  // Reposition checkboxes
  triangleCheckbox.position(canvasWidth/2, drawHeight + 45);
  sawtoothCheckbox.position(canvasWidth/2, drawHeight + 65);
  
  redraw();
}

function updateCanvasSize() {
  // Get the exact dimensions of the container
  const container = document.querySelector('main').getBoundingClientRect();
  containerWidth = Math.floor(container.width);  // Avoid fractional pixels
  canvasWidth = containerWidth;
}