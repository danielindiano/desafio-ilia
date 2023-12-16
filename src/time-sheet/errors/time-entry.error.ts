import { HttpException, HttpStatus } from '@nestjs/common';

export enum TimeEntryErrorMessages {
  InvalidLunch = 'Deve haver no mínimo 1 hora de almoço',
  MissingField = 'Campo obrigatório não informado',
  InvalidFormat = 'Data e hora em formato inválido',
  Maximum4Entries = 'Apenas 4 horários podem ser registrados por dia',
  WeekendEntry = 'Sábado e domingo não são permitidos como dia de trabalho',
  Duplicated = 'Horário já registrado',
}

export class TimeEntryValidationError extends HttpException {
  constructor(mensagem: string, statusCode = HttpStatus.BAD_REQUEST) {
    super({ mensagem }, statusCode);
  }
}

export class TimeEntryErrorInvalidLunch extends TimeEntryValidationError {
  constructor() {
    super(TimeEntryErrorMessages.InvalidLunch);
  }
}

export class TimeEntryErrorMissingField extends TimeEntryValidationError {
  constructor() {
    super(TimeEntryErrorMessages.MissingField);
  }
}

export class TimeEntryErrorInvalidFormat extends TimeEntryValidationError {
  constructor() {
    super(TimeEntryErrorMessages.InvalidFormat);
  }
}
export class TimeEntryErrorMaximum4TimeEntries extends TimeEntryValidationError {
  constructor() {
    super(TimeEntryErrorMessages.Maximum4Entries);
  }
}
export class TimeEntryErrorWeekendEntry extends TimeEntryValidationError {
  constructor() {
    super(TimeEntryErrorMessages.WeekendEntry);
  }
}
export class TimeEntryErrorDuplicated extends TimeEntryValidationError {
  constructor() {
    super(TimeEntryErrorMessages.Duplicated, HttpStatus.CONFLICT);
  }
}
