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

  async sendContactForm(
    firstName: string,
    lastName: string,
    email: string,
    message: string,
  ): Promise<boolean> {
    try {
      // Email to admin
      await this.mailerService.sendMail({
        from: email,
        to: 'aplevancanh1993@gmail.com', // Admin email
        subject: `New Contact Form Submission from ${firstName} ${lastName}`,
        html: `
          <h2>New Contact Form Message</h2>
          <p><strong>From:</strong> ${firstName} ${lastName}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Message:</strong></p>
          <p>${message}</p>
        `,
      });
      return true;
    } catch (ex) {
      console.log(ex);
      return false;
    }
  }
}