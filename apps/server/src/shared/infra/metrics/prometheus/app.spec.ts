import request from 'supertest';

import { createPrometheusMetricsApp } from './app';

describe('createPrometheusMetricsApp', () => {
	describe('should create an app that should', () => {
		it('collect all the available metrics and expose them on given route', async () => {
			const testMetricsRoute = '/prometheus-metrics';
			const exampleDefaultMetricName = 'process_heap_bytes';
			const exampleMetricsRouteMetric =
				`sc_api_response_time_in_seconds_count{` +
				`method="GET",` +
				`base_url="",full_path="${testMetricsRoute}",route_path="${testMetricsRoute}",` +
				`status_code="200"}`;
			const app = createPrometheusMetricsApp(testMetricsRoute, true, true);

			let response = await request(app).get(testMetricsRoute);
			response = await request(app).get(testMetricsRoute);

			expect(response.statusCode).toBe(200);
			expect(response.text).toContain(exampleDefaultMetricName);
			expect(response.text).toContain(exampleMetricsRouteMetric);
		});
	});
});
