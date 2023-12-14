import { IsDateString, IsNotEmpty } from 'class-validator';
import { TimeEntryErrorMessages } from '../errors/time-entry.error';

export class CreateTimeEntryDTO {
  @IsDateString(
    { strict: true, strictSeparator: true },
    { message: TimeEntryErrorMessages.InvalidFormat },
  )
  @IsNotEmpty({ message: TimeEntryErrorMessages.MissingField })
  // @Expose({ name: 'momento' })
  momento: string;

  userId?: string;
}
