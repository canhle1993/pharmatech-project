import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Quote, QuoteDocument } from './quote.schema';
import { CreateQuoteDto, UpdateQuoteDto, FilterQuoteDto } from './quote.dto';
import { MailService } from '../mail/mail.service';
import { QuoteGateway } from './quote.gateway';

@Injectable()
export class QuoteService {
  constructor(
    @InjectModel(Quote.name) private quoteModel: Model<QuoteDocument>,
    private mailService: MailService,
    private quoteGateway: QuoteGateway,
  ) {}

  async create(createQuoteDto: CreateQuoteDto): Promise<Quote> {
    const quote = new this.quoteModel({
      ...createQuoteDto,
      status: 'unread',
      createdAt: new Date(),
    });
    const savedQuote = await quote.save();
    
    // Emit socket event for real-time notification
    this.quoteGateway.emitNewQuote(savedQuote);
    
    return savedQuote;
  }

  async findAll(filterDto: FilterQuoteDto): Promise<{ data: Quote[]; total: number }> {
    const { status, page = 1, limit = 10 } = filterDto;
    const skip = (page - 1) * limit;
    
    const filter: any = {};
    if (status) {
      filter.status = status;
    }

    const [data, total] = await Promise.all([
      this.quoteModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.quoteModel.countDocuments(filter).exec(),
    ]);

    return { data, total };
  }

  async findOne(id: string): Promise<Quote> {
    return this.quoteModel.findById(id).exec();
  }

  async getUnreadCount(): Promise<number> {
    return this.quoteModel.countDocuments({ status: 'unread' }).exec();
  }

  async markAsRead(id: string): Promise<Quote> {
    const before = await this.quoteModel.findById(id).exec();
    const updated = await this.quoteModel
      .findByIdAndUpdate(id, { status: 'read' }, { new: true })
      .exec();
    if (before && before.status === 'unread' && updated) {
      const updatedId = (updated as any)?.id || (updated as any)?._id?.toString() || id;
      this.quoteGateway.emitQuoteStatusChanged({ id: updatedId, from: 'unread', to: 'read' });
    }
    return updated;
  }

  async markAsReplied(id: string, updateDto: UpdateQuoteDto): Promise<Quote> {
    return this.quoteModel
      .findByIdAndUpdate(
        id,
        {
          status: 'replied',
          repliedAt: new Date(),
          replyMessage: updateDto.replyMessage,
        },
        { new: true },
      )
      .exec();
  }

  async sendReply(id: string, replyMessage: string): Promise<boolean> {
    try {
      console.log('SendReply called with id:', id);
      const quote = await this.findOne(id);
      if (!quote) {
        console.error('Quote not found with id:', id);
        return false;
      }
      console.log('Quote found:', quote.email);

    const fullName = `${quote.firstName} ${quote.lastName}`;
    const subject = 'Re: Your Message to PharmaTech';
    const adminEmail = process.env.ADMIN_EMAIL || 'aplevancanh1993@gmail.com';
    
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Reply from PharmaTech</h2>
        <p>Dear ${fullName},</p>
        <p>Thank you for contacting us. Here is our response to your inquiry:</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0;">
          <h3 style="margin-top: 0;">Your Message:</h3>
          <p style="color: #666;">${quote.message}</p>
        </div>
        
        <div style="background-color: #e8f5e9; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0;">
          <h3 style="margin-top: 0;">Our Response:</h3>
          <p>${replyMessage}</p>
        </div>
        
        <p>If you have any further questions, please don't hesitate to contact us.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
          <p style="color: #666; font-size: 12px;">
            Best regards,<br>
            PharmaTech Team<br>
            Email: ${adminEmail}
          </p>
        </div>
      </div>
    `;

      console.log('Sending email from:', adminEmail, 'to:', quote.email);
      const result = await this.mailService.send2(
        adminEmail,
        quote.email,
        subject,
        htmlBody,
      );

      if (result) {
        console.log('Email sent successfully, updating status...');
        const updated = await this.markAsReplied(id, { replyMessage });
        if (updated) {
          const updatedId = (updated as any)?.id || (updated as any)?._id?.toString() || id;
          this.quoteGateway.emitQuoteStatusChanged({ id: updatedId, from: quote.status, to: 'replied' });
        }
        return true;
      }

      console.error('Failed to send email');
      return false;
    } catch (error) {
      console.error('Error in sendReply:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<Quote> {
    const before = await this.quoteModel.findById(id).exec();
    const deleted = await this.quoteModel.findByIdAndDelete(id).exec();
    if (before && before.status === 'unread') {
      this.quoteGateway.emitQuoteStatusChanged({ id, from: 'unread', to: 'deleted' });
    }
    return deleted;
  }
}
