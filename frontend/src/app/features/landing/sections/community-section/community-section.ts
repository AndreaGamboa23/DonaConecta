import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '../../../../shared/components/icon/icon';

@Component({
  selector: 'app-community-section',
  standalone: true,
  imports: [Icon, RouterLink],
  templateUrl: './community-section.html',
  styleUrl: './community-section.scss',
})
export class CommunitySection {}
