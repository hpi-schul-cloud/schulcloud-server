import { Module } from '@nestjs/common';
import { NotificationModule } from './notification.module';
import { NotificationController } from './api/controller/notification.controller';

@Module({
	imports: [NotificationModule],
	controllers: [NotificationController],
})
export class NotificationApiModule {}
