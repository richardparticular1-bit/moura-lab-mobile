import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';

@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Post()
  create(@Body() dto: CreateCampaignDto) {
    return this.campaignsService.create(dto);
  }

  @Get()
  list() {
    return this.campaignsService.list();
  }

  @Get('segments/:segment/patients')
  previewSegment(@Param('segment') segment: string) {
    return this.campaignsService.previewSegment(segment);
  }
}
