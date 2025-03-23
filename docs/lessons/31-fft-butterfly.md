# FFT Butterfly Operations on the Raspberry Pi Pico 2

Butterfly operations are the core of the Fast Fourier Transform (FFT) algorithm, and understanding them is key to appreciating how modern microcontrollers like the Raspberry Pi Pico 2 can efficiently perform signal processing tasks. Let's explore how these operations work and how they're accelerated by new hardware instructions.

## What is the FFT and Why Do We Need It?

The Fast Fourier Transform (FFT) is an algorithm that converts a signal from the time domain (how it changes over time) to the frequency domain (what frequencies it contains). This is incredibly useful for:

- Audio processing (extracting bass, treble, etc.)
- Vibration analysis
- Signal filtering
- Speech recognition
- And many other applications

In this project, we are implementing FFT on the Pico 2 microcontrollers, particularly for sound analysis with the [INMP441 microphone](../glossary.md#inmp441-microphone).

## What Are Butterfly Operations?

The name "butterfly" comes from the shape of the data flow diagram that represents the computation:

<iframe src="../sims/fft-butterfly/main.html" height="550"  scrolling="no"></iframe>

In this operation, two input values are combined to create two output values. Each butterfly combines elements that are a certain distance apart in the array, and this distance (called the "stride") changes as the algorithm progresses.

At its core, a butterfly operation looks like this in math:

```
A' = A + B × W
B' = A - B × W
```

Where W is a "twiddle factor" (a complex number based on a root of unity), and A and B are complex numbers from your data array.

## ARM Assembly and FFT on the Pico 2

The Raspberry Pi Pico 2 uses the RP2040 microcontroller with an ARM Cortex-M0+ core, but with a significant upgrade from the original Pico: hardware acceleration for certain operations, including multiply-accumulate (MAC) instructions that are perfect for butterfly operations.

### What are MAC Instructions?

MAC stands for Multiply-Accumulate. These instructions perform multiplication and addition in a single operation:

```
accumulator = accumulator + (operand1 × operand2)
```

This is exactly what we need for butterfly operations!

Looking at the `dft.py` file you shared, I can see how the assembly code is implementing these operations. Here's a snippet that performs the butterfly calculation:

```assembly
# From the dft.py file
vmul(s10, s12, s14)     # s10 = ax
vmul(s9, s13, s15)      # s9  = by
vsub(s10, s10, s9)      #  s10 = ax - by
vmul(s11, s13, s14)     # s11 = ay
vmul(s9,  s12, s15)     # s9  = bx
vadd(s11, s11, s9)      # s11 = ay + bx
```

This code is performing complex number multiplication and addition, which is the heart of the butterfly operation.

### How the Pico 2 Accelerates This

The Pico 2 adds hardware support for MAC operations through new custom instructions. Instead of needing multiple separate instructions for multiplication and addition, it can do both in one step.

For example, instead of:

```assembly
vmul(s9, s13, s15)      # Multiply
vsub(s10, s10, s9)      # Subtract
```

The Pico 2 can potentially use a single MAC instruction:

```assembly
vmla(s10, s13, s15)     # Multiply and accumulate (with negative value for subtraction)
```

This reduces both the number of instructions and the execution time.

## Calling Assembly from Python

Looking at your files, I can see how the Python code interfaces with the assembly routines. The key is using the `@micropython.asm_thumb` decorator, which allows writing ARM Thumb assembly directly in Python:

```python
@micropython.asm_thumb
def fft(r0, r1):        # r0 address of scratchpad, r1 = Control
    # Assembly code follows
    # ...
```

Then this function can be called from regular Python code like this:

```python
from dft import fft

# Setup the data arrays and control information
# ...

# Call the assembly function
fft(ctrl, FORWARD)
```

## Why These Instructions Aren't Used in Standard MicroPython

The standard MicroPython system running under Thonny doesn't fully utilize these new instructions for several reasons:

1. **Portability**: MicroPython aims to work across many different microcontrollers, not just the Pico 2. Using specialized instructions would make the code less portable.

2. **Backward Compatibility**: Using new instructions would break compatibility with the original Pico and other devices.

3. **Compilation Time**: MicroPython's JIT (Just-In-Time) compiler might not be optimized to recognize patterns that could use MAC instructions.

4. **ARM Version Support**: The standard MicroPython might be compiled to target a specific ARM instruction set that doesn't include these newer instructions.

The custom assembly code in your files is specifically written to leverage these instructions when available, which is why it achieves better performance.

## A Simple Python Example

Here's a simplified example showing how butterfly operations work in Python code:

```python
def butterfly(real, imag, idx_a, idx_b, twiddle_real, twiddle_imag):
    # Save original values
    a_real = real[idx_a]
    a_imag = imag[idx_a]
    b_real = real[idx_b]
    b_imag = imag[idx_b]
    
    # Calculate B × W (complex multiplication)
    bw_real = b_real * twiddle_real - b_imag * twiddle_imag
    bw_imag = b_real * twiddle_imag + b_imag * twiddle_real
    
    # Butterfly operation
    real[idx_a] = a_real + bw_real
    imag[idx_a] = a_imag + bw_imag
    real[idx_b] = a_real - bw_real
    imag[idx_b] = a_imag - bw_imag
```

This Python code is much slower than the assembly version shown in your files, but it clearly illustrates what's happening in each butterfly operation.

## Performance Improvements

Looking at the README.md in your files, I can see the performance difference:

```
Board | Time (ms) |
|-----|-----------|
| Pyboard 1.x | 12.9 |
| Pyboard D SF2W |  3.6 |
| Pyboard D SF6W |  3.6 |
| Pico 2 |  6.97 |
```

The Pico 2 can perform a 1024-point FFT in just 6.97ms, which is remarkably fast for a microcontroller. While not as fast as the Pyboard D, it's still significantly faster than the original Pyboard, partly due to these hardware optimizations.

## Conclusion

The butterfly operations in FFT algorithms are perfectly suited for hardware acceleration through MAC instructions. The Raspberry Pi Pico 2's support for these instructions makes it a powerful platform for signal processing applications, especially when using custom assembly code like in the files you've shared.

By understanding how these operations work and how to interface assembly with Python, you can create highly efficient signal processing applications, like the sound spectrum analyzer shown in your files.