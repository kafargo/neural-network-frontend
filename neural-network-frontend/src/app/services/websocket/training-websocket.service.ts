import { Injectable, OnDestroy, inject } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoggerService } from '../logger.service';
// Import shared interfaces from central location - avoid duplication
import { TrainingUpdate, TrainingComplete, TrainingError } from '../../interfaces/neural-network.interface';

// Re-export for backward compatibility (using 'export type' for isolatedModules)
export type { TrainingUpdate, TrainingComplete, TrainingError };

export interface ConnectionStatus {
  connected: boolean;
  socketId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TrainingWebSocketService implements OnDestroy {
  private socket!: Socket; // Non-null assertion as it will be initialized in initializeConnection
  private keepaliveTimer?: ReturnType<typeof setInterval>;
  private readonly connectionStatus = new BehaviorSubject<ConnectionStatus>({
    connected: false
  });
  private readonly trainingUpdates = new BehaviorSubject<TrainingUpdate | null>(null);
  private readonly trainingComplete = new BehaviorSubject<TrainingComplete | null>(null);
  private readonly trainingError = new BehaviorSubject<TrainingError | null>(null);
  
  // Production server URL based on the documentation
  private readonly serverUrl = environment.websocketUrl;
  
  // Modern Angular: use inject() function
  private readonly logger = inject(LoggerService);

  constructor() {
    this.initializeConnection();
  }

  private initializeConnection(): void {
    this.logger.log('Attempting to connect to WebSocket:', this.serverUrl);
    
    this.socket = io(this.serverUrl, {
      transports: ['polling', 'websocket'], // Try polling first, then upgrade to websocket
      timeout: 20000, // Initial connection timeout (20s)
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      randomizationFactor: 0.5,
      path: '/socket.io/',
      autoConnect: true,
      forceNew: false,
      multiplex: true,
      // Note: pingInterval/pingTimeout are server-side settings
      // The client automatically responds to server pings
      // Ensure your backend configures appropriate ping intervals for long operations
    });

    // Connection event handlers
    this.socket.on('connect', () => {
      this.logger.log('✅ Connected to training WebSocket:', this.socket.id);
      this.connectionStatus.next({
        connected: true,
        socketId: this.socket.id
      });
      this.startKeepalive();
    });

    this.socket.on('disconnect', (reason) => {
      this.logger.log('⚠️ Disconnected from training WebSocket:', reason);
      this.connectionStatus.next({ connected: false });
      this.stopKeepalive();
    });

    this.socket.on('connect_error', (error) => {
      this.logger.error('❌ WebSocket connection error:', error);
      this.logger.error('Server URL:', this.serverUrl);
      this.logger.error('Transports:', this.socket.io.opts.transports);
      this.connectionStatus.next({ connected: false });
    });

    this.socket.on('reconnect_attempt', (attempt) => {
      this.logger.log(`🔄 Reconnection attempt ${attempt}...`);
    });

    this.socket.on('reconnect_failed', () => {
      this.logger.error('❌ Reconnection failed after all attempts');
    });

    this.socket.on('reconnect', (attemptNumber) => {
      this.logger.log(`✅ Reconnected successfully after ${attemptNumber} attempts`);
      this.connectionStatus.next({
        connected: true,
        socketId: this.socket.id
      });
    });

    // Keepalive monitoring
    this.socket.on('ping', () => {
      this.logger.log('📡 Ping sent to server');
    });

    this.socket.on('pong', (latency) => {
      this.logger.log(`📡 Pong received (latency: ${latency}ms)`);
    });

    // Training update handler
    this.socket.on('training_update', (data: TrainingUpdate) => {
      this.logger.log('Training update received via WebSocket:', data);
      this.trainingUpdates.next(data);
    });

    // Training completion handler
    this.socket.on('training_complete', (data: TrainingComplete) => {
      this.logger.log('Training completed via WebSocket:', data);
      this.trainingComplete.next(data);
    });

    // Training error handler
    this.socket.on('training_error', (data: TrainingError) => {
      this.logger.error('Training error received via WebSocket:', data);
      this.trainingError.next(data);
    });
  }

  // Observable for connection status
  getConnectionStatus(): Observable<ConnectionStatus> {
    return this.connectionStatus.asObservable();
  }

  // Observable for training updates
  getTrainingUpdates(): Observable<TrainingUpdate | null> {
    return this.trainingUpdates.asObservable();
  }

  // Observable for training completion
  getTrainingComplete(): Observable<TrainingComplete | null> {
    return this.trainingComplete.asObservable();
  }

  // Observable for training errors
  getTrainingError(): Observable<TrainingError | null> {
    return this.trainingError.asObservable();
  }

  // Filter training updates for a specific job ID
  getTrainingUpdatesForJob(jobId: string): Observable<TrainingUpdate | null> {
    return new Observable<TrainingUpdate | null>(observer => {
      const subscription = this.trainingUpdates.subscribe(update => {
        if (!update || update.job_id === jobId) {
          observer.next(update);
        }
      });
      
      return () => subscription.unsubscribe();
    });
  }

  // Filter training completion for a specific job ID
  getTrainingCompleteForJob(jobId: string): Observable<TrainingComplete | null> {
    return new Observable<TrainingComplete | null>(observer => {
      const subscription = this.trainingComplete.subscribe(complete => {
        if (!complete || complete.job_id === jobId) {
          observer.next(complete);
        }
      });
      
      return () => subscription.unsubscribe();
    });
  }

  // Filter training errors for a specific job ID
  getTrainingErrorForJob(jobId: string): Observable<TrainingError | null> {
    return new Observable<TrainingError | null>(observer => {
      const subscription = this.trainingError.subscribe(error => {
        if (!error || error.job_id === jobId) {
          observer.next(error);
        }
      });
      
      return () => subscription.unsubscribe();
    });
  }

  // Check if currently connected
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Client-side keepalive to prevent idle connection timeouts
  private startKeepalive(): void {
    this.stopKeepalive(); // Clear any existing timer
    
    // Send a lightweight keepalive message every 30 seconds
    // This helps keep the connection alive through proxies and load balancers
    this.keepaliveTimer = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('keepalive', { timestamp: Date.now() });
        this.logger.log('💓 Keepalive sent');
      }
    }, 30000);
  }

  private stopKeepalive(): void {
    if (this.keepaliveTimer) {
      clearInterval(this.keepaliveTimer);
      this.keepaliveTimer = undefined;
    }
  }

  // Manually reconnect
  reconnect(): void {
    if (this.socket) {
      this.socket.connect();
    }
  }

  // Disconnect
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  // Cleanup on service destroy
  ngOnDestroy(): void {
    this.stopKeepalive();
    this.disconnect();
  }
}
