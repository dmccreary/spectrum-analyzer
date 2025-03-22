# Spectrum Analyzer Hardware

## Raspberry Pi Pico 2

The original Pico will work, however the clock is slower and it does not have built-in floating point hardware.

## Microphone

We like the [INMP442](https://dmccreary.github.io/learning-micropython/sensors/15-inmp441/) since it has an I2S interface and very low noise.

## Display

We use a 2.42" OLED display with a SSD1306 driver.

If you're prototyping on a breadboard or using standard jumper wires, stick with 4–8 MHz to ensure signal integrity and reduce data corruption.


