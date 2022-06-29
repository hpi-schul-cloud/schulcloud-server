import { ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { ApiValidationError } from '@shared/common';
import { AxiosError, AxiosResponse } from 'axios';

/**
 * export interface AxiosResponse<T = any, D = any>  {
  data: T;
  status: number;
  statusText: string;
  headers: AxiosResponseHeaders;
  config: AxiosRequestConfig<D>;
  request?: any;
}

export interface AxiosError<T = any, D = any> extends Error {
  config: AxiosRequestConfig<D>;
  code?: string;
  request?: any;
  response?: AxiosResponse<T, D>;
  isAxiosError: boolean;
  toJSON: () => object;
}
 */

export type FileStorageErrors = ApiValidationError | ForbiddenException | InternalServerErrorException;

const emptyAxiosResponse = {
	data: {},
	statusText: 'Can not cast to axios response.',
} as AxiosResponse<FileStorageErrors>;

const extractAxiosResponse = (axiosError: AxiosError<FileStorageErrors>): AxiosResponse<FileStorageErrors> => {
	const axiosResponse: AxiosResponse<FileStorageErrors> = axiosError.response || emptyAxiosResponse;

	return axiosResponse;
};

const hasAxiosResponse = (axiosError: AxiosError<FileStorageErrors>): boolean => {
	const keys = Object.keys(axiosError.response || {});
	const isAxiosResponse = keys.includes('data') && keys.includes('statusText');

	return isAxiosResponse;
};

const checkValidationError = (axiosError: AxiosError<FileStorageErrors>): boolean => {
	if (hasAxiosResponse(axiosError)) {
		const response = extractAxiosResponse(axiosError);
		const isValidationError = (response.data as ApiValidationError)?.validationErrors.length > 0;

		return isValidationError;
	}

	return false;
};

const isAxiosErrror = (requestResponse: unknown): boolean => {
	const isAxiosError = (requestResponse as AxiosError)?.isAxiosError === true;

	return isAxiosError;
};

const castToAxiosError = (requestResponse: unknown): AxiosError<FileStorageErrors> => {
	const axiosError = requestResponse as AxiosError<FileStorageErrors>;

	return axiosError;
};

export class ErrorMapper {
	static mapAxiosToDomainError(axiosError: AxiosError<FileStorageErrors>): FileStorageErrors {
		let error: FileStorageErrors;
		if (!hasAxiosResponse(axiosError)) {
			error = new InternalServerErrorException(axiosError);
		} else if (axiosError.code === '400' && checkValidationError(axiosError)) {
			const response = extractAxiosResponse(axiosError) as AxiosResponse<ApiValidationError>;
			error = new ApiValidationError(response.data.validationErrors);
		} else if (axiosError.code === '403') {
			const response = extractAxiosResponse(axiosError);
			error = new ForbiddenException(response.data);
		} else {
			const response = extractAxiosResponse(axiosError);
			error = new InternalServerErrorException(response.data);
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
