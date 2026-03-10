import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { CurrentUser } from '../common/decorators';

@Controller('chats')
export class ChatsController {
  constructor(private chatsService: ChatsService) { }

  @Get()
  listChats(
    @CurrentUser('id') userId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.chatsService.listUserChats(userId, Number(page), Number(limit));
  }

  @Get(':id')
  getChat(
    @Param('id', ParseUUIDPipe) chatId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.chatsService.getChatDetails(chatId, userId);
  }

  @Get(':id/messages')
  getMessages(
    @Param('id', ParseUUIDPipe) chatId: string,
    @CurrentUser('id') userId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '30',
  ) {
    return this.chatsService.getMessages(
      chatId,
      userId,
      Number(page),
      Number(limit),
    );
  }
}
