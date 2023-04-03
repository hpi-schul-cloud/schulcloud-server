import express, { NextFunction, Request, Response } from 'express';
import { Logger } from '@nestjs/common';
import { createMock } from '@golevelup/ts-jest';
import { FeathersProxyMiddleware } from './feathers-proxy.middleware';

describe('FeathersProxyMiddleware', () => {
	let middleware: FeathersProxyMiddleware;
	let mockFeathersApp: express.Express;

	beforeEach(() => {
		mockFeathersApp = jest.fn() as unknown as express.Express;
		middleware = new FeathersProxyMiddleware(mockFeathersApp);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	const setup = (path: string): { mockRequest: Request; mockResponse: Response; mockNextFunction: NextFunction } => {
		const mockRequest = createMock<Request>({ path, url: '' });
		const mockResponse = createMock<Response>({});
		const mockNextFunction = jest.fn();

		jest.spyOn(Logger, 'debug').mockImplementation();
		jest.spyOn(Logger, 'error').mockImplementation();

		return { mockRequest, mockResponse, mockNextFunction };
	};

	describe('when the path matches the nestjs server api pattern', () => {
		it('should call next() and not call feathersApp()', () => {
			const { mockRequest, mockResponse, mockNextFunction } = setup('/api/v3/something');

			middleware.use(mockRequest, mockResponse, mockNextFunction);

			expect(mockNextFunction).toHaveBeenCalled();
			expect(mockFeathersApp).not.toHaveBeenCalled();
		});
	});

	describe('when the path does not match the nestjs server pattern', () => {
		describe('when the path is not /serverversion or does not start with /api/v', () => {
			it('should log a deprecated path', () => {
				const { mockRequest, mockResponse, mockNextFunction } = setup('/something');

				middleware.use(mockRequest, mockResponse, mockNextFunction);

				expect(Logger.error).toHaveBeenCalledWith('/something', 'DEPRECATED-PATH');
				expect(mockRequest.url).toBe('/something');
			});
		});

		describe('when the path starts with /api/v', () => {
			it('should call feathersApp() with the modified URL and not call next()', () => {
				const { mockRequest, mockResponse, mockNextFunction } = setup('/api/v1/something');
				mockRequest.url = '/api/v1/something';

				middleware.use(mockRequest, mockResponse, mockNextFunction);

				expect(mockFeathersApp).toHaveBeenCalledWith(mockRequest, mockResponse, mockNextFunction);
				expect(Logger.debug).toHaveBeenCalledWith('feathers call');
				expect(mockNextFunction).not.toHaveBeenCalled();
			});

			it('should replace /api/vX with empty string in the URL before calling feathersApp()', () => {
				const { mockRequest, mockResponse, mockNextFunction } = setup('/api/v1/something');
				mockRequest.url = '/api/v1/something';

				middleware.use(mockRequest, mockResponse, mockNextFunction);

				expect(mockRequest.url).toBe('/something');
			});
		});
	});
});
