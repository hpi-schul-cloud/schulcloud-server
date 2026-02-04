import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { NotificationService } from '../../domain/service/notification.service';
import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { NotificationProps, Notification } from '../../domain/do';
import { ObjectId } from '@mikro-orm/mongodb';
import { NotificationRequestBodyParams } from '../dto/request/notification-request.body.params';
import { NotificationRequestResponse } from '../dto/response/notification-request.response';

@ApiTags('Notification')
@JwtAuthentication()
@Controller('notification')
export class NotificationController {
	constructor(private readonly notificationService: NotificationService) {}

	@Post()
	@HttpCode(202)
	@ApiOperation({
		summary: '"Creating" a notification',
	})
	@ApiResponse({
		status: 202,
		type: NotificationRequestResponse,
		description: 'Returns the identifier of the create request and when it was created',
	})
	@HttpCode(404)
	@ApiResponse({
		status: 404,
		type: 'test',
	})
	public async createNotification(
		@Body() body: NotificationRequestBodyParams,
		@CurrentUser() user: ICurrentUser // shouldn't this be the user for whom the notification should be created?
	): Promise<string> {
		const notificationProps: NotificationProps = {
			id: new ObjectId().toHexString(),
			type: body.type,
			key: body.key,
			arguments: body.args,
			userId: user.userId,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		const notification = new Notification(notificationProps);
		await this.notificationService.create(notification);
		return 'test'; //console.log("test");
	}
}
