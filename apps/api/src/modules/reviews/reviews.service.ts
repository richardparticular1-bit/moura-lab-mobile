import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async create(dto: CreateReviewDto) {
    const googleReviewUrl = this.config.get<string>('GOOGLE_REVIEW_URL');

    return this.prisma.review.create({
      data: {
        patientId: dto.patientId,
        appointmentId: dto.appointmentId,
        score: dto.score,
        comment: dto.comment,
        googleReviewRequestedAt: dto.score >= 5 && googleReviewUrl ? new Date() : undefined,
        internalTicketOpenedAt: dto.score <= 4 ? new Date() : undefined,
      },
    });
  }

  async metrics() {
    const aggregate = await this.prisma.review.aggregate({
      _avg: { score: true },
      _count: { id: true },
    });

    return {
      total: aggregate._count.id,
      averageScore: aggregate._avg.score,
    };
  }
}
