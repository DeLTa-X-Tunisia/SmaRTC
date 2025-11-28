// Jest setup file - Mock WebRTC APIs
// Polyfill TextEncoder/TextDecoder for Node.js (required by msgpack)
if (typeof (globalThis as any).TextEncoder === 'undefined') {
  const util = eval('require')('util');
  (globalThis as any).TextEncoder = util.TextEncoder;
  (globalThis as any).TextDecoder = util.TextDecoder;
}

(globalThis as any).RTCPeerConnection = jest.fn().mockImplementation(() => ({
  createOffer: jest.fn().mockResolvedValue({ type: 'offer', sdp: 'mock-sdp' }),
  createAnswer: jest.fn().mockResolvedValue({ type: 'answer', sdp: 'mock-sdp' }),
  setLocalDescription: jest.fn().mockResolvedValue(undefined),
  setRemoteDescription: jest.fn().mockResolvedValue(undefined),
  addIceCandidate: jest.fn().mockResolvedValue(undefined),
  addTrack: jest.fn(),
  close: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  connectionState: 'new',
  iceConnectionState: 'new',
  signalingState: 'stable',
  createDataChannel: jest.fn().mockReturnValue({
    readyState: 'open',
    send: jest.fn()
  })
}));

(globalThis as any).RTCSessionDescription = jest.fn().mockImplementation((init) => init);
(globalThis as any).RTCIceCandidate = jest.fn().mockImplementation((init) => init);

(globalThis as any).navigator = {
  mediaDevices: {
    getUserMedia: jest.fn().mockResolvedValue({
      getTracks: () => [
        { kind: 'video', id: 'video-track', stop: jest.fn(), enabled: true },
        { kind: 'audio', id: 'audio-track', stop: jest.fn(), enabled: true }
      ],
      getVideoTracks: () => [{ kind: 'video', id: 'video-track', stop: jest.fn(), enabled: true }],
      getAudioTracks: () => [{ kind: 'audio', id: 'audio-track', stop: jest.fn(), enabled: true }]
    })
  }
};
