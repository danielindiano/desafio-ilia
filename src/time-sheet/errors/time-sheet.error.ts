import { HttpException, HttpStatus } from '@nestjs/common';

export enum TimeSheetErrorMessages {
  NotFound = 'Relatório não encontrado',
  InvalidFormat = 'Formato inválido',
}

export class TimeSheetValidationError extends HttpException {
  constructor(mensagem: string, statusCode = HttpStatus.BAD_REQUEST) {
    super({ mensagem }, statusCode);
  }
}

export class TimeSheetErrorNotFound extends TimeSheetValidationError {
  constructor() {
    super(TimeSheetErrorMessages.NotFound, HttpStatus.NOT_FOUND);
  }
}

export class TimeSheetErrorInvalidFormat extends TimeSheetValidationError {
  constructor() {
    super(TimeSheetErrorMessages.InvalidFormat);
  }
}
