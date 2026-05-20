import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { CallHandler, ExecutionContext } from '@nestjs/common';
import { Request, Response } from 'express';
import { of, throwError } from 'rxjs';
import { AuditLogger } from '../logger';
import { ServiceAccountAuditInterceptor } from './service-account-audit.interceptor';

describe('ServiceAccountAuditInterceptor', () => {
	let interceptor: ServiceAccountAuditInterceptor;
	let auditLoggerMock: DeepMocked<AuditLogger>;

	beforeEach(() => {
		auditLoggerMock = createMock<AuditLogger>();
		interceptor = new ServiceAccountAuditInterceptor(auditLoggerMock);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	const createMockExecutionContext = (
		user: { userId: string; isServiceAccount: boolean } | undefined
	): ExecutionContext => {
		const mockRequest = {
			user,
			method: 'GET',
			path: '/test-endpoint',
		} as unknown as Request;

		const mockResponse = {
			statusCode: 200,
		} as Response;

		return createMock<ExecutionContext>({
			switchToHttp: () => {
				return {
					getRequest: () => mockRequest,
					getResponse: () => mockResponse,
				};
			},
		});
	};

	describe('intercept', () => {
		describe('when user is not a service account', () => {
			it('should not call auditLogger and pass through', (done) => {
				const context = createMockExecutionContext({ userId: 'user-123', isServiceAccount: false });
				const next: CallHandler = { handle: () => of({ result: 'success' }) };

				interceptor.intercept(context, next).subscribe({
					next: (value) => {
						expect(value).toEqual({ result: 'success' });
						expect(auditLoggerMock.logServiceAccountApiCall).not.toHaveBeenCalled();
						done();
					},
				});
			});
		});

		describe('when user is undefined', () => {
			it('should not call auditLogger and pass through', (done) => {
				const context = createMockExecutionContext(undefined);
				const next: CallHandler = { handle: () => of({ result: 'success' }) };

				interceptor.intercept(context, next).subscribe({
					next: (value) => {
						expect(value).toEqual({ result: 'success' });
						expect(auditLoggerMock.logServiceAccountApiCall).not.toHaveBeenCalled();
						done();
					},
				});
			});
		});

		describe('when user is a service account', () => {
			describe('when request succeeds', () => {
				it('should call auditLogger.logServiceAccountApiCall with correct parameters', (done) => {
					const context = createMockExecutionContext({ userId: 'service-account-123', isServiceAccount: true });
					const next: CallHandler = { handle: () => of({ result: 'success' }) };

					interceptor.intercept(context, next).subscribe({
						next: () => {
							expect(auditLoggerMock.logServiceAccountApiCall).toHaveBeenCalledWith(
								'service-account-123',
								'GET',
								'/test-endpoint',
								200,
								{}
							);
							done();
						},
					});
				});
			});

			describe('when request fails with error', () => {
				it('should call auditLogger.logServiceAccountApiCall with error details', (done) => {
					const context = createMockExecutionContext({ userId: 'service-account-123', isServiceAccount: true });
					const error = Object.assign(new Error('Not found'), { status: 404 });
					const next: CallHandler = { handle: () => throwError(() => error) };

					interceptor.intercept(context, next).subscribe({
						error: () => {
							expect(auditLoggerMock.logServiceAccountApiCall).toHaveBeenCalledWith(
								'service-account-123',
								'GET',
								'/test-endpoint',
								404,
								{ error: 'Not found' }
							);
							done();
						},
					});
				});

				it('should default to status 500 when error has no status', (done) => {
					const context = createMockExecutionContext({ userId: 'service-account-123', isServiceAccount: true });
					const error = new Error('Internal error');
					const next: CallHandler = { handle: () => throwError(() => error) };

					interceptor.intercept(context, next).subscribe({
						error: () => {
							expect(auditLoggerMock.logServiceAccountApiCall).toHaveBeenCalledWith(
								'service-account-123',
								'GET',
								'/test-endpoint',
								500,
								{ error: 'Internal error' }
							);
							done();
						},
					});
				});
			});
		});
	});
});
