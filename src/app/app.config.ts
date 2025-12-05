import { ApplicationConfig, ElementRef, inject, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular/standalone';

import { routes } from './app.routes';
import { IS_MOBILE } from './core/constants/resize.token';
import { APP_CONSTANTS } from './core/constants/app.const';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideIonicAngular({}),
    { provide: IS_MOBILE, useFactory: () => {
      const host = document.body
      const resizeSignal = signal(true)

      new ResizeObserver(entries => {
        const width = entries[0].contentRect.width;
        const isMobile = width < APP_CONSTANTS.BREAKPOINTS.DESKTOP_MIN
        resizeSignal.set(isMobile)
      }).observe(host);

      return resizeSignal
    }}
  ]
};
