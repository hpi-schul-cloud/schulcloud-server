import { LoggerModule } from '@core/logger';
import { ConfigurationModule } from '@infra/configuration';
import { Module } from '@nestjs/common';
import { MetricsController } from './api/metrics.controller';
import { MetricConfig, METRICS_CONFIG_TOKEN } from './metrics.config';
import { MetricsService } from './metrics.service';

@Module({
	imports: [LoggerModule, ConfigurationModule.register(METRICS_CONFIG_TOKEN, MetricConfig)],
	controllers: [MetricsController],
	providers: [MetricsService],
})
export class MetricsModule {}
