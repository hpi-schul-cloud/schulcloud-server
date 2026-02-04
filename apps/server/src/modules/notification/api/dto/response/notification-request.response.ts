import { ApiProperty } from '@nestjs/swagger';

export class NotificationRequestResponse {
	@ApiProperty()
	public requestId: string;

	@ApiProperty()
	public notificationCreatedAt: Date;

	constructor(response: NotificationRequestResponse) {
		this.requestId = response.requestId;
		this.notificationCreatedAt = response.notificationCreatedAt;
	}
}
