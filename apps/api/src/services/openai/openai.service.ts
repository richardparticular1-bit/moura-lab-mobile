import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { UrgencyLevel } from '../../common/enums';

export interface MouraAiResponse {
  answer: string;
  urgency: UrgencyLevel;
  handoffRequired: boolean;
  suggestedDepartment: 'recepcao' | 'dentista' | 'financeiro';
}

@Injectable()
export class OpenAiService {
  private readonly client: OpenAI | null;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    this.client = apiKey ? new OpenAI({ apiKey }) : null;
  }

  async triagePatientMessage(message: string): Promise<MouraAiResponse> {
    if (!this.client) {
      return this.localFallback(message);
    }

    const completion = await this.client.chat.completions.create({
      model: this.config.get<string>('OPENAI_MODEL', 'gpt-4.1-mini'),
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'Voce e a Moura IA, assistente virtual odontologica. Seja acolhedora, nunca faca diagnostico, colete sinais, classifique urgencia e encaminhe quando necessario. Responda em JSON com answer, urgency, handoffRequired e suggestedDepartment.',
        },
        {
          role: 'user',
          content: message,
        },
      ],
    });

    const content = completion.choices[0]?.message.content;
    if (!content) {
      return this.localFallback(message);
    }

    return JSON.parse(content) as MouraAiResponse;
  }

  private localFallback(message: string): MouraAiResponse {
    const normalized = message.toLowerCase();
    const urgentTerms = ['dor', 'inchaco', 'sangramento', 'trauma', 'febre', 'abscesso'];
    const isUrgent = urgentTerms.some((term) => normalized.includes(term));

    return {
      answer: isUrgent
        ? 'Entendo. Para te orientar com seguranca, poderia informar ha quanto tempo isso acontece, se existe inchaco, febre, sangramento ou trauma? Vou encaminhar sua mensagem para a equipe avaliar rapidamente. A Moura IA nao realiza diagnostico.'
        : 'Obrigado pelo contato. Vou te ajudar com acolhimento e encaminhar sua solicitacao para a equipe da Moura Odontologia quando necessario.',
      urgency: isUrgent ? UrgencyLevel.URGENT : UrgencyLevel.ROUTINE,
      handoffRequired: isUrgent,
      suggestedDepartment: isUrgent ? 'dentista' : 'recepcao',
    };
  }
}
