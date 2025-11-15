import { Controller, Post, Body } from '@nestjs/common';
import { OcrService } from './ocr.service';

@Controller('api/ocr')
export class OcrController {
  constructor(private readonly ocrService: OcrService) {}

  @Post('read')
  async read(@Body() body: { base64: string }) {
    return this.ocrService.readImageBase64(body.base64);
  }
}
