import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import {
  differenceInMinutes,
  isValid,
  isSameSecond,
  isWeekend,
} from 'date-fns';
import { TimeSheet, TimeSheetDocument } from './schemas/time-sheet.schema';
import { CreateTimeEntryDto } from './dto/create-time-entry.dto';
import {
  TimeEntryErorrDuplicated,
  TimeEntryErorrInvalidFormat,
  TimeEntryErorrMaximum4TimeEntries,
  TimeEntryErorrWeekendEntry,
  TimeEntryErrorInvalidLunch,
  TimeEntryErrorMissingField,
} from './errors/time-entry.error';

const ALLOWED_MAXIMUM_TIME_ENTRIES = 4;
const MINIMUN_LUNCH_TIME_IN_MINUTES = 60;
@Injectable()
export class TimeEntryService {
  constructor(
    @InjectModel(TimeSheet.name) private timeSheetModel: Model<TimeSheet>,
  ) {}

  async addTimeEntry(
    timeEntryDto: CreateTimeEntryDto,
  ): Promise<TimeSheetDocument> {
    const { userId, momento } = timeEntryDto;
    const date = momento.slice(0, 10);

    if (!momento) {
      throw new TimeEntryErrorMissingField();
    }
    if (!isValid(new Date(momento))) {
      throw new TimeEntryErorrInvalidFormat();
    }

    const timeEntry = new Date(momento);

    // Check if timeEntry is weekend day
    if (isWeekend(timeEntry)) {
      throw new TimeEntryErorrWeekendEntry();
    }

    const workday =
      (await this.timeSheetModel.findOne({ userId, date })) ||
      (await this.timeSheetModel.create({ date, timeEntries: [], userId }));

    // Check if the maximum of time entries has reached
    if (workday.timeEntries.length >= ALLOWED_MAXIMUM_TIME_ENTRIES) {
      throw new TimeEntryErorrMaximum4TimeEntries();
    }

    // Check if timeEntry is duplicated
    if (workday.timeEntries.some((t) => isSameSecond(t, timeEntry))) {
      throw new TimeEntryErorrDuplicated();
    }

    // Add the timeEntry in the set and sort tem chronologically
    workday.timeEntries.push(timeEntry);
    workday.timeEntries.sort((a, b) => a.getTime() - b.getTime());

    // Check if the new timeEntry violates the lunch time
    if (
      workday.timeEntries.length >= 3 &&
      differenceInMinutes(workday.timeEntries[2], workday.timeEntries[1]) <
        MINIMUN_LUNCH_TIME_IN_MINUTES
    ) {
      throw new TimeEntryErrorInvalidLunch();
    }

    await workday.save();

    return workday;
  }
}
