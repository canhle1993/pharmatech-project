import { ConfigService } from '@nestjs/config';

let configService = new ConfigService();

export function getImageUrl(): string {
  return configService.get('image_url');
}

/** 🌐 URL gốc frontend để redirect user */
export function getFrontendUrl(): string {
  return configService.get('FRONTEND_URL') || 'http://localhost:4200';
}
