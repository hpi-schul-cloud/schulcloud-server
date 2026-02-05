import { Module } from '@nestjs/common';
import { NotificationModule } from './notification.module';

@Module({
	imports: [NotificationModule],
})
export class NotificationApiModule {}
