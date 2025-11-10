import { Component, OnInit } from '@angular/core';
import { ChatService } from '../../../../services/chat.service';
import { AccountService } from '../../../../services/account.service';
import { Account } from '../../../../entities/account.entity';

@Component({
  selector: 'app-chat-history',
  templateUrl: './chat-history.component.html',
  styleUrls: ['./chat-history.component.css'],
})
export class ChatHistoryComponent implements OnInit {
  users: Account[] = []; // Danh sách người dùng
  currentUser: Account | null = null; // Người dùng đang được chọn
  history: any[] = []; // Lịch sử chat
  newMessage: string = ''; // Tin nhắn mới

  constructor(private chatService: ChatService, private accountService: AccountService) {}

  ngOnInit(): void {
    this.loadUsers();  // Tải danh sách người dùng
  }

  // Tải danh sách người dùng
  async loadUsers() {
    try {
      const users = await this.accountService.findAll(); // Lấy danh sách người dùng từ backend
      this.users = users; // Đảm bảo dữ liệu này là mảng
    } catch (error) {
      console.error("Lỗi khi tải danh sách người dùng", error);
    }
  }

  // Mở chat khi người dùng được chọn
  async openChat(user: any) {
    this.currentUser = user;
    this.history = await this.chatService.loadThread(user.id); // Tải lịch sử chat với người dùng này
  }

  // Gửi tin nhắn
  async sendMessage() {
    if (!this.newMessage.trim()) return; // Kiểm tra nếu tin nhắn rỗng thì không gửi
    const message = await this.chatService.sendMessage(
      this.currentUser.id,
      'admin',
      this.newMessage.trim()
    );
    this.history.push(message); // Thêm tin nhắn vào lịch sử
    this.newMessage = ''; // Xóa ô nhập tin nhắn
  }
}
