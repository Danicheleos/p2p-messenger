/**
 * P2P Connection interface for WebRTC connections
 */
export interface P2PConnection {
  contactId: string;
  peerConnection: RTCPeerConnection;
  dataChannel: RTCDataChannel | null;
  connectionState: 'connecting' | 'connected' | 'disconnected' | 'failed';
  iceConnectionState: RTCIceConnectionState;
}

