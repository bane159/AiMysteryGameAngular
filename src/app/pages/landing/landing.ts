import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/authentification';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-landing',
  imports: [CommonModule, RouterLink],
  templateUrl: './landing.html',
  styleUrl: './landing.sass',
})
export class Landing {
  isLoggedIn$: Observable<boolean>;

  constructor(private authService: AuthService) {
    this.isLoggedIn$ = this.authService.isLoggedIn$();
  }

  features = [
    {
      icon: 'detective',
      title: 'Be the Detective',
      description: 'Analyze clues, question suspects, and piece together the mystery to identify the impostor.'
    },
    {
      icon: 'ai',
      title: 'AI-Powered Characters',
      description: 'Interact with intelligent NPCs that respond dynamically to your questions and accusations.'
    },
    {
      icon: 'rules',
      title: 'Rule-Based Deduction',
      description: 'Each room has specific rules. Watch for violations to catch the impostor in the act.'
    },
    {
      icon: 'scenarios',
      title: 'Unique Scenarios',
      description: 'Every game generates fresh character scenarios, ensuring no two games are alike.'
    }
  ];

  socialLinks = [
    { name: 'Discord', url: '#', icon: 'discord' },
    { name: 'Twitter', url: '#', icon: 'twitter' },
    { name: 'GitHub', url: '#', icon: 'github' }
  ];
}
