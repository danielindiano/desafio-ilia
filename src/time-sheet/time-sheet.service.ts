import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import {
  differenceInMinutes,
  isValid,
  isSameSecond,
  isWeekend,
  differenceInSeconds,
  intervalToDuration,
  formatISODuration,
  startOfMonth,
  endOfMonth,
  differenceInBusinessDays,
} from 'date-fns';
import { TimeSheet, TimeSheetDocument } from './schemas/time-sheet.schema';
import { CreateTimeEntryDto } from './dto/create-time-entry.dto';
import {
  TimeEntryErrorDuplicated,
  TimeEntryErrorInvalidFormat,
  TimeEntryErrorMaximum4TimeEntries,
  TimeEntryErrorWeekendEntry,
  TimeEntryErrorInvalidLunch,
  TimeEntryErrorMissingField,
} from './errors/time-entry.error';
import { TimeSheetMonthReport, timeSheetToDto } from './dto/time-sheet.dto';
import {
  TimeSheetErrorInvalidFormat,
  TimeSheetErrorNotFound,
} from './errors/time-sheet.error';

const ALLOWED_MAXIMUM_TIME_ENTRIES = 4;
const MINIMUN_LUNCH_TIME_IN_MINUTES = 60;
const DURATION_OF_WORKDAY_IN_MINUTES = 480;
@Injectable()
export class TimeSheetService {
  constructor(
    @InjectModel(TimeSheet.name) private timeSheetModel: Model<TimeSheet>,
  ) {}

  public async addTimeEntry(
    userId: string,
    timeEntryDto: CreateTimeEntryDto,
  ): Promise<TimeSheetDocument> {
    const { momento } = timeEntryDto;
    const date = momento.slice(0, 10);

    this.validateInput(timeEntryDto);

    const timeEntry = new Date(momento);

    this.validateWeekendEntry(timeEntry);

    const workday = await this.getOrCreateWorkday(userId, date);

    this.validateDuplicatedTimeEntry(workday, timeEntry);
    this.validateMaximumTimeEntries(workday);

    workday.timeEntries.push(timeEntry);
    workday.timeEntries.sort((a, b) => a.getTime() - b.getTime());

    this.validateLunchTime(workday);

    await workday.save();

    return workday;
  }

  public async getMonthReport(
    userId: string,
    month: string,
  ): Promise<TimeSheetMonthReport> {
    this.validateMonthFormat(month);

    const workdays = await this.timeSheetModel.find({
      userId,
      date: { $regex: `${month}-` },
    });

    if (workdays.length === 0) {
      throw new TimeSheetErrorNotFound();
    }

    const monthWorkedTimeInSeconds = workdays.reduce(
      (acc, workday) => acc + this.getWorkedTimeInSeconds(workday),
      0,
    );

    const balanceHours =
      monthWorkedTimeInSeconds - this.calculateBusinessTimeInMonth(month);

    const horasTrabalhadas = this.formatSecondsToString(
      monthWorkedTimeInSeconds,
    );
    const horasExcedentes = this.formatSecondsToString(
      balanceHours > 0 ? balanceHours : 0,
    );
    const horasDevidas = this.formatSecondsToString(
      balanceHours < 0 ? -balanceHours : 0,
    );
    const expedientes = workdays.map(timeSheetToDto);

    return {
      userId,
      anoMes: month,
      horasTrabalhadas,
      horasExcedentes,
      horasDevidas,
      expedientes,
    };
  }

  private async getOrCreateWorkday(
    userId: string,
    date: string,
  ): Promise<TimeSheetDocument> {
    return (
      (await this.timeSheetModel.findOne({ userId, date })) ||
      (await this.timeSheetModel.create({ date, timeEntries: [], userId }))
    );
  }

  private validateInput(timeEntryDto: CreateTimeEntryDto): void {
    const { momento } = timeEntryDto;
    if (!momento) {
      throw new TimeEntryErrorMissingField();
    }
    if (!isValid(new Date(momento))) {
      throw new TimeEntryErrorInvalidFormat();
    }
  }

  private validateWeekendEntry(timeEntry: Date): void {
    if (isWeekend(timeEntry)) {
      throw new TimeEntryErrorWeekendEntry();
    }
  }

  private validateMaximumTimeEntries(workday: TimeSheetDocument): void {
    if (workday.timeEntries.length >= ALLOWED_MAXIMUM_TIME_ENTRIES) {
      throw new TimeEntryErrorMaximum4TimeEntries();
    }
  }

  private validateDuplicatedTimeEntry(
    workday: TimeSheetDocument,
    timeEntry: Date,
  ): void {
    if (workday.timeEntries.some((t) => isSameSecond(t, timeEntry))) {
      throw new TimeEntryErrorDuplicated();
    }
  }

  private validateLunchTime(workday: TimeSheetDocument): void {
    if (
      workday.timeEntries.length >= 3 &&
      differenceInMinutes(workday.timeEntries[2], workday.timeEntries[1]) <
        MINIMUN_LUNCH_TIME_IN_MINUTES
    ) {
      throw new TimeEntryErrorInvalidLunch();
    }
  }

  private getWorkedTimeInSeconds(timeSheet: TimeSheetDocument): number {
    const { timeEntries } = timeSheet;
    let firstShift = 0;
    let secondShift = 0;

    if (timeEntries[1]) {
      firstShift = differenceInSeconds(timeEntries[1], timeEntries[0]);
    }

    if (timeEntries[3]) {
      secondShift = differenceInSeconds(timeEntries[3], timeEntries[2]);
    }
    // sum of firstShift and secondShift in Duration format
    return firstShift + secondShift;
  }

  private calculateBusinessTimeInMonth(month: string): number {
    // TODO: It's not considering holidays
    const monthStart = startOfMonth(new Date(`${month}-01`));
    const monthEnd = endOfMonth(new Date(`${month}-01`));

    return (
      differenceInBusinessDays(monthEnd, monthStart) *
      DURATION_OF_WORKDAY_IN_MINUTES *
      60
    );
  }

  private formatSecondsToString(durationInSeconds: number): string {
    const duration = intervalToDuration({
      start: 0,
      end: durationInSeconds * 1000,
    });
    return formatISODuration(duration);
  }

  private validateMonthFormat(month: string): void {
    if (!/^\d{4}-\d{2}$/.test(month)) {
      throw new TimeSheetErrorInvalidFormat();
    }
    const [year, monthNumber] = month.split('-').map(Number);
    if (monthNumber < 1 || monthNumber > 12) {
      throw new TimeSheetErrorInvalidFormat();
    }
    if (year < 1900 || year > 2200) {
      throw new TimeSheetErrorInvalidFormat();
    }
  }
}
