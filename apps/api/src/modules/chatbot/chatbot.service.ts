import { Injectable } from '@nestjs/common';
import { InteractionChannel } from '../../common/enums';
import { InteractionsService } from '../interactions/interactions.service';
import { PatientsService } from '../patients/patients.service';
import { OpenAiService } from '../../services/openai/openai.service';
import { WhatsappService } from '../../services/whatsapp/whatsapp.service';

@Injectable()
export class ChatbotService {
  constructor(
    private readonly whatsapp: WhatsappService,
    private readonly openAi: OpenAiService,
    private readonly patients: PatientsService,
    private readonly interactions: InteractionsService,
  ) {}

  verifyWebhook(mode?: string, token?: string, challenge?: string) {
    return this.whatsapp.verify(mode, token, challenge);
  }

  async handleWebhook(payload: Record<string, unknown>) {
    const messages = this.whatsapp.extractMessages(payload);

    for (const message of messages) {
      const patient = await this.patients.findByPhone(message.from);
      const triage = await this.openAi.triagePatientMessage(message.text);

      await this.interactions.create({
        patientId: patient?.id,
        channel: InteractionChannel.WHATSAPP,
        message: message.text,
        urgency: triage.urgency,
        metadata: {
          messageId: message.messageId,
          handoffRequired: triage.handoffRequired,
          suggestedDepartment: triage.suggestedDepartment,
        },
      });

      await this.whatsapp.sendText(message.from, triage.answer);
    }

    return { received: messages.length };
  }
}
