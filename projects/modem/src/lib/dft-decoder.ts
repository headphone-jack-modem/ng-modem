import { Decoder } from "./decoder";
import { Subject } from "rxjs";
import { Config } from "./config";

export class DFTDecoder implements Decoder {

  onReceive: Subject<string> = new Subject<string>();

  private samplesPerBaud = 0;

  private sinusLow!: Float32Array;
  private sinusHigh!: Float32Array;
  private cosinusLow!: Float32Array;
  private cosinusHigh!: Float32Array;

  // use to calculate the correlation
  private cLowReal!: Float32Array;
  private cLowImag!: Float32Array;
  private cHighReal!: Float32Array;
  private cHighImag!: Float32Array;
  private cIndex = 0;
  private sumLowReal = 0;
  private sumLowImag = 0;
  private sumHighReal = 0;
  private sumHighImag = 0;

  // use to calculate the bit-lengths discriminate
  private discriminate = 0;
  private absMax = 0;

  // use to fetching the data
  private rxBitStatus: RxBitStatus = RxBitStatus.INACTIVE;
  private byte = 0;
  private parityBit = 1;
  private controlBit = false;

  private message!: string;
  private messageSize = 0;

  constructor(private config: Config, private sampleRate: number) {
    this.init();
  }

  private init(): void {
    this.samplesPerBaud = Math.floor(this.sampleRate / this.config.baud);

    // phase increment with respect to the sampling rate
    const phaseIncLow = 2 * Math.PI * (this.config.freqLow / this.sampleRate);
    const phaseIncHigh = 2 * Math.PI * (this.config.freqHigh / this.sampleRate);

    this.sinusLow = new Float32Array(this.samplesPerBaud);
    this.sinusHigh = new Float32Array(this.samplesPerBaud);
    this.cosinusLow = new Float32Array(this.samplesPerBaud);
    this.cosinusHigh = new Float32Array(this.samplesPerBaud);

    this.cLowReal = new Float32Array(this.samplesPerBaud).fill(0);
    this.cLowImag = new Float32Array(this.samplesPerBaud).fill(0);
    this.cHighReal = new Float32Array(this.samplesPerBaud).fill(0);
    this.cHighImag = new Float32Array(this.samplesPerBaud).fill(0);

    for (let i = 0; i < this.samplesPerBaud; i++) {
      this.sinusLow[i] = Math.sin(phaseIncLow * i);
      this.sinusHigh[i] = Math.sin(phaseIncHigh * i);
      this.cosinusLow[i] = Math.cos(phaseIncLow * i);
      this.cosinusHigh[i] = Math.cos(phaseIncHigh * i);
    }
  }

  setConfig(config: Config): void {
    this.config = config;
    this.init();
  }

  private peakNormalize(samples: Float32Array): Float32Array {
    let max = Math.max.apply(null, Array.from(samples, sample => Math.abs(sample)));
    if (max == 0)
      return samples;
    samples.map(s => s / max);
    return samples;
  }

  private sum(samples: Float32Array, index: number): number {
    let s = 0;
    for (let sample of samples) {
      s += sample;
    }
    return s;
  }

  private correlation(samples: Float32Array): Float32Array {

    let cLow, cHigh;

    for (let i = 0; i < samples.length; i++) {
      this.cLowReal[this.cIndex] = samples[i] * this.cosinusLow[this.cIndex];
      this.cLowImag[this.cIndex] = samples[i] * this.sinusLow[this.cIndex];
      this.cHighReal[this.cIndex] = samples[i] * this.cosinusHigh[this.cIndex];
      this.cHighImag[this.cIndex] = samples[i] * this.sinusHigh[this.cIndex];

      this.sumLowReal += this.cLowReal[this.cIndex];
      this.sumLowImag += this.cLowImag[this.cIndex];
      this.sumHighReal += this.cHighReal[this.cIndex];
      this.sumHighImag += this.cHighImag[this.cIndex];

      cLow = Math.sqrt(Math.pow(this.sumLowReal, 2) + Math.pow(this.sumLowImag, 2));
      cHigh = Math.sqrt(Math.pow(this.sumHighReal, 2) + Math.pow(this.sumHighImag, 2));

      samples[i] = cHigh - cLow;

      this.cIndex++;
      if (this.cIndex == this.samplesPerBaud) this.cIndex = 0;
      this.sumLowReal -= this.cLowReal[this.cIndex];
      this.sumLowImag -= this.cLowImag[this.cIndex];
      this.sumHighReal -= this.cHighReal[this.cIndex];
      this.sumHighImag -= this.cHighImag[this.cIndex];

    }

    return samples;
  }

  private smoothing(samples: Float32Array, n: number): Float32Array {
    for (let i = n; i < samples.length - n; i++) {
      for (let m = -n; m <= n; m++) {
        samples[i] += samples[i + m];
      }
      samples[i] /= (2 * n + 1);
    }
    return samples;
  }

  private bitDetection(samples: Float32Array): number[] {
    let b: number[] = [];
    for (let i = 1; i < samples.length; i++) {
      this.discriminate++;
      if (Math.abs(samples[i]) > Math.abs(this.absMax))
        this.absMax = samples[i];
      if (samples[i - 1] * samples[i] <= 0) {
        let length = Math.round(this.discriminate / this.samplesPerBaud);
        let bits: number[];
        if (Math.abs(this.absMax) < 5)
          bits = Array(1).fill(-1);
        else if (this.absMax < 0)
          bits = Array(length).fill(0);
        else
          bits = Array(length).fill(1);
        b.push(...bits);
        this.discriminate = this.absMax = 0;
      }
    }
    return b;
  }

  private onRxByte(dataByte: number, controlBit: boolean) {
    if (controlBit) {
      this.messageSize = dataByte;
      this.message = "";
      return;
    }

    if (Boolean(this.messageSize)) {
      this.message += String.fromCharCode(dataByte);
      if (this.message.length === this.messageSize) {
        this.onReceive.next(this.message);
        this.messageSize = 0;
      }
    }
  }

  private dataFetch(bit: number) {

    if (this.rxBitStatus === RxBitStatus.INACTIVE && bit === 0) {
      this.rxBitStatus = RxBitStatus.START_BIT;
      this.parityBit = 1;
      return;
    }

    if (this.rxBitStatus <= RxBitStatus.DATA_BIT) {
      this.parityBit ^= bit;
      bit <<= 7;
      this.byte >>>= 1;
      this.byte |= bit;
      this.rxBitStatus++;
      return;
    }

    if (this.rxBitStatus === RxBitStatus.CONTROL_BIT) {
      this.parityBit ^= bit;
      this.controlBit = (bit === 1);
      this.rxBitStatus++;
      return;
    }

    if (this.rxBitStatus === RxBitStatus.PARITY_BIT && bit === this.parityBit) {
      this.rxBitStatus++;
      return;
    }

    if (this.rxBitStatus === RxBitStatus.STOP_BIT && bit === 1)
      this.onRxByte(this.byte, this.controlBit);

    this.rxBitStatus = RxBitStatus.INACTIVE;
  }

  private onRxBits(bits: number[]): void {
    for (let bit of bits)
      if (bit == -1)
        this.rxBitStatus = RxBitStatus.INACTIVE;
      else
        this.dataFetch(bit);
  }

  demodulate(samples: Float32Array): void {
    samples = this.peakNormalize(samples);
    samples = this.correlation(samples);
    samples = this.smoothing(samples, 1);
    let bits: number[] = this.bitDetection(samples);
    this.onRxBits(bits);
  }

}

enum RxBitStatus {
  START_BIT = 0,
  DATA_BIT = 7,
  CONTROL_BIT = 8,
  PARITY_BIT = 9,
  STOP_BIT = 10,
  INACTIVE = 0xFF
}
