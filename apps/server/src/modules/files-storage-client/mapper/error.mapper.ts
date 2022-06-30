import { ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { ApiValidationError } from '@shared/common';
import { AxiosError, AxiosResponse } from 'axios';
import { FileStorageErrors } from '../interfaces';
import {
	isValidationError,
	extractAxiosResponse,
	hasAxiosResponse,
	isAxiosErrror,
	castToAxiosError,
} from './error.mapper.utils';

export class ErrorMapper {
	static mapAxiosToDomainError(axiosError: AxiosError<FileStorageErrors>): FileStorageErrors {
		let error: FileStorageErrors;
		if (!hasAxiosResponse(axiosError)) {
			error = new InternalServerErrorException(axiosError);
		} else if (axiosError.code === '400' && isValidationError(axiosError)) {
			const response = extractAxiosResponse(axiosError) as AxiosResponse<ApiValidationError>;
			error = new ApiValidationError(response.data.validationErrors);
		} else if (axiosError.code === '403') {
			const response = extractAxiosResponse(axiosError);
			error = new ForbiddenException(response.data);
		} else if (axiosError.code) {
			const response = extractAxiosResponse(axiosError);
			error = new InternalServerErrorException(response.data);
		} else {
			error = new InternalServerErrorException(axiosError);
		}

		return error;
	}

	// expected inputs AxiosError<FileStorageErrors> | Error
	static mapErrorToDomainError(requestResponse: unknown): FileStorageErrors {
		if (isAxiosErrror(requestResponse)) {
			const axiosError = castToAxiosError(requestResponse);
			return ErrorMapper.mapAxiosToDomainError(axiosError);
		}

		const internalServerError = new InternalServerErrorException(requestResponse);

		return internalServerError;
	}
}
