import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { AppointmentStatus } from '../../../common/enums';

export class CreateAppointmentDto {
  @IsString()
  patientId: string;

  @IsString()
  professional: string;

  @IsDateString()
  startsAt: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;
}
