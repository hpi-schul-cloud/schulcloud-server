import { NotificationType } from '../../../types/notification-type.enum';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class NotificationRequestBodyParams {
	@ApiProperty({ description: 'Type of the message' })
	@IsString()
	public type!: NotificationType;

	@ApiProperty({ description: 'The notification key, processed by the frontend for the right language' })
	@IsString()
	public key!: string;

	@ApiProperty({ description: 'An array of arguments for the message to fill in, like coursenames', isArray: true })
	@IsArray()
	public args!: string[];

	@ApiProperty({ description: 'The id of the user to receive the notification' })
	@IsString()
	public userId!: string;
}
