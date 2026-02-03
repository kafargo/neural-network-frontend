import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AppStateService } from '../../services/app-state.service';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css']
})
export class AboutComponent {
  constructor(
    private router: Router,
    private appState: AppStateService
  ) {}

  onContinue(): void {
    this.appState.setActiveSection('create');
    this.router.navigate(['/create']);
  }
}
