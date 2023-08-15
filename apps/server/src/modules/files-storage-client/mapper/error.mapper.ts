import { BadRequestException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { ApiValidationError } from '@shared/common';
import { ErrorUtils } from '@src/core/error/utils';
import { FileStorageError, IFileStorageError } from '../interfaces';

export const isValidationError = (error: IFileStorageError): boolean => {
	const checked = !!(error.validationErrors && error.validationErrors.length > 0);

	return checked;
};
export class ErrorMapper {
	static mapErrorToDomainError(errorObj: IFileStorageError): FileStorageError {
		let error: FileStorageError;
		if (errorObj.status === 400 && isValidationError(errorObj)) {
			error = new ApiValidationError(errorObj.validationErrors);
		} else if (errorObj.status === 400 && !isValidationError(errorObj)) {
			error = new BadRequestException(errorObj.message);
		} else if (errorObj.status === 403) {
			error = new ForbiddenException(errorObj.message);
		} else {
			error = new InternalServerErrorException(ErrorUtils.convertUnknownError(errorObj));
		}

		return error;
	}
}
