import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsMongoId, IsString } from 'class-validator';
import { NotificationType } from './notification-type.enum';

export class NotificationDto {
	@ApiProperty({ description: 'Type of the message' })
	@IsMongoId()
	public notificationType!: NotificationType;

	@ApiProperty({ description: 'The notification key, processed by the frontend for the right language' })
	@IsString()
	public notificationKey!: string;

	@ApiProperty({ description: 'An array of arguments for the message to fill in, like coursenames', isArray: true })
	@IsArray()
	public notificationArguments!: string[];

	@ApiProperty({ description: 'The id of the user to receive the notification' })
	@IsString()
	public userId!: string;

	// constructor(private readonly type: NotificationType, private readonly key: string, private readonly args: string[], private readonly userid: string) {
	// 	this.notificationType = type;
	// 	this.notificationKey = key;
	// 	this.notificationArguments = args;
	// 	this.userId = userid;
	// }
}
