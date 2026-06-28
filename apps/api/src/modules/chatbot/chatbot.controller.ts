import { Body, Controller, Get, Post, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { ChatbotService } from './chatbot.service';

@Controller('webhooks/whatsapp')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Get()
  verify(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() response: Response,
  ) {
    const verified = this.chatbotService.verifyWebhook(mode, token, challenge);
    if (!verified) {
      return response.sendStatus(403);
    }

    return response.status(200).send(verified);
  }

  @Post()
  receive(@Body() payload: Record<string, unknown>) {
    return this.chatbotService.handleWebhook(payload);
  }
}
