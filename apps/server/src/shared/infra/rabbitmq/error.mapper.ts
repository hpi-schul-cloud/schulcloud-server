import { BadRequestException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { ErrorUtils } from '@src/core/error/utils';
import { IError } from '@shared/infra/rabbitmq';

export class ErrorMapper {
	static mapRpcErrorResponseToDomainError(
		errorObj: IError
	): BadRequestException | ForbiddenException | InternalServerErrorException {
		let error: BadRequestException | ForbiddenException | InternalServerErrorException;
		if (errorObj.status === 400) {
			error = new BadRequestException(errorObj.message);
		} else if (errorObj.status === 403) {
			error = new ForbiddenException(errorObj.message);
		} else if (errorObj.status === 500) {
			error = new InternalServerErrorException(errorObj.message);
		} else {
			error = new InternalServerErrorException(null, ErrorUtils.createHttpExceptionOptions(errorObj));
		}

		return error;
	}
}
