import { createMock } from '@golevelup/ts-jest';
import { type AuditLogger } from '@infra/logger';
import { type CallHandler, type ExecutionContext } from '@nestjs/common';
import { type Request, type Response } from 'express';
import { of, throwError } from 'rxjs';
import { ServiceAccountAuditInterceptor } from './service-account-audit.interceptor';

const createMockExecutionContext = (
	user: { userId: string; isServiceAccount: boolean } | undefined
): ExecutionContext => {
	const mockRequest = {
		user,
		method: 'GET',
		originalUrl: '/test-endpoint',
	} as unknown as Request;

	const mockResponse = {
		statusCode: 200,
	} as Response;

	return createMock<ExecutionContext>({
		getType: () => 'http',
		switchToHttp: () => {
			return {
				getRequest: () => mockRequest,
				getResponse: () => mockResponse,
			};
		},
	});
};

describe('ServiceAccountAuditInterceptor', () => {
	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('intercept', () => {
		describe('when context type is not http', () => {
			const setup = () => {
				const auditLoggerMock = createMock<AuditLogger>();
				const interceptor = new ServiceAccountAuditInterceptor(auditLoggerMock);
				const context = createMock<ExecutionContext>({
					getType: () => 'ws',
				});
				const next: CallHandler = { handle: () => of({ result: 'success' }) };

				return { context, next, interceptor, auditLoggerMock };
			};

			it('should pass through without logging', (done) => {
				const { context, next, interceptor, auditLoggerMock } = setup();

				interceptor.intercept(context, next).subscribe({
					next: (value) => {
						expect(value).toEqual({ result: 'success' });
						expect(auditLoggerMock.logServiceAccountApiCall).not.toHaveBeenCalled();
						expect(context.switchToHttp).not.toHaveBeenCalled();
						done();
					},
				});
			});
		});

		describe('when user is not a service account', () => {
			const setup = () => {
				const auditLoggerMock = createMock<AuditLogger>();
				const interceptor = new ServiceAccountAuditInterceptor(auditLoggerMock);
				const context = createMockExecutionContext({ userId: 'user-123', isServiceAccount: false });
				const next: CallHandler = { handle: () => of({ result: 'success' }) };

				return { context, next, interceptor, auditLoggerMock };
			};

			it('should not call auditLogger and pass through', (done) => {
				const { context, next, interceptor, auditLoggerMock } = setup();

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
			const setup = () => {
				const auditLoggerMock = createMock<AuditLogger>();
				const interceptor = new ServiceAccountAuditInterceptor(auditLoggerMock);
				const context = createMockExecutionContext(undefined);
				const next: CallHandler = { handle: () => of({ result: 'success' }) };

				return { context, next, interceptor, auditLoggerMock };
			};

			it('should not call auditLogger and pass through', (done) => {
				const { context, next, interceptor, auditLoggerMock } = setup();

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
			const createServiceAccountContext = () =>
				createMockExecutionContext({ userId: 'service-account-123', isServiceAccount: true });

			describe('when request succeeds', () => {
				const setup = () => {
					const auditLoggerMock = createMock<AuditLogger>();
					const interceptor = new ServiceAccountAuditInterceptor(auditLoggerMock);
					const context = createServiceAccountContext();
					const next: CallHandler = { handle: () => of({ result: 'success' }) };

					return { context, next, interceptor, auditLoggerMock };
				};

				it('should call auditLogger.logServiceAccountApiCall with correct parameters', (done) => {
					const { context, next, interceptor, auditLoggerMock } = setup();

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
				const setup = (error: Error) => {
					const auditLoggerMock = createMock<AuditLogger>();
					const interceptor = new ServiceAccountAuditInterceptor(auditLoggerMock);
					const context = createServiceAccountContext();
					const next: CallHandler = { handle: () => throwError(() => error) };

					return { context, interceptor, auditLoggerMock, next };
				};

				it('should call auditLogger.logServiceAccountApiCall with error details', (done) => {
					const error = Object.assign(new Error('Not found'), { status: 404 });
					const { context, interceptor, auditLoggerMock, next } = setup(error);

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
					const error = new Error('Internal error');
					const { context, interceptor, auditLoggerMock, next } = setup(error);

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
