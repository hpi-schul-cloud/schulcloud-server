import { GeneralError } from '@feathersjs/errors';
import { ForbiddenException, InternalServerErrorException, ValidationError as IValidationError } from '@nestjs/common';
import { ApiValidationError } from '@shared/common';
import { AxiosError, AxiosRequestConfig, AxiosResponse, AxiosResponseHeaders } from 'axios';
import { ErrorMapper } from './error.mapper';
import { FileStorageErrors } from '../interfaces';

import { emptyAxiosResponse, extractAxiosResponse, hasAxiosResponse, isAxiosErrror, isValidationError } from './error.mapper.utils';

describe('error.mapper.utils', () => {
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
			code: code.toString(),
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

	describe('isAxiosErrror', () => {
		it('Should return true if error is axios error response', () => {
			const errorText = 'bla';
			const json = JSON.stringify(new InternalServerErrorException(errorText));
			const data = JSON.parse(json) as Record<string, unknown>;
			const code = 500;
			const error = createAxiosError(data, code, errorText);

			const response = isAxiosErrror(error);

			expect(response).toBe(true);
		});

		it('Should return false if error is *not* axios error response', () => {
			const errorText = 'bla';
			const error = new Error(errorText);

			const response = isAxiosErrror(error);

			expect(response).toBe(false);
		});
	});

	describe('isValidationError', () => {
		it('Should return true if axios error response include api validation error', () => {
			const errorText = 'ApiValidationError ABC';
			const apiValidationError = createApiValidationError();
			const json = JSON.stringify(apiValidationError);
			const data = JSON.parse(json) as Record<string, unknown>;
			const code = 400;

			const error = createAxiosError(data, code, errorText);

			const response = isValidationError(error);

			expect(response).toBe(true);
		});

		it('Should return false if axios error response do *not* include api validation error', () => {
			const errorText = 'bla';
			const error = new Error(errorText);

			// @ts-expect-error Testcase
			const response = isValidationError(error);

			expect(response).toBe(false);
		});
	});

	describe('hasAxiosResponse', () => {
		it('Should return true if axios error response include axios response', () => {
			const errorText = 'bla';
			const json = JSON.stringify(new InternalServerErrorException(errorText));
			const data = JSON.parse(json) as Record<string, unknown>;
			const code = 500;
			const error = createAxiosError(data, code, errorText);

			const response = hasAxiosResponse(error);

			expect(response).toBe(true);
		});

		it('Should return false if axios error response do *not* include api validation error', () => {
			const errorText = 'bla';
			const error = new Error(errorText);

			// @ts-expect-error Testcase
			const response = hasAxiosResponse(error);

			expect(response).toBe(false);
		});
	});

	describe('extractAxiosResponse', () => {
		it('Should extract axios response from axios', () => {
			const errorText = 'bla';
			const json = JSON.stringify(new InternalServerErrorException(errorText));
			const data = JSON.parse(json) as Record<string, unknown>;
			const code = 500;
			const error = createAxiosError(data, code, errorText);

			const response = extractAxiosResponse(error);
			const expectedResponse = {
				data,
				status: code,
				statusText: errorText,
				headers: {},
				config: {},
				request: {},
			};

			expect(response).toStrictEqual(expectedResponse);
		});

		it('Should return false if axios error response do *not* include api validation error', () => {
			const errorText = 'bla';
			const error = new Error(errorText);

			// @ts-expect-error Testcase
			const response = extractAxiosResponse(error);

			expect(response).toBe(emptyAxiosResponse);
		});
	});
});
