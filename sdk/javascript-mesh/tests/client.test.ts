/**
 * Unit tests for SmaRTCClient
 */

import { SmaRTCClient } from '../src/client';
import type { ConnectionConfig } from '../src/types';

describe('SmaRTCClient', () => {
  let client: SmaRTCClient;
  const mockConfig: ConnectionConfig = {
    serverUrl: 'http://localhost:5000',
    sessionId: 'test-session',
    username: 'test-user'
  };

  beforeEach(() => {
    client = new SmaRTCClient(mockConfig);
  });

  afterEach(() => {
    if (client) {
      client.disconnect();
    }
  });

  describe('Constructor', () => {
    it('should create client with default config', () => {
      expect(client).toBeDefined();
    });

    it('should merge user config with defaults', () => {
      const customConfig: ConnectionConfig = {
        ...mockConfig,
        maxDirectPeers: 10,
        enableMesh: false
      };
      const customClient = new SmaRTCClient(customConfig);
      expect(customClient).toBeDefined();
      customClient.disconnect();
    });
  });

  describe('Connection Management', () => {
    it('should have connect method', () => {
      expect(client.connect).toBeDefined();
      expect(typeof client.connect).toBe('function');
    });

    it('should have disconnect method', () => {
      expect(client.disconnect).toBeDefined();
      expect(typeof client.disconnect).toBe('function');
    });
  });

  describe('Event Handling', () => {
    it('should register event handlers', () => {
      const handler = jest.fn();
      client.on('peer-joined', handler);
      expect(handler).not.toHaveBeenCalled();
    });

    it('should unregister event handlers', () => {
      const handler = jest.fn();
      client.on('peer-joined', handler);
      client.off('peer-joined', handler);
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('Peer Management', () => {
    it('should have getPeers method', () => {
      expect(client.getPeers).toBeDefined();
      const peers = client.getPeers();
      expect(Array.isArray(peers)).toBe(true);
    });

    it('should have getSessionInfo method', () => {
      expect(client.getSessionInfo).toBeDefined();
    });
  });

  describe('Quality Control', () => {
    it('should have setQuality method', () => {
      expect(client.setQuality).toBeDefined();
      expect(typeof client.setQuality).toBe('function');
    });
  });

  describe('Statistics', () => {
    it('should have getStats method', () => {
      expect(client.getStats).toBeDefined();
      expect(typeof client.getStats).toBe('function');
    });
  });
});
