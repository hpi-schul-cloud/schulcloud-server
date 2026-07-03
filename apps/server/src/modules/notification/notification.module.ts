import { Module } from '@nestjs/common';
import { NotificationService } from './domain/service';

import { LoggerModule } from '@infra/logger';
import { NOTIFICATION_REPO } from './domain/interfaces';
import { NotificationMikroOrmRepo } from './repo';

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
