import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async send(): Promise<boolean> {
    try {
      await this.mailerService.sendMail({
        from: 'aplevancanh1993@gmail.com',
        to: 'aplevancanh1993@gmail.com',
        subject: 'Hello',
        html: '<b><i>How are you?</i></b>',
      });
      return true;
    } catch (ex) {
      console.log(ex);
      return false;
    }
  }

  async send2(
    from: string,
    to: string,
    subject: string,
    body: string,
  ): Promise<boolean> {
    try {
      await this.mailerService.sendMail({
        from: from,
        to: to,
        subject: subject,
        html: body,
      });
      return true;
    } catch (ex) {
      console.log(ex);
      return false;
    }
  }

  async send3(): Promise<boolean> {
    try {
      let fullName = 'Nguyen Van A';
      await this.mailerService.sendMail({
        from: 'aplevancanh1993@gmail.com',
        to: 'aplevancanh1993@gmail.com',
        subject: 'Hello',
        template: 'welcome',
        context: {
          fullName: fullName,
          username: 'acc1',
        },
      });
      return true;
    } catch (ex) {
      console.log(ex);
      return false;
    }
  }

  async send4(
    from: string,
    to: string,
    subject: string,
    template: string,
    data: any,
  ): Promise<boolean> {
    try {
      await this.mailerService.sendMail({
        from: from,
        to: to,
        subject: subject,
        template: template,
        context: data,
      });
      return true;
    } catch (ex) {
      console.log(ex);
      return false;
    }
  }
}
