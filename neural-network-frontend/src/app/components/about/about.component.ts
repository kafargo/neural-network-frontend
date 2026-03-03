import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AppStateService } from '../../services/app-state.service';
import { NeuralNetworkService } from '../../services/neural-network.service';
import { SkillCategory } from '../../interfaces/neural-network.interface';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css']
})
export class AboutComponent {
  /** Whether the prompt text area is expanded. */
  showPromptInput = false;

  /** The user's customization prompt bound to the textarea. */
  userPrompt = '';

  /** True while waiting for the AI response. */
  isLoading = false;

  /** Error message to display, empty string when no error. */
  errorMessage = '';

  /**
   * Custom About Me paragraphs from the AI.
   * Null means use the original hardcoded content.
   */
  customAboutMe: string[] | null = null;

  /**
   * Custom skills categories from the AI.
   * Null means use the original hardcoded content.
   */
  customSkills: SkillCategory[] | null = null;

  constructor(
    private router: Router,
    private appState: AppStateService,
    private neuralNetworkService: NeuralNetworkService
  ) {}

  /**
   * Navigate to the network creation page.
   */
  onContinue(): void {
    this.appState.setActiveSection('create');
    this.router.navigate(['/create']);
  }

  /**
   * Toggle the visibility of the prompt input area.
   */
  togglePromptInput(): void {
    this.showPromptInput = !this.showPromptInput;
    this.errorMessage = '';
  }

  /**
   * Call the backend AI endpoint to generate customized content.
   *
   * Splits the about_me response into paragraphs and stores
   * both about_me and skills in component state.
   */
  generateCustomAbout(): void {
    if (!this.userPrompt.trim()) {
      this.errorMessage = 'Please enter a prompt.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.neuralNetworkService.customizeAbout(this.userPrompt).subscribe({
      next: (response) => {
        this.customAboutMe = response.about_me
          .split('\n\n')
          .filter((p) => p.trim().length > 0);
        this.customSkills = response.skills ?? null;
        this.isLoading = false;
        this.showPromptInput = false;  // Close modal on success
      },
      error: (err) => {
        this.errorMessage =
          err.message || 'Failed to generate content. Please try again.';
        this.isLoading = false;
      }
    });
  }

  /**
   * Reset the about content to the original hardcoded version.
   *
   * Clears custom content, prompt, and any error messages.
   */
  resetAbout(): void {
    this.customAboutMe = null;
    this.customSkills = null;
    this.userPrompt = '';
    this.errorMessage = '';
  }
}
