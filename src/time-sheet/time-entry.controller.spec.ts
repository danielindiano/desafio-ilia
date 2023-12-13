import { Test, TestingModule } from '@nestjs/testing';
import { TimeEntryController } from './time-entry.controller';
import { TimeEntryService } from './time-entry.service';
describe('TimeEntryController', () => {
  let controller: TimeEntryController;
  let timeEntryService: TimeEntryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TimeEntryController],
      providers: [
        {
          provide: TimeEntryService,
          useValue: {
            addTimeEntry: jest.fn(),
          },
        },
      ],
    }).compile();

    timeEntryService = module.get<TimeEntryService>(TimeEntryService);
    controller = module.get<TimeEntryController>(TimeEntryController);
  });

  it('should be defined', () => {
    expect(timeEntryService).toBeDefined();
    expect(controller).toBeDefined();
  });
});
