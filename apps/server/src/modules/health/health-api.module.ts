import { Module } from '@nestjs/common';

import { HealthController } from './controller';
import { HealthcheckRepo } from './repo';
import { HealthService } from './service';
import { HealthUc } from './uc';

@Module({
	controllers: [HealthController],
	providers: [HealthcheckRepo, HealthService, HealthUc],
})
export class HealthApiModule {}
