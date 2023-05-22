import { Request, Response } from 'express';
import { getAPIResponseTimeMetricLabels } from './middleware';

describe('getAPIResponseTimeMetricLabels', () => {
	it('should return proper metric labels for a typical request and response', () => {
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

	it('should return proper metric labels even for a less typical request and response', () => {
		const mockReq = { method: 'DELETE' } as Request;

		const mockRes = { statusCode: 422 } as Response;

		const labels = getAPIResponseTimeMetricLabels(mockReq, mockRes);

		expect(labels).toEqual({
			method: 'DELETE',
			base_url: '',
			full_path: '',
			route_path: '',
			status_code: 422,
		});
	});
});
