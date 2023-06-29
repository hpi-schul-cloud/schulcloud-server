import { Module } from '@nestjs/common';

import { HealthController } from './controller';
import { HealthcheckRepo } from './repo';
import { HealthService } from './service';
import { HealthUC } from './uc';

@Module({
	controllers: [HealthController],
	providers: [HealthcheckRepo, HealthService, HealthUC],
})
export class HealthApiModule {}
