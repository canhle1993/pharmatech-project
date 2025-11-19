import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class OcrService {
  private client = new OpenAI({
    baseURL: 'https://router.huggingface.co/v1',
    apiKey: process.env.HF_TOKEN,
  });

  async readImageBase64(base64: string) {
    const imageUrl = `data:image/jpeg;base64,${base64}`;

    const result = await this.client.chat.completions.create({
      model: 'zai-org/GLM-4.5V:novita',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `
              You are an OCR extractor for Vietnamese bank transfer receipts.
              Return the result STRICTLY in JSON only, no explanation.

              JSON format:
              {
                "amount": "",
                "time": "",
                "ref": "",
                "sender": "",
                "receiver": "",
                "raw_text": ""
              }

              - amount: số tiền giao dịch
              - time: thời gian giao dịch
              - ref: mã giao dịch
              - sender: người gửi
              - receiver: người thụ hưởng
              - raw_text: toàn bộ text OCR được

              Không được suy đoán. Nếu không thấy giá trị → để rỗng.
            `,
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
              },
            },
          ],
        },
      ],
    });

    const raw = result.choices?.[0]?.message?.content || '';

    let json: any = null;

    try {
      json = JSON.parse(raw);
    } catch (e) {
      console.log('❌ JSON parse failed, raw text:', raw);
    }

    return {
      raw,
      json,
      formatted: json ?? this.formatResult(raw),
    };
  }

  // ===============================
  // 📌 Format lại nội dung OCR
  // ===============================
  private formatResult(text: string) {
    if (!text) return null;

    // ====== Amount ======
    const amount =
      text.match(/(?:\b| )\d{1,3}(?:[.,]\d{3})+(?:\s?(VND|USD))?/i)?.[0] ??
      text.match(/\b\d+\s?(VND|USD)\b/i)?.[0] ??
      '';

    // ====== Time ======
    const time =
      text.match(/\d{1,2}:\d{2}.*\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}/)?.[0] ??
      text.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}/)?.[0] ??
      '';

    // ====== Reference ======
    let ref =
      text.match(/(Mã giao dịch|Ma giao dich)[^\d]*(\d{6,20})/i)?.[2] ?? '';

    if (ref && ref.length >= 10 && ref.length <= 14) {
      const isRef = text.includes(ref) && text.includes('giao dịch');
      if (!isRef) ref = '';
    }

    // ====== Sender ======
    let sender = '';

    // 1) từ “Nội dung”
    const senderFromNoiDung =
      text.match(/Nội dung[:\s]+([A-Za-zÀ-ỹ\s]{3,40})/i)?.[1] ?? '';
    if (senderFromNoiDung) sender = senderFromNoiDung.trim();

    // 2) tên cụ thể
    if (/DO CONG THANG/i.test(text)) sender = 'DO CONG THANG';

    // 3) backup
    if (!sender) {
      const nameMatch = text.match(
        /\b([A-ZĐ][a-zà-ỹ]+(?:\s+[A-ZĐ][a-zà-ỹ]+){1,2})\b/,
      );
      if (nameMatch) sender = nameMatch[1];
    }

    // ====== Receiver ======
    let receiver = '';

    // 1) Markdown **NAME**
    const mdReceiver = text.match(/\*\*([A-Z ]{3,40})\*\*/);
    if (mdReceiver) receiver = mdReceiver[1].trim();

    // 2) “Tên người thụ hưởng”
    if (!receiver) {
      const recvMatch =
        text.match(/Tên người thụ hưởng[^A-Z]*([A-Z ]{3,40})/i)?.[1] ?? '';
      if (recvMatch) receiver = recvMatch.trim();
    }

    // 3) “Người thụ hưởng | Receiver | To”
    if (!receiver) {
      receiver =
        text
          .match(/(Người thụ hưởng|Receiver|To)[^\n]+/i)?.[0]
          ?.replace(/Người thụ hưởng|Receiver|To/i, '')
          ?.trim() ?? '';
    }

    // 4) Sau “Tài khoản thụ hưởng”
    if (!receiver) {
      const recv2 = text.match(
        /Tài khoản thụ hưởng[^A-Z]*([A-Z ]{3,40})/i,
      )?.[1];
      if (recv2) receiver = recv2.trim();
    }

    // ====== RETURN CUỐI CÙNG ======
    return {
      amount: amount.trim(),
      time: time.trim(),
      ref: ref.trim(),
      sender,
      receiver,
    };
  }
}
