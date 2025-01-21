import { Module } from '@nestjs/common';

import { LoggerModule } from '@core/logger';
import { HealthController } from './controller';
import { HealthCheckRepo } from './repo';
import { HealthService } from './service';
import { HealthUC } from './uc';

@Module({
	imports: [LoggerModule],
	controllers: [HealthController],
	providers: [HealthCheckRepo, HealthService, HealthUC],
})
export class HealthApiModule {}
