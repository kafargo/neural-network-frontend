import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';

import { NetworkConfigComponent } from './network-config.component';
import { NeuralNetworkService } from '../../services/neural-network.service';
import { AppStateService } from '../../services/app-state.service';
import { LoggerService } from '../../services/logger.service';
import { TrainingWebSocketService } from '../../services/websocket/training-websocket.service';
import { NetworkCreateResponse } from '../../interfaces/neural-network.interface';

describe('NetworkConfigComponent', () => {
  let component: NetworkConfigComponent;
  let fixture: ComponentFixture<NetworkConfigComponent>;
  let neuralNetworkServiceSpy: jest.Mocked<Partial<NeuralNetworkService>>;
  let routerSpy: jest.Mocked<Partial<Router>>;
  let appStateSpy: Partial<AppStateService>;
  let loggerSpy: jest.Mocked<Partial<LoggerService>>;
  let websocketSpy: jest.Mocked<Partial<TrainingWebSocketService>>;

  beforeEach(async () => {
    const networkSpy = {
      createNetwork: jest.fn()
    };
    const routerSpyObj = {
      navigate: jest.fn()
    };
    const appStateSpyObj = {
      setNetworkId: jest.fn(),
      setActiveSection: jest.fn(),
      setNetworkConfig: jest.fn(),
      setTrainingComplete: jest.fn(),
      setFinalAccuracy: jest.fn(),
      networkConfig: signal({ hiddenLayer1: 128, hiddenLayer2: 64, useSecondLayer: true, layerSizes: [784, 128, 64, 10] })
    };
    const loggerSpyObj = {
      error: jest.fn()
    };
    const websocketSpyObj = {
      resetTrainingData: jest.fn()
    };
    
    await TestBed.configureTestingModule({
      imports: [NetworkConfigComponent, FormsModule, HttpClientTestingModule],
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
    fixture = TestBed.createComponent(NetworkConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default configuration', () => {
    expect(component.config.hiddenLayer1).toBe(128);
    expect(component.config.hiddenLayer2).toBe(64);
    expect(component.config.useSecondLayer).toBe(true);
    expect(component.config.layerSizes).toEqual([784, 128, 64, 10]);
  });

  it('should update layer sizes when config changes', () => {
    component.config.hiddenLayer1 = 256;
    component.config.useSecondLayer = false;
    component.onConfigChange();
    
    expect(component.config.layerSizes).toEqual([784, 256, 10]);
    expect(appStateSpy.setNetworkConfig).toHaveBeenCalledWith(component.config);
  });

  it('should create network successfully', () => {
    const mockResponse: NetworkCreateResponse = { 
      network_id: 'test-network-id',
      layer_sizes: [784, 128, 64, 10],
      message: 'Network created successfully'
    };
    (neuralNetworkServiceSpy.createNetwork as jest.Mock).mockReturnValue(of(mockResponse));
    
    component.createNetwork();
    
    expect(component.loading).toBe(false);
    expect(appStateSpy.setNetworkId).toHaveBeenCalledWith('test-network-id');
    expect(appStateSpy.setActiveSection).toHaveBeenCalledWith('train');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/train']);
    expect(component.error).toBeNull();
  });

  it('should handle network creation error', () => {
    (neuralNetworkServiceSpy.createNetwork as jest.Mock).mockReturnValue(throwError(() => new Error('API Error')));
    
    component.createNetwork();
    
    expect(component.loading).toBe(false);
    expect(component.error).toBe('Failed to create network. Please try again.');
    expect(loggerSpy.error).toHaveBeenCalled();
  });

  it('should update app state when configuration is updated', () => {
    component.onConfigChange();
    
    expect(appStateSpy.setNetworkConfig).toHaveBeenCalledWith(component.config);
  });
});
