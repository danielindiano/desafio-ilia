import { Module } from '@nestjs/common';

import { MongooseModule } from '@nestjs/mongoose';
import { TimeSheet, TimeSheetSchema } from './schemas/time-sheet.schema';
import { TimeEntryController } from './time-entry.controller';
import { TimeSheetService } from './time-sheet.service';
import { TimeSheetController } from './time-sheet.controller';
import { TimeEntryService } from './time-entry.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TimeSheet.name, schema: TimeSheetSchema },
    ]),
  ],
  controllers: [TimeSheetController, TimeEntryController],
  providers: [TimeSheetService, TimeEntryService],
  exports: [TimeSheetService, TimeEntryService],
})
export class TimeSheetModule {}
