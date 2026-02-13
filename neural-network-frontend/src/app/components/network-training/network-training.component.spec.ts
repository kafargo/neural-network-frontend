import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';

import { NetworkTrainingComponent } from './network-training.component';
import { NeuralNetworkService } from '../../services/neural-network.service';
import { AppStateService } from '../../services/app-state.service';
import { LoggerService } from '../../services/logger.service';
import { TrainingWebSocketService } from '../../services/websocket/training-websocket.service';

describe('NetworkTrainingComponent', () => {
  let component: NetworkTrainingComponent;
  let fixture: ComponentFixture<NetworkTrainingComponent>;
  let neuralNetworkServiceSpy: jest.Mocked<Partial<NeuralNetworkService>>;
  let routerSpy: jest.Mocked<Partial<Router>>;
  let appStateSpy: Partial<AppStateService>;
  let loggerSpy: jest.Mocked<Partial<LoggerService>>;
  let websocketSpy: jest.Mocked<Partial<TrainingWebSocketService>>;

  beforeEach(async () => {
    const networkSpy = {
      trainNetwork: jest.fn()
    };
    const routerSpyObj = {
      navigate: jest.fn()
    };
    const appStateSpyObj = {
      setTrainingConfig: jest.fn(),
      setTrainingComplete: jest.fn(),
      setActiveSection: jest.fn(),
      setFinalAccuracy: jest.fn(),
      networkId: signal('test-network-id'),
      trainingConfig: signal({ epochs: 10, miniBatchSize: 10, learningRate: 3.0 }),
      finalAccuracy: signal(null)
    };
    const loggerSpyObj = {
      error: jest.fn(),
      log: jest.fn()
    };
    const websocketSpyObj = {
      connect: jest.fn(),
      disconnect: jest.fn(),
      getConnectionStatus: jest.fn().mockReturnValue(of({ connected: true, socketId: 'test-socket-id' })),
      getTrainingUpdates: jest.fn().mockReturnValue(of()),
      getTrainingComplete: jest.fn().mockReturnValue(of()),
      getTrainingError: jest.fn().mockReturnValue(of()),
      resetTrainingData: jest.fn()
    };
    
    await TestBed.configureTestingModule({
      imports: [NetworkTrainingComponent, FormsModule, HttpClientTestingModule],
      providers: [
        { provide: NeuralNetworkService, useValue: networkSpy },
        { provide: Router, useValue: routerSpyObj },
        { provide: AppStateService, useValue: appStateSpyObj },
        { provide: LoggerService, useValue: loggerSpyObj },
        { provide: TrainingWebSocketService, useValue: websocketSpyObj }
      ]
    }).compileComponents();

    neuralNetworkServiceSpy = TestBed.inject(NeuralNetworkService) as jest.Mocked<Partial<NeuralNetworkService>>;
    routerSpy = TestBed.inject(Router) as jest.Mocked<Partial<Router>>;
    appStateSpy = TestBed.inject(AppStateService) as Partial<AppStateService>;
    loggerSpy = TestBed.inject(LoggerService) as jest.Mocked<Partial<LoggerService>>;
    websocketSpy = TestBed.inject(TrainingWebSocketService) as jest.Mocked<Partial<TrainingWebSocketService>>;
    fixture = TestBed.createComponent(NetworkTrainingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default training configuration', () => {
    expect(component.trainingConfig.epochs).toBe(10);
    expect(component.trainingConfig.miniBatchSize).toBe(10);
    expect(component.trainingConfig.learningRate).toBe(3.0);
  });

  it('should update app state when configuration is updated', () => {
    component.onConfigChange();
    
    expect(appStateSpy.setTrainingConfig).toHaveBeenCalledWith(component.trainingConfig);
  });

  it('should start training successfully', () => {
    const mockResponse = { job_id: 'test-job-id', network_id: 'test-network-id', message: 'Training started' };
    (neuralNetworkServiceSpy.trainNetwork as jest.Mock).mockReturnValue(of(mockResponse));
    
    component.startTraining();
    
    expect(component.trainingStarted).toBe(true);
    expect(component.isTraining).toBe(true);
    expect(component.trainingLoading).toBe(false);
  });

  it('should handle training start error', () => {
    (neuralNetworkServiceSpy.trainNetwork as jest.Mock).mockReturnValue(throwError(() => new Error('API Error')));
    
    component.startTraining();
    
    expect(component.trainingLoading).toBe(false);
    expect(component.error).toBe('Failed to start training. Please try again.');
  });

  it('should not start training without network ID', () => {
    // Set empty networkId for this test
    component.networkId = '';
    
    component.startTraining();
    
    expect(component.error).toBe('No network available for training');
  });

  it('should navigate to test section when continue is clicked', () => {
    component.onContinueToTest();
    
    expect(appStateSpy.setActiveSection).toHaveBeenCalledWith('test');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/test']);
  });
});
