import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInteractionDto } from './dto/create-interaction.dto';

@Injectable()
export class InteractionsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateInteractionDto) {
    return this.prisma.interaction.create({
      data: {
        patientId: dto.patientId,
        channel: dto.channel,
        message: dto.message,
        urgency: dto.urgency,
        metadata: dto.metadata,
      },
    });
  }

  listByPatient(patientId: string) {
    return this.prisma.interaction.findMany({
      where: { patientId },
      orderBy: { occurredAt: 'desc' },
      take: 100,
    });
  }
}
