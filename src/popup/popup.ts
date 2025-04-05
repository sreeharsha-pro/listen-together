import SimplePeer from 'simple-peer';

// Types for messages
interface ConnectionMessage {
  action: string;
  roomCode?: string;
  signal?: any;
  peerId?: string;
}

document.addEventListener('DOMContentLoaded', function() {
  // DOM elements
  const hostButton = document.getElementById('host-button') as HTMLButtonElement;
  const hostSection = document.getElementById('host-section') as HTMLDivElement;
  const modeSelection = document.getElementById('mode-selection') as HTMLDivElement;
  const connectionCode = document.getElementById('connection-code') as HTMLDivElement;
  const copyCodeButton = document.getElementById('copy-code') as HTMLButtonElement;
  const disconnectHostButton = document.getElementById('disconnect-host') as HTMLButtonElement;
  const connectionStatus = document.getElementById('connection-status') as HTMLDivElement;
  
  // WebRTC peer connections
  let peers: SimplePeer.Instance[] = [];
  
  // Generate a unique room code
  function generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
  
  // Host button click handler
  hostButton.addEventListener('click', function() {
    // Hide mode selection, show host section
    modeSelection.classList.add('hidden');
    hostSection.classList.remove('hidden');
    
    // Generate and display room code
    const roomCode: string = generateCode();
    connectionCode.textContent = roomCode;
    
    // Update status
    connectionStatus.textContent = 'Status: Waiting for connections...';
    connectionStatus.classList.remove('disconnected');
    connectionStatus.classList.add('connected');
    
    // Store room code in local storage for access from background script
    chrome.storage.local.set({ 'hostRoomCode': roomCode, 'isHost': true }, function() {
      console.log('Room code saved, ready to accept connections');
      // Notify background script to start listening for connections
      chrome.runtime.sendMessage({ 
        action: 'startHosting',
        roomCode: roomCode 
      });
    });
  });
  
  // Copy room code button
  copyCodeButton.addEventListener('click', function() {
    navigator.clipboard.writeText(connectionCode.textContent || '')
      .then(() => {
        copyCodeButton.textContent = 'Copied!';
        setTimeout(() => {
          copyCodeButton.textContent = 'Copy Code';
        }, 2000);
      });
  });
  
  // Disconnect host button
  disconnectHostButton.addEventListener('click', function() {
    // Close all peer connections
    peers.forEach(peer => {
      if (peer && !peer.destroyed) {
        peer.destroy();
      }
    });
    peers = [];
    
    // Reset UI
    hostSection.classList.add('hidden');
    modeSelection.classList.remove('hidden');
    connectionStatus.textContent = 'Status: Not Connected';
    connectionStatus.classList.remove('connected');
    connectionStatus.classList.add('disconnected');
    
    // Clear stored data
    chrome.storage.local.remove(['hostRoomCode', 'isHost'], function() {
      console.log('Host data cleared');
      // Notify background script to stop hosting
      chrome.runtime.sendMessage({ action: 'stopHosting' });
    });
  });
  
  // Listen for messages from background script
  chrome.runtime.onMessage.addListener(function(message: ConnectionMessage) {
    if (message.action === 'newPeerConnection') {
      connectionStatus.textContent = `Status: Connected with ${peers.length} peer(s)`;
    }
    
    if (message.action === 'peerSignal' && message.signal) {
      handlePeerSignal(message.signal, message.peerId || '');
    }
  });
  
  // Handle incoming peer signals
  function handlePeerSignal(signal: any, peerId: string) {
    // Find existing peer or create new one
    let peer = peers.find(p => (p as any).peerId === peerId);
    
    if (!peer) {
      // Create new peer
      peer = new SimplePeer({ initiator: false, trickle: false });
      (peer as any).peerId = peerId;
      
      // Setup peer events
      peer.on('signal', data => {
        // Send signal back to background script
        chrome.runtime.sendMessage({
          action: 'sendSignal',
          signal: data,
          peerId: peerId,
          roomCode: connectionCode.textContent
        });
      });
      
      peer.on('connect', () => {
        console.log('Peer connected:', peerId);
        connectionStatus.textContent = `Status: Connected with ${peers.length} peer(s)`;
      });
      
      peer.on('data', data => {
        // Forward media control messages to background
        try {
          const message = JSON.parse(data.toString());
          chrome.runtime.sendMessage({
            action: 'mediaControl',
            ...message
          });
        } catch (e) {
          console.error('Failed to parse peer data:', e);
        }
      });
      
      peer.on('close', () => {
        console.log('Peer disconnected:', peerId);
        peers = peers.filter(p => (p as any).peerId !== peerId);
        connectionStatus.textContent = `Status: Connected with ${peers.length} peer(s)`;
      });
      
      peers.push(peer);
    }
    
    // Signal the peer with the received data
    peer.signal(signal);
  }
});