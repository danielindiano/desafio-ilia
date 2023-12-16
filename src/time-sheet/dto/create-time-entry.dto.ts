import { IsDateString, IsNotEmpty } from 'class-validator';
import { TimeEntryErrorMessages } from '../errors/time-entry.error';

export class CreateTimeEntryDto {
  @IsDateString(
    { strict: true, strictSeparator: true },
    { message: TimeEntryErrorMessages.InvalidFormat },
  )
  @IsNotEmpty({ message: TimeEntryErrorMessages.MissingField })
  momento: string;
}
