import { ConfigService } from '@nestjs/config';

let configService = new ConfigService();

export function getImageUrl(): string {
  return configService.get('image_url');
}
