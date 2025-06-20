import { io } from 'socket.io-client';

const URL = 'http://localhost:5000';

class SocketService {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.authToken = null;
        this.callbacks = {
        onConnect: null,
        onDisconnect: null,
        onFooEvent: null,
        onRefresh: null,
        onMatchFound: null,
        onReceiveText: null,
        onAuthFail: null
        };
        console.log("SocketService initialized");
        this.reconnectCtr = 0;
    }

    // Initialize with callbacks
    initialize(callbacks = {}) {
        this.callbacks = { ...this.callbacks, ...callbacks };
    }

    connect(authToken) {
        if (this.socket && this.socket.connected) {
        console.log("Socket already connected");
        return this.socket;
        }

        this.authToken = authToken;
        
        this.socket = io(URL, {
        autoConnect: false,
        extraHeaders: {
            "Authorization": `Bearer ${authToken}`
        },
        auth: {
            token: authToken
        }
        });

        this.setupEventListeners();
        this.socket.connect();
        return this.socket;
    }

    setupEventListeners() {
        if (!this.socket) return;

        // Connection events
        this.socket.on('connect', () => {
        console.log("Connected to socket server");
        this.isConnected = true;
        if (this.callbacks.onConnect) {
            this.callbacks.onConnect();
        }
        });

        this.socket.on('disconnect', () => {
        console.log("Disconnected from socket server");
        this.isConnected = false;
        if (this.callbacks.onDisconnect) {
            this.callbacks.onDisconnect();
        }
        });

        this.socket.on('connect_error', (error) => {
        console.log("Connection error:", error);
        if(error.message === 'auth_fail') {
            console.error("Authentication failed. Refreshing token.");
            if (this.callbacks.onAuthFail) {
                this.callbacks.onAuthFail();
            }
        }
        if (this.callbacks.onRefresh) {
            this.callbacks.onRefresh();
        }
        });

        // Application events
        this.socket.on('foo', (value) => {
        if (this.callbacks.onFooEvent) {
            this.callbacks.onFooEvent(value);
        }
        });

        this.socket.on('match_found', () => {
        console.log("Match found! socketService");
        if (this.callbacks.onMatchFound) {
            this.callbacks.onMatchFound();
        }
        });

        this.socket.on('receive_text', (data) => {
        console.log("Received text socketService:", data);
        if (this.callbacks.onReceiveText) {
            this.callbacks.onReceiveText(data);
        }
        });
    }

    disconnect() {
        if (this.socket) {
        if (this.callbacks.onDisconnect) {
            this.callbacks.onDisconnect();
        }
        this.socket.removeAllListeners();
        this.socket.disconnect();
        this.socket = null;
        this.isConnected = false;
        this.authToken = null;
        }
    }

    // Method to emit events
    emit(event, data) {
        if (this.socket && this.socket.connected) {
        this.socket.emit(event, data);
        } else {
        console.warn("Socket not connected. Cannot emit:", event);
        }
    }

    // Method to reconnect with new auth token
    reconnect(newAuthToken) {
        if(this.reconnectCtr >= 10) {
            console.error("Authorization refresh attempts exceeded. Disconnecting socket.");
            this.disconnect();
            return;
        }
        this.disconnect();
        return this.connect(newAuthToken);
    }

    // Get connection status
    getConnectionStatus() {
        return this.isConnected;
    }

    // Get socket instance (for components that need direct access)
    getSocket() {
        return this.socket;
    }

    // Update callbacks dynamically
    updateCallbacks(newCallbacks) {
        this.callbacks = { ...this.callbacks, ...newCallbacks };
    }
}

// Create and export a singleton instance
const socketService = new SocketService();
export default socketService;