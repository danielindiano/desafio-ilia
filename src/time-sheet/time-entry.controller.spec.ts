import { Test, TestingModule } from '@nestjs/testing';
import { TimeEntryController } from './time-entry.controller';
import { TimeSheetService } from './time-sheet.service';
describe('TimeEntryController', () => {
  let controller: TimeEntryController;
  let timeEntryService: TimeSheetService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TimeEntryController],
      providers: [
        {
          provide: TimeSheetService,
          useValue: {
            addTimeEntry: jest.fn(),
          },
        },
      ],
    }).compile();

    timeEntryService = module.get<TimeSheetService>(TimeSheetService);
    controller = module.get<TimeEntryController>(TimeEntryController);
  });

  it('should be defined', () => {
    expect(timeEntryService).toBeDefined();
    expect(controller).toBeDefined();
  });
});
