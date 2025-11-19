import { Body, Controller, Post } from '@nestjs/common';
import { AiService } from './ai.service';

@Controller('api/ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  async chat(@Body() body: any) {
    const { message, history } = body;
    const reply = await this.aiService.chat(message, history || []);
    return { reply };
  }
}
