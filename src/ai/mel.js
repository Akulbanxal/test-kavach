/**
 * Mel Spectrogram and DSP Utilities
 * Pure JavaScript implementation optimized for browser AI inference.
 * No external DSP dependencies.
 */
import { SAMPLE_RATE, FFT_SIZE, HOP_LENGTH, N_MELS, MODEL_INPUT_FRAMES } from './constants.js';

/**
 * 1. Convert Hertz to Mel scale
 */
export function hertzToMel(hz) {
    return 2595.0 * Math.log10(1.0 + hz / 700.0);
}

/**
 * 2. Convert Mel scale to Hertz
 */
export function melToHertz(mel) {
    return 700.0 * (10.0 ** (mel / 2595.0) - 1.0);
}

/**
 * 3. Create Mel Filterbank
 * Returns a 2D array of shape [N_MELS, FFT_SIZE / 2 + 1]
 * Used to map linear STFT bins to the Mel scale.
 */
export function createMelFilterbank() {
    const numBins = Math.floor(FFT_SIZE / 2) + 1;
    const minMel = hertzToMel(0);
    const maxMel = hertzToMel(SAMPLE_RATE / 2);
    
    // N_MELS filters require N_MELS + 2 points
    const melPoints = new Float32Array(N_MELS + 2);
    const melStep = (maxMel - minMel) / (N_MELS + 1);
    for (let i = 0; i < N_MELS + 2; i++) {
        melPoints[i] = minMel + i * melStep;
    }
    
    const hzPoints = new Float32Array(N_MELS + 2);
    for (let i = 0; i < N_MELS + 2; i++) {
        hzPoints[i] = melToHertz(melPoints[i]);
    }
    
    const binPoints = new Int32Array(N_MELS + 2);
    for (let i = 0; i < N_MELS + 2; i++) {
        binPoints[i] = Math.floor((FFT_SIZE + 1) * hzPoints[i] / SAMPLE_RATE);
    }
    
    const filterbank = [];
    for (let m = 0; m < N_MELS; m++) {
        const filter = new Float32Array(numBins);
        const left = binPoints[m];
        const center = binPoints[m + 1];
        const right = binPoints[m + 2];
        
        for (let k = left; k < center; k++) {
            filter[k] = (k - binPoints[m]) / (binPoints[m + 1] - binPoints[m]);
        }
        for (let k = center; k < right; k++) {
            filter[k] = (binPoints[m + 2] - k) / (binPoints[m + 2] - binPoints[m + 1]);
        }
        filterbank.push(filter);
    }
    return filterbank;
}

/**
 * Radix-2 iterative FFT helper function.
 * Mutates the `real` and `imag` arrays in-place.
 */
function fft(real, imag) {
    const n = real.length;
    const bits = Math.log2(n);
    
    // Bit reversal permutation
    for (let i = 0; i < n; i++) {
        let j = 0;
        let tempI = i;
        for (let k = 0; k < bits; k++) {
            j = (j << 1) | (tempI & 1);
            tempI >>= 1;
        }
        if (i < j) {
            let temp = real[i]; real[i] = real[j]; real[j] = temp;
            temp = imag[i]; imag[i] = imag[j]; imag[j] = temp;
        }
    }
    
    // Cooley-Tukey algorithm
    for (let s = 1; s <= bits; s++) {
        const m = 1 << s;
        const m2 = m >> 1;
        const omega_m_re = Math.cos(-2.0 * Math.PI / m);
        const omega_m_im = Math.sin(-2.0 * Math.PI / m);
        
        for (let k = 0; k < n; k += m) {
            let omega_re = 1.0;
            let omega_im = 0.0;
            for (let j = 0; j < m2; j++) {
                const t_re = omega_re * real[k + j + m2] - omega_im * imag[k + j + m2];
                const t_im = omega_re * imag[k + j + m2] + omega_im * real[k + j + m2];
                
                const u_re = real[k + j];
                const u_im = imag[k + j];
                
                real[k + j] = u_re + t_re;
                imag[k + j] = u_im + t_im;
                real[k + j + m2] = u_re - t_re;
                imag[k + j + m2] = u_im - t_im;
                
                const next_omega_re = omega_re * omega_m_re - omega_im * omega_m_im;
                const next_omega_im = omega_re * omega_m_im + omega_im * omega_m_re;
                omega_re = next_omega_re;
                omega_im = next_omega_im;
            }
        }
    }
}

/**
 * 4. Compute Short-Time Fourier Transform (STFT)
 * Applies a Hann window and computes FFT over overlapping frames.
 * Returns an object with 'real' and 'imag' arrays containing frames.
 */
export function computeSTFT(pcmFloat32) {
    const window = new Float32Array(FFT_SIZE);
    for (let i = 0; i < FFT_SIZE; i++) {
        window[i] = 0.5 * (1.0 - Math.cos(2.0 * Math.PI * i / (FFT_SIZE - 1)));
    }
    
    const numFrames = Math.floor((pcmFloat32.length - FFT_SIZE) / HOP_LENGTH) + 1;
    const stftReal = [];
    const stftImag = [];
    
    for (let f = 0; f < numFrames; f++) {
        const start = f * HOP_LENGTH;
        const real = new Float32Array(FFT_SIZE);
        const imag = new Float32Array(FFT_SIZE);
        
        for (let i = 0; i < FFT_SIZE; i++) {
            real[i] = pcmFloat32[start + i] * window[i];
        }
        
        fft(real, imag);
        stftReal.push(real);
        stftImag.push(imag);
    }
    
    return { real: stftReal, imag: stftImag };
}

/**
 * 5. Compute Magnitude Spectrogram
 * Converts STFT complex numbers to magnitude (absolute values).
 */
export function magnitudeSpectrogram(stft) {
    const numFrames = stft.real.length;
    const numBins = Math.floor(FFT_SIZE / 2) + 1;
    const mag = [];
    
    for (let f = 0; f < numFrames; f++) {
        const frameMag = new Float32Array(numBins);
        for (let i = 0; i < numBins; i++) {
            const r = stft.real[f][i];
            const im = stft.imag[f][i];
            frameMag[i] = Math.sqrt(r * r + im * im);
        }
        mag.push(frameMag);
    }
    return mag;
}

/**
 * 6. Convert Int16Array PCM to Float32Array normalized between [-1.0, 1.0]
 */
export function pcm16ToFloat32(pcm16Array) {
    const float32 = new Float32Array(pcm16Array.length);
    for (let i = 0; i < pcm16Array.length; i++) {
        const s = pcm16Array[i];
        float32[i] = s < 0 ? s / 32768.0 : s / 32767.0;
    }
    return float32;
}

/**
 * 7. End-to-end PCM to normalized Mel Spectrogram
 * Input: Int16Array
 * Output: Flat Float32Array ready for ONNX Inference.
 * 
 * Target tensor shape expected by ONNX model:
 * [batch_size = 1, channels = 1, n_mels = 64, frames = 48]
 */
export function pcmToMelSpectrogram(pcm16Array) {
    // Pipeline execution
    const float32 = pcm16ToFloat32(pcm16Array);
    const stft = computeSTFT(float32);
    const mag = magnitudeSpectrogram(stft);
    const melFilters = createMelFilterbank();
    
    const numFrames = mag.length;
    // We pad or truncate frames to match MODEL_INPUT_FRAMES exactly
    const targetFrames = MODEL_INPUT_FRAMES;
    
    // Total size = N_MELS * MODEL_INPUT_FRAMES
    const tensorData = new Float32Array(N_MELS * targetFrames);
    
    // Apply filters and convert to log scale
    for (let f = 0; f < targetFrames; f++) {
        for (let m = 0; m < N_MELS; m++) {
            let melValue = 0;
            // If we have less frames than expected, we leave padded values as 0
            if (f < numFrames) {
                for (let k = 0; k < mag[f].length; k++) {
                    // Power spectrogram (mag squared) times filter weight
                    melValue += (mag[f][k] ** 2) * melFilters[m][k];
                }
            }
            
            // Log base 10 mapping, adding 1e-9 for numerical stability against log(0)
            const logMel = Math.log10(melValue + 1e-9);
            
            // Layout is typically [batch, channels, height/mels, width/frames]
            // We use row-major flat indexing: index = m * targetFrames + f
            tensorData[m * targetFrames + f] = logMel;
        }
    }
    
    // Mean-variance normalization across the entire spectrogram
    let sum = 0;
    for (let i = 0; i < tensorData.length; i++) {
        sum += tensorData[i];
    }
    const mean = sum / tensorData.length;
    
    let variance = 0;
    for (let i = 0; i < tensorData.length; i++) {
        variance += (tensorData[i] - mean) ** 2;
    }
    variance = variance / tensorData.length;
    const std = Math.sqrt(variance) + 1e-9;
    
    for (let i = 0; i < tensorData.length; i++) {
        tensorData[i] = (tensorData[i] - mean) / std;
    }
    
    return tensorData; // Ready to feed into ONNX tensor
}
