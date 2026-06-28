import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface IncomingWhatsappMessage {
  from: string;
  text: string;
  messageId?: string;
  timestamp?: string;
}

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  constructor(private readonly config: ConfigService) {}

  verify(mode?: string, token?: string, challenge?: string) {
    const expectedToken = this.config.get<string>('WHATSAPP_VERIFY_TOKEN');
    if (mode === 'subscribe' && token === expectedToken) {
      return challenge;
    }

    return null;
  }

  extractMessages(payload: Record<string, any>): IncomingWhatsappMessage[] {
    const entries = payload.entry ?? [];
    return entries.flatMap((entry: any) =>
      (entry.changes ?? []).flatMap((change: any) =>
        (change.value?.messages ?? [])
          .filter((message: any) => message.type === 'text')
          .map((message: any) => ({
            from: message.from,
            text: message.text?.body ?? '',
            messageId: message.id,
            timestamp: message.timestamp,
          })),
      ),
    );
  }

  async sendText(to: string, text: string) {
    const accessToken = this.config.get<string>('WHATSAPP_ACCESS_TOKEN');
    const phoneNumberId = this.config.get<string>('WHATSAPP_PHONE_NUMBER_ID');

    if (!accessToken || !phoneNumberId) {
      this.logger.warn(`WhatsApp nao configurado. Mensagem simulada para ${to}: ${text}`);
      return { simulated: true, to, text };
    }

    const response = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: text },
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Falha ao enviar WhatsApp: ${response.status} ${body}`);
    }

    return response.json();
  }
}
