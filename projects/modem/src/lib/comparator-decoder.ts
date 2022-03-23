import { Decoder } from "./decoder";
import { Observable, Subject } from "rxjs";
import { Config } from "./config";

enum ReceiveStatus {
  START_BIT = 0,
  DATA_BIT = 8,
  CONTROL_BIT = 9,
  PARITY_BIT = 10,
  STOP_BIT = 11,
  INACTIVE = 0xFF
}

export class ComparatorDecoder implements Decoder {

  onReceive: Subject<string> = new Subject<string>();

  private isLastSampleOnTop = false;
  private receiveStatus: ReceiveStatus = ReceiveStatus.INACTIVE;
  private samplesPerBaud = 0;
  private samplesPerBaudCounter = 0;
  private samplesPerFrequencyCounter = 0;
  private lowCounter = 0;
  private highCounter = 0;

  private dataByte = 0;
  private parityBit = true;
  private controlBit = true;

  private minSamplesPerLowFrequency = 0;
  private maxSamplesPerLowFrequency = 0;
  private minSamplesPerHighFrequency = 0;
  private maxSamplesPerHighFrequency = 0;

  private message!: string;
  private messageSize = 0;

  constructor(private config: Config, private sampleRate: number) {
    this.init();
  }

  private init(): void {
    this.samplesPerBaud = Math.floor(this.sampleRate / this.config.baud);
    const samplesPerLowFreq = this.sampleRate / this.config.freqLow;
    const samplesPerHighFreq = this.sampleRate / this.config.freqHigh;
    const highPerLow = this.config.freqHigh / this.config.freqLow;

    const rSamplesPerLowFreq = (samplesPerLowFreq - samplesPerHighFreq) / (1 / highPerLow + 1);
    const rSamplesPerHighFreq = (samplesPerLowFreq - samplesPerHighFreq) - rSamplesPerLowFreq;

    this.minSamplesPerLowFrequency = samplesPerLowFreq - rSamplesPerLowFreq;
    this.maxSamplesPerLowFrequency = samplesPerLowFreq + rSamplesPerLowFreq;
    this.minSamplesPerHighFrequency = samplesPerHighFreq - rSamplesPerHighFreq;
    this.maxSamplesPerHighFrequency = samplesPerHighFreq + rSamplesPerHighFreq;
  }

  setConfig(config: Config): void {
    this.config = config;
    this.init();
  }

  demodulate(samples: Float32Array): void {
    for (const sample of samples) {

      // comparator call on falling edge
      if (this.isLastSampleOnTop && sample < 0) {
        this.compare();
      }

      // if baud is complete and receive-status wasn't INACTIVE, then determine the received bit
      if (this.receiveStatus < ReceiveStatus.INACTIVE && this.samplesPerBaudCounter > this.samplesPerBaud) {
        this.bitDetermination();
        this.samplesPerBaudCounter = 0;
      }

      this.isLastSampleOnTop = (sample >= 0);
      this.samplesPerFrequencyCounter++;
      this.samplesPerBaudCounter++;
    }
  }

  private compare() {

    const sampleCounter = this.samplesPerFrequencyCounter;

    // wave is too short
    if (sampleCounter < this.minSamplesPerHighFrequency) {
      return;
    }

    this.samplesPerFrequencyCounter = 0;

    // wave is too long
    if (sampleCounter > this.maxSamplesPerLowFrequency) {
      return;
    }

    // zero's wave
    if (sampleCounter > this.minSamplesPerLowFrequency) {
      this.lowCounter += sampleCounter;

      // start bit detection
      if (this.receiveStatus === ReceiveStatus.INACTIVE && this.lowCounter > this.samplesPerBaud / 2) {
        this.receiveStatus = ReceiveStatus.START_BIT;
        this.highCounter = 0;
        this.samplesPerBaudCounter = this.lowCounter;
      }
    }
    // one's wave
    else {
      if (this.receiveStatus === ReceiveStatus.INACTIVE) {
        this.lowCounter = this.highCounter = 0;
      } else {
        this.highCounter += sampleCounter;
      }
    }
  }

  private bitDetermination() {

    // Bit logic determination
    let bit;

    if (this.highCounter < this.lowCounter) {
      bit = 0;
      this.lowCounter = 0;
    } else {
      bit = 0b1000_0000;
      this.highCounter = 0;
    }

    // start bit reception
    if (this.receiveStatus === ReceiveStatus.START_BIT && !bit) {
      this.dataByte = 0;
      this.parityBit = true;
      this.receiveStatus++;
      return;
    }
    // data bit reception
    if (this.receiveStatus <= ReceiveStatus.DATA_BIT) {
      this.dataByte >>>= 1;
      this.dataByte |= bit;
      this.parityBit = bit ? !this.parityBit : this.parityBit;
      this.receiveStatus++;
      return;
    }
    // control bit reception
    if (this.receiveStatus === ReceiveStatus.CONTROL_BIT) {
      this.controlBit = Boolean(bit);
      this.parityBit = bit ? !this.parityBit : this.parityBit;
      this.receiveStatus++;
      return;
    }
    // parity bit reception
    if (this.receiveStatus === ReceiveStatus.PARITY_BIT) {
      if (Boolean(bit) === this.parityBit) {
        this.receiveStatus++;
        return;
      }
    }
    // stop bit reception
    if (this.receiveStatus === ReceiveStatus.STOP_BIT) {
      if (Boolean(bit)) {
        this.onReceiveByte(this.dataByte, this.controlBit);
      }
    }

    this.receiveStatus = ReceiveStatus.INACTIVE;
  }

  private onReceiveByte(dataByte: number, controlBit: boolean) {
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
}
