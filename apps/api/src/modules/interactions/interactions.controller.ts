import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateInteractionDto } from './dto/create-interaction.dto';
import { InteractionsService } from './interactions.service';

@Controller('interactions')
export class InteractionsController {
  constructor(private readonly interactionsService: InteractionsService) {}

  @Post()
  create(@Body() dto: CreateInteractionDto) {
    return this.interactionsService.create(dto);
  }

  @Get('patient/:patientId')
  listByPatient(@Param('patientId') patientId: string) {
    return this.interactionsService.listByPatient(patientId);
  }
}
