import { Injectable } from '@nestjs/common';
import fetch from 'node-fetch';

type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

@Injectable()
export class AiService {
  private readonly HF_TOKEN = process.env.HF_TOKEN;

  async chat(message: string, history: ChatMessage[] = []): Promise<string> {
    // 🧠 Prompt hệ thống: tối ưu cho content tuyển dụng + PharmaTech
    const systemPrompt: ChatMessage = {
      role: 'system',
      content: `
Bạn là PharmaTech AI – trợ lý nội dung thông minh của công ty thiết bị dược.
Nhiệm vụ:
- Trả lời tự nhiên, rõ ràng, mạch lạc, đúng văn phong Việt Nam.
- Khi viết nội dung tuyển dụng, hãy viết hấp dẫn – xúc tích – chuyên nghiệp.
- Không dùng HTML.
- Không dùng markdown đậm (#, *…).
- Được phép xuống dòng theo đoạn văn.
- Luôn ưu tiên trả lời như một chuyên gia nhân sự hoặc chuyên gia sản phẩm.
`,
    };

    const messages: ChatMessage[] = [
      systemPrompt,
      ...(history || []),
      { role: 'user', content: message },
    ];

    const res = await fetch(
      'https://router.huggingface.co/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.HF_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'Qwen/Qwen2.5-7B-Instruct',
          messages,
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 600,
        }),
      },
    );

    if (!res.ok) {
      const text = await res.text();
      console.error('HF ERROR:', text);
      throw new Error('HuggingFace request failed');
    }

    const data = await res.json();
    const reply =
      data?.choices?.[0]?.message?.content ||
      'Xin lỗi, hiện tại tôi chưa thể trả lời.';

    return reply;
  }
}
