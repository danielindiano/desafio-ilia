import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { TimeSheet } from './schemas/time-sheet.schema';
import { Model } from 'mongoose';

@Injectable()
export class TimeSheetService {
  constructor(
    @InjectModel(TimeSheet.name) private timeSheetModel: Model<TimeSheet>,
  ) {}
}
