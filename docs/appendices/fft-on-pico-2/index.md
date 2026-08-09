# FFT on Pico 2

!!! prompt
    Are there any MicroPython FFT libraries available yet that leverage the powerful new DSP assembly instructions on the Raspberry Pi Pico 2? All the old MicroPython FFT libraries only used the older assembly language code written for the original Raspberry Pi Pico. Please find sample code and benchmarks for 512 and 1024 point FFT functions.

This appendix summarizes the state of MicroPython FFT libraries for the Pico 2 (RP2350) as of August 2026, and how they relate to the [assembler FFT](../../lessons/09-assembler-function.md) and [DSP instructions](../../lessons/50-dsp-instructions.md) lessons used elsewhere in this book.

## Short answer

There is no mature, drop-in MicroPython package yet that hand-exploits the RP2350's Cortex-M33 **integer DSP-SIMD extension** (the `SMLAD`/`SXTB16`-style instructions) for FFT. What actually exists is more interesting: the community jumped past that and is leaning on the M33's **hardware FPU** instead, because it turns out to be fast enough on its own.

## FPU vs. DSP-SIMD extension

These are two separate hardware blocks, and it matters which one a library actually uses:

| Feature | Original Pico (RP2040) | Pico 2 (RP2350) |
|---|---|---|
| Core | Cortex-M0+ | Cortex-M33 |
| Instruction set | ARMv6-M, Thumb-1 | ARMv8-M, Thumb-2 |
| Hardware FPU | None (software float) | Yes, single-precision (FPv5-SP) |
| Integer DSP-SIMD extension | None | Yes (`SMLAD`, `SXTB16`, saturating arithmetic, etc.) |

The original Pico has neither an FPU nor the DSP-SIMD extension, which is why the older MicroPython FFT libraries (including the version of Peter Hinch's library used in [the assembler FFT lesson](../../lessons/09-assembler-function.md)) lean on hand-rolled Thumb-1 integer assembly. The Pico 2 has both, and existing library authors report that the FPU alone already removes the old bottleneck — from Peter Hinch's own README:

> The ARM FPU is so fast that integer code offers no speed advantage.

## Libraries available today

### peterhinch/micropython-fourier

[github.com/peterhinch/micropython-fourier](https://github.com/peterhinch/micropython-fourier) is the library already in use in this book's lessons, and the only one found that explicitly names Pico 2 / RP2350 as a supported target. It is an in-place radix-2 Cooley-Tukey FFT (power-of-2 sizes only) with the butterfly/twiddle inner loop hand-written in Thumb-2 assembler that calls the **FPU** — not the integer DSP-SIMD instructions. A few files still reference `pyb.ADC`; swapping in `machine.ADC` is a small, documented change to run it standalone on Pico 2 without a Pyboard.

### ulab (`numpy.fft`)

[micropython-ulab](https://github.com/v923z/micropython-ulab) is buildable into RP2350 MicroPython firmware via dpgeorge's `rp2-add-rp2350` branch, now merged upstream. Its `numpy.fft.fft` is a portable radix-2 C implementation, not a CMSIS-DSP call — it benefits from GCC targeting the hardware FPU (`-mfpu=fpv5-sp-d16 -mfloat-abi=hard`) when the firmware is built for RP2350, but it doesn't hand-exploit the DSP-SIMD instructions either. No published Pico-2-specific 512/1024-point benchmark was found.

### CMSIS-DSP (the actual path to the SIMD ceiling)

ARM ships `libCMSISDSP_cortex-m33.a` with `arm_rfft_fast_f32` / `arm_rfft_q15`, and these kernels *do* use the DSP-SIMD extension. It is not wired into MicroPython for the `rp2` port by anyone publicly yet:

- A [Raspberry Pi forum thread](https://forums.raspberrypi.com/viewtopic.php?t=389775) shows someone linking CMSIS-DSP against RP2350 C code and hitting a hard-float/soft-float ABI mismatch (`"uses VFP register arguments, Project.elf does not"`) — fixable by matching `-mfloat-abi=hard -mfpu=fpv5-sp-d16 -DARM_MATH_CM33=1` across the *entire* build, but it shows nobody has packaged this cleanly for rp2 yet.
- A [MicroPython discussion thread](https://github.com/orgs/micropython/discussions/16130) has someone building a full CMSIS-DSP usermod wrapper (70+ functions including FFT, matrix ops, IIR filters, using `uctypes` for structs) — but for **STM32**, not `rp2`. On their STM32 Cortex-M33 target, a 1024-point FFT through that wrapper measured **~182 µs** — that's the ceiling a properly-wired CMSIS-DSP module gets you, roughly 38x faster than the pure-Python FPU path below. Nobody has published an `rp2` port of this wrapper yet.

### Ruled out

[muFFT-pico](https://github.com/j-sass/muFFT-pico) is a C/C++ library (not MicroPython) whose "optimizations" are SSE/AVX/NEON — none of which exist on Cortex-M33 (no NEON on M-profile cores). Despite the name, it isn't targeting the Pico's DSP hardware.

## Benchmarks

| Library | Platform | Core | Size | Time |
|---|---|---|---|---|
| micropython-fourier | Pico 2 | Cortex-M33 @150MHz | 1024-pt complex | **6.97 ms** |
| micropython-fourier | Pyboard 1.x | Cortex-M4 @168MHz | 1024-pt complex | 12.9 ms |
| micropython-fourier | Pyboard D SF2W/SF6W | Cortex-M7 | 1024-pt complex | 3.6 ms |
| CMSIS-DSP (C) | RP2040 | Cortex-M0+ (no FPU) | 512-pt f32 | 9.1 ms |
| CMSIS-DSP (C) | RP2040 | Cortex-M0+ (no FPU) | 1024-pt f32 | 18.6 ms |
| CMSIS-DSP usermod | STM32 | Cortex-M33 | 1024-pt | **~0.18 ms** |

!!! note
    Only the first row (peterhinch's library, 1024-pt, Pico 2) is a directly published MicroPython-on-Pico-2 number — sourced from [the library's README](https://github.com/peterhinch/micropython-fourier). No 512-point number is published there; for a radix-2 FFT that scales as N·log(N), expect roughly **3–3.3 ms**, but this should be verified on real hardware rather than trusted as an extrapolation. The RP2040 rows come from [jptrainor/cmsis-sandbox](https://github.com/jptrainor/cmsis-sandbox) (plain C, not MicroPython) and are included only for scale — they show Pico 2's FPU-backed MicroPython FFT already beats the old chip's *raw C* float FFT by roughly 2.7x, without touching the DSP-SIMD extension at all. The STM32 row comes from the [MicroPython CMSIS-DSP discussion](https://github.com/orgs/micropython/discussions/16130) and is the best available estimate of what a properly wired CMSIS-DSP path could achieve on Pico 2's own Cortex-M33 — nobody has published that port or its numbers yet.

## Sample code

### Benchmarking the FPU-based library on-device

This script needs no external hardware — it generates synthetic data and times the transform. Copy `dft.py`, `dftclass.py`, `polar.py`, and `window.py` from [micropython-fourier](https://github.com/peterhinch/micropython-fourier) to `/lib` first, and build firmware with `ulab` included if you want the second half to run.

```python
# fft_benchmark.py — run directly on a Pico 2 (RP2350), no external hardware needed
import time
from dftclass import DFT, FORWARD

def bench_dft(n, iterations=20):
    d = DFT(n)
    t0 = time.ticks_us()
    for _ in range(iterations):
        d.run(FORWARD)
    t1 = time.ticks_us()
    return time.ticks_diff(t1, t0) / iterations

for n in (512, 1024):
    us = bench_dft(n)
    print("micropython-fourier  N={:5d}  {:.2f} ms".format(n, us / 1000))

try:
    from ulab import numpy as np

    def bench_ulab(n, iterations=20):
        x = np.zeros(n, dtype=np.float)
        t0 = time.ticks_us()
        for _ in range(iterations):
            np.fft.fft(x)
        t1 = time.ticks_us()
        return time.ticks_diff(t1, t0) / iterations

    for n in (512, 1024):
        us = bench_ulab(n)
        print("ulab numpy.fft       N={:5d}  {:.2f} ms".format(n, us / 1000))
except ImportError:
    print("ulab not built into this firmware -- skipping")
```

### Building CMSIS-DSP for RP2350 (C, for a future usermod)

The compiler/link flags that resolved the hard-float ABI mismatch on the forum thread above — every object in the final link, not just the CMSIS-DSP library, must use these flags:

```
-mcpu=cortex-m33 -mthumb -mfpu=fpv5-sp-d16 -mfloat-abi=hard -DARM_MATH_CM33=1
```

linked against `libCMSISDSP_cortex-m33.a`, calling `arm_rfft_fast_f32()` / `arm_rfft_fast_init_f32()`. This is C, not MicroPython — turning it into a usable Pico 2 library means wrapping it as a MicroPython usermod (`micropython.mk` + a small C shim exposing `fft(buffer)` to Python), following the pattern the STM32 wrapper in the [MicroPython discussion thread](https://github.com/orgs/micropython/discussions/16130) already proved out. This has not been done for `rp2` publicly yet — it's the open gap.

## Practical recommendation

- **Today:** use [micropython-fourier](https://github.com/peterhinch/micropython-fourier) (already in use in this book) or `ulab`'s `numpy.fft` — run the benchmark script above on real hardware to fill in the missing 512-point and ulab numbers.
- **To chase the ~180 µs-class ceiling:** write a small C usermod wrapping `arm_rfft_fast_f32`/`arm_cfft_f32` from CMSIS-DSP, matching the hard-float ABI flags throughout the whole build. No one has published this for `rp2` yet, so this would be new work rather than a drop-in install.

## Sources

1. [peterhinch/micropython-fourier](https://github.com/peterhinch/micropython-fourier)
2. [RP2350 dsp instructions — Raspberry Pi Forums](https://forums.raspberrypi.com/viewtopic.php?t=381317)
3. [RP2350 + CMSIS-DSP + FPU help — Raspberry Pi Forums](https://forums.raspberrypi.com/viewtopic.php?t=389775)
4. [Unable to build RP2350/Pico 2 MicroPython firmware — Raspberry Pi Forums](https://forums.raspberrypi.com/viewtopic.php?t=376809)
5. [jptrainor/cmsis-sandbox](https://github.com/jptrainor/cmsis-sandbox)
6. [j-sass/muFFT-pico](https://github.com/j-sass/muFFT-pico)
7. [Adding CMSIS DSP functions — MicroPython discussion #16130](https://github.com/orgs/micropython/discussions/16130)
8. [ARM-software/CMSIS-DSP](https://github.com/ARM-software/CMSIS-DSP)
9. [Cornell ECE4760 RP2350 arithmetic benchmarks](https://people.ece.cornell.edu/land/courses/ece4760/RP2350/arithmetic/index_arithmetic.html)
10. [RP2350 — Wikipedia](https://en.wikipedia.org/wiki/RP2350)
