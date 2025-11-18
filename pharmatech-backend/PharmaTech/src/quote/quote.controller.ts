import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { QuoteService } from './quote.service';
import { CreateQuoteDto, ReplyQuoteDto, FilterQuoteDto } from './quote.dto';

@Controller('api/quote')
export class QuoteController {
  constructor(private readonly quoteService: QuoteService) {}

  @Post()
  async create(@Body() createQuoteDto: CreateQuoteDto) {
    try {
      const quote = await this.quoteService.create(createQuoteDto);
      return {
        msg: 'Quote created successfully',
        data: quote,
      };
    } catch (error) {
      throw new HttpException(
        {
          msg: 'Failed to create quote',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get()
  async findAll(@Query() query: FilterQuoteDto) {
    try {
      const result = await this.quoteService.findAll(query);
      return {
        msg: 'Quotes retrieved successfully',
        ...result,
      };
    } catch (error) {
      throw new HttpException(
        {
          msg: 'Failed to retrieve quotes',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('unread-count')
  async getUnreadCount() {
    try {
      const count = await this.quoteService.getUnreadCount();
      return {
        msg: 'Unread count retrieved successfully',
        count,
      };
    } catch (error) {
      throw new HttpException(
        {
          msg: 'Failed to get unread count',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const quote = await this.quoteService.findOne(id);
      if (!quote) {
        throw new HttpException(
          {
            msg: 'Quote not found',
          },
          HttpStatus.NOT_FOUND,
        );
      }
      return {
        msg: 'Quote retrieved successfully',
        data: quote,
      };
    } catch (error) {
      throw new HttpException(
        {
          msg: 'Failed to retrieve quote',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Put(':id/read')
  async markAsRead(@Param('id') id: string) {
    try {
      const quote = await this.quoteService.markAsRead(id);
      if (!quote) {
        throw new HttpException(
          {
            msg: 'Quote not found',
          },
          HttpStatus.NOT_FOUND,
        );
      }
      return {
        msg: 'Quote marked as read',
        data: quote,
      };
    } catch (error) {
      throw new HttpException(
        {
          msg: 'Failed to mark quote as read',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post(':id/reply')
  async sendReply(@Param('id') id: string, @Body() replyDto: ReplyQuoteDto) {
    try {
      // Strip HTML tags to validate actual text content
      const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '').trim();
      const textContent = replyDto.replyMessage
        ? stripHtml(replyDto.replyMessage)
        : '';

      if (!replyDto.replyMessage || !textContent) {
        throw new HttpException(
          {
            msg: 'Reply message is required',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const result = await this.quoteService.sendReply(
        id,
        replyDto.replyMessage,
      );

      if (!result) {
        throw new HttpException(
          {
            msg: 'Failed to send reply. Email service might be unavailable.',
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return {
        msg: 'Reply sent successfully',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          msg: 'Failed to send reply',
          error: error.message || 'Unknown error occurred',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    try {
      const quote = await this.quoteService.delete(id);
      if (!quote) {
        throw new HttpException(
          {
            msg: 'Quote not found',
          },
          HttpStatus.NOT_FOUND,
        );
      }
      return {
        msg: 'Quote deleted successfully',
        data: quote,
      };
    } catch (error) {
      throw new HttpException(
        {
          msg: 'Failed to delete quote',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
