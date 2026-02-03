import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AboutComponent } from './about.component';
import { AppStateService } from '../../services/app-state.service';

describe('AboutComponent', () => {
  let component: AboutComponent;
  let fixture: ComponentFixture<AboutComponent>;
  let routerSpy: jest.Mocked<Partial<Router>>;
  let appStateSpy: jest.Mocked<Partial<AppStateService>>;

  beforeEach(async () => {
    const routerSpyObj = {
      navigate: jest.fn()
    };
    const appStateSpyObj = {
      setActiveSection: jest.fn()
    };

    await TestBed.configureTestingModule({
      imports: [AboutComponent],
      providers: [
        { provide: Router, useValue: routerSpyObj },
        { provide: AppStateService, useValue: appStateSpyObj }
      ]
    }).compileComponents();

    routerSpy = TestBed.inject(Router) as jest.Mocked<Partial<Router>>;
    appStateSpy = TestBed.inject(AppStateService) as jest.Mocked<Partial<AppStateService>>;
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
});
