import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

/**
 * Aplica el título de cada ruta y actualiza la descripción meta.
 * Usa TitleStrategy de Angular, sin dependencias adicionales.
 */
@Injectable({ providedIn: 'root' })
export class DonaTitleStrategy extends TitleStrategy {
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const title = this.buildTitle(snapshot);
    if (title) {
      this.titleService.setTitle(title);
    }

    const description = this.deepestRoute(snapshot).data['description'];
    if (typeof description === 'string') {
      this.metaService.updateTag({ name: 'description', content: description });
    }
  }

  private deepestRoute(snapshot: RouterStateSnapshot) {
    let current = snapshot.root;
    while (current.firstChild) {
      current = current.firstChild;
    }
    return current;
  }
}
