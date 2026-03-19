import { DomainErrorHandler } from '@core/error';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AjaxErrorResponse, H5pError } from '@lumieducation/h5p-server';
import { ArgumentsHost, HttpException } from '@nestjs/common';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';
import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import { H5pAjaxErrorResponseFilter } from './h5p-ajax-error-response.filter';

describe(H5pAjaxErrorResponseFilter.name, () => {
	let module: TestingModule;
	let filter: H5pAjaxErrorResponseFilter;
	let domainErrorHandler: DeepMocked<DomainErrorHandler>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				H5pAjaxErrorResponseFilter,
				{
					provide: DomainErrorHandler,
					useValue: createMock<DomainErrorHandler>(),
				},
			],
		}).compile();

		filter = module.get(H5pAjaxErrorResponseFilter);
		domainErrorHandler = module.get(DomainErrorHandler);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	const setupArgsHost = () => {
		const mockedResponse: DeepMocked<Response> = createMock<Response>({
			status: () => mockedResponse,
		});

		const mockedHttpArgsHost: DeepMocked<HttpArgumentsHost> = createMock<HttpArgumentsHost>({
			getResponse: () => mockedResponse,
		});

		const mockedArgumentsHost: DeepMocked<ArgumentsHost> = createMock<ArgumentsHost>({
			switchToHttp: () => mockedHttpArgsHost,
		});

		return {
			mockedArgumentsHost,
			mockedResponse,
		};
	};

	describe('when the filtered error is an H5pError', () => {
		describe('when the H5pError has error id "install-missing-libraries"', () => {
			const setup = () => {
				const { mockedArgumentsHost, mockedResponse } = setupArgsHost();

				const exception = new H5pError('install-missing-libraries');
				exception.httpStatusCode = 500;
				exception.clientErrorId = 'test-client-error-id';
				exception.name = 'test-error-title';
				exception.message = 'test-error-description';

				return {
					exception,
					mockedArgumentsHost,
					mockedResponse,
				};
			};

			it('should set an AjaxErrorResponse in the response body', () => {
				const { exception, mockedArgumentsHost, mockedResponse } = setup();

				filter.catch(exception, mockedArgumentsHost);

				expect(mockedResponse.json).toHaveBeenCalledWith(
					new AjaxErrorResponse(
						exception.clientErrorId as string,
						exception.httpStatusCode,
						'Error - File contains one or more not supported libraries',
						exception.message
					)
				);
			});

			it('should set the correct response status', () => {
				const { exception, mockedArgumentsHost, mockedResponse } = setup();

				filter.catch(exception, mockedArgumentsHost);

				expect(mockedResponse.status).toHaveBeenCalledWith(exception.httpStatusCode);
			});

			it('should handle and log the unknown error', () => {
				const { exception, mockedArgumentsHost } = setup();

				filter.catch(exception, mockedArgumentsHost);

				expect(domainErrorHandler.execHttpContext).toHaveBeenCalledWith(exception, mockedArgumentsHost.switchToHttp());
			});
		});

		describe('when the H5pError has another error id', () => {
			const setup = () => {
				const { mockedArgumentsHost, mockedResponse } = setupArgsHost();

				const exception = new H5pError('error-id');
				exception.httpStatusCode = 500;
				exception.clientErrorId = 'test-client-error-id';
				exception.name = 'test-error-title';
				exception.message = 'test-error-description';

				return {
					exception,
					mockedArgumentsHost,
					mockedResponse,
				};
			};

			it('should set an AjaxErrorResponse in the response body', () => {
				const { exception, mockedArgumentsHost, mockedResponse } = setup();

				filter.catch(exception, mockedArgumentsHost);

				expect(mockedResponse.json).toHaveBeenCalledWith(
					new AjaxErrorResponse(
						exception.clientErrorId as string,
						exception.httpStatusCode,
						exception.name,
						exception.message
					)
				);
			});

			it('should set the correct response status', () => {
				const { exception, mockedArgumentsHost, mockedResponse } = setup();

				filter.catch(exception, mockedArgumentsHost);

				expect(mockedResponse.status).toHaveBeenCalledWith(exception.httpStatusCode);
			});

			it('should handle and log the unknown error', () => {
				const { exception, mockedArgumentsHost } = setup();

				filter.catch(exception, mockedArgumentsHost);

				expect(domainErrorHandler.execHttpContext).toHaveBeenCalledWith(exception, mockedArgumentsHost.switchToHttp());
			});
		});
	});

	describe('when the filtered error is an HttpException', () => {
		const setup = () => {
			const { mockedArgumentsHost, mockedResponse } = setupArgsHost();

			const exception = new HttpException('', 403);
			exception.name = 'test-forbidden-error-title';
			exception.message = 'test-forbidden-error-description';

			return {
				exception,
				mockedArgumentsHost,
				mockedResponse,
			};
		};

		it('should set an AjaxErrorResponse in the response body', () => {
			const { exception, mockedArgumentsHost, mockedResponse } = setup();

			filter.catch(exception, mockedArgumentsHost);

			expect(mockedResponse.json).toHaveBeenCalledWith(
				new AjaxErrorResponse('', exception.getStatus(), exception.name, exception.message)
			);
		});

		it('should set the correct response status', () => {
			const { exception, mockedArgumentsHost, mockedResponse } = setup();

			filter.catch(exception, mockedArgumentsHost);

			expect(mockedResponse.status).toHaveBeenCalledWith(exception.getStatus());
		});

		it('should handle and log the unknown error', () => {
			const { exception, mockedArgumentsHost } = setup();

			filter.catch(exception, mockedArgumentsHost);

			expect(domainErrorHandler.execHttpContext).toHaveBeenCalledWith(exception, mockedArgumentsHost.switchToHttp());
		});
	});

	describe('when the filtered error is an unknown error', () => {
		const setup = () => {
			const { mockedArgumentsHost, mockedResponse } = setupArgsHost();

			const exception = new Error('unknown-error');

			return {
				exception,
				mockedArgumentsHost,
				mockedResponse,
			};
		};

		it('should set an AjaxErrorResponse in the response body', () => {
			const { exception, mockedArgumentsHost, mockedResponse } = setup();

			filter.catch(exception, mockedArgumentsHost);

			expect(mockedResponse.json).toHaveBeenCalledWith(
				new AjaxErrorResponse('', 500, 'Internal Server Error', 'An unexpected error had occurred.')
			);
		});

		it('should set the correct response status', () => {
			const { exception, mockedArgumentsHost, mockedResponse } = setup();

			filter.catch(exception, mockedArgumentsHost);

			expect(mockedResponse.status).toHaveBeenCalledWith(500);
		});

		it('should handle and log the unknown error', () => {
			const { exception, mockedArgumentsHost } = setup();

			filter.catch(exception, mockedArgumentsHost);

			expect(domainErrorHandler.execHttpContext).toHaveBeenCalledWith(exception, mockedArgumentsHost.switchToHttp());
		});
	});
});
