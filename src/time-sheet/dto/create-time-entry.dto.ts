import { IsDateString, IsNotEmpty } from 'class-validator';

export class CreateTimeEntryDTO {
  @IsDateString()
  @IsNotEmpty({ message: 'Campo obrigatório não informado' })
  momento: string;

  userId?: string;
}
