import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { createRequestLoggerMiddleware } from './request-logger-middleware';

jest.mock('@hpi-schul-cloud/commons/lib', () => {
	return {
		Configuration: {
			get: jest.fn(),
		},
	};
});

describe('RequestLoggerMiddleware', () => {
	let mockRequest: Partial<Request>;
	let mockResponse: Partial<Response>;
	let nextFunction: NextFunction;
	let loggerSpy: jest.SpyInstance;
	let errorLoggerSpy: jest.SpyInstance;

	beforeEach(() => {
		mockRequest = {
			method: 'GET',
			originalUrl: '/test',
		};

		mockResponse = {
			statusCode: 200,
			get: jest.fn(),
			on: jest.fn(),
		};

		nextFunction = jest.fn();

		loggerSpy = jest.spyOn(Logger.prototype, 'log');
		errorLoggerSpy = jest.spyOn(Logger.prototype, 'error');
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should call next() when logging is disabled', () => {
		jest.spyOn(Configuration, 'get').mockReturnValue(false);

		const middleware = createRequestLoggerMiddleware();
		middleware(mockRequest as Request, mockResponse as Response, nextFunction);

		expect(nextFunction).toHaveBeenCalled();
		expect(mockResponse.on).not.toHaveBeenCalled();
	});

	it('should log request details when logging is enabled', () => {
		jest.spyOn(Configuration, 'get').mockReturnValue(true);

		jest.spyOn(process, 'hrtime').mockReturnValueOnce([0, 0]);
		jest.spyOn(mockResponse, 'get').mockImplementation().mockReturnValue('100');

		// eslint-disable-next-line @typescript-eslint/ban-types
		let finishCallback: Function | undefined;
		// eslint-disable-next-line @typescript-eslint/ban-types
		mockResponse.on = jest.fn().mockImplementation((event: string, callback: Function) => {
			finishCallback = callback;
		});

		const middleware = createRequestLoggerMiddleware();
		middleware(mockRequest as Request, mockResponse as Response, nextFunction);

		expect(nextFunction).toHaveBeenCalled();
		expect(mockResponse.on).toHaveBeenCalledWith('finish', expect.any(Function));

		// Simulate response finish
		jest.spyOn(process, 'hrtime').mockReturnValueOnce([1, 0]);

		// Make sure callback was set before calling it
		expect(finishCallback).toBeDefined();
		finishCallback?.();

		expect(loggerSpy).toHaveBeenCalledWith('GET /test 200 1000ms 100');
	});

	it('should handle errors during logging', () => {
		jest.spyOn(Configuration, 'get').mockReturnValue(true);
		// eslint-disable-next-line @typescript-eslint/ban-types
		mockResponse.on = jest.fn().mockImplementation((event: string, callback: Function) => {
			callback();
		});

		// Force an error by making response.get throw
		mockResponse.get = jest.fn().mockImplementation(() => {
			throw new Error('Test error');
		});

		const middleware = createRequestLoggerMiddleware();
		middleware(mockRequest as Request, mockResponse as Response, nextFunction);

		expect(errorLoggerSpy).toHaveBeenCalledWith('unable to write accesslog', Error('Test error'));
	});
});
