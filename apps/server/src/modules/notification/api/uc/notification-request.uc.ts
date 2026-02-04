import { Injectable } from '@nestjs/common';
import { NotificationService } from '../../domain/service';
import { Notification } from '../../domain/do/notification.do';

@Injectable()
export class NotificationRequestUc {
	constructor(private readonly notificationService: NotificationService) {}

	public async createNotificationRequest(
		// notificationRequest: NotificationRequestBodyParams
		notificationRequest: Notification
		// ): Promise<NotificationRequestResponse> {
	): Promise<string> {
		const result = await this.notificationService.create(notificationRequest);

		return 'result';
	}
}
