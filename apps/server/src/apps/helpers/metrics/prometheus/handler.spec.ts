import express from 'express';
import client from 'prom-client';
import request from 'supertest';

import { createPrometheusMetricsHandler } from './handler';

describe('createPrometheusMetricsHandler', () => {
	describe('should create a handler that should', () => {
		const app = express();
		const handler = createPrometheusMetricsHandler();

		let clientRegisterMetricsSpy: jest.SpyInstance;

		beforeAll(() => {
			app.use('/metrics', handler);
		});

		beforeEach(() => {
			clientRegisterMetricsSpy = jest.spyOn(client.register, 'metrics');
		});

		afterEach(() => {
			clientRegisterMetricsSpy.mockRestore();
		});

		it('call Prometheus client metrics() method once', async () => {
			await request(app).get('/metrics');

			expect(clientRegisterMetricsSpy).toBeCalledTimes(1);
		});

		it('return HTTP 500 if the Prometheus client metrics() method call fails', async () => {
			clientRegisterMetricsSpy.mockImplementation(async (): Promise<string> => Promise.reject(Error('test error')));

			const response = await request(app).get('/metrics');

			expect(response.statusCode).toBe(500);
		});

		it('return HTTP 200 with metrics content if the Prometheus client metrics() method call succeed', async () => {
			const testMetricsData = 'there should be some metrics...';

			clientRegisterMetricsSpy.mockImplementation(async (): Promise<string> => Promise.resolve(testMetricsData));

			const response = await request(app).get('/metrics');

			expect(response.statusCode).toBe(200);
			expect(response.text).toBe(testMetricsData);
		});
	});
});
