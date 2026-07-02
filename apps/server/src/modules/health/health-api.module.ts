import { Module } from '@nestjs/common';

import { ConfigurationModule } from '@infra/configuration';
import { LoggerModule } from '@infra/logger';
import { HealthController } from './controller';
import { HEALTH_CONFIG_TOKEN, HealthConfig } from './health.config';
import { HealthCheckRepo } from './repo';
import { HealthService } from './service';
import { HealthUC } from './uc';

@Module({
	imports: [LoggerModule, ConfigurationModule.register(HEALTH_CONFIG_TOKEN, HealthConfig)],
	controllers: [HealthController],
	providers: [HealthCheckRepo, HealthService, HealthUC],
})
export class HealthApiModule {}
