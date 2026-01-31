import { Injectable, signal, computed } from '@angular/core';
import { AppSection, NetworkConfig, TrainingConfig } from '../interfaces/neural-network.interface';

@Injectable({
  providedIn: 'root'
})
export class AppStateService {
  // Modern Angular signals for state management
  readonly activeSection = signal<AppSection>('about');
  readonly networkId = signal<string>('');
  readonly networkConfig = signal<NetworkConfig>({
    hiddenLayer1: 128,
    hiddenLayer2: 64,
    useSecondLayer: true,
    layerSizes: [784, 128, 64, 10]
  });
  readonly trainingConfig = signal<TrainingConfig>({
    epochs: 10,
    miniBatchSize: 10,
    learningRate: 3.0
  });
  readonly trainingComplete = signal<boolean>(false);
  readonly finalAccuracy = signal<number | null>(null);

  // Computed signals (example: check if network is ready for training)
  readonly isNetworkReady = computed(() => this.networkId().length > 0);
  readonly isTrainingReady = computed(() => this.isNetworkReady() && !this.trainingComplete());

  // Setters using signal.set()
  setActiveSection(section: AppSection): void {
    this.activeSection.set(section);
  }

  setNetworkId(id: string): void {
    this.networkId.set(id);
  }

  setNetworkConfig(config: NetworkConfig): void {
    this.networkConfig.set(config);
  }

  setTrainingConfig(config: TrainingConfig): void {
    this.trainingConfig.set(config);
  }

  setTrainingComplete(complete: boolean): void {
    this.trainingComplete.set(complete);
  }

  setFinalAccuracy(accuracy: number | null): void {
    this.finalAccuracy.set(accuracy);
  }

  // Clear all state - useful for page refresh or reset
  clearAllState(): void {
    this.activeSection.set('about');
    this.networkId.set('');
    this.networkConfig.set({
      hiddenLayer1: 128,
      hiddenLayer2: 64,
      useSecondLayer: true,
      layerSizes: [784, 128, 64, 10]
    });
    this.trainingConfig.set({
      epochs: 10,
      miniBatchSize: 10,
      learningRate: 3.0
    });
    this.trainingComplete.set(false);
    this.finalAccuracy.set(null);
  }
}
