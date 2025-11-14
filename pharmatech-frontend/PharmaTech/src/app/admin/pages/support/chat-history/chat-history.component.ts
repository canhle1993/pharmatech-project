import { Component, OnInit } from '@angular/core';
import { ChatService } from '../../../../services/chat.service';
import { AccountService } from '../../../../services/account.service';
import { Account } from '../../../../entities/account.entity';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chat-history',
  templateUrl: './chat-history.component.html',
  styleUrls: ['./chat-history.component.css'],
  standalone: true,  // Nếu sử dụng standalone component
  imports: [CommonModule],  // Thêm CommonModule vào imports
})
export class ChatHistoryComponent implements OnInit {
   ngOnInit(): void {
  }

}
