import { Controller, Sse, MessageEvent, Header } from '@nestjs/common';
import { Observable, merge, from } from 'rxjs';
import { filter, map, concatMap } from 'rxjs/operators';
import { NotificationService } from '../domain/service';
import { NotificationObserverService } from './notification-observer.service';
import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
import { RequestTimeout } from '@shared/common/decorators/timeout.decorator';

@Controller('notifications')
@JwtAuthentication()
export class NotificationController {
	constructor(
		private readonly notificationService: NotificationService,
		private readonly notificationObserverService: NotificationObserverService
	) {}

	@Sse('stream')
	@Header('Content-Type', 'text/event-stream')
	@Header('Cache-Control', 'no-cache')
	@Header('Connection', 'keep-alive')
	@RequestTimeout('SSE_TIMEOUT')
	public stream(@CurrentUser() user: ICurrentUser): Observable<MessageEvent> {
		// 1. Initial Sync: Fetch existing unread notifications and delete them immediately
		const initialNotifications$ = from(this.notificationService.getUnreadNotifications(user.userId)).pipe(
			concatMap(async (notifications) => {
				if (notifications.length > 0) {
					await Promise.all(notifications.map((n) => this.notificationService.deleteNotification(n.id)));
				}
				return {
					data: { type: 'initial', notifications },
				};
			})
		);

		// 2. Live Stream: Filter global change stream for this user and delete immediately
		const liveNotifications$ = this.notificationObserverService.notifications$.pipe(
			filter((notification) => notification.userId === user.userId),
			concatMap(async (notification) => {
				// notification here is the raw mongo document from the change stream
				const notificationId = notification._id.toString();
				await this.notificationService.deleteNotification(notificationId);
				return {
					data: { type: 'live', notification },
				};
			})
		);

		return merge(initialNotifications$, liveNotifications$);
	}
}
