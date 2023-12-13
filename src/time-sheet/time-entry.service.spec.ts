import { Test, TestingModule } from '@nestjs/testing';
import { TimeEntryService } from './time-entry.service';
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
import { CreateTimeEntryDTO } from './dto/create-time-entry.dto';
import { createSandbox } from 'sinon';

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
};

const defaultTimeEntry: CreateTimeEntryDTO = {
  momento: day_and_Moments.valid_day1[0],
  userId: users[0],
};

describe('TimeEntryService', () => {
  let sandbox: ReturnType<typeof createSandbox>;
  beforeAll(async () => {
    sandbox = createSandbox();
  });

  let service: TimeEntryService;
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
      providers: [TimeEntryService],
    }).compile();

    timeSheetModel = module.get<Model<TimeSheetDocument>>(
      getModelToken(TimeSheet.name),
    );
    service = module.get<TimeEntryService>(TimeEntryService);
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

  it("should create new TimeSheet when adding the first user's timeEntry for that day", async () => {
    const modelCreateSpy = sandbox.spy(timeSheetModel, 'create');
    const modelFindSpy = sandbox.spy(timeSheetModel, 'findOne');

    const result = await service.addTimeEntry(defaultTimeEntry);
    expect(result).toBeTruthy();
    expect(result.timeEntries).toHaveLength(1);
    expect(modelCreateSpy.calledOnce).toBe(true);
    expect(modelCreateSpy.calledImmediatelyAfter(modelFindSpy)).toBe(true);
  });

  it('should reuse the same TimeSheet when adding subsequent time entries for the same day and user', async () => {
    const firstCall = await service.addTimeEntry(defaultTimeEntry);
    const modelCreateSpy = sandbox.spy(timeSheetModel, 'create');

    const secondCall = await service.addTimeEntry({
      ...defaultTimeEntry,
      momento: day_and_Moments.valid_day1[1],
    });

    expect(secondCall).toBeTruthy();
    expect(secondCall.timeEntries).toHaveLength(2);
    expect(modelCreateSpy.called).toBe(false);
    expect(firstCall.id).toEqual(secondCall.id);
    expect(firstCall.userId).toEqual(secondCall.userId);
  });

  it('should create new TimeSheet when adding a new Time Entry, for different day', async () => {
    const firstCall = await service.addTimeEntry(defaultTimeEntry);
    const modelCreateSpy = sandbox.spy(timeSheetModel, 'create');

    const secondCall = await service.addTimeEntry({
      ...defaultTimeEntry,
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
    const firstCall = await service.addTimeEntry(defaultTimeEntry);
    const modelCreateSpy = sandbox.spy(timeSheetModel, 'create');

    const secondCall = await service.addTimeEntry({
      ...defaultTimeEntry,
      userId: users[1],
    });

    expect(secondCall).toBeTruthy();
    expect(firstCall.timeEntries).toHaveLength(1);
    expect(secondCall.timeEntries).toHaveLength(1);
    expect(modelCreateSpy.calledOnce).toBe(true);
    expect(firstCall.userId).not.toEqual(secondCall.userId);
    expect(firstCall.id).not.toEqual(secondCall.id);
  });

  it.skip('should throw an error when trying to insert a duplicated Time Entry', async () => {
    const firstCall = await service.addTimeEntry({
      userId: users[0],
      momento: day_and_Moments.invalid_duplicated[0],
    });
    const modelCreateSpy = sandbox.spy(timeSheetModel, 'create');
    const modelFindSpy = sandbox.spy(timeSheetModel, 'findOne');

    const secondCall = service.addTimeEntry({
      userId: users[0],
      momento: day_and_Moments.invalid_duplicated[1],
    });

    expect(firstCall.timeEntries).toHaveLength(1);
    expect(modelFindSpy.calledOnce).toBe(false);
    expect(modelCreateSpy.calledOnce).toBe(false);

    await expect(secondCall).rejects.toThrowError();
  });

  it.skip('should throw an error when trying to insert more than 4 time entries in the same day', async () => {
    const allDaysCalls = [];
    for (const momento of day_and_Moments.valid_day1) {
      allDaysCalls.push(
        await service.addTimeEntry({
          userId: users[0],
          momento,
        }),
      );
    }

    const modelCreateSpy = sandbox.spy(timeSheetModel, 'create');
    const modelFindSpy = sandbox.spy(timeSheetModel, 'findOne');

    const fifthCall = service.addTimeEntry({
      userId: users[0],
      momento: day_and_Moments.invalid_duplicated[1],
    });

    expect(allDaysCalls).toHaveLength(4);
    expect(allDaysCalls[0].timeEntries).toHaveLength(1);
    expect(allDaysCalls[1].timeEntries).toHaveLength(2);
    expect(allDaysCalls[2].timeEntries).toHaveLength(3);
    expect(allDaysCalls[3].timeEntries).toHaveLength(4);

    expect(modelFindSpy.calledOnce).toBe(false);
    expect(modelCreateSpy.calledOnce).toBe(false);

    await expect(fifthCall).rejects.toThrowError();
  });

  it.skip('should throw an error when trying to insert a time entry in a weekend day', async () => {
    const modelCreateSpy = sandbox.spy(timeSheetModel, 'create');
    const modelFindSpy = sandbox.spy(timeSheetModel, 'findOne');

    const weekendCall = service.addTimeEntry({
      userId: users[0],
      momento: day_and_Moments.invalid_weekendday1[0],
    });

    expect(modelFindSpy.calledOnce).toBe(false);
    expect(modelCreateSpy.calledOnce).toBe(false);

    await expect(weekendCall).rejects.toThrowError();
  });

  it.skip('should throw an error when time entries violate minimun 1 lunch hour time', async () => {
    const firstCall = await service.addTimeEntry({
      userId: users[0],
      momento: day_and_Moments.invalid_lunch_day[0],
    });
    const secondCall = await service.addTimeEntry({
      userId: users[0],
      momento: day_and_Moments.invalid_lunch_day[1],
    });
    const modelCreateSpy = sandbox.spy(timeSheetModel, 'create');
    const modelFindSpy = sandbox.spy(timeSheetModel, 'findOne');

    const thirdCall = await service.addTimeEntry({
      userId: users[0],
      momento: day_and_Moments.invalid_lunch_day[2],
    });

    expect(firstCall.timeEntries).toHaveLength(1);
    expect(secondCall.timeEntries).toHaveLength(2);
    expect(firstCall.userId).toEqual(secondCall.userId);
    expect(firstCall.id).toEqual(secondCall.id);
    expect(modelFindSpy.calledOnce).toBe(false);
    expect(modelCreateSpy.calledOnce).toBe(false);

    await expect(thirdCall).rejects.toThrowError();
  });

  it.skip('should throw an error when trying to insert a Time Entry with invalid format', async () => {
    const modelCreateSpy = sandbox.spy(timeSheetModel, 'create');
    const modelFindSpy = sandbox.spy(timeSheetModel, 'findOne');

    const invalidFormatCall = service.addTimeEntry({
      userId: users[0],
      momento: day_and_Moments.invalid_format[0],
    });

    expect(modelFindSpy.calledOnce).toBe(false);
    expect(modelCreateSpy.calledOnce).toBe(false);

    await expect(invalidFormatCall).rejects.toThrowError();
  });
});
