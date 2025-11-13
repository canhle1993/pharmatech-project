import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-ai-gpt',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './aiGPT.component.html',
  styleUrls: ['./aiGPT.component.css'],
})
export class AiGPTComponent {
  showChat = false;
  fullscreen = false;
  userMessage = '';
  typing = false;

  history: { role: 'user' | 'assistant'; content: string }[] = [];
  messages: { from: 'user' | 'bot'; text: string }[] = [];

  toggleChat() {
    this.showChat = !this.showChat;

    // nếu đóng chat thì tắt luôn fullscreen
    if (!this.showChat) {
      this.fullscreen = false;
    }
  }

  toggleFullscreen() {
    this.fullscreen = !this.fullscreen;
  }

  cleanText(text: string): string {
    if (!text) return '';
    return text
      .replace(/<\/?[^>]+(>|$)/g, '') // bỏ HTML
      .replace(/[*_`#>-]{1,}/g, '') // bỏ markdown thô
      .replace(/\s{2,}/g, ' ')
      .replace(/\n{2,}/g, '\n')
      .trim();
  }

  async sendMessage() {
    if (!this.userMessage.trim()) return;

    const text = this.userMessage.trim();
    this.messages.push({ from: 'user', text });
    this.userMessage = '';
    this.typing = true;

    try {
      const res = await fetch('http://localhost:3000/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: this.history,
        }),
      });

      const data = await res.json();
      const rawReply = data?.reply || '';
      const cleanReply = this.cleanText(rawReply);

      this.history.push({ role: 'user', content: text });
      this.history.push({ role: 'assistant', content: cleanReply });

      this.messages.push({ from: 'bot', text: cleanReply });
    } catch (err) {
      console.error(err);
      this.messages.push({
        from: 'bot',
        text: 'Xin lỗi, hiện tại hệ thống AI đang gặp lỗi. Vui lòng thử lại sau.',
      });
    } finally {
      this.typing = false;
    }
  }
}
