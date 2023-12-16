import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TimeSheetDocument = HydratedDocument<TimeSheet>;

@Schema()
export class TimeSheet {
  @Prop({ type: String, required: true })
  userId: string;

  @Prop({ type: String, required: true, match: /\d{4}-\d{2}-\d{2}/ })
  date: string;

  @Prop({ type: [Date], required: true, maxlength: 4 })
  timeEntries: Date[];
}

export const TimeSheetSchema = SchemaFactory.createForClass(TimeSheet);
