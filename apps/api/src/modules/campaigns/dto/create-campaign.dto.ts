import { IsArray, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { CampaignStatus } from '../../../common/enums';

export class CreateCampaignDto {
  @IsString()
  @MinLength(3)
  name: string;

  @IsString()
  segment: string;

  @IsString()
  messageTemplate: string;

  @IsOptional()
  @IsEnum(CampaignStatus)
  status?: CampaignStatus;

  @IsOptional()
  @IsArray()
  patientIds?: string[];
}
