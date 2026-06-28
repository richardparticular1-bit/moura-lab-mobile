import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Prisma } from '@prisma/client';
import { InteractionChannel, UrgencyLevel } from '../../../common/enums';

export class CreateInteractionDto {
  @IsOptional()
  @IsString()
  patientId?: string;

  @IsEnum(InteractionChannel)
  channel: InteractionChannel;

  @IsString()
  message: string;

  @IsOptional()
  @IsEnum(UrgencyLevel)
  urgency?: UrgencyLevel;

  @IsOptional()
  metadata?: Prisma.InputJsonValue;
}
