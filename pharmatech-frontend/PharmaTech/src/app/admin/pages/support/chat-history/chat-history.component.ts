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
  }


}
