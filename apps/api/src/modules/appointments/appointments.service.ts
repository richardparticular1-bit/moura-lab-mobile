import { Injectable, NotFoundException } from '@nestjs/common';
import { AppointmentStatus } from '../../common/enums';
import { PrismaService } from '../../prisma/prisma.service';
import { SchedulerService } from '../../services/scheduler/scheduler.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scheduler: SchedulerService,
  ) {}

  async create(dto: CreateAppointmentDto) {
    const appointment = await this.prisma.appointment.create({
      data: {
        patientId: dto.patientId,
        professional: dto.professional,
        startsAt: new Date(dto.startsAt),
        type: dto.type,
        status: dto.status ?? AppointmentStatus.SCHEDULED,
      },
      include: { patient: true },
    });

    await this.scheduler.emitAppointmentCreated(appointment.id);
    return appointment;
  }

  async list(from?: string, to?: string) {
    return this.prisma.appointment.findMany({
      where: {
        startsAt: {
          gte: from ? new Date(from) : undefined,
          lte: to ? new Date(to) : undefined,
        },
      },
      include: { patient: true },
      orderBy: { startsAt: 'asc' },
      take: 200,
    });
  }

  async update(id: string, dto: UpdateAppointmentDto) {
    const current = await this.prisma.appointment.findUnique({ where: { id } });
    if (!current) {
      throw new NotFoundException('Agendamento nao encontrado.');
    }

    const appointment = await this.prisma.appointment.update({
      where: { id },
      data: {
        patientId: dto.patientId,
        professional: dto.professional,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
        type: dto.type,
        status: dto.status,
      },
      include: { patient: true },
    });

    if (dto.status === AppointmentStatus.ATTENDED) {
      await this.scheduler.emitAppointmentCompleted(id);
    }

    if (dto.status === AppointmentStatus.NO_SHOW) {
      await this.scheduler.emitAppointmentNoShow(id);
    }

    return appointment;
  }
}
