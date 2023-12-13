import { Test, TestingModule } from '@nestjs/testing';
import { TimeSheetController } from './time-sheet.controller';
import { TimeSheetService } from './time-sheet.service';
import { TimeEntryService } from './time-entry.service';

describe('TimeSheetController', () => {
  let controller: TimeSheetController;
  let timeSheetService: TimeSheetService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TimeSheetController],
      providers: [
        {
          provide: TimeSheetService,
          useValue: {},
        },
      ],
    }).compile();

    timeSheetService = module.get<TimeSheetService>(TimeSheetService);
    controller = module.get<TimeSheetController>(TimeSheetController);
  });

  it('should be defined', () => {
    expect(timeSheetService).toBeDefined();
    expect(controller).toBeDefined();
  });
});
