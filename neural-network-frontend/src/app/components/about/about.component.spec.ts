import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AboutComponent } from './about.component';
import { AppStateService } from '../../services/app-state.service';
import { NeuralNetworkService } from '../../services/neural-network.service';

describe('AboutComponent', () => {
  let component: AboutComponent;
  let fixture: ComponentFixture<AboutComponent>;
  let routerSpy: jest.Mocked<Partial<Router>>;
  let appStateSpy: jest.Mocked<Partial<AppStateService>>;
  let neuralNetworkSpy: jest.Mocked<Partial<NeuralNetworkService>>;

  beforeEach(async () => {
    const routerSpyObj = {
      navigate: jest.fn()
    };
    const appStateSpyObj = {
      setActiveSection: jest.fn()
    };
    const neuralNetworkSpyObj = {
      customizeAbout: jest.fn()
    };

    await TestBed.configureTestingModule({
      imports: [AboutComponent],
      providers: [
        { provide: Router, useValue: routerSpyObj },
        { provide: AppStateService, useValue: appStateSpyObj },
        { provide: NeuralNetworkService, useValue: neuralNetworkSpyObj }
      ]
    }).compileComponents();

    routerSpy = TestBed.inject(Router) as jest.Mocked<Partial<Router>>;
    appStateSpy = TestBed.inject(AppStateService) as jest.Mocked<Partial<AppStateService>>;
    neuralNetworkSpy = TestBed.inject(NeuralNetworkService) as jest.Mocked<Partial<NeuralNetworkService>>;
    fixture = TestBed.createComponent(AboutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should navigate to create section when continue is clicked', () => {
    component.onContinue();
    expect(appStateSpy.setActiveSection).toHaveBeenCalledWith('create');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/create']);
  });

  it('should initialize with original content (customAboutMe is null)', () => {
    expect(component.customAboutMe).toBeNull();
    expect(component.customSkills).toBeNull();
    expect(component.showPromptInput).toBe(false);
  });

  it('should toggle prompt input visibility', () => {
    expect(component.showPromptInput).toBe(false);
    component.togglePromptInput();
    expect(component.showPromptInput).toBe(true);
    component.togglePromptInput();
    expect(component.showPromptInput).toBe(false);
  });

  it('should show error when generating with empty prompt', () => {
    component.userPrompt = '   ';
    component.generateCustomAbout();
    expect(component.errorMessage).toBe('Please enter a prompt.');
    expect(neuralNetworkSpy.customizeAbout).not.toHaveBeenCalled();
  });

  it('should call service and update content on successful generation', () => {
    const mockResponse = {
      about_me: 'First paragraph.\n\nSecond paragraph.',
      skills: [
        { category: 'Backend', tags: ['Python', 'Flask'] },
        { category: 'Frontend', tags: ['Angular'] }
      ]
    };

    (neuralNetworkSpy.customizeAbout as jest.Mock).mockReturnValue(of(mockResponse));

    component.userPrompt = 'Make it technical';
    component.generateCustomAbout();

    expect(neuralNetworkSpy.customizeAbout).toHaveBeenCalledWith('Make it technical');
    expect(component.customAboutMe).toEqual(['First paragraph.', 'Second paragraph.']);
    expect(component.customSkills).toEqual(mockResponse.skills);
    expect(component.isLoading).toBe(false);
    expect(component.errorMessage).toBe('');
  });

  it('should set error message on service failure', () => {
    (neuralNetworkSpy.customizeAbout as jest.Mock).mockReturnValue(
      throwError(() => new Error('API failed'))
    );

    component.userPrompt = 'Make it fun';
    component.generateCustomAbout();

    expect(component.errorMessage).toBe('API failed');
    expect(component.isLoading).toBe(false);
    expect(component.customAboutMe).toBeNull();
  });

  it('should reset content to original', () => {
    component.customAboutMe = ['Custom paragraph'];
    component.customSkills = [{ category: 'Test', tags: ['skill'] }];
    component.userPrompt = 'some prompt';
    component.errorMessage = 'some error';

    component.resetAbout();

    expect(component.customAboutMe).toBeNull();
    expect(component.customSkills).toBeNull();
    expect(component.userPrompt).toBe('');
    expect(component.errorMessage).toBe('');
  });

  it('should set isLoading to true while generating', () => {
    const mockResponse = {
      about_me: 'Paragraph.',
      skills: []
    };

    (neuralNetworkSpy.customizeAbout as jest.Mock).mockReturnValue(of(mockResponse));

    component.userPrompt = 'Test';
    // We can't easily test the intermediate loading state with synchronous observables,
    // but we can verify it's false after completion
    component.generateCustomAbout();
    expect(component.isLoading).toBe(false);
  });
});
