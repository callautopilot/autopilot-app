// webm-byte-stream.d.ts
declare module "webm-byte-stream" {
  export class WebMByteStream {
    constructor(buffer: Buffer);
    getNextCluster(): Buffer;
    // Add other methods and properties as needed
  }
}
