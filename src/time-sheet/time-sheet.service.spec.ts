import { Test, TestingModule } from '@nestjs/testing';
import { TimeSheetService } from './time-sheet.service';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TimeSheetDocument, TimeSheet } from './schemas/time-sheet.schema';

describe('TimeSheetService', () => {
  let service: TimeSheetService;
  let timeSheetModel: Model<TimeSheetDocument>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TimeSheetService,
        {
          provide: getModelToken(TimeSheet.name),
          useValue: Model,
        },
      ],
    }).compile();
    timeSheetModel = module.get<Model<TimeSheetDocument>>(
      getModelToken(TimeSheet.name),
    );
    service = module.get<TimeSheetService>(TimeSheetService);
  });

  it('should be defined', () => {
    expect(timeSheetModel).toBeDefined();
    expect(service).toBeDefined();
  });
});
