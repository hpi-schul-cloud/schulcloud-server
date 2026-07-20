import { ErrorUtils } from '@infra/error/utils/error.utils';
import { BadRequestException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { type IError } from './rpc-message';

export class ErrorMapper {
	public static mapRpcErrorResponseToDomainError(
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
