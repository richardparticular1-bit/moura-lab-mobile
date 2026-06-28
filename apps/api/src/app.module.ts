import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { AuthModule } from './modules/auth/auth.module';
import { CampaignsModule } from './modules/campaigns/campaigns.module';
import { ChatbotModule } from './modules/chatbot/chatbot.module';
import { InteractionsModule } from './modules/interactions/interactions.module';
import { PatientsModule } from './modules/patients/patients.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { PrismaModule } from './prisma/prisma.module';
import { OpenAiModule } from './services/openai/openai.module';
import { SchedulerModule } from './services/scheduler/scheduler.module';
import { WhatsappModule } from './services/whatsapp/whatsapp.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    OpenAiModule,
    WhatsappModule,
    SchedulerModule,
    AuthModule,
    PatientsModule,
    AppointmentsModule,
    InteractionsModule,
    ChatbotModule,
    CampaignsModule,
    ReviewsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
