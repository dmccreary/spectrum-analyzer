// Responsive Base and Treble MicroSim
// the width of the entire canvas
let canvasWidth = 450;
// The top drawing region above the interactive controls
let drawHeight = 300;
// control region height
let controlHeight = 50;
// The total height of both the drawing region height + the control region height
let canvasHeight = drawHeight + controlHeight;
// margin around the active plotting region
let margin = 20;
let sliderLeftMargin = 60;
// larger text so students in the back of the room can read the labels
let defaultTextSize = 16;

// global variables for responsive design
let containerWidth; // calculated by container upon resize
let containerHeight = canvasHeight; // fixed height on page

let bassSlider, trebleSlider;

function setup() {
  // Create a canvas to match the parent container's size
  updateCanvasSize();
  const canvas = createCanvas(containerWidth, containerHeight);
  canvas.parent(document.querySelector('main'));
  textSize(defaultTextSize);

  // Calculate slider width based on container width
  let sliderWidth = (containerWidth - sliderLeftMargin - 3 * margin) / 2;

  // Create bass slider on the left
  bassSlider = createSlider(0, 100, 50, 1);
  bassSlider.position(sliderLeftMargin, drawHeight + 10);
  bassSlider.size(sliderWidth);

  // Create treble slider on the right
  trebleSlider = createSlider(0, 100, 50, 1);
  trebleSlider.position(sliderLeftMargin + sliderWidth + margin, drawHeight + 10);
  trebleSlider.size(sliderWidth);
  
  describe('A frequency response visualization showing bass and treble controls', LABEL);
}

function draw() {
  // Fill the drawing region with 'aliceblue'
  fill('aliceblue');
  stroke('silver');
  strokeWeight(1);
  rect(0, 0, containerWidth, drawHeight);

  // Fill the control region with 'white'
  fill('white');
  stroke('silver');
  strokeWeight(1);
  rect(0, drawHeight, containerWidth, controlHeight);

  // Get the updated slider values
  let bassVal = bassSlider.value();
  let trebleVal = trebleSlider.value();

  // Normalize the slider values to range -1 to 1
  let bassAmount = (bassVal - 50) / 50;
  let trebleAmount = (trebleVal - 50) / 50;

  // Define frequency range and number of points
  let numPoints = 500;
  let freqMin = 20;
  let freqMax = 20000;

  // Define EQ parameters
  let f_bass_cutoff = 500;
  let f_treble_cutoff = 2000;
  let n = 4;
  let maxGain = 12; // dB
  let gainMin = -15; // dB
  let gainMax = 15; // dB

  // Begin shape for plotting the frequency response curve
  noFill();
  stroke('blue');
  strokeWeight(3);
  beginShape();

  for (let i = 0; i < numPoints; i++) {
    let fraction = i / (numPoints - 1);
    let frequency = freqMin * Math.pow(freqMax / freqMin, fraction);

    // Compute lowShelf and highShelf
    let lowShelf = 1 / (1 + Math.pow(frequency / f_bass_cutoff, n));
    let highShelf = 1 / (1 + Math.pow(f_treble_cutoff / frequency, n));

    // Compute gains
    let bassGain_dB = bassAmount * maxGain * lowShelf;
    let trebleGain_dB = trebleAmount * maxGain * highShelf;

    let totalGain_dB = bassGain_dB + trebleGain_dB;

    // Map frequency to x position
    let x = map(
      Math.log10(frequency),
      Math.log10(freqMin),
      Math.log10(freqMax),
      margin,
      containerWidth - margin
    );

    // Map gain to y position
    let y = map(totalGain_dB, gainMin, gainMax, drawHeight, margin);

    // Plot the point
    vertex(x, y);
  }

  endShape();

  // Draw axes
  stroke(150);
  // x-axis at y = gain 0 dB
  let yZero = map(0, gainMin, gainMax, drawHeight, margin);
  strokeWeight(1);
  line(margin, yZero, containerWidth - margin, yZero);

  // Draw labels
  noStroke();
  fill('black');
  textAlign(CENTER, TOP);
  textSize(24);
  text("Frequency Response", containerWidth / 2, margin / 2);

  // Draw slider labels under the sliders
  textSize(defaultTextSize);
  textAlign(CENTER, TOP);
  fill('black');
  
  // Bass label and value
  text("Bass: " + (bassVal - 50), 
       bassSlider.x + bassSlider.width/2, 
       bassSlider.y + 20);
  
  // Treble label and value
  text("Treble: " + (trebleVal - 50), 
       trebleSlider.x + trebleSlider.width/2, 
       trebleSlider.y + 20);
}

function windowResized() {
  // Update canvas size when the container resizes
  updateCanvasSize();
  resizeCanvas(containerWidth, containerHeight);
  
  // Recalculate slider width based on new container width
  let sliderWidth = (containerWidth - sliderLeftMargin - 3 * margin) / 2;
  
  // Update slider sizes and positions
  bassSlider.position(sliderLeftMargin, drawHeight + 10);
  bassSlider.size(sliderWidth);
  
  trebleSlider.position(sliderLeftMargin + sliderWidth + margin, drawHeight + 10);
  trebleSlider.size(sliderWidth);
  
  redraw();
}

function updateCanvasSize() {
  // Get the exact dimensions of the container
  const container = document.querySelector('main').getBoundingClientRect();
  containerWidth = Math.floor(container.width);  // Avoid fractional pixels
  canvasWidth = containerWidth;
}