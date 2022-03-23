import { Encoder } from "./encoder";
import { Config } from "./config";

export class BasicEncoder implements Encoder {

  private samplesPerBit!: number;
  // an array of values of samples in one baud of a low frequency
  private bitBufferLow!: Float32Array;
  // an array of values of samples in one baud of a high frequency
  private bitBufferHigh!: Float32Array;

  constructor(private config: Config, private sampleRate: number) {
    this.init();
  }

  private init(): void {

    this.samplesPerBit = Math.floor(this.sampleRate / this.config.baud);
    this.bitBufferLow = new Float32Array(this.samplesPerBit);
    this.bitBufferHigh = new Float32Array(this.samplesPerBit);

    // ω(angular frequency) per sample for low frequency
    const lowWps = 2 * Math.PI * this.config.freqLow / this.sampleRate;
    // ω(angular frequency) per sample for high frequency
    const highWps = 2 * Math.PI * this.config.freqHigh / this.sampleRate;

    for (let bitBufferIndex = 0; bitBufferIndex < this.samplesPerBit; bitBufferIndex++) {
      this.bitBufferLow[bitBufferIndex] = -Math.sin(bitBufferIndex * lowWps);
      this.bitBufferHigh[bitBufferIndex] = -Math.sin(bitBufferIndex * highWps);
    }
  }

  setConfig(config: Config): void {
    this.config = config;
    this.init();
  }

  modulate(message: string): Float32Array {

    let header = 0b01_0000_0000;     // the one is for the control bit

    // convert message characters to an array of utf8 numbers
    let utf8Message = this.utf8Encode(message);

    if (utf8Message.length > 256)
      throw new Error("the message length is too long");

    header |= utf8Message.length;

    // 1 byte for preamble
    // 1 byte for header
    // x byte for message
    // every byte take 12 baud:
    //     start    1
    //     data     8
    //     control  1
    //     parity   1
    //     stop     1
    // every baud take 30 samples
    const bufferLength = (2 + utf8Message.length) * 12 * this.samplesPerBit;
    const samples: Float32Array = new Float32Array(bufferLength);

    let samplesHead = 0;  // use this to pointing to the current sample of the samples

    // preamble
    for (let i = 0; i < 12; i++, samplesHead += this.samplesPerBit)
      samples.set(this.bitBufferHigh, samplesHead);

    // create an array of numbers including the header and the message
    for (let byte of [header].concat(utf8Message)) {

      // odd parity bit
      let parityBit = true;

      // for each bit of the byte, do
      let bitSelector = 0b10_0000_0000;
      while (Boolean(bitSelector >>= 1)) {
        parityBit = bitSelector & byte ? !parityBit : parityBit;
      }

      byte <<= 1;                                      // (start bit):   data in binary is --c ---- ---- 0
      byte |= parityBit ? 0b010_0000_0000_0 : 0;       // (parity bit):  data in binary is -pc ---- ---- 0
      byte |= 0b100_0000_0000_0;                       // (stop bit):    data in binary is 1pc ---- ---- 0

      // fill the samples with the right amounts
      for (let bitIndex = 0; bitIndex < 12; bitIndex++, byte >>= 1, samplesHead += this.samplesPerBit) {
        samples.set(byte & 1 ? this.bitBufferHigh : this.bitBufferLow, samplesHead);
      }
    }
    // samples.set(new Float32Array(12 * this.samplesPerBit).fill(0.1), samplesHead);

    return samples;
  }

  private utf8Encode(str: String): number[] {
    let encoded = [];
    for (let index = 0; index < str.length; index++) {
      let codePoint = str.charCodeAt(index);
      // decode surrogate
      // see https://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
      if (codePoint >= 0xd800 && codePoint <= 0xdbff && str.length > (index + 1)) {
        const low = str.charCodeAt(index + 1);
        if (low >= 0xdc00 && low <= 0xdfff) {
          index++;
          codePoint = ((codePoint - 0xd800) << 10) + low - 0xdc00 + 0x10000;
        }
      }
      if (codePoint <= 0x7f) {
        encoded.push(codePoint);
      }
      else if (codePoint <= 0x7ff) {
        encoded.push(((codePoint >> 6) & 0x1F) | 0xc0, (codePoint & 0x3f) | 0x80);
      }
      else if (codePoint <= 0xffff) {
        encoded.push((codePoint >> 12) | 0xe0, ((codePoint >> 6) & 0x3f) | 0x80, (codePoint & 0x3f) | 0x80);
      }
      else if (codePoint <= 0x1fffff) {
        encoded.push(((codePoint >> 18) & 0x07) | 0xf0, ((codePoint >> 12) & 0x3f) | 0x80, ((codePoint >> 6) & 0x3f) | 0x80, (codePoint & 0x3f) | 0x80);
      }
    }
    return encoded;
  }
}
