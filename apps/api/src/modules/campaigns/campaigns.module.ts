import { Module } from '@nestjs/common';
import { SchedulerModule } from '../../services/scheduler/scheduler.module';
import { CampaignsController } from './campaigns.controller';
import { CampaignsService } from './campaigns.service';

@Module({
  imports: [SchedulerModule],
  controllers: [CampaignsController],
  providers: [CampaignsService],
})
export class CampaignsModule {}
