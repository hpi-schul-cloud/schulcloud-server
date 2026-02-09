import { Module } from '@nestjs/common';
import { NotificationService } from './domain/service/notification.service';

import { LoggerModule } from '@core/logger';
import { NotificationRepo } from './repo/notification.repo';

@Module({
	imports: [LoggerModule],
	providers: [NotificationService, NotificationRepo],
	exports: [NotificationService],
})
export class NotificationModule {}
