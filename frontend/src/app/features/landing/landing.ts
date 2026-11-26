import { Component } from '@angular/core';
import { CategorySearch } from './sections/category-search/category-search';
import { CategoriesSection } from './sections/categories-section/categories-section';
import { CommunitySection } from './sections/community-section/community-section';
import { HeroSection } from './sections/hero-section/hero-section';
import { NeedsPreview } from './sections/needs-preview/needs-preview';
import { ProcessSection } from './sections/process-section/process-section';
import { PurposeSection } from './sections/purpose-section/purpose-section';
import { QuickAccess } from './sections/quick-access/quick-access';
import { ValuesStrip } from './sections/values-strip/values-strip';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    HeroSection,
    QuickAccess,
    ValuesStrip,
    CategorySearch,
    CategoriesSection,
    NeedsPreview,
    ProcessSection,
    PurposeSection,
    CommunitySection,
  ],
  templateUrl: './landing.html',
  styleUrl: './landing.scss',
})
export class Landing {}
