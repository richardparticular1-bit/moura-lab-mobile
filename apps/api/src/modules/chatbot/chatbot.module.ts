import { Module } from '@nestjs/common';
import { OpenAiModule } from '../../services/openai/openai.module';
import { WhatsappModule } from '../../services/whatsapp/whatsapp.module';
import { InteractionsModule } from '../interactions/interactions.module';
import { PatientsModule } from '../patients/patients.module';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';

@Module({
  imports: [PatientsModule, InteractionsModule, OpenAiModule, WhatsappModule],
  controllers: [ChatbotController],
  providers: [ChatbotService],
})
export class ChatbotModule {}
