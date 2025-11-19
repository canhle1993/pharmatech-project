import {
  ApplicationConfig,
  importProvidersFrom, // 🧩 Thêm dòng này
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { tokenInterceptor } from './interceptors/token.interceptor';
import { routes } from './app.routes';
import {
  provideClientHydration,
  withEventReplay,
} from '@angular/platform-browser';

import { provideAnimations } from '@angular/platform-browser/animations';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import {
  provideHttpClient,
  withFetch,
  withInterceptors,
} from '@angular/common/http';
import { MessageService } from 'primeng/api';

// 🧩 Import QuillModule
import { QuillModule } from 'ngx-quill';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),

    provideHttpClient(withFetch(), withInterceptors([tokenInterceptor])),

    provideClientHydration(withEventReplay()),
    provideAnimations(),
    MessageService,
    providePrimeNG({
      theme: {
        preset: Aura,
      },
    }),

    // ✅ Đăng ký QuillModule toàn cục
    importProvidersFrom(QuillModule.forRoot()),
  ],
};
