import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { TimeSheet, TimeSheetDocument } from './schemas/time-sheet.schema';
import { CreateTimeEntryDTO } from './dto/create-time-entry.dto';

@Injectable()
export class TimeEntryService {
  constructor(
    @InjectModel(TimeSheet.name) private timeSheetModel: Model<TimeSheet>,
  ) {}

  async addTimeEntry(
    timeEntryDto: CreateTimeEntryDTO,
  ): Promise<TimeSheetDocument> {
    const { userId, momento } = timeEntryDto;
    const date = momento.slice(0, 10);
    const timeEntry = new Date(momento);

    const workday =
      (await this.timeSheetModel.findOne({ userId, date })) ||
      (await this.timeSheetModel.create({ date, timeEntries: [], userId }));

    workday.timeEntries.push(timeEntry);
    workday.timeEntries.sort((a, b) => a.getTime() - b.getTime());
    // TODO: Validate the timeEntries and everything else
    await workday.save();

    return workday;
  }
}
