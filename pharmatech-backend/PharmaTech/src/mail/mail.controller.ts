import { Body, Controller, Get, HttpException, HttpStatus, Post } from '@nestjs/common';
import { MailService } from './mail.service';

@Controller('api/mail')
export class MailController {

    constructor(
        private mailService: MailService
    ) { }

    @Get('send')
    async send() {
        let result = await this.mailService.send();
        if (result) {
            return {
                msg: 'Sent'
            }
        } else {
            throw new HttpException({
                msg: 'Failed'
            }, HttpStatus.BAD_REQUEST);
        }
    }

    @Post('send2')
    async send2(@Body() body: any) {
        let result = await this.mailService.send2(body.from, body.to, body.subject, body.body);
        if (result) {
            return {
                msg: 'Sent'
            }
        } else {
            throw new HttpException({
                msg: 'Failed'
            }, HttpStatus.BAD_REQUEST);
        }
        
    }

    @Get('send3')
    async send3() {
        let result = await this.mailService.send3();
        if (result) {
            return {
                msg: 'Sent'
            }
        } else {
            throw new HttpException({
                msg: 'Failed'
            }, HttpStatus.BAD_REQUEST);
        }
    }

    @Post('contact')
    async sendContactForm(@Body() body: any) {
        const { firstName, lastName, email, message } = body;
        
        if (!firstName || !lastName || !email || !message) {
            throw new HttpException({
                msg: 'All fields are required'
            }, HttpStatus.BAD_REQUEST);
        }

        let result = await this.mailService.sendContactForm(
            firstName,
            lastName,
            email,
            message
        );
        
        if (result) {
            return {
                msg: 'Message sent successfully'
            }
        } else {
            throw new HttpException({
                msg: 'Failed to send message'
            }, HttpStatus.BAD_REQUEST);
        }
    }

}
