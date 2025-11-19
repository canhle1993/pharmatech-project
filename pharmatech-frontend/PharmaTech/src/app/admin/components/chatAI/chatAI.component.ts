import { Component } from '@angular/core';
import { env } from '../../../enviroments/enviroment';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chatAI',
  templateUrl: './chatAI.component.html',
  styleUrls: ['./chatAI.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class ChatAIComponent {
  showChat = false;
  userMessage = '';
  messages: { from: 'user' | 'bot'; text: string }[] = [];

  toggleChat() {
    this.showChat = !this.showChat;
  }

  async sendMessage() {
    if (!this.userMessage.trim()) return;

    const text = this.userMessage;
    this.messages.push({ from: 'user', text });
    this.userMessage = '';

    try {
      const res = await fetch(
        'https://router.huggingface.co/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${env.hf_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'meta-llama/Meta-Llama-3-8B-Instruct',
            messages: [
              {
                role: 'user',
                content: text,
              },
            ],
          }),
        }
      );

      const data = await res.json();

      const botReply = data?.choices?.[0]?.message?.content || 'No response';

      this.messages.push({ from: 'bot', text: botReply });
    } catch (err) {
      console.error(err);
      this.messages.push({
        from: 'bot',
        text: '❌ Lỗi API HuggingFace',
      });
    }
  }
}
