using System.Buffers;
using System.Runtime.CompilerServices;
using System.Runtime.InteropServices;

namespace TunRTC.SignalServer.Codec
{
    /// <summary>
    /// Ultra-lightweight differential video encoder for extreme bandwidth reduction
    /// Target: <100kbps per stream, 144p-720p adaptive quality
    /// Strategy: Delta frames + aggressive quantization + smart keyframe scheduling
    /// </summary>
    public class DifferentialVideoEncoder
    {
        private readonly ArrayPool<byte> _bufferPool = ArrayPool<byte>.Shared;
        private readonly ILogger<DifferentialVideoEncoder> _logger;
        
        private byte[]? _previousFrame;
        private int _frameWidth;
        private int _frameHeight;
        private int _frameCount;
        private int _keyframeInterval = 30; // Keyframe every 30 frames (1s at 30fps)
        private QualityLevel _currentQuality = QualityLevel.Medium;

        public DifferentialVideoEncoder(ILogger<DifferentialVideoEncoder> logger)
        {
            _logger = logger;
        }

        /// <summary>
        /// Initialize encoder with frame dimensions
        /// </summary>
        public void Initialize(int width, int height, QualityLevel quality = QualityLevel.Medium)
        {
            _frameWidth = width;
            _frameHeight = height;
            _currentQuality = quality;
            _previousFrame = new byte[width * height * 4]; // RGBA
            
            _logger.LogInformation("Encoder initialized: {Width}x{Height} @ {Quality}", 
                width, height, quality);
        }

        /// <summary>
        /// Encode frame using differential compression
        /// Returns compressed data size in bytes
        /// </summary>
        public EncodedFrame EncodeFrame(ReadOnlySpan<byte> frameData)
        {
            if (_previousFrame == null)
            {
                throw new InvalidOperationException("Encoder not initialized");
            }

            _frameCount++;
            var isKeyframe = _frameCount % _keyframeInterval == 1;

            var outputBuffer = _bufferPool.Rent(_frameWidth * _frameHeight * 4);
            int compressedSize;

            try
            {
                if (isKeyframe)
                {
                    // Keyframe: Apply quantization and compression
                    compressedSize = EncodeKeyframe(frameData, outputBuffer);
                    frameData.CopyTo(_previousFrame);
                }
                else
                {
                    // Delta frame: Encode only differences
                    compressedSize = EncodeDeltaFrame(frameData, outputBuffer);
                    frameData.CopyTo(_previousFrame);
                }

                // Copy to final buffer
                var result = new byte[compressedSize];
                Array.Copy(outputBuffer, result, compressedSize);

                return new EncodedFrame
                {
                    Data = result,
                    Width = _frameWidth,
                    Height = _frameHeight,
                    IsKeyframe = isKeyframe,
                    FrameNumber = _frameCount,
                    Quality = _currentQuality
                };
            }
            finally
            {
                _bufferPool.Return(outputBuffer);
            }
        }

        /// <summary>
        /// Adaptive quality adjustment based on bandwidth
        /// </summary>
        public void AdjustQuality(int availableBandwidthKbps)
        {
            var newQuality = availableBandwidthKbps switch
            {
                < 100 => QualityLevel.VeryLow,   // 144p equivalent
                < 300 => QualityLevel.Low,       // 240p equivalent
                < 800 => QualityLevel.Medium,    // 360p equivalent
                < 2000 => QualityLevel.High,     // 480p equivalent
                _ => QualityLevel.VeryHigh       // 720p equivalent
            };

            if (newQuality != _currentQuality)
            {
                _currentQuality = newQuality;
                _logger.LogInformation("Quality adjusted to {Quality} (bandwidth: {Bandwidth}kbps)",
                    newQuality, availableBandwidthKbps);
            }
        }

        /// <summary>
        /// Encode keyframe with quantization
        /// </summary>
        [MethodImpl(MethodImplOptions.AggressiveOptimization)]
        private int EncodeKeyframe(ReadOnlySpan<byte> frameData, Span<byte> output)
        {
            var quantization = GetQuantizationFactor(_currentQuality);
            var blockSize = GetBlockSize(_currentQuality);
            
            int outputIndex = 0;
            
            // Write header
            output[outputIndex++] = 0xFF; // Keyframe marker
            output[outputIndex++] = (byte)_currentQuality;
            
            // Block-based encoding with quantization
            for (int y = 0; y < _frameHeight; y += blockSize)
            {
                for (int x = 0; x < _frameWidth; x += blockSize)
                {
                    var block = ExtractBlock(frameData, x, y, blockSize);
                    var quantized = QuantizeBlock(block, quantization);
                    
                    // RLE compression
                    outputIndex += CompressBlock(quantized, output.Slice(outputIndex));
                }
            }

            return outputIndex;
        }

        /// <summary>
        /// Encode delta frame (only differences)
        /// </summary>
        [MethodImpl(MethodImplOptions.AggressiveOptimization)]
        private int EncodeDeltaFrame(ReadOnlySpan<byte> frameData, Span<byte> output)
        {
            var threshold = GetDifferenceThreshold(_currentQuality);
            int outputIndex = 0;
            
            // Write header
            output[outputIndex++] = 0x00; // Delta frame marker
            
            int changedBlocks = 0;
            var blockSize = GetBlockSize(_currentQuality);
            
            // First pass: count changed blocks
            var changedBlockList = new List<(int x, int y)>();
            
            for (int y = 0; y < _frameHeight; y += blockSize)
            {
                for (int x = 0; x < _frameWidth; x += blockSize)
                {
                    if (_previousFrame != null && HasBlockChanged(frameData, _previousFrame, x, y, blockSize, threshold))
                    {
                        changedBlockList.Add((x, y));
                        changedBlocks++;
                    }
                }
            }

            // Write changed block count
            WriteInt16(output, outputIndex, (short)changedBlocks);
            outputIndex += 2;

            // If more than 70% changed, fallback to keyframe
            var totalBlocks = (_frameWidth / blockSize) * (_frameHeight / blockSize);
            if (changedBlocks > totalBlocks * 0.7)
            {
                return EncodeKeyframe(frameData, output);
            }

            // Second pass: encode changed blocks
            foreach (var (x, y) in changedBlockList)
            {
                // Write block position (relative encoding)
                output[outputIndex++] = (byte)(x / blockSize);
                output[outputIndex++] = (byte)(y / blockSize);
                
                // Write block data (delta)
                var block = ExtractBlock(frameData, x, y, blockSize);
                var previousBlock = ExtractBlock(_previousFrame, x, y, blockSize);
                var delta = ComputeDelta(block, previousBlock);
                
                var quantization = GetQuantizationFactor(_currentQuality);
                var quantized = QuantizeBlock(delta, quantization);
                outputIndex += CompressBlock(quantized, output.Slice(outputIndex));
            }

            return outputIndex;
        }

        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        private bool HasBlockChanged(ReadOnlySpan<byte> current, byte[] previous, 
            int x, int y, int blockSize, int threshold)
        {
            long totalDiff = 0;
            int pixels = 0;

            for (int by = 0; by < blockSize && y + by < _frameHeight; by++)
            {
                for (int bx = 0; bx < blockSize && x + bx < _frameWidth; bx++)
                {
                    var idx = ((y + by) * _frameWidth + (x + bx)) * 4;
                    
                    if (idx + 3 >= current.Length || idx + 3 >= previous.Length)
                        continue;

                    totalDiff += Math.Abs(current[idx] - previous[idx]); // R
                    totalDiff += Math.Abs(current[idx + 1] - previous[idx + 1]); // G
                    totalDiff += Math.Abs(current[idx + 2] - previous[idx + 2]); // B
                    pixels++;
                }
            }

            return pixels > 0 && (totalDiff / pixels) > threshold;
        }

        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        private byte[] ExtractBlock(ReadOnlySpan<byte> data, int x, int y, int blockSize)
        {
            var block = new byte[blockSize * blockSize * 4];
            int idx = 0;

            for (int by = 0; by < blockSize && y + by < _frameHeight; by++)
            {
                for (int bx = 0; bx < blockSize && x + bx < _frameWidth; bx++)
                {
                    var srcIdx = ((y + by) * _frameWidth + (x + bx)) * 4;
                    if (srcIdx + 3 < data.Length)
                    {
                        block[idx++] = data[srcIdx];
                        block[idx++] = data[srcIdx + 1];
                        block[idx++] = data[srcIdx + 2];
                        block[idx++] = data[srcIdx + 3];
                    }
                }
            }

            return block;
        }

        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        private byte[] ComputeDelta(byte[] current, byte[] previous)
        {
            var delta = new byte[current.Length];
            for (int i = 0; i < current.Length; i++)
            {
                delta[i] = (byte)(current[i] - previous[i] + 128); // Offset to handle negative
            }
            return delta;
        }

        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        private byte[] QuantizeBlock(byte[] block, int quantization)
        {
            var quantized = new byte[block.Length];
            for (int i = 0; i < block.Length; i++)
            {
                quantized[i] = (byte)((block[i] / quantization) * quantization);
            }
            return quantized;
        }

        /// <summary>
        /// Simple RLE compression for block data
        /// </summary>
        [MethodImpl(MethodImplOptions.AggressiveOptimization)]
        private int CompressBlock(byte[] block, Span<byte> output)
        {
            int outIdx = 0;
            int i = 0;

            while (i < block.Length)
            {
                byte value = block[i];
                int count = 1;

                // Count consecutive identical values
                while (i + count < block.Length && block[i + count] == value && count < 255)
                {
                    count++;
                }

                if (count >= 3 || value == 0) // RLE beneficial
                {
                    output[outIdx++] = 0xFF; // RLE marker
                    output[outIdx++] = (byte)count;
                    output[outIdx++] = value;
                }
                else // Literal copy
                {
                    for (int j = 0; j < count; j++)
                    {
                        output[outIdx++] = block[i + j];
                    }
                }

                i += count;
            }

            return outIdx;
        }

        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        private int GetQuantizationFactor(QualityLevel quality) => quality switch
        {
            QualityLevel.VeryLow => 32,
            QualityLevel.Low => 16,
            QualityLevel.Medium => 8,
            QualityLevel.High => 4,
            QualityLevel.VeryHigh => 2,
            _ => 8
        };

        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        private int GetBlockSize(QualityLevel quality) => quality switch
        {
            QualityLevel.VeryLow => 16,
            QualityLevel.Low => 8,
            QualityLevel.Medium => 8,
            QualityLevel.High => 4,
            QualityLevel.VeryHigh => 4,
            _ => 8
        };

        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        private int GetDifferenceThreshold(QualityLevel quality) => quality switch
        {
            QualityLevel.VeryLow => 30,
            QualityLevel.Low => 20,
            QualityLevel.Medium => 15,
            QualityLevel.High => 10,
            QualityLevel.VeryHigh => 5,
            _ => 15
        };

        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        private static void WriteInt16(Span<byte> buffer, int offset, short value)
        {
            buffer[offset] = (byte)(value & 0xFF);
            buffer[offset + 1] = (byte)((value >> 8) & 0xFF);
        }

        public void Dispose()
        {
            _previousFrame = null;
        }
    }

    /// <summary>
    /// Differential video decoder
    /// </summary>
    public class DifferentialVideoDecoder
    {
        private byte[]? _previousFrame;
        private int _frameWidth;
        private int _frameHeight;

        public void Initialize(int width, int height)
        {
            _frameWidth = width;
            _frameHeight = height;
            _previousFrame = new byte[width * height * 4];
        }

        public DecodedFrame DecodeFrame(EncodedFrame encoded)
        {
            if (_previousFrame == null)
                throw new InvalidOperationException("Decoder not initialized");

            var output = new byte[_frameWidth * _frameHeight * 4];

            if (encoded.IsKeyframe)
            {
                DecodeKeyframe(encoded.Data, output);
                Array.Copy(output, _previousFrame, output.Length);
            }
            else
            {
                DecodeDeltaFrame(encoded.Data, _previousFrame, output);
                Array.Copy(output, _previousFrame, output.Length);
            }

            return new DecodedFrame
            {
                Data = output,
                Width = _frameWidth,
                Height = _frameHeight
            };
        }

        private void DecodeKeyframe(byte[] data, byte[] output)
        {
            // TODO: Implement full keyframe decode
            // For now, placeholder
        }

        private void DecodeDeltaFrame(byte[] data, byte[] previous, byte[] output)
        {
            // TODO: Implement delta decode
            // For now, placeholder
        }
    }

    /// <summary>
    /// Quality levels for adaptive encoding
    /// </summary>
    public enum QualityLevel
    {
        VeryLow,    // 144p equivalent, ~50kbps
        Low,        // 240p equivalent, ~100kbps
        Medium,     // 360p equivalent, ~200kbps
        High,       // 480p equivalent, ~400kbps
        VeryHigh    // 720p equivalent, ~800kbps
    }

    public class EncodedFrame
    {
        public byte[] Data { get; set; } = Array.Empty<byte>();
        public int Width { get; set; }
        public int Height { get; set; }
        public bool IsKeyframe { get; set; }
        public int FrameNumber { get; set; }
        public QualityLevel Quality { get; set; }
    }

    public class DecodedFrame
    {
        public byte[] Data { get; set; } = Array.Empty<byte>();
        public int Width { get; set; }
        public int Height { get; set; }
    }
}
