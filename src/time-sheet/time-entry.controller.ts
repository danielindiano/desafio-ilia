import { Body, Controller, HttpCode, Post, Headers } from '@nestjs/common';
import { CreateTimeEntryDTO } from './dto/create-time-entry.dto';
import { TimeEntryService } from './time-entry.service';

@Controller('batidas')
export class TimeEntryController {
  constructor(private readonly timeEntryService: TimeEntryService) {}

  @HttpCode(201)
  @Post()
  async createTimeEntry(
    @Headers('X-UserId') userId = process.env.API_DEFAULT_USER,
    @Body() timeEntry: CreateTimeEntryDTO,
  ) {
    // TODO: The userId param must comes from JWT Auth or other engine. For this example, we're receiving via headers
    return await this.timeEntryService.addTimeEntry({ userId, ...timeEntry });
  }
}
