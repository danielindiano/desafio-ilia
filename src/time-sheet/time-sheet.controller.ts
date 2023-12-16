import { Controller, Get, Param, Headers } from '@nestjs/common';
import { TimeSheetService } from './time-sheet.service';

@Controller('folha-ponto')
export class TimeSheetController {
  constructor(private readonly timesheetService: TimeSheetService) {}

  @Get('/:month')
  async getReportByMonth(
    // TODO: The userId param must comes from JWT Auth or other engine. For this example, we're receiving via headers
    @Headers('X-UserId') userId = process.env.API_DEFAULT_USER,
    @Param('month') month: string,
  ) {
    return this.timesheetService.getMonthReport(userId, month);
  }
}
