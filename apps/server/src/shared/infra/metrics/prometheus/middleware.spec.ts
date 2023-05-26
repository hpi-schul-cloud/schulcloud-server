import request from 'supertest';
import express, { Request, Response } from 'express';
import {
	apiResponseTimeMetricHistogram,
	createAPIResponseTimeMetricMiddleware,
	getAPIResponseTimeMetricLabels,
} from './middleware';

describe('getAPIResponseTimeMetricLabels', () => {
	describe('should return correct metric labels for', () => {
		it('a typical request and response', () => {
			const mockReq = {
				method: 'GET',
				baseUrl: '/api/v1',
				route: { path: '/schools/:schoolId' },
			} as Request;

			const mockRes = { statusCode: 200 } as Response;

			const labels = getAPIResponseTimeMetricLabels(mockReq, mockRes);

			expect(labels).toEqual({
				method: 'GET',
				base_url: '/api/v1',
				full_path: '/api/v1/schools/:schoolId',
				route_path: '/schools/:schoolId',
				status_code: 200,
			});
		});

		it('a less typical request and response', () => {
			const mockReq = { method: 'DELETE', baseUrl: '/' } as Request;

			const mockRes = { statusCode: 501 } as Response;

			const labels = getAPIResponseTimeMetricLabels(mockReq, mockRes);

			expect(labels).toEqual({
				method: 'DELETE',
				base_url: '/',
				full_path: '/',
				route_path: '',
				status_code: 501,
			});
		});
	});
});

describe('createAPIResponseTimeMetricMiddleware', () => {
	describe('should create a middleware that should', () => {
		const app = express();
		const middleware = createAPIResponseTimeMetricMiddleware();

		beforeAll(() => {
			app.use(middleware);
			app.use(express.json());
			app.get('/sayHello', (req, res) => {
				res.set('Test-Header', 'test_header_value');
				res.status(201).send('hello');
			});
		});

		it('not interfere with how the app endpoints work', async () => {
			const response = await request(app).get('/sayHello');

			expect(response.statusCode).toBe(201);
			expect(response.header).toHaveProperty('test-header', 'test_header_value');
			expect(response.text).toBe('hello');
		});

		it('call observe() on API response time metric histogram once for every app request', async () => {
			const observeMethodSpy = jest.spyOn(apiResponseTimeMetricHistogram, 'observe');

			await request(app).get('/sayHello');

			expect(observeMethodSpy).toBeCalledTimes(1);
		});
	});
});
