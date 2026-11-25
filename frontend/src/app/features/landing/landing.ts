import { Component } from '@angular/core';
import { CategoriesSection } from './sections/categories-section/categories-section';
import { CommunitySection } from './sections/community-section/community-section';
import { HeroSection } from './sections/hero-section/hero-section';
import { ProcessSection } from './sections/process-section/process-section';
import { PurposeSection } from './sections/purpose-section/purpose-section';
import { ValuesStrip } from './sections/values-strip/values-strip';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    HeroSection,
    ValuesStrip,
    CategoriesSection,
    ProcessSection,
    PurposeSection,
    CommunitySection,
  ],
  templateUrl: './landing.html',
  styleUrl: './landing.scss',
})
export class Landing {}
