import { ForbiddenException, InternalServerErrorException, ValidationError as IValidationError } from '@nestjs/common';
import { ApiValidationError } from '@shared/common';
import { AxiosError, AxiosRequestConfig, AxiosResponse, AxiosResponseHeaders } from 'axios';
import { ErrorMapper } from './error.mapper';
import { FileStorageErrors } from '../interfaces';

describe('ErrorMapper', () => {
	const createAxiosError = (
		data: Record<string, unknown>,
		code: number,
		errorText: string
	): AxiosError<FileStorageErrors> => {
		const headers: AxiosResponseHeaders = {};
		const config: AxiosRequestConfig = {};
		const response: AxiosResponse = {
			data,
			status: code,
			statusText: errorText,
			headers,
			config,
			request: {},
		};
		const error: AxiosError<FileStorageErrors> = {
			isAxiosError: true,
			config,
			code: code?.toString(),
			response,
			name: errorText,
			message: errorText,
			toJSON: () => ({}),
		};

		return error;
	};

	const createApiValidationError = (): ApiValidationError => {
		const constraints: IValidationError[] = [];
		constraints.push(
			{
				property: 'propWithoutConstraint',
			},
			{
				property: 'propWithOneConstraing',
				constraints: {
					rulename: 'ruleDescription',
				},
			},
			{
				property: 'propWithMultipleCOnstraints',
				constraints: {
					rulename: 'ruleDescription',
					secondrulename: 'secondRuleDescription',
				},
			}
		);

		const apiValidationError = new ApiValidationError(constraints);

		return apiValidationError;
	};

	describe('mapAxiosToDomainError', () => {
		it('Should map 403 axios error response to ForbiddenException.', () => {
			const errorText = 'ForbiddenException ABC';
			const json = JSON.stringify(new ForbiddenException(errorText));
			const data = JSON.parse(json) as Record<string, unknown>;
			const code = 403;

			const error = createAxiosError(data, code, errorText);
			const result = ErrorMapper.mapAxiosToDomainError(error);

			expect(result).toEqual(new ForbiddenException(errorText));
		});

		it('Should map 500 axios error response to InternalServerErrorException.', () => {
			const errorText = 'InternalServerErrorException ABC';
			const json = JSON.stringify(new InternalServerErrorException(errorText));
			const data = JSON.parse(json) as Record<string, unknown>;
			const code = 500;

			const error = createAxiosError(data, code, errorText);
			const result = ErrorMapper.mapAxiosToDomainError(error);

			expect(result).toEqual(new InternalServerErrorException(errorText));
		});

		it('Should map unkown axios error code to InternalServerErrorException.', () => {
			const errorText = 'ForbiddenException ABC';
			const json = JSON.stringify(new ForbiddenException(errorText));
			const data = JSON.parse(json) as Record<string, unknown>;
			const code = 444;

			const error = createAxiosError(data, code, errorText);
			const result = ErrorMapper.mapAxiosToDomainError(error);

			expect(result).toEqual(new InternalServerErrorException(errorText));
		});

		it('Should map undefined axios error code to InternalServerErrorException.', () => {
			const errorText = 'ForbiddenException ABC';
			const json = JSON.stringify(new ForbiddenException(errorText));
			const data = JSON.parse(json) as Record<string, unknown>;
			const code = undefined;

			// @ts-expect-error: Test case
			const error = createAxiosError(data, code, errorText);
			const result = ErrorMapper.mapAxiosToDomainError(error);

			expect(result).toEqual(new InternalServerErrorException(errorText));
		});

		it('Should map generic error to InternalServerErrorException.', () => {
			const errorText = 'ABC';
			const error = new Error(errorText);
			// @ts-expect-error: Test case
			const result = ErrorMapper.mapAxiosToDomainError(error);

			expect(result).toEqual(new InternalServerErrorException(errorText));
		});

		it('Should map 400 api validation error response to ApiValidationError.', () => {
			const errorText = 'ApiValidationError ABC';
			const apiValidationError = createApiValidationError();
			const json = JSON.stringify(apiValidationError);
			const data = JSON.parse(json) as Record<string, unknown>;
			const code = 400;

			const error = createAxiosError(data, code, errorText);
			const result = ErrorMapper.mapAxiosToDomainError(error);

			expect(result).toEqual(new ApiValidationError());
		});

		it('Should map any 400 error that is not an ApiValidationError to InternalServerErrorException.', () => {
			const errorText = 'ForbiddenException ABC';
			const json = JSON.stringify(new ForbiddenException(errorText));
			const data = JSON.parse(json) as Record<string, unknown>;
			const code = 400;

			const error = createAxiosError(data, code, errorText);
			const result = ErrorMapper.mapAxiosToDomainError(error);

			expect(result).toEqual(new InternalServerErrorException(errorText));
		});
	});

	describe('mapErrorToDomainError', () => {
		it('Should map generic error to domain error.', () => {
			const errorText = 'Generic Error ABC';

			const error = new Error(errorText);
			const result = ErrorMapper.mapErrorToDomainError(error);

			expect(result).toEqual(new InternalServerErrorException(errorText));
		});

		it('Should map axios error response to domain error.', () => {
			const errorText = 'ForbiddenException ABC';
			const json = JSON.stringify(new ForbiddenException(errorText));
			const data = JSON.parse(json) as Record<string, unknown>;
			const code = 403;

			const error = createAxiosError(data, code, errorText);
			const result = ErrorMapper.mapErrorToDomainError(error);

			expect(result).toEqual(new ForbiddenException(errorText));
		});
	});
});
