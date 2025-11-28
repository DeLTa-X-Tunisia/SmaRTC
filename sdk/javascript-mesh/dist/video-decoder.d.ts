/**
 * Differential Video Decoder (Client-Side)
 * Decodes compressed video frames from SmaRTC server
 */
export declare class DifferentialVideoDecoder {
    private previousFrame;
    private canvas;
    private ctx;
    constructor(width: number, height: number);
    /**
     * Decode compressed frame
     */
    decode(compressedData: Uint8Array): ImageData;
    /**
     * Decode keyframe (full frame)
     */
    private decodeKeyframe;
    /**
     * Decode delta frame (only changes)
     */
    private decodeDeltaFrame;
    /**
     * Get decoded frame as canvas element
     */
    getCanvas(): HTMLCanvasElement;
    /**
     * Render decoded frame to target canvas
     */
    renderTo(targetCanvas: HTMLCanvasElement): void;
}
//# sourceMappingURL=video-decoder.d.ts.map