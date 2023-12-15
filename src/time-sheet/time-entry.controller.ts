import { Body, Controller, HttpCode, Post, Headers } from '@nestjs/common';
import { CreateTimeEntryDto } from './dto/create-time-entry.dto';
import { TimeSheetService } from './time-sheet.service';
import { timeSheetToDto } from './dto/time-sheet.dto';

@Controller('batidas')
export class TimeEntryController {
  constructor(private readonly timeEntryService: TimeSheetService) {}

  @HttpCode(201)
  @Post()
  async createTimeEntry(
    // TODO: The userId param must comes from JWT Auth or other engine. For this example, we're receiving via headers
    @Headers('X-UserId') userId = process.env.API_DEFAULT_USER,
    @Body() timeEntry: CreateTimeEntryDto,
  ) {
    const timeSheet = await this.timeEntryService.addTimeEntry({
      userId,
      ...timeEntry,
    });

    return timeSheetToDto(timeSheet);
  }
}
