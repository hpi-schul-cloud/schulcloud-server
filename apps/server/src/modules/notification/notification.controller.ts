import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { NotificationService } from './domain/service/notification.service';
import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { NotificationProps, Notification } from './domain/do';
import { ObjectId } from 'bson';

@ApiTags('Notification')
@JwtAuthentication()
@Controller('notification')
export class NotificationController {
	constructor(private readonly notificationService: NotificationService) {}

	@Post()
	@HttpCode(202)
	@ApiOperation({
		summary: '"Creating" a deletion request',
	})
	@ApiResponse({
		status: 202,
		type: 'test',
		description: 'Returns identifier of the create request and when create is planned at',
	})
	@HttpCode(404)
	@ApiResponse({
		status: 404,
		type: 'test',
	})
	public async createNotification(
		@Body('type') type: string,
		@Body('key') key: string,
		@Body('arguments') args: string[],
		@CurrentUser() user: ICurrentUser
	): Promise<string> {
		const notificationProps: NotificationProps = {
			id: new ObjectId().toHexString(),
			type,
			key,
			arguments: args,
			userId: user.userId,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		const notification = new Notification(notificationProps);
		await this.notificationService.create(notification);
		return 'test'; //console.log("test");
	}

	// @Post('create')
	// public async createNotification(
	//     @Body('type') type: NotificationType,
	//     @Body('key') key: string,
	//     @Body('arguments') args: string[],
	//     @CurrentUser() user: ICurrentUser
	// ): Promise<void> {
	//     const notificationProps: NotificationProps = {
	//         id: new ObjectId().toHexString(),
	//         type,
	//         key,
	//         arguments: args,
	//         userId: user.userId,
	//     };

	//     const notification = new Notification(notificationProps);
	//     await this.notificationService.create(notification);
	// }
}
