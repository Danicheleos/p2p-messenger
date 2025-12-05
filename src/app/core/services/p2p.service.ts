import { Injectable, signal, computed, inject } from '@angular/core';
import { APP_CONSTANTS } from '../constants/app.const';
import { P2PConnection } from '../interfaces/p2p-connection.interface';

/**
 * Signaling data structure for manual exchange
 */
export interface SignalingData {
  type: 'offer' | 'answer' | 'ice-candidate';
  contactId: string;
  data: RTCSessionDescriptionInit | RTCIceCandidateInit;
  timestamp: number;
}

/**
 * P2P Service - Manages WebRTC connections for peer-to-peer messaging
 */
@Injectable({ providedIn: 'root' })
export class P2PService {
  private connections = new Map<string, P2PConnection>();
  private messageCallbacks = new Map<string, Set<(message: string) => void>>();
  private pendingSignalingData = new Map<string, SignalingData[]>();

  private _connectionStates = signal<Map<string, P2PConnection['connectionState']>>(new Map());
  private _iceStates = signal<Map<string, RTCIceConnectionState>>(new Map());

  /**
   * Get connection state for a contact
   */
  getConnectionState(contactId: string): P2PConnection['connectionState'] {
    return this._connectionStates().get(contactId) || 'disconnected';
  }

  /**
   * Get ICE connection state for a contact
   */
  getIceState(contactId: string): RTCIceConnectionState {
    return this._iceStates().get(contactId) || 'new';
  }

  /**
   * Check if connection exists for a contact
   */
  hasConnection(contactId: string): boolean {
    return this.connections.has(contactId);
  }

  /**
   * Create a new WebRTC connection for a contact
   */
  async createConnection(contactId: string): Promise<RTCPeerConnection> {
    // Close existing connection if any
    if (this.connections.has(contactId)) {
      await this.closeConnection(contactId);
    }

    const pc = new RTCPeerConnection({
      iceServers: [...APP_CONSTANTS.WEBRTC.ICE_SERVERS] as RTCIceServer[]
    });

    // Create data channel
    const dataChannel = pc.createDataChannel('messages', {
      ordered: true
    });

    // Set up data channel event handlers
    this.setupDataChannel(dataChannel, contactId);

    // Set up ICE candidate handler
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.storeIceCandidate(event.candidate, contactId);
      }
    };

    // Set up connection state handlers
    pc.onconnectionstatechange = () => {
      this.updateConnectionState(contactId, pc.connectionState as P2PConnection['connectionState']);
    };

    pc.oniceconnectionstatechange = () => {
      this.updateIceState(contactId, pc.iceConnectionState);
    };

    // Handle incoming data channel (when receiving connection)
    pc.ondatachannel = (event) => {
      const channel = event.channel;
      this.setupDataChannel(channel, contactId);
    };

    // Store connection
    const connection: P2PConnection = {
      contactId,
      peerConnection: pc,
      dataChannel: dataChannel,
      connectionState: 'connecting',
      iceConnectionState: 'new'
    };

    this.connections.set(contactId, connection);
    this.updateConnectionState(contactId, 'connecting');
    this.updateIceState(contactId, 'new');

    return pc;
  }

  /**
   * Create and send an offer for a contact
   */
  async sendOffer(contactId: string): Promise<SignalingData> {
    const pc = await this.createConnection(contactId);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const signalingData: SignalingData = {
      type: 'offer',
      contactId,
      data: offer,
      timestamp: Date.now()
    };

    // Store for manual exchange
    this.storeSignalingData(contactId, signalingData);

    return signalingData;
  }

  /**
   * Handle an incoming offer
   */
  async handleOffer(offer: RTCSessionDescriptionInit, contactId: string): Promise<SignalingData> {
    const pc = await this.createConnection(contactId);
    await pc.setRemoteDescription(offer);

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    const signalingData: SignalingData = {
      type: 'answer',
      contactId,
      data: answer,
      timestamp: Date.now()
    };

    // Store for manual exchange
    this.storeSignalingData(contactId, signalingData);

    return signalingData;
  }

  /**
   * Handle an incoming answer
   */
  async handleAnswer(answer: RTCSessionDescriptionInit, contactId: string): Promise<void> {
    const connection = this.connections.get(contactId);
    if (!connection) {
      throw new Error(`No connection found for contact ${contactId}`);
    }

    await connection.peerConnection.setRemoteDescription(answer);
  }

  /**
   * Handle an incoming ICE candidate
   */
  async handleIceCandidate(candidate: RTCIceCandidateInit, contactId: string): Promise<void> {
    const connection = this.connections.get(contactId);
    if (!connection) {
      // Store for later if connection not ready
      const signalingData: SignalingData = {
        type: 'ice-candidate',
        contactId,
        data: candidate,
        timestamp: Date.now()
      };
      this.storeSignalingData(contactId, signalingData);
      return;
    }

    try {
      await connection.peerConnection.addIceCandidate(candidate);
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  }

  /**
   * Send a message via data channel
   */
  async sendMessage(message: string, contactId: string): Promise<void> {
    const connection = this.connections.get(contactId);
    if (!connection) {
      throw new Error(`No connection found for contact ${contactId}`);
    }

    if (!connection.dataChannel || connection.dataChannel.readyState !== 'open') {
      throw new Error(`Data channel not open for contact ${contactId}`);
    }

    connection.dataChannel.send(message);
  }

  /**
   * Register a callback for incoming messages
   */
  onMessage(contactId: string, callback: (message: string) => void): () => void {
    if (!this.messageCallbacks.has(contactId)) {
      this.messageCallbacks.set(contactId, new Set());
    }
    this.messageCallbacks.get(contactId)!.add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.messageCallbacks.get(contactId);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.messageCallbacks.delete(contactId);
        }
      }
    };
  }

  /**
   * Close connection for a contact
   */
  async closeConnection(contactId: string): Promise<void> {
    const connection = this.connections.get(contactId);
    if (!connection) {
      return;
    }

    // Close data channel
    if (connection.dataChannel) {
      connection.dataChannel.close();
    }

    // Close peer connection
    connection.peerConnection.close();

    // Clean up
    this.connections.delete(contactId);
    this.messageCallbacks.delete(contactId);
    this.pendingSignalingData.delete(contactId);
    this._connectionStates.update(states => {
      const newStates = new Map(states);
      newStates.delete(contactId);
      return newStates;
    });
    this._iceStates.update(states => {
      const newStates = new Map(states);
      newStates.delete(contactId);
      return newStates;
    });
  }

  /**
   * Export signaling data for manual exchange
   */
  exportSignalingData(contactId: string): string | null {
    const data = this.pendingSignalingData.get(contactId);
    if (!data || data.length === 0) {
      return null;
    }

    return JSON.stringify(data, null, 2);
  }

  /**
   * Import signaling data from manual exchange
   */
  async importSignalingData(jsonData: string): Promise<void> {
    try {
      const dataArray: SignalingData[] = JSON.parse(jsonData);
      
      for (const signalingData of dataArray) {
        await this.processSignalingData(signalingData);
      }
    } catch (error) {
      console.error('Error importing signaling data:', error);
      throw new Error('Invalid signaling data format');
    }
  }

  /**
   * Get pending signaling data for a contact
   */
  getPendingSignalingData(contactId: string): SignalingData[] {
    return this.pendingSignalingData.get(contactId) || [];
  }

  /**
   * Clear pending signaling data for a contact
   */
  clearPendingSignalingData(contactId: string): void {
    this.pendingSignalingData.delete(contactId);
  }

  /**
   * Set up data channel event handlers
   */
  private setupDataChannel(channel: RTCDataChannel, contactId: string): void {
    channel.onopen = () => {
      console.log(`Data channel opened for contact ${contactId}`);
      this.updateConnectionState(contactId, 'connected');
    };

    channel.onclose = () => {
      console.log(`Data channel closed for contact ${contactId}`);
      this.updateConnectionState(contactId, 'disconnected');
    };

    channel.onerror = (error) => {
      console.error(`Data channel error for contact ${contactId}:`, error);
      this.updateConnectionState(contactId, 'failed');
    };

    channel.onmessage = (event) => {
      const callbacks = this.messageCallbacks.get(contactId);
      if (callbacks) {
        callbacks.forEach(callback => callback(event.data));
      }
    };

    // Update connection's data channel reference
    const connection = this.connections.get(contactId);
    if (connection) {
      connection.dataChannel = channel;
    }
  }

  /**
   * Store ICE candidate for manual exchange
   */
  private storeIceCandidate(candidate: RTCIceCandidate, contactId: string): void {
    const signalingData: SignalingData = {
      type: 'ice-candidate',
      contactId,
      data: candidate.toJSON(),
      timestamp: Date.now()
    };

    this.storeSignalingData(contactId, signalingData);
  }

  /**
   * Store signaling data for manual exchange
   */
  private storeSignalingData(contactId: string, data: SignalingData): void {
    if (!this.pendingSignalingData.has(contactId)) {
      this.pendingSignalingData.set(contactId, []);
    }
    this.pendingSignalingData.get(contactId)!.push(data);
  }

  /**
   * Process incoming signaling data
   */
  private async processSignalingData(signalingData: SignalingData): Promise<void> {
    const { type, contactId, data } = signalingData;

    switch (type) {
      case 'offer':
        await this.handleOffer(data as RTCSessionDescriptionInit, contactId);
        break;
      case 'answer':
        await this.handleAnswer(data as RTCSessionDescriptionInit, contactId);
        break;
      case 'ice-candidate':
        await this.handleIceCandidate(data as RTCIceCandidateInit, contactId);
        break;
    }
  }

  /**
   * Update connection state signal
   */
  private updateConnectionState(contactId: string, state: P2PConnection['connectionState']): void {
    this._connectionStates.update(states => {
      const newStates = new Map(states);
      newStates.set(contactId, state);
      return newStates;
    });

    // Update connection object
    const connection = this.connections.get(contactId);
    if (connection) {
      connection.connectionState = state;
    }
  }

  /**
   * Update ICE state signal
   */
  private updateIceState(contactId: string, state: RTCIceConnectionState): void {
    this._iceStates.update(states => {
      const newStates = new Map(states);
      newStates.set(contactId, state);
      return newStates;
    });

    // Update connection object
    const connection = this.connections.get(contactId);
    if (connection) {
      connection.iceConnectionState = state;
    }
  }
}

