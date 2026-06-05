import { Module } from '@nestjs/common';
import { NotificationService } from './domain/service';

import { LoggerModule } from '@core/logger';
import { NotificationMikroOrmRepo } from './repo';
import { NOTIFICATION_REPO } from './domain/interfaces';

@Module({
	imports: [LoggerModule],
	providers: [
		NotificationService,
		{
			provide: NOTIFICATION_REPO,
			useClass: NotificationMikroOrmRepo,
		},
	],
	exports: [NotificationService],
})
export class NotificationModule {}
