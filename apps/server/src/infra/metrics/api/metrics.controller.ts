import { Controller, Get, Header } from '@nestjs/common';
import { MetricsService } from '../metrics.service';

@Controller('/metrics')
export class MetricsController {
	constructor(private readonly appService: MetricsService) {}

	@Header('Content-Type', 'text/plain')
	@Get()
	public getMetrics(): Promise<string> {
		return this.appService.getMetrics();
	}
}
