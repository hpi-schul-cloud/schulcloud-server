import { ApiValidationError } from '@shared/common';
import { AxiosError, AxiosResponse } from 'axios';
import { FileStorageErrors } from '../interfaces';

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

export const emptyAxiosResponse = {
	data: {},
	statusText: 'Can not cast to axios response.',
} as AxiosResponse<FileStorageErrors>;

export const extractAxiosResponse = (axiosError: AxiosError<FileStorageErrors>): AxiosResponse<FileStorageErrors> => {
	const axiosResponse: AxiosResponse<FileStorageErrors> = axiosError.response || emptyAxiosResponse;

	return axiosResponse;
};

export const hasAxiosResponse = (axiosError: AxiosError<FileStorageErrors>): boolean => {
	const keys = Object.keys(axiosError.response || {});
	const isAxiosResponse = keys.includes('data') && keys.includes('statusText');

	return isAxiosResponse;
};

export const isValidationError = (axiosError: AxiosError<FileStorageErrors>): boolean => {
	if (hasAxiosResponse(axiosError)) {
		const response = extractAxiosResponse(axiosError);
		const checked = (response.data as ApiValidationError)?.validationErrors?.length > 0;

		return checked;
	}

	return false;
};

export const isAxiosError = (requestResponse: unknown): boolean => {
	const result = (requestResponse as AxiosError)?.isAxiosError === true;

	return result;
};

export const castToAxiosError = (requestResponse: unknown): AxiosError<FileStorageErrors> => {
	const axiosError = requestResponse as AxiosError<FileStorageErrors>;

	return axiosError;
};
