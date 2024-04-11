import { Module } from '@nestjs/common';

import { HealthController } from './controller';
import { HealthCheckRepo } from './repo';
import { HealthService } from './service';
import { HealthUC } from './uc';

@Module({
	controllers: [HealthController],
	providers: [HealthCheckRepo, HealthService, HealthUC],
})
export class HealthApiModule {}
