import { Inject, Injectable, Optional } from '@angular/core';
import { Config } from "./config";
import { Encoder } from "./encoder";
import { BasicEncoder } from "./basic-encoder";
import { Decoder } from "./decoder";
import { Subject, Subscription } from "rxjs";
import { DFTDecoder } from "./dft-decoder";

@Injectable({
  providedIn: 'root'
})
export class ModemService {

  onReceive: Subject<string> = new Subject<string>();
  private decoderSub: Subscription;
  private mediaStream!: MediaStream;
  private listening = false;

  constructor(@Inject('audioContext') @Optional() public audioContext: AudioContext,
              @Inject('microModemConfig') @Optional() private config: Config,
              @Inject('microModemEncoder') @Optional() private encoder: Encoder,
              @Inject('avrModemDecoder') @Optional() private decoder: Decoder) {

    this.audioContext = audioContext || new AudioContext();
    this.config = config || {baud: 1600, freqLow: 4800, freqHigh: 11200};
    this.encoder = encoder || new BasicEncoder(this.config, this.audioContext.sampleRate);
    this.decoder = decoder || new DFTDecoder(this.config, this.audioContext.sampleRate);
    this.decoderSub = this.decoder.onReceive.subscribe(message => this.messageRouter(message))
  }

  setConfig(config: Config) {
    this.encoder.setConfig(config);
    this.decoder.setConfig(config);
    this.config = config;
  }

  getConfig(): Config {
    return this.config;
  }

  setEncoder(encoder: Encoder){
    this.encoder = encoder;
  }

  setDecoder(decoder: Decoder) {
    this.decoderSub.unsubscribe();
    this.decoder = decoder;
    this.decoderSub = this.decoder.onReceive.subscribe(message => this.messageRouter((message)));
  }

  send(message: string): void {
    const samples: Float32Array = this.encoder.modulate(message);
    const audioBuffer: AudioBuffer = this.audioContext.createBuffer(1, samples.length, this.audioContext.sampleRate);
    audioBuffer.getChannelData(0).set(samples);
    const audioBufferSourceNode: AudioBufferSourceNode = this.audioContext.createBufferSource();
    audioBufferSourceNode.buffer = audioBuffer;
    audioBufferSourceNode.connect(this.audioContext.destination);

    audioBufferSourceNode.start(0);
  }

  set listen(value: boolean) {
    if (value === this.listen) {
      return;
    }

    if (value) {
      navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: true
        },
        video: false
      }).then(mediaStream => this.onAudioAccessPermit(mediaStream))
        .catch(() => console.warn('Audio Access Denied..'));
    } else {
      this.mediaStream.getTracks().forEach(mediaStreamTrack => mediaStreamTrack.enabled = false);
      this.listening = false;
    }
  }

  get listen(): boolean {
    return this.listening;
  }

  private onAudioAccessPermit(mediaStream: MediaStream): void {
    this.mediaStream = mediaStream;
    const mediaStreamAudioSourceNode: MediaStreamAudioSourceNode = this.audioContext.createMediaStreamSource(mediaStream);
    const scriptProcessorNode: ScriptProcessorNode = this.audioContext.createScriptProcessor(8192, 1, 1);
    mediaStreamAudioSourceNode.connect(scriptProcessorNode);
    scriptProcessorNode.addEventListener('audioprocess', audioProcessingEvent => this.onAudioProcess(audioProcessingEvent));
    scriptProcessorNode.disconnect();
    this.listening = true;
  }

  private onAudioProcess(audioProcessingEvent: AudioProcessingEvent): void {
    const samples: Float32Array = audioProcessingEvent.inputBuffer.getChannelData(0);
    this.decoder.demodulate(samples);
  }

  private messageRouter(message: string) {
    this.onReceive.next(message);
  }
}
