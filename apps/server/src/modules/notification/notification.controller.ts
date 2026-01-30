import { Controller, Injectable, Post, Param, Body, HttpCode } from '@nestjs/common';
import { NotificationService } from './domain/service/notification.service';
import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
import { not } from 'cheerio/dist/commonjs/api/traversing';
import { NotificationType } from './types/notification-type.enum';
import { Notification, NotificationProps } from './domain/do';
import { ObjectId } from 'bson';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Notification')
@JwtAuthentication()
// @Controller({
//     path: 'notification',
// })
@Controller('notification')
export class NotificationController {
	constructor(private readonly notificationService: NotificationService) {}

	@Post()
	@HttpCode(202)
	@ApiOperation({
		summary: '"Queueing" a deletion request',
	})
	@ApiResponse({
		status: 202,
		type: 'test',
		description: 'Returns identifier of the deletion request and when deletion is planned at',
	})
	@HttpCode(404)
	@ApiResponse({
		status: 404,
		type: 'test',
	})
	public createNotification(
		@Body('type') type: string,
		@Body('key') key: string
		// @Body('arguments') args: string[],
		// @CurrentUser() user: ICurrentUser
	): string {
		// const notificationProps: NotificationProps = {
		//     id: new ObjectId().toHexString(),
		//     type,
		//     key,
		//     arguments: args,
		//     userId: user.userId,
		// };

		// const notification = new Notification(notificationProps);
		// await this.notificationService.create(notification);
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
