import { Controller, Get, Param } from '@nestjs/common';
import { TimeSheetService } from './time-sheet.service';

@Controller('folhas-de-ponto')
export class TimeSheetController {
  constructor(private readonly timesheetService: TimeSheetService) {}

  @Get('/:month')
  async getReportByMonth(@Param('month') month: string) {
    console.log({ month });
  }
}
