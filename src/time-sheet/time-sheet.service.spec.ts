import { Test, TestingModule } from '@nestjs/testing';
import { TimeSheetService } from './time-sheet.service';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import {
  TimeSheet,
  TimeSheetDocument,
  TimeSheetSchema,
} from './schemas/time-sheet.schema';
import { Model } from 'mongoose';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '../../test/utils/MongooseTestModule';
import { CreateTimeEntryDto } from './dto/create-time-entry.dto';
import { createSandbox } from 'sinon';
import {
  TimeEntryErrorMaximum4TimeEntries,
  TimeEntryErrorWeekendEntry,
  TimeEntryErrorDuplicated,
  TimeEntryErrorInvalidLunch,
  TimeEntryErrorInvalidFormat,
} from './errors/time-entry.error';
import {
  TimeSheetErrorInvalidFormat,
  TimeSheetErrorNotFound,
} from './errors/time-sheet.error';

// TODO: Get all mocks from helpers
const users = ['1', '2', '3'];
const day_and_Moments = {
  valid_day1: [
    '2023-12-11 08:00:00',
    '2023-12-11 12:00:00',
    '2023-12-11 14:00:00',
    '2023-12-11 18:00:00',
  ],
  valid_day2: [
    '2023-12-12 08:00:00',
    '2023-12-12 12:00:00',
    '2023-12-12 14:00:00',
    '2023-12-12 18:00:00',
  ],
  another_month: [
    '2023-11-14 08:00:00',
    '2023-11-14 12:00:00',
    '2023-11-14 14:00:00',
    '2023-11-14 18:00:00',
  ],
  invalid_lunch_day: [
    '2023-12-11 08:00:00',
    '2023-12-11 12:00:00',
    '2023-12-11 12:30:00',
    '2023-12-11 18:00:00',
  ],
  invalid_duplicated: [
    '2023-12-11 08:00:00',
    '2023-12-11 08:00:00',
    '2023-12-11 14:00:00',
    '2023-12-11 18:00:00',
  ],
  invalid_weekendday1: [
    '2023-12-02 08:00:00',
    '2023-12-02 08:00:00',
    '2023-12-02 14:00:00',
    '2023-12-02 18:00:00',
  ],

  invalid_weekendday2: [
    '2023-12-03 08:00:00',
    '2023-12-03 08:00:00',
    '2023-12-03 14:00:00',
    '2023-12-03 18:00:00',
  ],
  invalid_format: [
    '2023-13-03 08:00:00',
    '1000-12-03 08:00:00',
    '2023-11-31 14:00:00',
    '2023-12-03 18:00:00',
  ],
  invalid_5th_timeEntry: '2023-12-11 20:00:00',
};

const defaultTimeEntry: CreateTimeEntryDto = {
  momento: day_and_Moments.valid_day1[0],
};

describe('TimeSheetService', () => {
  let sandbox: ReturnType<typeof createSandbox>;
  beforeAll(async () => {
    sandbox = createSandbox();
  });

  let service: TimeSheetService;
  let timeSheetModel: Model<TimeSheetDocument>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        rootMongooseTestModule(),
        MongooseModule.forFeature([
          {
            name: TimeSheet.name,
            schema: TimeSheetSchema,
          },
        ]),
      ],
      providers: [TimeSheetService],
    }).compile();

    timeSheetModel = module.get<Model<TimeSheetDocument>>(
      getModelToken(TimeSheet.name),
    );
    service = module.get<TimeSheetService>(TimeSheetService);

    await timeSheetModel.deleteMany({});
  });

  afterEach(async () => {
    sandbox.restore();
  });

  afterAll(async () => {
    await closeInMongodConnection();
  });

  it('should be defined', () => {
    expect(timeSheetModel).toBeDefined();
    expect(service).toBeDefined();
  });

  describe('addTimeEntry', () => {
    it("should create new TimeSheet when adding the first user's timeEntry for that day", async () => {
      const modelCreateSpy = sandbox.spy(timeSheetModel, 'create');
      const modelFindSpy = sandbox.spy(timeSheetModel, 'findOne');

      const result = await service.addTimeEntry(users[0], defaultTimeEntry);
      expect(result).toBeTruthy();
      expect(result.timeEntries).toHaveLength(1);
      expect(modelCreateSpy.calledOnce).toBe(true);
      expect(modelCreateSpy.calledImmediatelyAfter(modelFindSpy)).toBe(true);
    });

    it('should reuse the same TimeSheet when adding subsequent time entries for the same day and user', async () => {
      const firstCall = await service.addTimeEntry(users[0], defaultTimeEntry);
      const modelCreateSpy = sandbox.spy(timeSheetModel, 'create');

      const secondCall = await service.addTimeEntry(users[0], {
        momento: day_and_Moments.valid_day1[1],
      });

      expect(secondCall).toBeTruthy();
      expect(secondCall.timeEntries).toHaveLength(2);
      expect(modelCreateSpy.called).toBe(false);
      expect(firstCall.id).toEqual(secondCall.id);
      expect(firstCall.userId).toEqual(secondCall.userId);
    });

    it('should create new TimeSheet when adding a new Time Entry, for different day', async () => {
      const firstCall = await service.addTimeEntry(users[0], defaultTimeEntry);
      const modelCreateSpy = sandbox.spy(timeSheetModel, 'create');

      const secondCall = await service.addTimeEntry(users[0], {
        momento: day_and_Moments.valid_day2[1],
      });

      expect(secondCall).toBeTruthy();
      expect(firstCall.timeEntries).toHaveLength(1);
      expect(secondCall.timeEntries).toHaveLength(1);
      expect(modelCreateSpy.calledOnce).toBe(true);
      expect(firstCall.userId).toEqual(secondCall.userId);
      expect(firstCall.id).not.toEqual(secondCall.id);
    });

    it('should create new TimeSheet when adding a new Time Entry, for different user', async () => {
      const firstCall = await service.addTimeEntry(users[0], defaultTimeEntry);
      const modelCreateSpy = sandbox.spy(timeSheetModel, 'create');

      const secondCall = await service.addTimeEntry(users[1], defaultTimeEntry);

      expect(secondCall).toBeTruthy();
      expect(firstCall.timeEntries).toHaveLength(1);
      expect(secondCall.timeEntries).toHaveLength(1);
      expect(modelCreateSpy.calledOnce).toBe(true);
      expect(firstCall.userId).not.toEqual(secondCall.userId);
      expect(firstCall.id).not.toEqual(secondCall.id);
    });

    it('should throw an error when trying to insert a duplicated Time Entry', async () => {
      const firstCall = await service.addTimeEntry(users[0], {
        momento: day_and_Moments.invalid_duplicated[0],
      });
      const modelCreateSpy = sandbox.spy(timeSheetModel, 'create');
      const modelFindSpy = sandbox.spy(timeSheetModel, 'findOne');

      const secondCall = service.addTimeEntry(users[0], {
        momento: day_and_Moments.invalid_duplicated[1],
      });

      expect(firstCall.timeEntries).toHaveLength(1);
      expect(modelFindSpy.calledOnce).toBe(true);
      expect(modelCreateSpy.calledOnce).toBe(false);

      await expect(secondCall).rejects.toThrowError(TimeEntryErrorDuplicated);
    });

    it('should throw an error when trying to insert more than 4 time entries in the same day', async () => {
      const allDaysCalls = [];
      for (const momento of day_and_Moments.valid_day1) {
        allDaysCalls.push(await service.addTimeEntry(users[0], { momento }));
      }

      const modelCreateSpy = sandbox.spy(timeSheetModel, 'create');
      const modelFindSpy = sandbox.spy(timeSheetModel, 'findOne');

      const fifthCall = service.addTimeEntry(users[0], {
        momento: day_and_Moments.invalid_5th_timeEntry,
      });

      expect(allDaysCalls).toHaveLength(4);
      expect(allDaysCalls[0].timeEntries).toHaveLength(1);
      expect(allDaysCalls[1].timeEntries).toHaveLength(2);
      expect(allDaysCalls[2].timeEntries).toHaveLength(3);
      expect(allDaysCalls[3].timeEntries).toHaveLength(4);

      expect(modelFindSpy.calledOnce).toBe(true);
      expect(modelCreateSpy.calledOnce).toBe(false);

      await expect(fifthCall).rejects.toThrowError(
        TimeEntryErrorMaximum4TimeEntries,
      );
    });

    it('should throw an error when trying to insert a time entry in a weekend day', async () => {
      const modelCreateSpy = sandbox.spy(timeSheetModel, 'create');
      const modelFindSpy = sandbox.spy(timeSheetModel, 'findOne');

      const weekendCall = service.addTimeEntry(users[0], {
        momento: day_and_Moments.invalid_weekendday1[0],
      });

      expect(modelFindSpy.calledOnce).toBe(false);
      expect(modelCreateSpy.calledOnce).toBe(false);

      await expect(weekendCall).rejects.toThrowError(
        TimeEntryErrorWeekendEntry,
      );
    });

    it('should throw an error when time entries violate minimun 1 lunch hour time', async () => {
      const firstCall = await service.addTimeEntry(users[0], {
        momento: day_and_Moments.invalid_lunch_day[0],
      });
      const secondCall = await service.addTimeEntry(users[0], {
        momento: day_and_Moments.invalid_lunch_day[1],
      });
      const modelCreateSpy = sandbox.spy(timeSheetModel, 'create');
      const modelFindSpy = sandbox.spy(timeSheetModel, 'findOne');

      const thirdCall = service.addTimeEntry(users[0], {
        momento: day_and_Moments.invalid_lunch_day[2],
      });

      expect(firstCall.timeEntries).toHaveLength(1);
      expect(secondCall.timeEntries).toHaveLength(2);
      expect(firstCall.userId).toEqual(secondCall.userId);
      expect(firstCall.id).toEqual(secondCall.id);
      expect(modelFindSpy.calledOnce).toBe(true);
      expect(modelCreateSpy.calledOnce).toBe(false);

      await expect(thirdCall).rejects.toThrowError(TimeEntryErrorInvalidLunch);
    });

    it('should throw an error when trying to insert a Time Entry with invalid format', async () => {
      const modelCreateSpy = sandbox.spy(timeSheetModel, 'create');
      const modelFindSpy = sandbox.spy(timeSheetModel, 'findOne');

      const invalidFormatCall = service.addTimeEntry(users[0], {
        momento: day_and_Moments.invalid_format[0],
      });

      expect(modelFindSpy.calledOnce).toBe(false);
      expect(modelCreateSpy.calledOnce).toBe(false);

      await expect(invalidFormatCall).rejects.toThrowError(
        TimeEntryErrorInvalidFormat,
      );
    });
  });

  describe('getMonthReport', () => {
    it('should throw an error when trying to get a report for a month with invalid format', async () => {
      const invalidFormatCall = service.getMonthReport(users[0], '2023-13');

      await expect(invalidFormatCall).rejects.toThrowError(
        TimeSheetErrorInvalidFormat,
      );
    });

    it('should throw and error when trying to get a report for non-existing time entries', async () => {
      // Without time entries insert calls before
      const monthReport = service.getMonthReport(users[0], '2023-12');

      await expect(monthReport).rejects.toThrowError(TimeSheetErrorNotFound);
    });

    it('should return a month report with the correct number of days', async () => {
      // Insert day1 time entries
      for (const momento of day_and_Moments.valid_day1) {
        await service.addTimeEntry(users[0], { momento });
      }
      // Insert day2 time entries
      for (const momento of day_and_Moments.valid_day2) {
        await service.addTimeEntry(users[0], { momento });
      }

      const monthReport = await service.getMonthReport(users[0], '2023-12');

      expect(monthReport.anoMes).toEqual('2023-12');
      expect(monthReport.expedientes).toHaveLength(2);
      expect(monthReport.expedientes[0].dia).toEqual('2023-12-11');
      expect(monthReport.expedientes[1].dia).toEqual('2023-12-12');
      expect(monthReport.horasTrabalhadas).toEqual('P0Y0M0DT16H0M0S');
    });

    it('should calculate only time entries for the given user', async () => {
      // Insert day1 time entries
      for (const momento of day_and_Moments.valid_day1) {
        await service.addTimeEntry(users[0], { momento });
      }
      // Insert day2 time entries for user 1
      for (const momento of day_and_Moments.valid_day2) {
        await service.addTimeEntry(users[1], { momento });
      }

      // Get report for user 0
      const monthReport = await service.getMonthReport(users[0], '2023-12');

      expect(monthReport.anoMes).toEqual('2023-12');
      expect(monthReport.expedientes).toHaveLength(1);
      expect(monthReport.expedientes[0].dia).toEqual('2023-12-11');
      expect(monthReport.horasTrabalhadas).toEqual('P0Y0M0DT8H0M0S');
    });

    it('should calculate only time entries for the given month', async () => {
      // Insert day1 time entries
      for (const momento of day_and_Moments.valid_day1) {
        await service.addTimeEntry(users[0], { momento });
      }
      // Insert another month time entries
      for (const momento of day_and_Moments.another_month) {
        await service.addTimeEntry(users[0], { momento });
      }

      // Get report for month = 12
      const monthReport = await service.getMonthReport(users[0], '2023-12');

      expect(monthReport.anoMes).toEqual('2023-12');
      expect(monthReport.expedientes).toHaveLength(1);
      expect(monthReport.expedientes[0].dia).toEqual('2023-12-11');
      expect(monthReport.horasTrabalhadas).toEqual('P0Y0M0DT8H0M0S');
    });

    it('should not calculate incomplete time entries with only 1', async () => {
      // Insert just 1 time entrie for day1
      await service.addTimeEntry(users[0], {
        momento: day_and_Moments.valid_day1[0],
      });

      const monthReport = await service.getMonthReport(users[0], '2023-12');

      expect(monthReport.anoMes).toEqual('2023-12');
      expect(monthReport.expedientes).toHaveLength(1);
      expect(monthReport.expedientes[0].dia).toEqual('2023-12-11');
      expect(monthReport.horasTrabalhadas).toEqual('P0Y0M0DT0H0M0S');
    });

    it('should not calculate incomplete time entries with 3', async () => {
      // Insert 3 time entries for day1
      await service.addTimeEntry(users[0], {
        momento: day_and_Moments.valid_day1[0],
      });
      await service.addTimeEntry(users[0], {
        momento: day_and_Moments.valid_day1[1],
      });
      await service.addTimeEntry(users[0], {
        momento: day_and_Moments.valid_day1[2],
      });

      const monthReport = await service.getMonthReport(users[0], '2023-12');

      expect(monthReport.anoMes).toEqual('2023-12');
      expect(monthReport.expedientes).toHaveLength(1);
      expect(monthReport.expedientes[0].dia).toEqual('2023-12-11');
      expect(monthReport.horasTrabalhadas).toEqual('P0Y0M0DT4H0M0S');
    });
  });
});
