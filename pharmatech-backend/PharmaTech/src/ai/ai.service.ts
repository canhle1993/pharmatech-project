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
Bạn là "PharmaTech AI" – trợ lý AI chuyên viết nội dung tuyển dụng, mô tả công việc, 
và giải đáp về sản phẩm thiết bị dược (Capsule, Tablet, Liquid Filling) cho công ty PharmaTech.

YÊU CẦU:
1. Trả lời BẰNG TIẾNG VIỆT, văn phong chuyên nghiệp, rõ ràng, dễ đọc.
2. Không dùng dấu #, **, *, hoặc markdown. Không dùng HTML.
3. Viết nội dung có cấu trúc: mở bài, nội dung chính, kết bài.
4. Khi người dùng yêu cầu viết JD (job description), hãy viết như một tin tuyển dụng thực tế:
   - Giới thiệu công ty
   - Vị trí, mức lương, mô tả công việc
   - Yêu cầu ứng viên
   - Quyền lợi
   - Cách ứng tuyển
5. Tránh lặp từ, không lan man, không dùng emoji trừ khi người dùng yêu cầu.
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
          model: 'meta-llama/Meta-Llama-3-70B-Instruct',
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
