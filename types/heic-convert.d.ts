// heic-convert no provee types oficiales (chequeado en npm package).
// Declaración manual basada en su README y signature público.
//
// Uso típico:
//   import convert from "heic-convert";
//   const jpegArrayBuffer = await convert({
//     buffer: heicBuffer,
//     format: "JPEG",
//     quality: 1,
//   });

declare module "heic-convert" {
  interface ConvertOptions {
    buffer: ArrayBuffer | Buffer;
    format: "JPEG" | "PNG";
    quality?: number; // 0-1, default 0.92
  }

  function convert(options: ConvertOptions): Promise<ArrayBuffer>;

  export = convert;
}
