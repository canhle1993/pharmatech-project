import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { HotlineData, HotlineService } from '../../../services/hotline.service';

@Component({
  selector: 'app-zalo',
  templateUrl: './zalo.component.html',
  styleUrls: ['./zalo.component.css'],
})
export class ZaloComponent implements OnInit {
  // 👉 Sự kiện phát ra yêu cầu mở Chatbot
  @Output() openChatEvent = new EventEmitter<void>();

  hotlineData: HotlineData = {
    hotlineNumber: '(012) 345-6789',
    storeLocation: '6391 Elgin St. Celina, Delaware 10299',
  };

  constructor(private hotlineService: HotlineService) {}

  ngOnInit() {
    this.loadHotlineData();
  }

  // ☎️ Hotline
  loadHotlineData(): void {
    this.hotlineService.getHotlineInfo().subscribe({
      next: (data: HotlineData) => {
        if (data) this.hotlineData = data;
      },
      error: () => console.log('Using default hotline data'),
    });
  }

  // 📞 Tạo link call
  getPhoneHref(phoneNumber: string): string {
    return 'tel:' + phoneNumber.replace(/[^0-9]/g, '');
  }

  // 👉 Hàm gọi khi click Facebook icon
  openChatbot() {
    this.openChatEvent.emit(); // phát sự kiện cho component cha
  }
}
