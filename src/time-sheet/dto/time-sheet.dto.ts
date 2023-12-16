import { IsArray, IsDateString, IsOptional } from 'class-validator';
import { TimeSheetDocument } from '../schemas/time-sheet.schema';
import { format } from 'date-fns';

//Expediente
export class TimeSheetDto {
  @IsOptional()
  userId?: string;

  @IsDateString()
  dia: string;

  @IsArray()
  pontos: string[];
}

//Relatório Mensal
export class TimeSheetMonthReport {
  @IsOptional()
  userId?: string;

  @IsDateString()
  anoMes: string;

  horasTrabalhadas: string;
  horasExcedentes: string;
  horasDevidas: string;
  expedientes: TimeSheetDto[];
}

export const timeSheetToDto = (ts: TimeSheetDocument): TimeSheetDto => {
  return {
    userId: ts.userId,
    dia: ts.date,
    pontos: ts.timeEntries.map((te) => format(te, 'HH:mm:ss')),
  };
};
