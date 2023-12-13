import { Test, TestingModule } from '@nestjs/testing';
import { TimeEntryService } from './time-entry.service';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import {
  TimeSheet,
  TimeSheetDocument,
  TimeSheetSchema,
} from './schemas/time-sheet.schema';
import { Model, models } from 'mongoose';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '../../test/utils/MongooseTestModule';
import { CreateTimeEntryDTO } from './dto/create-time-entry.dto';
import { createSandbox } from 'sinon';

// TODO: Get all mocks from helpers 
const defaultTimeEntry: CreateTimeEntryDTO = {
  momento: '2023-12-01 08:00:00',
  userId: '1',
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
    expect(modelCreateSpy.callCount).toBe(1);
    expect(modelCreateSpy.calledImmediatelyAfter(modelFindSpy)).toBe(true);
  });

  it('should reuse the same TimeSheet when adding subsequent time entries for the same day and user', async () => {});

  it('should create new TimeSheet when adding a new Time Entry, for different day', async () => {});

  it('should create new TimeSheet when adding a new Time Entry, for different user', async () => {});

  it('should throw an error when trying to insert a duplicated Time Entry', async () => {});

  it('should throw an error when trying to insert more than 4 time entries in the same day', async () => {});

  it('should throw an error when trying to insert a time entry in a weekend day', async () => {});

  it('should throw an error when time entries violate minimun 1 lunch hour time', async () => {});

  it('should throw an error when trying to insert a Time Entry with invalid format', async () => {});

  afterAll(async () => {
    await closeInMongodConnection();
  });
});
