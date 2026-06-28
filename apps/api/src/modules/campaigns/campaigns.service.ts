import { Injectable } from '@nestjs/common';
import { CampaignStatus } from '../../common/enums';
import { PrismaService } from '../../prisma/prisma.service';
import { SchedulerService } from '../../services/scheduler/scheduler.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';

@Injectable()
export class CampaignsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scheduler: SchedulerService,
  ) {}

  async create(dto: CreateCampaignDto) {
    const campaign = await this.prisma.campaign.create({
      data: {
        name: dto.name,
        segment: dto.segment,
        messageTemplate: dto.messageTemplate,
        status: dto.status ?? CampaignStatus.DRAFT,
        patients: dto.patientIds
          ? {
              create: dto.patientIds.map((patientId) => ({ patientId })),
            }
          : undefined,
      },
      include: { patients: true },
    });

    await this.scheduler.emitCampaignCreated(campaign.id);
    return campaign;
  }

  list() {
    return this.prisma.campaign.findMany({
      include: { patients: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  previewSegment(segment: string) {
    const now = new Date();
    const monthsAgo = (months: number) => new Date(now.getFullYear(), now.getMonth() - months, now.getDate());

    if (segment === '6-months-inactive') {
      return this.prisma.patient.findMany({
        where: {
          lgpdConsentAccepted: true,
          OR: [{ lastVisitAt: null }, { lastVisitAt: { lte: monthsAgo(6) } }],
        },
        take: 500,
      });
    }

    if (segment === '12-months-inactive') {
      return this.prisma.patient.findMany({
        where: {
          lgpdConsentAccepted: true,
          OR: [{ lastVisitAt: null }, { lastVisitAt: { lte: monthsAgo(12) } }],
        },
        take: 500,
      });
    }

    if (segment === 'interrupted-treatment') {
      return this.prisma.patient.findMany({
        where: {
          lgpdConsentAccepted: true,
          treatments: { some: { status: 'INTERRUPTED' } },
        },
        take: 500,
      });
    }

    return [];
  }
}
