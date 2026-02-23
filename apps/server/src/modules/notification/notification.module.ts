import { Module } from '@nestjs/common';
import { NotificationService } from './domain/service';

import { LoggerModule } from '@core/logger';
import { NotificationMikroOrmRepo } from './repo';

@Module({
	imports: [LoggerModule],
	providers: [NotificationService, NotificationMikroOrmRepo],
	exports: [NotificationService],
})
export class NotificationModule {}
