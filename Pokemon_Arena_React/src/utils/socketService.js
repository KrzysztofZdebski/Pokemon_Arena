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
            onAuthFail: null,
            onBattleStart: null,
            onBattleEnd: null,
            onSelectedPokemon: null,
            onPokemonPrepared: null,
            onNextRound: null,
            onInvalidAction: null,
        };
        console.log("SocketService constructor");
        this.reconnectCtr = 0;
        this.messageQueue = []; // Add message queue
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
            
            // Process queued messages when connected
            this.processMessageQueue();
            
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

        this.socket.on('match_found', (data) => {
        console.log("Match found! socketService");
        if (this.callbacks.onMatchFound) {
            this.callbacks.onMatchFound(data);
        }
        });

        this.socket.on('receive_text', (data) => {
        console.log("Received text socketService:", data);
        if (this.callbacks.onReceiveText) {
            this.callbacks.onReceiveText(data);
        }
        });

        this.socket.on('opponent_left', (data) => {
            console.log("Opponent left the game:", data);
            // Handle opponent left event, e.g., show a message or redirect
            if (this.callbacks.onOpponentLeft) {
                this.callbacks.onOpponentLeft(data);
            }
            this.disconnect();
        });

        this.socket.on('battle_start', (data) => {
            console.log("Battle started:", data);
            if (this.callbacks.onBattleStart) {
                this.callbacks.onBattleStart(data);
            }
        });

        this.socket.on('battle_end', (data) => {
            console.log("Battle ended:", data);
            if (this.callbacks.onBattleEnd) {
                this.callbacks.onBattleEnd(data);
            }
        });

        this.socket.on('pokemon_chosen', (data) => {
            console.log("Pokemon chosen:", data);
            if (this.callbacks.onSelectedPokemon) {
                this.callbacks.onSelectedPokemon(data);
            }
        });

        this.socket.on('pokemon_prepared', (data) => {
            console.log("Pokemon prepared:", data);
            // Handle pokemon prepared event, e.g., update UI or state
            if (this.callbacks.onPokemonPrepared) {
                this.callbacks.onPokemonPrepared(data);
            }
        });

        this.socket.on('next_round', (data) => {
            console.log("Next round started:", data);
            if (this.callbacks.onNextRound) {
                this.callbacks.onNextRound(data);
            }
        });

        this.socket.on('InvalidAction', (data) => {
            console.error("Invalid action:", data.message);
            // Handle invalid action, e.g., show an error message
            if (this.callbacks.onInvalidAction) {
                this.callbacks.onInvalidAction(data);
            }
        });
    }

    // Process queued messages when connection is established
    processMessageQueue() {
        while (this.messageQueue.length > 0) {
            const { event, data, resolve, reject } = this.messageQueue.shift();
            try {
                this.socket.emit(event, data);
                resolve();
            } catch (error) {
                reject(error);
            }
        }
    }

    // Method to emit events with waiting and timeout
    emit(event, data, waitForConnection = true, timeoutMs = 20000) {
        return new Promise((resolve, reject) => {
            // If socket is connected, emit immediately
            if (this.socket && this.socket.connected) {
                try {
                    this.socket.emit(event, data);
                    resolve();
                } catch (error) {
                    reject(error);
                }
                return;
            }

            // If not waiting for connection, reject immediately
            if (!waitForConnection) {
                reject(new Error("Socket not connected. Cannot emit: " + event));
                return;
            }

            // Queue the message with timeout
            const timeoutId = setTimeout(() => {
                // Remove from queue if timeout occurs
                const index = this.messageQueue.findIndex(item => 
                    item.event === event && item.data === data
                );
                if (index !== -1) {
                    this.messageQueue.splice(index, 1);
                }
                reject(new Error(`Timeout waiting for connection to emit: ${event}`));
            }, timeoutMs);

            // Add to queue
            this.messageQueue.push({
                event,
                data,
                resolve: () => {
                    clearTimeout(timeoutId);
                    resolve();
                },
                reject: (error) => {
                    clearTimeout(timeoutId);
                    reject(error);
                }
            });

            console.log(`Queued message: ${event}. Waiting for connection...`);
        });
    }

    // Alternative method for immediate emit (old behavior)
    emitImmediate(event, data) {
        if (this.socket && this.socket.connected) {
            this.socket.emit(event, data);
            return true;
        } else {
            console.warn("Socket not connected. Cannot emit:", event);
            return false;
        }
    }

    disconnect() {
        if (this.socket) {
            // Clear message queue on disconnect
            this.messageQueue.forEach(({ reject }) => {
                reject(new Error("Socket disconnected before message could be sent"));
            });
            this.messageQueue = [];

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