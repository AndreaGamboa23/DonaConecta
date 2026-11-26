import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '../../../../shared/components/icon/icon';
import { PageHero } from '../../../../shared/components/page-hero/page-hero';
import { BandejaConversaciones } from '../../components/bandeja-conversaciones/bandeja-conversaciones';
import { PanelConversacion } from '../../components/panel-conversacion/panel-conversacion';

@Component({
  selector: 'app-mensajes',
  standalone: true,
  imports: [RouterLink, Icon, PageHero, BandejaConversaciones, PanelConversacion],
  templateUrl: './mensajes.html',
  styleUrl: './mensajes.scss',
})
export class Mensajes {}
