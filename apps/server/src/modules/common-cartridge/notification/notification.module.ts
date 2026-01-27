import { Module } from '@nestjs/common';
import { NotificationService } from './service/notification.service';

import { Logger } from '@core/logger';
import { NotificationRepo } from './repo/notification.repo';

@Module({
  providers: [NotificationService, Logger, NotificationRepo],
  exports: [NotificationService],
})
export class NotificationModule {}
