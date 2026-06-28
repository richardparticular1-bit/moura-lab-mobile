import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(private readonly config: ConfigService) {}

  emitAppointmentCreated(appointmentId: string) {
    return this.emit('appointment.created', { appointmentId });
  }

  emitAppointmentCompleted(appointmentId: string) {
    return this.emit('appointment.completed', { appointmentId });
  }

  emitAppointmentNoShow(appointmentId: string) {
    return this.emit('appointment.no_show', { appointmentId });
  }

  emitCampaignCreated(campaignId: string) {
    return this.emit('campaign.created', { campaignId });
  }

  private async emit(event: string, payload: Record<string, unknown>) {
    const baseUrl = this.config.get<string>('N8N_WEBHOOK_BASE_URL');
    if (!baseUrl) {
      this.logger.warn(`n8n nao configurado. Evento ${event} simulado.`);
      return { simulated: true, event, payload };
    }

    const response = await fetch(`${baseUrl}/${event}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, payload }),
    });

    if (!response.ok) {
      this.logger.error(`Falha ao emitir evento ${event}: ${response.status}`);
    }

    return { event, delivered: response.ok };
  }
}
