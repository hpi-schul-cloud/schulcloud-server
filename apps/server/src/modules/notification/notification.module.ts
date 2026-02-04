import { Module } from '@nestjs/common';
import { NotificationService } from './domain/service/notification.service';
import { NotificationController } from './api/controller/notification.controller';

import { Logger } from '@core/logger';
import { NotificationRepo } from './repo/notification.repo';

@Module({
	providers: [NotificationService, Logger, NotificationRepo],
	controllers: [NotificationController],
	exports: [NotificationService],
})
export class NotificationModule {}
