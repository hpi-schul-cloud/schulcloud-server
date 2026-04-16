import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { collectDefaultMetrics, Histogram, register } from 'prom-client';
import { MetricConfig, METRICS_CONFIG_TOKEN } from './metrics.config';

@Injectable()
export class MetricsService implements OnModuleInit {
	constructor(@Inject(METRICS_CONFIG_TOKEN) private readonly config: MetricConfig) {}

	public onModuleInit(): void {
		if (this.config.collectDefaultMetrics) {
			collectDefaultMetrics();
		}
	}

	public static readonly responseTimeMetricHistogram = new Histogram({
		name: 'sc_api_response_time_in_seconds',
		help: 'SC API response time in seconds',
		labelNames: ['method', 'base_url', 'full_path', 'route_path', 'status_code'],
	});

	public async getMetrics(): Promise<string> {
		const metrics = await register.metrics();
		return metrics;
	}
}
