import { Injectable, NotFoundException } from '@nestjs/common';
import { PatientStatus } from '../../common/enums';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';

@Injectable()
export class PatientsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePatientDto) {
    return this.prisma.patient.create({
      data: {
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
        city: dto.city,
        source: dto.source,
        status: dto.status ?? PatientStatus.LEAD,
        lgpdConsentAccepted: dto.lgpdConsentAccepted ?? false,
        lgpdConsentAcceptedAt: dto.lgpdConsentAccepted ? new Date() : undefined,
        lgpdConsentSource: dto.lgpdConsentAccepted ? 'api' : undefined,
      },
    });
  }

  async list(query?: string) {
    return this.prisma.patient.findMany({
      where: query
        ? {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { phone: { contains: query } },
              { email: { contains: query, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });
  }

  async get(id: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id },
      include: {
        appointments: { orderBy: { startsAt: 'desc' }, take: 10 },
        treatments: true,
        interactions: { orderBy: { occurredAt: 'desc' }, take: 20 },
      },
    });

    if (!patient) {
      throw new NotFoundException('Paciente nao encontrado.');
    }

    return patient;
  }

  async findByPhone(phone: string) {
    return this.prisma.patient.findFirst({ where: { phone } });
  }

  async update(id: string, dto: UpdatePatientDto) {
    await this.ensureExists(id);

    return this.prisma.patient.update({
      where: { id },
      data: {
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
        city: dto.city,
        source: dto.source,
        status: dto.status,
        lgpdConsentAccepted: dto.lgpdConsentAccepted,
        lgpdConsentAcceptedAt: dto.lgpdConsentAccepted ? new Date() : undefined,
        lgpdConsentSource: dto.lgpdConsentAccepted ? 'api' : undefined,
      },
    });
  }

  private async ensureExists(id: string) {
    const patient = await this.prisma.patient.findUnique({ where: { id }, select: { id: true } });
    if (!patient) {
      throw new NotFoundException('Paciente nao encontrado.');
    }
  }
}
