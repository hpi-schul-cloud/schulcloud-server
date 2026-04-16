import { createMock } from '@golevelup/ts-jest';
import { CallHandler, ExecutionContext } from '@nestjs/common';
import { Request, Response } from 'express';
import { of, throwError } from 'rxjs';
import { MetricsService } from '../metrics.service';
import { ResponseTimeMetricsInterceptor } from './response-time-metrics.interceptor';

jest.mock('../metrics.service');

describe(ResponseTimeMetricsInterceptor.name, () => {
	let mockObserve: jest.Mock;

	beforeEach(() => {
		jest.clearAllMocks();
		mockObserve = jest.fn();
		// @ts-expect-error testing purpose only
		MetricsService.responseTimeMetricHistogram = {
			observe: mockObserve,
		};
	});

	describe('intercept', () => {
		describe('when intercepting a request', () => {
			const setup = () => {
				const interceptor = new ResponseTimeMetricsInterceptor();
				const mockRequest = createMock<Request>({
					method: 'GET',
					baseUrl: '',
					route: { path: '/test' },
					url: '/test',
				});
				const mockResponse = createMock<Response>({
					statusCode: 200,
				});
				const mockExecutionContext = createMock<ExecutionContext>({
					switchToHttp: jest.fn().mockImplementation(() => {
						return {
							getRequest: jest.fn().mockReturnValue(mockRequest),
							getResponse: jest.fn().mockReturnValue(mockResponse),
						};
					}),
				});
				const mockCallHandler = createMock<CallHandler>({
					handle: jest.fn().mockReturnValue(of('test response')),
				});

				const expectedLabels = {
					base_url: '',
					full_path: '/test',
					method: 'GET',
					route_path: '/test',
					status_code: 200,
				};

				return { expectedLabels, interceptor, mockExecutionContext, mockCallHandler };
			};

			it('should be defined', () => {
				const { interceptor } = setup();

				expect(interceptor).toBeDefined();
			});

			it('should call MetricsService.responseTimeMetricHistogram.observe with correct parameters after request completion', (done) => {
				const { expectedLabels, interceptor, mockExecutionContext, mockCallHandler } = setup();

				const result = interceptor.intercept(mockExecutionContext, mockCallHandler);

				result.subscribe({
					complete: () => {
						// Use setTimeout to ensure finalize has been called
						setTimeout(() => {
							expect(mockObserve).toHaveBeenCalledWith(expectedLabels, expect.any(Number));
							expect(mockObserve).toHaveBeenCalledTimes(1);
							done();
						}, 0);
					},
				});
			});

			it('should return an observable', () => {
				const { interceptor, mockExecutionContext, mockCallHandler } = setup();
				const result = interceptor.intercept(mockExecutionContext, mockCallHandler);

				expect(result).toBeDefined();
			});

			it('should measure response time correctly', (done) => {
				const { interceptor, mockExecutionContext, mockCallHandler } = setup();

				const result = interceptor.intercept(mockExecutionContext, mockCallHandler);

				result.subscribe({
					complete: () => {
						setTimeout(() => {
							expect(mockObserve).toHaveBeenCalledWith(expect.any(Object), expect.any(Number));

							// Verify that the duration is a positive number
							// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
							const [, duration] = mockObserve.mock.calls[0];
							expect(duration).toBeGreaterThanOrEqual(0);
							done();
						}, 0);
					},
				});
			});
		});

		describe('when request has different HTTP methods', () => {
			const testCases = [
				{ method: 'POST', statusCode: 201 },
				{ method: 'PUT', statusCode: 200 },
				{ method: 'DELETE', statusCode: 204 },
				{ method: 'PATCH', statusCode: 200 },
			];

			const setup = (method: string, statusCode: number) => {
				const interceptor = new ResponseTimeMetricsInterceptor();
				const mockRequest = createMock<Request>({
					method,
					baseUrl: '/api',
					route: { path: '/users/:id' },
					url: '/api/users/123',
				});
				const mockResponse = createMock<Response>({
					statusCode,
				});
				const mockExecutionContext = createMock<ExecutionContext>({
					switchToHttp: jest.fn().mockImplementation(() => {
						return {
							getRequest: jest.fn().mockReturnValue(mockRequest),
							getResponse: jest.fn().mockReturnValue(mockResponse),
						};
					}),
				});
				const mockCallHandler = createMock<CallHandler>({
					handle: jest.fn().mockReturnValue(of('response')),
				});

				return { interceptor, mockExecutionContext, mockCallHandler };
			};

			testCases.forEach(({ method, statusCode }) => {
				it(`should handle ${method} requests with status ${statusCode}`, (done) => {
					const { interceptor, mockExecutionContext, mockCallHandler } = setup(method, statusCode);
					const result = interceptor.intercept(mockExecutionContext, mockCallHandler);

					result.subscribe({
						complete: () => {
							setTimeout(() => {
								expect(mockObserve).toHaveBeenCalledWith(
									{
										method,
										base_url: '/api',
										full_path: '/api/users/:id',
										route_path: '/users/:id',
										status_code: statusCode,
									},
									expect.any(Number)
								);
								done();
							}, 0);
						},
					});
				});
			});
		});

		describe('when request has no route', () => {
			const setup = () => {
				const interceptor = new ResponseTimeMetricsInterceptor();
				const mockRequest = createMock<Request>({
					method: 'GET',
					baseUrl: '/api',
					route: undefined,
					url: '/api/unknown',
				});
				const mockResponse = createMock<Response>({
					statusCode: 404,
				});
				const mockExecutionContext = createMock<ExecutionContext>({
					switchToHttp: jest.fn().mockImplementation(() => {
						return {
							getRequest: jest.fn().mockReturnValue(mockRequest),
							getResponse: jest.fn().mockReturnValue(mockResponse),
						};
					}),
				});
				const mockCallHandler = createMock<CallHandler>({
					handle: jest.fn().mockReturnValue(of('not found')),
				});

				return { interceptor, mockExecutionContext, mockCallHandler };
			};

			it('should handle requests without route path', (done) => {
				const { interceptor, mockExecutionContext, mockCallHandler } = setup();

				const result = interceptor.intercept(mockExecutionContext, mockCallHandler);

				result.subscribe({
					complete: () => {
						setTimeout(() => {
							expect(mockObserve).toHaveBeenCalledWith(
								{
									method: 'GET',
									base_url: '/api',
									full_path: '/api',
									route_path: undefined,
									status_code: 404,
								},
								expect.any(Number)
							);
							done();
						}, 0);
					},
				});
			});
		});

		describe('when request throws an error', () => {
			const setup = () => {
				const interceptor = new ResponseTimeMetricsInterceptor();
				const mockRequest = createMock<Request>({
					method: 'POST',
					baseUrl: '/api',
					route: { path: '/error' },
					url: '/api/error',
				});
				const mockResponse = createMock<Response>({
					statusCode: 500,
				});
				const mockExecutionContext = createMock<ExecutionContext>({
					switchToHttp: jest.fn().mockImplementation(() => {
						return {
							getRequest: jest.fn().mockReturnValue(mockRequest),
							getResponse: jest.fn().mockReturnValue(mockResponse),
						};
					}),
				});
				const mockCallHandler = createMock<CallHandler>({
					handle: jest.fn().mockReturnValue(throwError(() => new Error('Server error'))),
				});

				return { interceptor, mockExecutionContext, mockCallHandler };
			};
			it('should still record metrics when an error occurs', (done) => {
				const { interceptor, mockExecutionContext, mockCallHandler } = setup();

				const result = interceptor.intercept(mockExecutionContext, mockCallHandler);

				result.subscribe({
					error: () => {
						setTimeout(() => {
							expect(mockObserve).toHaveBeenCalledWith(
								{
									method: 'POST',
									base_url: '/api',
									full_path: '/api/error',
									route_path: '/error',
									status_code: 500,
								},
								expect.any(Number)
							);
							done();
						}, 0);
					},
				});
			});
		});

		describe('when metrics service throws an error', () => {
			const setup = () => {
				const interceptor = new ResponseTimeMetricsInterceptor();
				const mockRequest = createMock<Request>({
					method: 'GET',
					baseUrl: '/api',
					route: { path: '/test' },
					url: '/api/test',
				});
				const mockResponse = createMock<Response>({
					statusCode: 200,
				});
				const mockExecutionContext = createMock<ExecutionContext>({
					switchToHttp: jest.fn().mockImplementation(() => {
						return {
							getRequest: jest.fn().mockReturnValue(mockRequest),
							getResponse: jest.fn().mockReturnValue(mockResponse),
						};
					}),
				});
				const mockCallHandler = createMock<CallHandler>({
					handle: jest.fn().mockReturnValue(of('response')),
				});

				// Mock the observe method to throw an error
				mockObserve.mockImplementation(() => {
					throw new Error('Metrics service error');
				});

				return { interceptor, mockExecutionContext, mockCallHandler };
			};

			it('should not throw an error when metrics collection fails', (done) => {
				const { interceptor, mockExecutionContext, mockCallHandler } = setup();

				const result = interceptor.intercept(mockExecutionContext, mockCallHandler);

				result.subscribe({
					next: (value) => {
						expect(value).toBe('response');
					},
					complete: () => {
						// Test should complete normally even when metrics fail
						setTimeout(() => {
							expect(mockObserve).toHaveBeenCalled();
							done();
						}, 0);
					},
					error: () => {
						fail('Observable should not emit an error when metrics collection fails');
					},
				});
			});
		});
	});
});
